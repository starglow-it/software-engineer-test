export const FOLLOW_UP_WINDOW_HOURS = 72;
const FOLLOW_UP_WINDOW_MS = FOLLOW_UP_WINDOW_HOURS * 60 * 60 * 1_000;

export type FollowUpStatus =
  | "CONTACT_REQUESTED"
  | "CHECK_IN_OVERDUE"
  | "UP_TO_DATE";

export interface CheckInEvent {
  requestedContact: boolean;
  createdAt: string;
}

export interface OutreachEvent {
  createdAt: string;
}

export interface FollowUpResult {
  status: FollowUpStatus;
  reason: string;
}

interface FollowUpInput {
  checkIns: readonly CheckInEvent[];
  outreaches: readonly OutreachEvent[];
  now: Date;
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid event timestamp: ${value}`);
  }

  return parsed;
}

function latestByCreatedAt<T extends { createdAt: string }>(
  events: readonly T[],
): T | undefined {
  return events.reduce<T | undefined>((latest, event) => {
    if (!latest || timestamp(event.createdAt) > timestamp(latest.createdAt)) {
      return event;
    }

    return latest;
  }, undefined);
}

function formatUtcDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function calculateFollowUpStatus({
  checkIns,
  outreaches,
  now,
}: FollowUpInput): FollowUpResult {
  const latestRequest = latestByCreatedAt(
    checkIns.filter((checkIn) => checkIn.requestedContact),
  );

  if (latestRequest) {
    const requestTime = timestamp(latestRequest.createdAt);
    const requestResolved = outreaches.some(
      (outreach) => timestamp(outreach.createdAt) > requestTime,
    );

    if (!requestResolved) {
      return {
        status: "CONTACT_REQUESTED",
        reason: `Contact requested on ${formatUtcDate(latestRequest.createdAt)}; no later outreach has been recorded.`,
      };
    }
  }

  const latestCheckIn = latestByCreatedAt(checkIns);

  if (!latestCheckIn) {
    return {
      status: "CHECK_IN_OVERDUE",
      reason: "No check-in has been recorded.",
    };
  }

  const elapsed = now.getTime() - timestamp(latestCheckIn.createdAt);

  if (elapsed >= FOLLOW_UP_WINDOW_MS) {
    return {
      status: "CHECK_IN_OVERDUE",
      reason: "The latest check-in was more than 72 hours ago.",
    };
  }

  return {
    status: "UP_TO_DATE",
    reason: "The latest check-in is recent and there are no unresolved contact requests.",
  };
}

