import { MessageSquarePlus, PhoneCall, Trash2, Users } from "lucide-react";
import { ParticipantActionDialog } from "@/components/participant-action-dialog";
import { RemoveParticipantDialog } from "@/components/remove-participant-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Participant } from "@/graphql/participants";
import { formatDateTime, initials } from "@/lib/format";

function ParticipantActions({ participant }: { participant: Participant }) {
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <ParticipantActionDialog
        participant={participant}
        action="check-in"
        trigger={
          <Button variant="outline" size="sm">
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            Check-in
          </Button>
        }
      />
      <ParticipantActionDialog
        participant={participant}
        action="outreach"
        trigger={
          <Button size="sm">
            <PhoneCall className="size-4" aria-hidden="true" />
            Outreach
          </Button>
        }
      />
      <RemoveParticipantDialog
        participant={participant}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </Button>
        }
      />
    </div>
  );
}

function DateDetail({
  label,
  value,
  note,
}: {
  label: string;
  value: string | null | undefined;
  note?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:hidden">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800 md:mt-0">
        {formatDateTime(value)}
      </p>
      {note && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

export function ParticipantList({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
            <Users className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-950">No participants found</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
            Try a different name or clear the current status filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-white">
              <TableHead className="w-[18%]">Participant</TableHead>
              <TableHead className="w-[17%]">Latest check-in</TableHead>
              <TableHead className="w-[17%]">Latest outreach</TableHead>
              <TableHead className="w-[28%]">Follow-up status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
                      {initials(participant.name)}
                    </span>
                    <span className="font-semibold text-slate-950">{participant.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DateDetail
                    label="Latest check-in"
                    value={participant.latestCheckIn?.createdAt}
                    note={participant.latestCheckIn?.note}
                  />
                </TableCell>
                <TableCell>
                  <DateDetail
                    label="Latest outreach"
                    value={participant.latestOutreach?.createdAt}
                    note={participant.latestOutreach?.note}
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge status={participant.followUp.status} />
                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                    {participant.followUp.reason}
                  </p>
                </TableCell>
                <TableCell>
                  <ParticipantActions participant={participant} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="space-y-3 md:hidden">
        {participants.map((participant) => (
          <Card key={participant.id}>
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
                    {initials(participant.name)}
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-950">{participant.name}</h2>
                    <p className="text-xs text-slate-500">Participant</p>
                  </div>
                </div>
                <StatusBadge status={participant.followUp.status} />
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                {participant.followUp.reason}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DateDetail
                  label="Latest check-in"
                  value={participant.latestCheckIn?.createdAt}
                  note={participant.latestCheckIn?.note}
                />
                <DateDetail
                  label="Latest outreach"
                  value={participant.latestOutreach?.createdAt}
                  note={participant.latestOutreach?.note}
                />
              </div>

              <ParticipantActions participant={participant} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
