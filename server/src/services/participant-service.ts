import type {
  CheckIn,
  Outreach,
  Participant,
  ParticipantRepository,
} from "../db/database.js";
import {
  calculateFollowUpStatus,
  type FollowUpResult,
  type FollowUpStatus,
} from "./follow-up.js";

const statusPriority: Record<FollowUpStatus, number> = {
  CONTACT_REQUESTED: 0,
  CHECK_IN_OVERDUE: 1,
  UP_TO_DATE: 2,
};

export class ParticipantNotFoundError extends Error {
  constructor(id: number) {
    super(`Participant ${id} was not found.`);
    this.name = "ParticipantNotFoundError";
  }
}

export class ParticipantAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`A participant named ${name} already exists.`);
    this.name = "ParticipantAlreadyExistsError";
  }
}

export interface ParticipantView extends Participant {
  latestCheckIn: CheckIn | null;
  latestOutreach: Outreach | null;
  followUp: FollowUpResult;
}

export interface DashboardSummary {
  totalParticipants: number;
  contactRequested: number;
  checkInOverdue: number;
  upToDate: number;
}

interface ParticipantFilters {
  status?: FollowUpStatus | null;
  search?: string | null;
}

export class ParticipantService {
  constructor(
    private readonly repository: ParticipantRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private toView(participant: Participant, now: Date): ParticipantView {
    const checkIns = this.repository.listCheckIns(participant.id);
    const outreaches = this.repository.listOutreaches(participant.id);

    return {
      ...participant,
      latestCheckIn: checkIns[0] ?? null,
      latestOutreach: outreaches[0] ?? null,
      followUp: calculateFollowUpStatus({ checkIns, outreaches, now }),
    };
  }

  listParticipants(filters: ParticipantFilters = {}): ParticipantView[] {
    const now = this.now();
    const search = filters.search?.trim().toLocaleLowerCase() ?? "";

    return this.repository
      .listParticipants()
      .filter(
        (participant) =>
          search.length === 0 ||
          participant.name.toLocaleLowerCase().includes(search),
      )
      .map((participant) => this.toView(participant, now))
      .filter(
        (participant) =>
          !filters.status || participant.followUp.status === filters.status,
      )
      .sort((left, right) => {
        const byStatus =
          statusPriority[left.followUp.status] -
          statusPriority[right.followUp.status];

        return byStatus || left.name.localeCompare(right.name);
      });
  }

  dashboardSummary(): DashboardSummary {
    const participants = this.listParticipants();

    return participants.reduce<DashboardSummary>(
      (summary, participant) => {
        summary.totalParticipants += 1;

        if (participant.followUp.status === "CONTACT_REQUESTED") {
          summary.contactRequested += 1;
        } else if (participant.followUp.status === "CHECK_IN_OVERDUE") {
          summary.checkInOverdue += 1;
        } else {
          summary.upToDate += 1;
        }

        return summary;
      },
      {
        totalParticipants: 0,
        contactRequested: 0,
        checkInOverdue: 0,
        upToDate: 0,
      },
    );
  }

  createParticipant(name: string): ParticipantView {
    if (this.repository.findParticipantByName(name)) {
      throw new ParticipantAlreadyExistsError(name);
    }

    const now = this.now();
    const participant = this.repository.createParticipant(name, now.toISOString());

    return this.toView(participant, now);
  }

  recordCheckIn(
    participantId: number,
    requestedContact: boolean,
    note: string | null,
  ): CheckIn {
    this.assertParticipantExists(participantId);
    return this.repository.recordCheckIn(
      participantId,
      requestedContact,
      note,
      this.now().toISOString(),
    );
  }

  logOutreach(participantId: number, note: string | null): Outreach {
    this.assertParticipantExists(participantId);
    return this.repository.logOutreach(
      participantId,
      note,
      this.now().toISOString(),
    );
  }

  private assertParticipantExists(participantId: number): void {
    if (!this.repository.findParticipant(participantId)) {
      throw new ParticipantNotFoundError(participantId);
    }
  }
}
