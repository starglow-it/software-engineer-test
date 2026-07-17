import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900",
        className,
      )}
      {...props}
    />
  );
}

