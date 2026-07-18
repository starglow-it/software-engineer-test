import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface Participant {
  id: number;
  name: string;
  createdAt: string;
}

export interface CheckIn {
  id: number;
  participantId: number;
  requestedContact: boolean;
  note: string | null;
  createdAt: string;
}

export interface Outreach {
  id: number;
  participantId: number;
  note: string | null;
  createdAt: string;
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATABASE_PATH = resolve(
  moduleDirectory,
  "../../data/reconnect.db",
);

const schema = `
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_unique_name
    ON participants(name COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS check_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    requested_contact INTEGER NOT NULL CHECK (requested_contact IN (0, 1)),
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS outreaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_check_ins_participant_created
    ON check_ins(participant_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_outreaches_participant_created
    ON outreaches(participant_id, created_at DESC);
`;

function hoursAgo(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * 60 * 60 * 1_000).toISOString();
}

export function seedDemoData(database: Database.Database, now = new Date()): void {
  const existing = database
    .prepare("SELECT COUNT(*) AS count FROM participants")
    .get() as { count: number };

  if (existing.count > 0) {
    return;
  }

  const insertParticipant = database.prepare(
    "INSERT INTO participants (name, created_at) VALUES (?, ?)",
  );
  const insertCheckIn = database.prepare(
    `INSERT INTO check_ins
      (participant_id, requested_contact, note, created_at)
     VALUES (?, ?, ?, ?)`,
  );
  const insertOutreach = database.prepare(
    `INSERT INTO outreaches (participant_id, note, created_at)
     VALUES (?, ?, ?)`,
  );

  database.transaction(() => {
    const maya = Number(
      insertParticipant.run("Maya Chen", hoursAgo(now, 240)).lastInsertRowid,
    );
    insertCheckIn.run(
      maya,
      1,
      "Would appreciate a check-in today.",
      hoursAgo(now, 2),
    );

    const jordan = Number(
      insertParticipant.run("Jordan Brooks", hoursAgo(now, 240)).lastInsertRowid,
    );
    insertCheckIn.run(jordan, 0, null, hoursAgo(now, 96));

    const sam = Number(
      insertParticipant.run("Sam Rivera", hoursAgo(now, 240)).lastInsertRowid,
    );
    insertCheckIn.run(sam, 0, "All set for now.", hoursAgo(now, 8));

    const taylor = Number(
      insertParticipant.run("Taylor Morgan", hoursAgo(now, 240)).lastInsertRowid,
    );
    insertCheckIn.run(
      taylor,
      1,
      "Requested a quick follow-up.",
      hoursAgo(now, 30),
    );
    insertOutreach.run(
      taylor,
      "Connected and confirmed next steps.",
      hoursAgo(now, 20),
    );
  })();
}

export function createDatabase(
  filename = process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH,
  now = new Date(),
): Database.Database {
  if (filename !== ":memory:") {
    mkdirSync(dirname(filename), { recursive: true });
  }

  const database = new Database(filename);
  database.pragma("foreign_keys = ON");

  if (filename !== ":memory:") {
    database.pragma("journal_mode = WAL");
  }

  database.exec(schema);
  seedDemoData(database, now);
  return database;
}

export class ParticipantRepository {
  constructor(private readonly database: Database.Database) {}

  listParticipants(): Participant[] {
    return this.database
      .prepare(
        `SELECT id, name, created_at AS createdAt
         FROM participants
         ORDER BY name COLLATE NOCASE`,
      )
      .all() as Participant[];
  }

  findParticipant(id: number): Participant | undefined {
    return this.database
      .prepare(
        `SELECT id, name, created_at AS createdAt
         FROM participants
         WHERE id = ?`,
      )
      .get(id) as Participant | undefined;
  }

  findParticipantByName(name: string): Participant | undefined {
    return this.database
      .prepare(
        `SELECT id, name, created_at AS createdAt
         FROM participants
         WHERE name = ? COLLATE NOCASE`,
      )
      .get(name) as Participant | undefined;
  }

  createParticipant(name: string, createdAt: string): Participant {
    const result = this.database
      .prepare(
        `INSERT INTO participants (name, created_at)
         VALUES (?, ?)`,
      )
      .run(name, createdAt);

    return this.findParticipant(Number(result.lastInsertRowid))!;
  }

  listCheckIns(participantId: number): CheckIn[] {
    const rows = this.database
      .prepare(
        `SELECT
           id,
           participant_id AS participantId,
           requested_contact AS requestedContact,
           note,
           created_at AS createdAt
         FROM check_ins
         WHERE participant_id = ?
         ORDER BY created_at DESC`,
      )
      .all(participantId) as Array<Omit<CheckIn, "requestedContact"> & {
      requestedContact: number;
    }>;

    return rows.map((row) => ({
      ...row,
      requestedContact: Boolean(row.requestedContact),
    }));
  }

  listOutreaches(participantId: number): Outreach[] {
    return this.database
      .prepare(
        `SELECT
           id,
           participant_id AS participantId,
           note,
           created_at AS createdAt
         FROM outreaches
         WHERE participant_id = ?
         ORDER BY created_at DESC`,
      )
      .all(participantId) as Outreach[];
  }

  recordCheckIn(
    participantId: number,
    requestedContact: boolean,
    note: string | null,
    createdAt: string,
  ): CheckIn {
    const result = this.database
      .prepare(
        `INSERT INTO check_ins
          (participant_id, requested_contact, note, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(participantId, requestedContact ? 1 : 0, note, createdAt);

    const row = this.database
      .prepare(
        `SELECT
           id,
           participant_id AS participantId,
           requested_contact AS requestedContact,
           note,
           created_at AS createdAt
         FROM check_ins
         WHERE id = ?`,
      )
      .get(result.lastInsertRowid) as Omit<CheckIn, "requestedContact"> & {
      requestedContact: number;
    };

    return { ...row, requestedContact: Boolean(row.requestedContact) };
  }

  logOutreach(
    participantId: number,
    note: string | null,
    createdAt: string,
  ): Outreach {
    const result = this.database
      .prepare(
        `INSERT INTO outreaches (participant_id, note, created_at)
         VALUES (?, ?, ?)`,
      )
      .run(participantId, note, createdAt);

    return this.database
      .prepare(
        `SELECT
           id,
           participant_id AS participantId,
           note,
           created_at AS createdAt
         FROM outreaches
         WHERE id = ?`,
      )
      .get(result.lastInsertRowid) as Outreach;
  }
}
