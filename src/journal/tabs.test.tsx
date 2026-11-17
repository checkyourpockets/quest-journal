import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteRune, gradeRune, restoreRune } from "../data/mutate";
import type { DocMap } from "../data/types";
import { Journal, type JournalActions } from "./Journal";
import { buildView } from "./model";

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

beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

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
    deleteRune: vi.fn(() => null),
    restoreRune: vi.fn(),
    addRune: vi.fn(),
    addReading: vi.fn(),
    requestEpisode: vi.fn(),
    requestSeries: vi.fn(),
    saveSettings: vi.fn(),
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

const deckDocs: DocMap = {
  ...docs,
  collections: {
    ...(docs.collections as Record<string, unknown>),
    runes: [
      { id: "r", w: "가나다", meaning: "sample", hanja: "", known: false, srs: { due: "2026-03-01", ease: 2.5, ivl: 0, reps: 0, lapses: 0, last: null } },
      { id: "r2", w: "라마바", meaning: "castle", hanja: "城", known: false, srs: { due: "2026-03-01", ease: 2.5, ivl: 0, reps: 0, lapses: 0, last: null } },
    ],
    reviews: [
      { id: "rev-a", runeId: "r", grade: "again", applied: false },
      { id: "rev-b", runeId: "r2", grade: "good", applied: false },
    ],
    reviewQueue: ["r", "r2"],
  },
  finance: { accounts: [{ name: "Sample broker", kind: "investment", value: 10, costBasis: 8 }] },
};

function Deck() {
  const [state, setState] = useState(deckDocs);
  const base = actions();
  return (
    <Journal
      view={buildView(state, "2026-03-01")}
      actions={{
        ...base,
        deleteRune: (id) => {
          const result = deleteRune(state, id);
          setState(result.docs);
          return result.removed ? { row: result.removed, index: result.index } : null;
        },
        restoreRune: (row, index) => setState(restoreRune(state, row, index).docs),
        gradeRune: (id, grade) => setState(gradeRune(state, id, grade, "2026-03-01").docs),
      }}
    />
  );
}

function dueCount(): string {
  return screen.getByRole("button", { name: /Due for review/ }).textContent || "";
}

describe("rune delete", () => {
  it("asks before banishing, updates the due count, and undoes", () => {
    localStorage.clear();
    render(<Deck />);
    fireEvent.click(screen.getByRole("tab", { name: "Runes" }));
    fireEvent.click(screen.getByRole("button", { name: /Due for review/ }));
    const filter = document.getElementById("rune-filter");
    if (!filter) throw new Error("filter missing");
    expect(dueCount()).toContain("2");
    fireEvent.click(within(filter).getByRole("button", { name: "Banish 가나다" }));
    expect(within(filter).getByText("Banish this rune?")).toBeTruthy();
    fireEvent.click(within(filter).getByRole("button", { name: "Cancel" }));
    expect(within(filter).queryByText("Banish this rune?")).toBeNull();
    expect(within(filter).getByRole("button", { name: "Banish 가나다" })).toBeTruthy();
    fireEvent.click(within(filter).getByRole("button", { name: "Banish 가나다" }));
    fireEvent.click(within(filter).getByRole("button", { name: "Banish" }));
    expect(within(filter).queryByRole("button", { name: "Banish 가나다" })).toBeNull();
    expect(dueCount()).toContain("1");
    expect(screen.getByRole("status").textContent).toContain("banished");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(within(filter).getByRole("button", { name: "Banish 가나다" })).toBeTruthy();
    expect(dueCount()).toContain("2");
    fireEvent.click(screen.getByRole("tab", { name: "Ledger" }));
    expect(screen.getByRole("heading", { level: 2, name: "Ledger" })).toBeTruthy();
    expect(screen.getByText("Pay periods")).toBeTruthy();
  });

  it("drops a banished card from a type-mode sitting and still grades the next one", () => {
    localStorage.clear();
    render(<Deck />);
    fireEvent.click(screen.getByRole("tab", { name: "Runes" }));
    fireEvent.click(screen.getByRole("button", { name: "Type" }));
    fireEvent.click(screen.getByRole("button", { name: /Start rune review/ }));
    const review = document.getElementById("rune-review");
    if (!review) throw new Error("review missing");
    const word = () => review.querySelector(".rvword")?.textContent;
    expect(word()).toBe("가나다");
    fireEvent.change(within(review).getByRole("textbox", { name: "Typed meaning" }), { target: { value: "sample" } });
    fireEvent.click(within(review).getByRole("button", { name: "Check" }));
    expect(within(review).getByText("Correct")).toBeTruthy();
    const tools = () => review.querySelector(".rvtools") as HTMLElement;
    fireEvent.click(within(tools()).getByRole("button", { name: "Banish 가나다" }));
    fireEvent.click(within(tools()).getByRole("button", { name: "Banish" }));
    expect(word()).toBe("라마바");
    expect(within(review).queryByText("Correct")).toBeNull();
    const typed = within(review).getByRole("textbox", { name: "Typed meaning" }) as HTMLInputElement;
    expect(typed.value).toBe("");
    expect(within(review).getByText("1 left in this sitting")).toBeTruthy();
    fireEvent.change(typed, { target: { value: "castle" } });
    fireEvent.click(within(review).getByRole("button", { name: "Check" }));
    expect(within(review).getByText("Correct")).toBeTruthy();
    fireEvent.click(within(review).getByRole("button", { name: "Good" }));
    expect(within(review).getByText(/Review done/)).toBeTruthy();
    expect(dueCount()).toContain("0");
  });

  it("does not bring an again-card back after it is banished", () => {
    localStorage.clear();
    render(<Deck />);
    fireEvent.click(screen.getByRole("tab", { name: "Runes" }));
    fireEvent.click(screen.getByRole("button", { name: /Start rune review/ }));
    const review = document.getElementById("rune-review");
    if (!review) throw new Error("review missing");
    fireEvent.click(within(review).getByRole("button", { name: "Show meaning" }));
    fireEvent.click(within(review).getByRole("button", { name: "Again" }));
    expect(review.querySelector(".rvword")?.textContent).toBe("라마바");
    fireEvent.click(screen.getByText(/Browse the whole deck/));
    fireEvent.click(within(review).getByRole("button", { name: "All" }));
    fireEvent.click(within(review).getByRole("button", { name: "Banish 가나다" }));
    fireEvent.click(within(review).getByRole("button", { name: "Banish" }));
    expect(within(review).queryByRole("button", { name: "Banish 가나다" })).toBeNull();
    expect(within(review).getByText("1 left in this sitting")).toBeTruthy();
    fireEvent.click(within(review).getByRole("button", { name: "Show meaning" }));
    fireEvent.click(within(review).getByRole("button", { name: "Good" }));
    expect(within(review).getByText(/Review done/)).toBeTruthy();
    expect(within(review).queryByText("가나다")).toBeNull();
  });
});
