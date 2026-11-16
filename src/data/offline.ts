import type { DocMap, OfflineQueue } from "./types";

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
  return { email, docs: q.docs || {}, events: Array.isArray(q.events) ? q.events : [] };
}

export function saveQueue(queue: OfflineQueue) {
  write(QUEUE_KEY, queue);
}

export function emptyQueue(email: string): OfflineQueue {
  return { email, docs: {}, events: [] };
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
