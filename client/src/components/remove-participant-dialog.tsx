import { LoaderCircle, Trash2 } from "lucide-react";
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
import { getErrorMessage } from "@/graphql/client";
import {
  useRemoveParticipant,
  type Participant,
} from "@/graphql/participants";

interface RemoveParticipantDialogProps {
  participant: Participant;
  trigger: ReactNode;
}

export function RemoveParticipantDialog({
  participant,
  trigger,
}: RemoveParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const removeParticipant = useRemoveParticipant();

  function handleOpenChange(nextOpen: boolean) {
    if (!removeParticipant.isPending) {
      setOpen(nextOpen);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await removeParticipant.mutateAsync({ participantId: participant.id });
      toast.success(`${participant.name} was removed.`);
      setOpen(false);
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
            <DialogTitle>Remove participant?</DialogTitle>
            <DialogDescription>
              This will permanently remove {participant.name} and all of their
              check-ins and outreach history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-950">
              {participant.name}
            </p>
            <p className="mt-1 text-xs leading-5 text-rose-800">
              Participant record and related activity will be deleted.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={removeParticipant.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={removeParticipant.isPending}
            >
              {removeParticipant.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {removeParticipant.isPending ? "Removing..." : "Remove participant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
