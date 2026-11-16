import { describe, expect, it } from "vitest";
import { buildView } from "./model";
import { schedule } from "../lib/srs";
import { addChronicle, gradeRune, toggleHabitToday } from "../data/mutate";
import type { DocMap } from "../data/types";

function sample(): DocMap {
  return {
    generatedAt: "2026-11-16 KST",
    computed: {
      today: "2026-11-16",
      exportedAt: "2026-11-16T07:26:39.196Z",
      shifts: { "2026-11-16": "OFF", "2026-11-17": "PM" },
      omen: { date: "2026-11-16", text: "A quiet day.", why: "Rest counts." },
      oracle: "Walk, then write.",
      bag: { ember: 1, hourglass: 1, reroll: 1 },
      coach: { date: "2026-11-15", slipping: "The heel.", step: "Ten calf raises." },
      rules: { offerCap: 3, offerExpiryDays: 7, habitCore: ["Morning Movement"], rotation: { order: ["Show Up"], nextMonth: "2026-12" } },
      char: {
        total: 250, earned: 250, spent: 0, lvl: 2, into: 0,
        cls: { name: "Warden", why: "Hearth leads." },
        aspiration: "The Unbroken", aspDesc: "A quiet heel.",
        aspects: [{ name: "Body", cls: "Warrior", col: "#e0864a", pts: 10, lvl: 1, into: 10 }],
        rooms: [{ name: "Kitchen", giver: "cook", icon: "🍳", xp: 20, lvl: 1, into: 20 }],
        branches: [{ name: "Push", col: "#e0864a", un: ["A push"], av: ["B"], gh: 1, hid: 0 }],
        nodeCounts: { un: 1, av: 1, gh: 1, hid: 0 },
        inbody: { date: "2026-11-04", weight: 70, smm: 30, bf: 15, score: 80, bmr: 1600 },
        inbodyPrev: { date: "2026-10-07", weight: 69, smm: 29, bf: 16, score: 79, bmr: 1590 },
        moves: [["Press", 40, 8, "2026-11-04"]],
      },
      ledger: {
        target: 20, rows: 2,
        periods: [{ p: "2026-10-21", end: null, inc: 100, out: 40, give: 0, inv: 0, rate: 0.6 }],
        pcats: { "2026-10-21": [["Groceries", 40]] },
        pmerch: { "2026-10-21": [["Market", 40]] },
        give: { "2026": [["Fund", 10, 1]] },
        recent: [{ d: "2026-11-16", w: "Market", c: "Groceries", a: 40, dir: "out" }],
        redirect: { amount: 50000, from: "2026-12", to: "savings" },
      },
      inv: [{ n: "Oats", f: null }],
    },
    collections: {
      quests: [
        { id: "q1", title: "Morning Movement", giver: "coach", type: "habit", status: "active", window: "morning", start: "2026-11-16", end: "2026-11-22", flavor: "Move", rewards: { xp: 20, skills: ["Body"] }, conditions: [{ kind: "tally", min: 3, prompt: "Move" }], tally: { "0": ["2026-11-16"] } },
        { id: "q2", title: "Show Up", giver: "trainer", type: "habit", status: "rotation", window: "any", rewards: { xp: 20 }, conditions: [{ kind: "tally", min: 2, manual: true }] },
      ],
      inventory: [{ id: "i1", name: "Rolled oats", category: "Pantry", qty: 2, unit: "cups", useBy: null }],
      blueprints: [{ id: "oats", name: "Overnight oats", kind: "meal", yield: "1 jar", unlocked: "2026-10-26", materials: [{ name: "Rolled oats", qty: "1/2 cup", match: "oats" }], steps: ["Mix."], tools: ["Jar"], notes: "", variations: [] }],
      entries: [{ id: "e1", date: "2026-11-16", session: "morning", text: "Hello." }],
      readings: [{ id: "r1", title: "A note", ko: "안녕하세요", pickDate: "2026-11-16", topic: "greeting" }],
      runes: [{ id: "rune1", w: "안녕", hanja: "", meaning: "hello", known: false, srs: { due: "2026-11-16", ease: 2.5, ivl: 0, lapses: 0, last: null, reps: 0 } }],
      series: [{ id: "s1", title: "Sample", premise: "A short tale.", arc: [{ title: "Dawn" }], episodes: {} }],
      beatnotes: [{ id: "b1", date: "2026-11-16", title: "Desk", beat: "A quiet shift." }],
      pins: [{ id: "p1", name: "Home", category: "home", note: "Base" }],
    },
    skill_web: {
      RB: 600,
      r: [120, 215],
      nodes: [
        { id: "n1", name: "First step", br: ["push"], t: 1, st: "un", pre: [], x: 600, y: 480, crit: "Do it", h: "", un: "2026-11-01", confirm: false },
        { id: "n2", name: "Next step", br: ["push"], t: 2, st: "av", pre: ["n1"], x: 600, y: 360, crit: "Do more", h: "1 month", un: "", confirm: false },
      ],
      badges: [{ k: "push", l: "Push", col: "#e0864a", x: 600, y: 40 }],
    },
  };
}

describe("journal view", () => {
  it("builds every section the nine tabs need", () => {
    const view = buildView(sample(), "2026-11-16");
    expect(view.quests).toHaveLength(2);
    expect(view.quests[0].loggedToday).toBe(true);
    expect(view.quests[0].p).toEqual([1, 3]);
    expect(view.quests[1].rot).toBe("2026-12");
    expect(view.recipes).toHaveLength(1);
    expect(view.runes[0].due).toBe("2026-11-16");
    expect(view.entries[0].t).toBe("Hello.");
    expect(view.web?.nodes).toHaveLength(2);
    expect(view.char.branches[0].av).toBe(1);
    expect(view.ledger.periods).toHaveLength(1);
    expect(view.oracle.text).toContain("Walk");
    expect(view.pins[0].n).toBe("Home");
  });

  it("schedules a later due date for a good review", () => {
    const next = schedule({ ease: 2.5, ivl: 0, reps: 0, lapses: 0, due: "2026-11-16", last: null }, "good", "2026-11-16");
    expect(next.due > "2026-11-16").toBe(true);
    expect(next.reps).toBe(1);
    const again = schedule(next, "again", next.due);
    expect(again.lapses).toBe(1);
    expect(again.due > next.due).toBe(true);
  });

  it("writes chronicle text and habit checks into collections", () => {
    const start = sample();
    const saved = addChronicle(start, "night", "A line.", "2026-11-16");
    const entries = (saved.docs.collections as { entries: { text: string }[] }).entries;
    expect(entries.some((e) => e.text === "A line.")).toBe(true);
    expect(saved.event.kind).toBe("chronicle");
    const checked = toggleHabitToday(saved.docs, "q1", "2026-11-17");
    const quest = (checked.docs.collections as { quests: { tally: { "0": string[] } }[] }).quests[0];
    expect(quest.tally["0"]).toContain("2026-11-17");
    expect(checked.event.kind).toBe("habit_check");
    const graded = gradeRune(checked.docs, "rune1", "easy", "2026-11-16");
    const rune = (graded.docs.collections as { runes: { srs: { due: string } }[] }).runes[0];
    expect(rune.srs.due > "2026-11-16").toBe(true);
    expect(graded.event.kind).toBe("rune_review");
  });
});
