export type DocMap = Record<string, unknown>;

export type SavePhase = "idle" | "saving" | "saved" | "queued" | "error";

export type EventDraft = { id: string; kind: string; payload: Record<string, unknown>; at: string };

export type OfflineQueue = {
  email: string;
  docs: DocMap;
  events: EventDraft[];
};

export type Grade = "again" | "hard" | "good" | "easy";
