import { describe, expect, it } from "vitest";
import { mergeRemote } from "./offline";
import type { OfflineQueue } from "./types";

const server = {
  collections: { runes: [{ id: "server", srs: { due: "2026-11-17" } }] },
  finance: { accounts: [{ name: "Sample broker" }] },
};

function queue(partial: Partial<OfflineQueue>): OfflineQueue {
  return {
    email: "person@example.com",
    docs: { collections: { runes: [{ id: "queued" }] } },
    events: [{ id: "e", kind: "rune_review", payload: { id: "queued" }, at: "2026-11-16T00:00:00.000Z" }],
    ...partial,
  };
}

describe("remote merge", () => {
  it("drops a queued deck that is older than the server row", () => {
    const merged = mergeRemote(server, { collections: "2026-11-17T03:00:00.000Z" }, queue({ at: "2026-11-16T00:00:00.000Z" }));
    expect(merged.docs.collections).toEqual(server.collections);
    expect(merged.docs.finance).toEqual(server.finance);
    expect(merged.queue.docs).toEqual({});
    expect(merged.queue.events).toEqual([]);
  });

  it("drops an untimestamped queue so an old copy cannot hide the server deck", () => {
    const merged = mergeRemote(server, { collections: "2026-11-17T03:00:00.000Z" }, queue({ at: undefined }));
    expect(merged.docs.collections).toEqual(server.collections);
    expect(merged.queue.events).toEqual([]);
  });

  it("keeps an unsent edit that is newer than the server row", () => {
    const local = queue({
      at: "2026-11-17T04:00:00.000Z",
      events: [{ id: "e", kind: "rune_review", payload: { id: "queued" }, at: "2026-11-17T04:00:00.000Z" }],
    });
    const merged = mergeRemote(server, { collections: "2026-11-17T03:00:00.000Z" }, local);
    expect(merged.docs.collections).toEqual(local.docs.collections);
    expect(merged.docs.finance).toEqual(server.finance);
    expect(merged.queue).toBe(local);
  });
});
