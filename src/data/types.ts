export type DocMap = Record<string, unknown>;

export type SavePhase = "idle" | "saving" | "saved" | "queued" | "error";

export type EventDraft = { id: string; kind: string; payload: Record<string, unknown>; at: string };

export type OfflineQueue = {
  email: string;
  docs: DocMap;
  events: EventDraft[];
  /** When the queued snapshots were taken. Missing on queues saved before this field existed. */
  at?: string;
};

export type Grade = "again" | "hard" | "good" | "easy";
