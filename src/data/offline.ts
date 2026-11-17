import type { Mutation } from "./mutate";
import type { DocMap, EventDraft, OfflineQueue } from "./types";

const CACHE_KEY = "qj.cache.v1";
const QUEUE_KEY = "qj.queue.v1";

type CacheBlob = { email: string; docs: DocMap; at: string };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or a full disk; the in-memory copy still works */
  }
}

export function loadCache(email: string): DocMap | null {
  const blob = read<CacheBlob>(CACHE_KEY);
  if (!blob || blob.email !== email || !blob.docs) return null;
  return blob.docs;
}

export function saveCache(email: string, docs: DocMap) {
  write(CACHE_KEY, { email, docs, at: new Date().toISOString() } satisfies CacheBlob);
}

export function loadQueue(email: string): OfflineQueue {
  const q = read<OfflineQueue>(QUEUE_KEY);
  if (!q || q.email !== email) return { email, docs: {}, events: [] };
  return {
    email,
    docs: q.docs || {},
    events: Array.isArray(q.events) ? q.events : [],
    at: typeof q.at === "string" ? q.at : undefined,
  };
}

export function saveQueue(queue: OfflineQueue) {
  write(QUEUE_KEY, queue);
}

export function emptyQueue(email: string): OfflineQueue {
  return { email, docs: {}, events: [] };
}

const QUEUED_RUNE_KINDS = new Set(["rune_add", "rune_review", "rune_restore"]);

/** Unflushed add/review/restore events for a deleted rune must not sync later and recreate it. */
export function dropQueuedRuneEvents(events: EventDraft[], runeId: string): EventDraft[] {
  return events.filter((ev) => {
    if (!QUEUED_RUNE_KINDS.has(ev.kind)) return true;
    return ev.payload.id !== runeId;
  });
}

export function enqueueMutation(queue: OfflineQueue, result: Mutation): OfflineQueue {
  const prior = result.forgetRuneId ? dropQueuedRuneEvents(queue.events, result.forgetRuneId) : queue.events.slice();
  const keys = result.keys?.length ? result.keys : ["collections"];
  const docs = { ...queue.docs };
  for (const key of keys) docs[key] = result.docs[key];
  return { email: queue.email, docs, events: prior.concat(result.event), at: new Date().toISOString() };
}

/**
 * The server row wins when it was saved after the queued snapshot, and when a
 * queue from an older app has no timestamp. A newer unsent edit still overlays.
 */
export function reconcileQueue(queue: OfflineQueue, remoteUpdatedAt: Record<string, string>): OfflineQueue {
  const localAt = queue.at || "";
  const docs = { ...(queue.docs || {}) };
  let dropped = false;
  for (const key of Object.keys(docs)) {
    const serverAt = remoteUpdatedAt[key];
    if (!serverAt) continue;
    if (!localAt || serverAt > localAt) {
      delete docs[key];
      dropped = true;
    }
  }
  if (!dropped) return queue;
  const events = localAt ? queue.events.filter((ev) => ev.at > localAt) : [];
  return { ...queue, docs, events };
}

export function mergeRemote(remote: DocMap, remoteUpdatedAt: Record<string, string>, queue: OfflineQueue): { docs: DocMap; queue: OfflineQueue } {
  const next = reconcileQueue(queue, remoteUpdatedAt);
  return { docs: { ...remote, ...next.docs }, queue: next };
}

export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = messageOf(error);
  return /failed to fetch|network|load failed|offline|timeout/i.test(msg);
}

export function messageOf(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Something went wrong while saving";
}
