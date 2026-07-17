import { LoaderCircle, MessageSquarePlus, PhoneCall } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useLogOutreach,
  useRecordCheckIn,
  type Participant,
} from "@/graphql/participants";
import { getErrorMessage } from "@/graphql/client";

type ActionType = "check-in" | "outreach";

interface ParticipantActionDialogProps {
  participant: Participant;
  action: ActionType;
  trigger: ReactNode;
}

export function ParticipantActionDialog({
  participant,
  action,
  trigger,
}: ParticipantActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [requestedContact, setRequestedContact] = useState(false);
  const recordCheckIn = useRecordCheckIn();
  const logOutreach = useLogOutreach();
  const mutation = action === "check-in" ? recordCheckIn : logOutreach;
  const isCheckIn = action === "check-in";
  const noteTooLong = note.length > 500;

  function resetForm() {
    setNote("");
    setRequestedContact(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!mutation.isPending) {
      setOpen(nextOpen);
      if (!nextOpen) resetForm();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noteTooLong) return;

    const normalizedNote = note.trim() || null;

    try {
      if (isCheckIn) {
        await recordCheckIn.mutateAsync({
          participantId: participant.id,
          requestedContact,
          note: normalizedNote,
        });
        toast.success(`Check-in recorded for ${participant.name}.`);
      } else {
        await logOutreach.mutateAsync({
          participantId: participant.id,
          note: normalizedNote,
        });
        toast.success(`Outreach recorded for ${participant.name}.`);
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isCheckIn ? "Record check-in" : "Log outreach"}
            </DialogTitle>
            <DialogDescription>
              {isCheckIn
                ? `Add a new check-in for ${participant.name}.`
                : `Record completed outreach for ${participant.name}. Outreach after a request resolves it.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            {isCheckIn && (
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Checkbox
                  id={`request-contact-${participant.id}`}
                  checked={requestedContact}
                  onCheckedChange={(checked) => setRequestedContact(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor={`request-contact-${participant.id}`}>
                    Participant requested contact
                  </Label>
                  <p className="text-xs leading-5 text-slate-500">
                    This request stays visible until later outreach is recorded.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor={`${action}-note-${participant.id}`}>Note (optional)</Label>
                <span
                  className={noteTooLong ? "text-xs text-rose-700" : "text-xs text-slate-500"}
                >
                  {note.length}/500
                </span>
              </div>
              <Textarea
                id={`${action}-note-${participant.id}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                aria-describedby={`${action}-note-help-${participant.id}`}
                aria-invalid={noteTooLong}
                placeholder={
                  isCheckIn
                    ? "Add relevant non-clinical context..."
                    : "Add a brief outreach note..."
                }
              />
              <p
                id={`${action}-note-help-${participant.id}`}
                className={noteTooLong ? "text-xs text-rose-700" : "text-xs text-slate-500"}
              >
                {noteTooLong
                  ? "Shorten this note to 500 characters or fewer."
                  : "Avoid sensitive or clinical information in this demo."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || noteTooLong}>
              {mutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : isCheckIn ? (
                <MessageSquarePlus className="size-4" aria-hidden="true" />
              ) : (
                <PhoneCall className="size-4" aria-hidden="true" />
              )}
              {mutation.isPending
                ? "Saving..."
                : isCheckIn
                  ? "Save check-in"
                  : "Save outreach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

