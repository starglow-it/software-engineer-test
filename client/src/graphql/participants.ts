import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "./client";

export type FollowUpStatus =
  | "CONTACT_REQUESTED"
  | "CHECK_IN_OVERDUE"
  | "UP_TO_DATE";

export interface CheckIn {
  id: string;
  participantId: string;
  requestedContact: boolean;
  note: string | null;
  createdAt: string;
}

export interface Outreach {
  id: string;
  participantId: string;
  note: string | null;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  latestCheckIn: CheckIn | null;
  latestOutreach: Outreach | null;
  followUp: {
    status: FollowUpStatus;
    reason: string;
  };
}

export interface DashboardSummary {
  totalParticipants: number;
  contactRequested: number;
  checkInOverdue: number;
  upToDate: number;
}

interface ParticipantFilters {
  search: string;
  status: FollowUpStatus | null;
}

const participantsQuery = /* GraphQL */ `
  query Participants($search: String, $status: FollowUpStatus) {
    participants(search: $search, status: $status) {
      id
      name
      latestCheckIn {
        id
        participantId
        requestedContact
        note
        createdAt
      }
      latestOutreach {
        id
        participantId
        note
        createdAt
      }
      followUp {
        status
        reason
      }
    }
  }
`;

const summaryQuery = /* GraphQL */ `
  query DashboardSummary {
    dashboardSummary {
      totalParticipants
      contactRequested
      checkInOverdue
      upToDate
    }
  }
`;

const recordCheckInMutation = /* GraphQL */ `
  mutation RecordCheckIn(
    $participantId: ID!
    $requestedContact: Boolean!
    $note: String
  ) {
    recordCheckIn(
      participantId: $participantId
      requestedContact: $requestedContact
      note: $note
    ) {
      id
    }
  }
`;

const logOutreachMutation = /* GraphQL */ `
  mutation LogOutreach($participantId: ID!, $note: String) {
    logOutreach(participantId: $participantId, note: $note) {
      id
    }
  }
`;

export const participantKeys = {
  all: ["participants"] as const,
  list: (filters: ParticipantFilters) => ["participants", filters] as const,
  summary: ["dashboard-summary"] as const,
};

export function useParticipants(filters: ParticipantFilters) {
  return useQuery({
    queryKey: participantKeys.list(filters),
    queryFn: async () => {
      const data = await graphqlClient.request<{ participants: Participant[] }>(
        participantsQuery,
        {
          search: filters.search.trim() || null,
          status: filters.status,
        },
      );

      return data.participants;
    },
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: participantKeys.summary,
    queryFn: async () => {
      const data = await graphqlClient.request<{
        dashboardSummary: DashboardSummary;
      }>(summaryQuery);

      return data.dashboardSummary;
    },
  });
}

function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: participantKeys.all }),
      queryClient.invalidateQueries({ queryKey: participantKeys.summary }),
    ]);
  };
}

export function useRecordCheckIn() {
  const refreshDashboard = useRefreshDashboard();

  return useMutation({
    mutationFn: (variables: {
      participantId: string;
      requestedContact: boolean;
      note: string | null;
    }) => graphqlClient.request(recordCheckInMutation, variables),
    onSuccess: refreshDashboard,
  });
}

export function useLogOutreach() {
  const refreshDashboard = useRefreshDashboard();

  return useMutation({
    mutationFn: (variables: { participantId: string; note: string | null }) =>
      graphqlClient.request(logOutreachMutation, variables),
    onSuccess: refreshDashboard,
  });
}

