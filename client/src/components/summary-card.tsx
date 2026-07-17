import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface SummaryCardProps {
  label: string;
  value?: number;
  icon: LucideIcon;
  tone: "rose" | "amber" | "emerald";
  loading?: boolean;
}

const tones = {
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  amber: "bg-amber-50 text-amber-800 ring-amber-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-10" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {value ?? 0}
            </p>
          )}
        </div>
        <div className={cn("grid size-11 place-items-center rounded-xl ring-1", tones[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

