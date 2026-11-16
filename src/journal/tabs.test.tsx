import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Journal, type JournalActions } from "./Journal";
import { buildView } from "./model";
import type { DocMap } from "../data/types";

const docs: DocMap = {
  computed: {
    today: "2026-03-01",
    shifts: { "2026-03-01": "OFF" },
    omen: { date: "2026-03-01", text: "Rest.", why: "Because." },
    oracle: "A note.",
    bag: { ember: 1, hourglass: 0, reroll: 0 },
    coach: { date: "2026-02-28", slipping: "Sleep.", step: "Lights out." },
    char: { total: 10, earned: 10, spent: 0, lvl: 1, into: 10, cls: { name: "Warden", why: "" }, aspects: [], rooms: [], branches: [], nodeCounts: { un: 0, av: 0, gh: 0, hid: 0 }, moves: [] },
    ledger: { target: 10, rows: 0, periods: [{ p: "2026-01-15", end: "2026-02-15", inc: 1, out: 1, give: 0, inv: 0, rate: 0 }], pcats: {}, pmerch: {}, give: {}, recent: [], redirect: { amount: 1, from: "2026-04", to: "savings" } },
  },
  collections: {
    quests: [{ id: "q", title: "Sample quest", giver: "coach", type: "side", status: "active", window: "any", rewards: { xp: 10 }, conditions: [], flavor: "Go." }],
    inventory: [{ id: "i", name: "Salt", category: "Pantry", qty: null, unit: "" }],
    blueprints: [{ id: "b", name: "Sample soup", kind: "meal", materials: [], steps: ["Stir."], tools: [] }],
    runes: [{ id: "r", w: "가나다", meaning: "sample", hanja: "", known: false, srs: { due: "2026-03-01", ease: 2.5, ivl: 0, reps: 0, lapses: 0, last: null } }],
    entries: [],
    readings: [],
    series: [{ title: "Tale", premise: "Once.", arc: [{ title: "One" }], episodes: {} }],
    beatnotes: [],
    pins: [{ id: "home", name: "Home", category: "home", note: "Here" }],
  },
  skill_web: { RB: 600, r: [120], nodes: [{ id: "n", name: "Step", br: ["push"], t: 1, st: "un", pre: [], x: 600, y: 400, crit: "Done", confirm: false }], badges: [{ k: "push", l: "Push", col: "#e0864a", x: 600, y: 40 }] },
};

function actions(): JournalActions {
  return {
    phase: "idle",
    detail: "",
    email: "",
    mode: "fixture",
    logChronicle: vi.fn(),
    toggleHabitToday: vi.fn(),
    setQuestStatus: vi.fn(),
    toggleQuestStep: vi.fn(),
    adjustItem: vi.fn(),
    gradeRune: vi.fn(),
    addRune: vi.fn(),
    addReading: vi.fn(),
    requestEpisode: vi.fn(),
    requestSeries: vi.fn(),
    signOut: vi.fn(),
  };
}

describe("tabs", () => {
  it("renders all nine tabs", async () => {
    render(<Journal view={buildView(docs, "2026-03-01")} actions={actions()} />);
    const titles: Record<string, string> = { Journal: "Quest journal" };
    for (const name of ["Today", "Journal", "Chronicle", "Runes", "Crafting", "Backpack", "Ledger", "Character", "World"]) {
      fireEvent.click(screen.getByRole("tab", { name }));
      expect(screen.getByRole("heading", { level: 2, name: titles[name] || name })).toBeTruthy();
    }
  });
});
