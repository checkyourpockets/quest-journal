import { describe, expect, it } from "vitest";
import { buildView } from "./model";
import { schedule } from "../lib/srs";
import { addChronicle, gradeRune, saveSettings, toggleHabitToday } from "../data/mutate";
import type { DocMap } from "../data/types";

function sample(): DocMap {
  return {
    generatedAt: "2026-03-01",
    computed: {
      today: "2026-03-01",
      exportedAt: "2026-03-01T00:00:00.000Z",
      shifts: { "2026-03-01": "OFF", "2026-03-02": "DAY" },
      omen: { date: "2026-03-01", text: "A quiet day.", why: "Rest counts." },
      oracle: "Walk, then write.",
      bag: { ember: 1, hourglass: 1, reroll: 1 },
      coach: { date: "2026-02-28", slipping: "A loose thread.", step: "One quiet minute." },
      rules: { offerCap: 3, offerExpiryDays: 7, habitCore: ["Sample habit"], rotation: { order: ["Rest Week"], nextMonth: "2026-04" } },
      char: {
        total: 250, earned: 250, spent: 0, lvl: 2, into: 0,
        cls: { name: "Warden", why: "Balance leads." },
        aspiration: "A far goal", aspDesc: "Keep it simple.",
        aspects: [{ name: "Body", cls: "Warrior", col: "#e0864a", pts: 10, lvl: 1, into: 10 }],
        rooms: [{ name: "Kitchen", giver: "cook", icon: "🍳", xp: 20, lvl: 1, into: 20 }],
        branches: [{ name: "Push", col: "#e0864a", un: ["A push"], av: ["B"], gh: 1, hid: 0 }],
        nodeCounts: { un: 1, av: 1, gh: 1, hid: 0 },
        inbody: { date: "2026-01-02", weight: 60, smm: 30, bf: 15, score: 80, bmr: 1500 },
        inbodyPrev: { date: "2025-12-02", weight: 59, smm: 29, bf: 16, score: 79, bmr: 1490 },
        moves: [["Press", 40, 8, "2026-01-02"]],
      },
      ledger: {
        target: 10, rows: 2,
        periods: [{ p: "2026-01-15", end: null, inc: 100, out: 40, give: 0, inv: 0, rate: 0.6 }],
        pcats: { "2026-01-15": [["Groceries", 40]] },
        pmerch: { "2026-01-15": [["Market", 40]] },
        give: { "2026": [["Fund", 10, 1]] },
        recent: [{ d: "2026-03-01", w: "Market", c: "Groceries", a: 40, dir: "out" }],
        redirect: { amount: 25, from: "2026-04", to: "savings" },
      },
      inv: [{ n: "Sample grain", f: null }],
    },
    collections: {
      quests: [
        { id: "q1", title: "Sample habit", giver: "coach", type: "habit", status: "active", window: "morning", start: "2026-03-01", end: "2026-03-07", flavor: "Move", rewards: { xp: 20, skills: ["Body"] }, conditions: [{ kind: "tally", min: 3, prompt: "Move" }], tally: { "0": ["2026-03-01"] } },
        { id: "q2", title: "Rest Week", giver: "trainer", type: "habit", status: "rotation", window: "any", rewards: { xp: 20 }, conditions: [{ kind: "tally", min: 2, manual: true }] },
      ],
      inventory: [{ id: "i1", name: "Sample grain", category: "Pantry", qty: 2, unit: "cups", useBy: null }],
      blueprints: [{ id: "bowl", name: "Sample bowl", kind: "meal", yield: "1 jar", unlocked: "2026-01-02", materials: [{ name: "Sample grain", qty: "1/2 cup", match: "grain" }], steps: ["Mix."], tools: ["Jar"], notes: "", variations: [] }],
      entries: [{ id: "e1", date: "2026-03-01", session: "morning", text: "Hello." }],
      readings: [{ id: "r1", title: "A note", ko: "가나다", pickDate: "2026-03-01", topic: "sample" }],
      runes: [{ id: "rune1", w: "가나다", hanja: "", meaning: "sample", known: false, srs: { due: "2026-03-01", ease: 2.5, ivl: 0, lapses: 0, last: null, reps: 0 } }],
      series: [{ id: "s1", title: "Sample", premise: "A short tale.", arc: [{ title: "Dawn" }], episodes: {} }],
      beatnotes: [{ id: "b1", date: "2026-03-01", title: "Desk", beat: "A short note." }],
      pins: [{ id: "p1", name: "Home", category: "home", note: "Base" }],
    },
    skill_web: {
      RB: 600,
      r: [120, 215],
      nodes: [
        { id: "n1", name: "First step", br: ["push"], t: 1, st: "un", pre: [], x: 600, y: 480, crit: "Do it", h: "", un: "2026-01-02", confirm: false },
        { id: "n2", name: "Next step", br: ["push"], t: 2, st: "av", pre: ["n1"], x: 600, y: 360, crit: "Do more", h: "1 month", un: "", confirm: false },
      ],
      badges: [{ k: "push", l: "Push", col: "#e0864a", x: 600, y: 40 }],
    },
  };
}

describe("journal view", () => {
  it("builds every section the nine tabs need", () => {
    const view = buildView(sample(), "2026-03-01");
    expect(view.quests).toHaveLength(2);
    expect(view.quests[0].loggedToday).toBe(true);
    expect(view.quests[0].p).toEqual([1, 3]);
    expect(view.quests[1].rot).toBe("2026-04");
    expect(view.recipes).toHaveLength(1);
    expect(view.runes[0].due).toBe("2026-03-01");
    expect(view.entries[0].t).toBe("Hello.");
    expect(view.web?.nodes).toHaveLength(2);
    expect(view.char.branches[0].av).toBe(1);
    expect(view.ledger.periods).toHaveLength(1);
    expect(view.oracle.text).toContain("Walk");
    expect(view.pins[0].n).toBe("Home");
    expect(view.settings.shift).toBeNull();
    expect(view.settings.savingsTargetPct).toBeNull();
    expect(view.settings.redirectAmountKRW).toBeNull();
  });

  it("reads a settings document and saves one without filling gaps", () => {
    const docs = sample();
    docs.settings = {
      shift: { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
      savingsTargetPct: 15,
      redirectGift: { amountKRW: 1000 },
    };
    const view = buildView(docs, "2026-03-02");
    expect(view.settings.shift).toEqual({ start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] });
    expect(view.settings.savingsTargetPct).toBe(15);
    expect(view.settings.redirectAmountKRW).toBe(1000);
    const saved = saveSettings(docs, { savingsTargetPct: 12 });
    expect(saved.keys).toEqual(["settings"]);
    expect(saved.event.kind).toBe("settings");
    expect((saved.docs.settings as { savingsTargetPct: number }).savingsTargetPct).toBe(12);
    expect((saved.docs.settings as { shift?: unknown }).shift).toBeUndefined();
  });

  it("schedules a later due date for a good review", () => {
    const next = schedule({ ease: 2.5, ivl: 0, reps: 0, lapses: 0, due: "2026-03-01", last: null }, "good", "2026-03-01");
    expect(next.due > "2026-03-01").toBe(true);
    expect(next.reps).toBe(1);
    const again = schedule(next, "again", next.due);
    expect(again.lapses).toBe(1);
    expect(again.due > next.due).toBe(true);
  });

  it("writes chronicle text and habit checks into collections", () => {
    const start = sample();
    const saved = addChronicle(start, "night", "A line.", "2026-03-01");
    const entries = (saved.docs.collections as { entries: { text: string }[] }).entries;
    expect(entries.some((e) => e.text === "A line.")).toBe(true);
    expect(saved.event.kind).toBe("chronicle");
    const checked = toggleHabitToday(saved.docs, "q1", "2026-03-02");
    const quest = (checked.docs.collections as { quests: { tally: { "0": string[] } }[] }).quests[0];
    expect(quest.tally["0"]).toContain("2026-03-02");
    expect(checked.event.kind).toBe("habit_check");
    const graded = gradeRune(checked.docs, "rune1", "easy", "2026-03-01");
    const rune = (graded.docs.collections as { runes: { srs: { due: string } }[] }).runes[0];
    expect(rune.srs.due > "2026-03-01").toBe(true);
    expect(graded.event.kind).toBe("rune_review");
  });
});
