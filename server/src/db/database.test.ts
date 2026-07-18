import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import {
  createDatabase,
  ParticipantRepository,
  seedDemoData,
} from "./database.js";

const now = new Date("2026-07-17T16:00:00.000Z");
let database: Database.Database;
let repository: ParticipantRepository;

beforeEach(() => {
  database = createDatabase(":memory:", now);
  repository = new ParticipantRepository(database);
});

afterEach(() => {
  database.close();
});

describe("database", () => {
  it("seeds each demo participant only once", () => {
    expect(repository.listParticipants()).toHaveLength(4);

    seedDemoData(database, now);

    expect(repository.listParticipants()).toHaveLength(4);
  });

  it("records check-ins and outreach durably through the repository", () => {
    const participant = repository.listParticipants()[0];
    expect(participant).toBeDefined();

    const checkIn = repository.recordCheckIn(
      participant!.id,
      true,
      "Please reach out.",
      now.toISOString(),
    );
    const outreach = repository.logOutreach(
      participant!.id,
      "Followed up.",
      new Date(now.getTime() + 1_000).toISOString(),
    );

    expect(checkIn.requestedContact).toBeTruthy();
    expect(repository.listCheckIns(participant!.id)[0]?.id).toBe(checkIn.id);
    expect(repository.listOutreaches(participant!.id)[0]?.id).toBe(outreach.id);
  });

  it("creates participants and enforces case-insensitive name uniqueness", () => {
    const participant = repository.createParticipant(
      "Avery Patel",
      now.toISOString(),
    );

    expect(repository.findParticipant(participant.id)).toEqual(participant);
    expect(repository.findParticipantByName("avery patel")).toEqual(participant);
    expect(() =>
      repository.createParticipant("AVERY PATEL", now.toISOString()),
    ).toThrow();
  });
});
