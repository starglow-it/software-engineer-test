import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { AddParticipantDialog } from "@/components/add-participant-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ParticipantList } from "@/components/participant-list";
import { SummaryCard } from "@/components/summary-card";
import {
  useDashboardSummary,
  useParticipants,
  type FollowUpStatus,
} from "@/graphql/participants";
import { getErrorMessage } from "@/graphql/client";

type StatusFilter = FollowUpStatus | "ALL";

function LoadingList() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="hidden h-8 w-28 sm:block" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const filters = {
    search,
    status: status === "ALL" ? null : status,
  };
  const participants = useParticipants(filters);
  const summary = useDashboardSummary();
  const hasFilters = search.trim().length > 0 || status !== "ALL";
  const error = participants.error ?? summary.error;

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
  }

  async function retry() {
    await Promise.all([participants.refetch(), summary.refetch()]);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-white shadow-sm">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">Reconnect</p>
              <p className="text-xs text-slate-500">Support follow-up dashboard</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 ring-1 ring-teal-100 sm:flex">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Non-clinical demo
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Coordinator workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Keep every follow-up visible
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review check-in activity, resolve contact requests, and keep support work moving.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500">
              {summary.data?.totalParticipants ?? 0} fictional participants
            </p>
            <AddParticipantDialog
              trigger={
                <Button>
                  <UserPlus className="size-4" aria-hidden="true" />
                  Add participant
                </Button>
              }
            />
          </div>
        </div>

        <section aria-label="Follow-up summary" className="mt-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Contact requested"
            value={summary.data?.contactRequested}
            icon={MessageCircle}
            tone="rose"
            loading={summary.isPending}
          />
          <SummaryCard
            label="Check-in overdue"
            value={summary.data?.checkInOverdue}
            icon={Clock3}
            tone="amber"
            loading={summary.isPending}
          />
          <SummaryCard
            label="Up to date"
            value={summary.data?.upToDate}
            icon={CheckCircle2}
            tone="emerald"
            loading={summary.isPending}
          />
        </section>

        <section aria-labelledby="participant-heading" className="mt-8">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="participant-heading" className="text-lg font-semibold text-slate-950">
                Participant follow-up
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Requests are shown first, followed by overdue check-ins.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Label htmlFor="participant-search" className="sr-only">
                  Search participants
                </Label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  id="participant-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search participants"
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-52">
                <Label htmlFor="status-filter" className="sr-only">
                  Filter by follow-up status
                </Label>
                <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                  <SelectTrigger id="status-filter" aria-label="Filter by follow-up status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="CONTACT_REQUESTED">Contact requested</SelectItem>
                    <SelectItem value="CHECK_IN_OVERDUE">Check-in overdue</SelectItem>
                    <SelectItem value="UP_TO_DATE">Up to date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {error ? (
            <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">The dashboard could not be loaded.</p>
                <p className="mt-1 text-rose-800">{getErrorMessage(error)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Try again
              </Button>
            </Alert>
          ) : participants.isPending ? (
            <LoadingList />
          ) : (
            <ParticipantList participants={participants.data ?? []} />
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">
          Reconnect is a fictional, non-clinical workflow demonstration. It does not provide medical guidance.
        </div>
      </footer>
    </div>
  );
}
