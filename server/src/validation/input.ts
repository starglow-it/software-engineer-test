export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function parseParticipantId(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new InputValidationError("Participant ID must be a positive integer.");
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new InputValidationError("Participant ID must be a positive integer.");
  }

  return id;
}

export function normalizeNote(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const note = value.trim();

  if (note.length > 500) {
    throw new InputValidationError("Notes must be 500 characters or fewer.");
  }

  return note.length === 0 ? null : note;
}

