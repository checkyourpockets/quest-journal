import { describe, expect, it } from "vitest";
import { deleteRune, restoreRune } from "./mutate";
import { enqueueMutation } from "./offline";
import type { DocMap, OfflineQueue } from "./types";

function docs(): DocMap {
  return {
    finance: { accounts: [{ name: "Sample broker", kind: "investment", value: 10, costBasis: 8 }] },
    settings: { savingsTargetPct: 10 },
    collections: {
      runes: [
        { id: "rune1", w: "가나다", meaning: "sample", srs: { due: "2026-03-01", ease: 2.5, ivl: 0, reps: 0, lapses: 0, last: null } },
        { id: "rune2", w: "라마바", meaning: "castle", srs: { due: "2026-03-01", ease: 2.5, ivl: 0, reps: 0, lapses: 0, last: null } },
      ],
      reviews: [
        { id: "rev-a", runeId: "rune1", grade: "good", applied: false },
        { id: "rev-b", runeId: "rune2", grade: "hard", applied: false },
      ],
      reviewQueue: ["rune1", "rune2"],
      pendingReviews: { rune1: { grade: "again", applied: false }, rune2: { grade: "good", applied: false } },
    },
  };
}

describe("deleteRune", () => {
  it("removes the card, pending reviews, and unflushed queue events", () => {
    const start = docs();
    const removed = deleteRune(start, "rune1");
    const col = removed.docs.collections as {
      runes: { id: string }[];
      reviews: { runeId: string }[];
      reviewQueue: string[];
      pendingReviews: Record<string, unknown>;
    };
    expect(col.runes.map((row) => row.id)).toEqual(["rune2"]);
    expect(col.reviews.map((row) => row.runeId)).toEqual(["rune2"]);
    expect(col.reviewQueue).toEqual(["rune2"]);
    expect(Object.keys(col.pendingReviews)).toEqual(["rune2"]);
    expect(removed.removed?.w).toBe("가나다");
    expect(removed.index).toBe(0);
    expect(removed.event.kind).toBe("rune_delete");
    expect(removed.event.payload).toEqual({ id: "rune1", w: "가나다" });
    expect(removed.forgetRuneId).toBe("rune1");
    expect((start.collections as { runes: unknown[] }).runes).toHaveLength(2);
    expect(removed.docs.finance).toEqual(start.finance);
    expect(removed.docs.settings).toEqual(start.settings);

    const queue: OfflineQueue = {
      email: "person@example.com",
      docs: {},
      events: [
        { id: "e1", kind: "rune_review", payload: { id: "rune1", grade: "again" }, at: "2026-03-01T00:00:00.000Z" },
        { id: "e2", kind: "rune_add", payload: { id: "rune1", w: "가나다" }, at: "2026-03-01T00:00:01.000Z" },
        { id: "e3", kind: "rune_restore", payload: { id: "rune1", w: "가나다" }, at: "2026-03-01T00:00:02.000Z" },
        { id: "e4", kind: "rune_review", payload: { id: "rune2", grade: "good" }, at: "2026-03-01T00:00:03.000Z" },
        { id: "e5", kind: "chronicle", payload: { id: "c1", text: "Hi" }, at: "2026-03-01T00:00:04.000Z" },
      ],
    };
    const queued = enqueueMutation(queue, removed);
    expect(queued.email).toBe("person@example.com");
    expect(Object.keys(queued.docs)).toEqual(["collections"]);
    expect(queued.events.map((event) => event.kind)).toEqual(["rune_review", "chronicle", "rune_delete"]);
    expect(queued.events[0].payload.id).toBe("rune2");
    expect((queued.docs.collections as { runes: { id: string }[] }).runes.map((row) => row.id)).toEqual(["rune2"]);
    expect(queue.events).toHaveLength(5);

    const back = restoreRune(queued.docs, removed.removed || {}, removed.index);
    expect((back.docs.collections as { runes: { id: string; srs: { due: string } }[] }).runes.map((row) => row.id)).toEqual(["rune1", "rune2"]);
    expect((back.docs.collections as { runes: { srs: { due: string } }[] }).runes[0].srs.due).toBe("2026-03-01");
    expect(back.event.kind).toBe("rune_restore");
    const twice = restoreRune(back.docs, removed.removed || {}, removed.index);
    expect((twice.docs.collections as { runes: unknown[] }).runes).toHaveLength(2);

    const missing = deleteRune(start, "missing");
    expect(missing.removed).toBeNull();
    expect(missing.event.payload).toEqual({ id: "missing", missing: true });
    expect((missing.docs.collections as { runes: unknown[] }).runes).toHaveLength(2);
  });
});
