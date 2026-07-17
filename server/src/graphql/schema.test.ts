import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createReconnectApp } from "../app.js";
import { createDatabase, ParticipantRepository } from "../db/database.js";
import { ParticipantService } from "../services/participant-service.js";

let database: Database.Database;
let currentTime: Date;

async function execute(
  app: ReturnType<typeof createReconnectApp>,
  query: string,
  variables?: Record<string, unknown>,
) {
  const response = await app.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  return response.json() as Promise<{
    data?: Record<string, unknown>;
    errors?: Array<{ message: string }>;
  }>;
}

beforeEach(() => {
  currentTime = new Date("2026-07-17T16:00:00.000Z");
  database = createDatabase(":memory:", currentTime);
});

afterEach(() => {
  database.close();
});

describe("Reconnect GraphQL API", () => {
  it("records a request and resolves it with later outreach", async () => {
    const repository = new ParticipantRepository(database);
    const service = new ParticipantService(repository, () => currentTime);
    const app = createReconnectApp(service);
    const sam = repository
      .listParticipants()
      .find((participant) => participant.name === "Sam Rivera");

    expect(sam).toBeDefined();

    const recordResult = await execute(
      app,
      `mutation Record($id: ID!) {
        recordCheckIn(participantId: $id, requestedContact: true) { id }
      }`,
      { id: String(sam!.id) },
    );

    expect(recordResult.errors).toBeUndefined();

    const requestedResult = await execute(
      app,
      `query Participant($search: String) {
        participants(search: $search) { followUp { status } }
      }`,
      { search: "Sam" },
    );

    expect(requestedResult.data).toMatchObject({
      participants: [{ followUp: { status: "CONTACT_REQUESTED" } }],
    });

    currentTime = new Date(currentTime.getTime() + 1_000);
    const outreachResult = await execute(
      app,
      `mutation Outreach($id: ID!) {
        logOutreach(participantId: $id) { id }
      }`,
      { id: String(sam!.id) },
    );

    expect(outreachResult.errors).toBeUndefined();

    const resolvedResult = await execute(
      app,
      `query Participant($search: String) {
        participants(search: $search) { followUp { status } }
      }`,
      { search: "Sam" },
    );

    expect(resolvedResult.data).toMatchObject({
      participants: [{ followUp: { status: "UP_TO_DATE" } }],
    });
  });

  it("returns a useful validation error for an unknown participant", async () => {
    const app = createReconnectApp(
      new ParticipantService(new ParticipantRepository(database), () => currentTime),
    );
    const result = await execute(
      app,
      `mutation {
        logOutreach(participantId: "999", note: "Attempted contact") { id }
      }`,
    );

    expect(result.errors?.[0]?.message).toBe("Participant 999 was not found.");
  });
});

