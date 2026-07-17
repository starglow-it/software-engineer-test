import { describe, expect, it } from "vitest";
import { calculateFollowUpStatus } from "./follow-up.js";

const now = new Date("2026-07-17T16:00:00.000Z");

function hoursAgo(hours: number): string {
  return new Date(now.getTime() - hours * 60 * 60 * 1_000).toISOString();
}

describe("calculateFollowUpStatus", () => {
  it("flags a request when no later outreach exists", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: true, createdAt: hoursAgo(2) }],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("CONTACT_REQUESTED");
    expect(result.reason).toContain("no later outreach");
  });

  it("resolves a request with outreach recorded later", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: true, createdAt: hoursAgo(2) }],
      outreaches: [{ createdAt: hoursAgo(1) }],
      now,
    });

    expect(result.status).toBe("UP_TO_DATE");
  });

  it("does not resolve a request with earlier outreach", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: true, createdAt: hoursAgo(2) }],
      outreaches: [{ createdAt: hoursAgo(3) }],
      now,
    });

    expect(result.status).toBe("CONTACT_REQUESTED");
  });

  it("requires outreach to be strictly later than the request", () => {
    const createdAt = hoursAgo(2);
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: true, createdAt }],
      outreaches: [{ createdAt }],
      now,
    });

    expect(result.status).toBe("CONTACT_REQUESTED");
  });

  it("prioritizes an unresolved request over an overdue check-in", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: true, createdAt: hoursAgo(96) }],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("CONTACT_REQUESTED");
  });

  it("marks a check-in older than 72 hours as overdue", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: false, createdAt: hoursAgo(73) }],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("CHECK_IN_OVERDUE");
  });

  it("treats exactly 72 hours as overdue", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: false, createdAt: hoursAgo(72) }],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("CHECK_IN_OVERDUE");
  });

  it("keeps a check-in just inside 72 hours up to date", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: false, createdAt: hoursAgo(71.99) }],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("UP_TO_DATE");
  });

  it("marks a participant with no check-ins as overdue", () => {
    const result = calculateFollowUpStatus({ checkIns: [], outreaches: [], now });

    expect(result).toEqual({
      status: "CHECK_IN_OVERDUE",
      reason: "No check-in has been recorded.",
    });
  });

  it("keeps a recent check-in without a request up to date", () => {
    const result = calculateFollowUpStatus({
      checkIns: [{ requestedContact: false, createdAt: hoursAgo(4) }],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("UP_TO_DATE");
  });

  it("does not let a later non-requesting check-in erase a request", () => {
    const result = calculateFollowUpStatus({
      checkIns: [
        { requestedContact: true, createdAt: hoursAgo(5) },
        { requestedContact: false, createdAt: hoursAgo(1) },
      ],
      outreaches: [],
      now,
    });

    expect(result.status).toBe("CONTACT_REQUESTED");
  });

  it("returns a readable reason for every status", () => {
    const scenarios = [
      calculateFollowUpStatus({
        checkIns: [{ requestedContact: true, createdAt: hoursAgo(1) }],
        outreaches: [],
        now,
      }),
      calculateFollowUpStatus({
        checkIns: [{ requestedContact: false, createdAt: hoursAgo(80) }],
        outreaches: [],
        now,
      }),
      calculateFollowUpStatus({
        checkIns: [{ requestedContact: false, createdAt: hoursAgo(1) }],
        outreaches: [],
        now,
      }),
    ];

    expect(scenarios.every(({ reason }) => reason.length > 20)).toBe(true);
  });
});

