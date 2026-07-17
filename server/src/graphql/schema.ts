import { GraphQLError } from "graphql";
import { createSchema } from "graphql-yoga";
import {
  ParticipantNotFoundError,
  type ParticipantService,
} from "../services/participant-service.js";
import {
  InputValidationError,
  normalizeNote,
  parseParticipantId,
} from "../validation/input.js";
import type { FollowUpStatus } from "../services/follow-up.js";

const typeDefs = /* GraphQL */ `
  enum FollowUpStatus {
    CONTACT_REQUESTED
    CHECK_IN_OVERDUE
    UP_TO_DATE
  }

  type CheckIn {
    id: ID!
    participantId: ID!
    requestedContact: Boolean!
    note: String
    createdAt: String!
  }

  type Outreach {
    id: ID!
    participantId: ID!
    note: String
    createdAt: String!
  }

  type FollowUp {
    status: FollowUpStatus!
    reason: String!
  }

  type Participant {
    id: ID!
    name: String!
    createdAt: String!
    latestCheckIn: CheckIn
    latestOutreach: Outreach
    followUp: FollowUp!
  }

  type DashboardSummary {
    totalParticipants: Int!
    contactRequested: Int!
    checkInOverdue: Int!
    upToDate: Int!
  }

  type Query {
    participants(status: FollowUpStatus, search: String): [Participant!]!
    dashboardSummary: DashboardSummary!
  }

  type Mutation {
    recordCheckIn(
      participantId: ID!
      requestedContact: Boolean!
      note: String
    ): CheckIn!

    logOutreach(participantId: ID!, note: String): Outreach!
  }
`;

interface ParticipantArgs {
  status?: FollowUpStatus | null;
  search?: string | null;
}

interface RecordCheckInArgs {
  participantId: string;
  requestedContact: boolean;
  note?: string | null;
}

interface LogOutreachArgs {
  participantId: string;
  note?: string | null;
}

function toGraphQLError(error: unknown): never {
  if (
    error instanceof InputValidationError ||
    error instanceof ParticipantNotFoundError
  ) {
    throw new GraphQLError(error.message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  throw error;
}

export function createReconnectSchema(service: ParticipantService) {
  return createSchema({
    typeDefs,
    resolvers: {
      Query: {
        participants: (_parent: unknown, args: ParticipantArgs) =>
          service.listParticipants(args),
        dashboardSummary: () => service.dashboardSummary(),
      },
      Mutation: {
        recordCheckIn: (_parent: unknown, args: RecordCheckInArgs) => {
          try {
            return service.recordCheckIn(
              parseParticipantId(args.participantId),
              args.requestedContact,
              normalizeNote(args.note),
            );
          } catch (error) {
            return toGraphQLError(error);
          }
        },
        logOutreach: (_parent: unknown, args: LogOutreachArgs) => {
          try {
            return service.logOutreach(
              parseParticipantId(args.participantId),
              normalizeNote(args.note),
            );
          } catch (error) {
            return toGraphQLError(error);
          }
        },
      },
    },
  });
}

