import { LoaderCircle, UserPlus } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/graphql/client";
import { useCreateParticipant } from "@/graphql/participants";

interface AddParticipantDialogProps {
  trigger: ReactNode;
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function AddParticipantDialog({ trigger }: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createParticipant = useCreateParticipant();
  const normalizedName = normalizeName(name);
  const validationError =
    normalizedName.length === 0
      ? "Participant name is required."
      : normalizedName.length > 80
        ? "Participant name must be 80 characters or fewer."
        : null;
  const visibleError = (submitted ? validationError : null) ?? serverError;

  function resetForm() {
    setName("");
    setSubmitted(false);
    setServerError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!createParticipant.isPending) {
      setOpen(nextOpen);
      if (!nextOpen) resetForm();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (validationError) return;

    try {
      await createParticipant.mutateAsync({ name: normalizedName });
      toast.success(`${normalizedName} was added.`);
      setOpen(false);
      resetForm();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add participant</DialogTitle>
            <DialogDescription>
              Add a fictional participant to the follow-up dashboard. They will
              appear as overdue until their first check-in is recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="participant-name">Participant name</Label>
              <span className="text-xs text-slate-500">
                {normalizedName.length}/80
              </span>
            </div>
            <Input
              id="participant-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setServerError(null);
              }}
              autoComplete="off"
              autoFocus
              aria-describedby="participant-name-help"
              aria-invalid={Boolean(visibleError)}
              placeholder="e.g. Avery Patel"
            />
            <p
              id="participant-name-help"
              role={visibleError ? "alert" : undefined}
              className={
                visibleError ? "text-xs text-rose-700" : "text-xs text-slate-500"
              }
            >
              {visibleError ?? "Names must be unique and 80 characters or fewer."}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createParticipant.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createParticipant.isPending}>
              {createParticipant.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              {createParticipant.isPending ? "Adding..." : "Add participant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
