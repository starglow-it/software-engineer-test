import { CheckCircle2, Clock3, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FollowUpStatus } from "@/graphql/participants";

const statusDetails = {
  CONTACT_REQUESTED: {
    label: "Contact requested",
    variant: "requested" as const,
    icon: MessageCircle,
  },
  CHECK_IN_OVERDUE: {
    label: "Check-in overdue",
    variant: "overdue" as const,
    icon: Clock3,
  },
  UP_TO_DATE: {
    label: "Up to date",
    variant: "current" as const,
    icon: CheckCircle2,
  },
} satisfies Record<FollowUpStatus, object>;

export function StatusBadge({ status }: { status: FollowUpStatus }) {
  const details = statusDetails[status];
  const Icon = details.icon;

  return (
    <Badge variant={details.variant}>
      <Icon className="size-3.5" aria-hidden="true" />
      {details.label}
    </Badge>
  );
}

