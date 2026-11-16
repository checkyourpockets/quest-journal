import type { DocMap } from "../data/types";

/** Obvious stand-in data for screenshots and local clicks. Not a person's journal. */
export function sampleDocs(): DocMap {
  const names = ["North", "East", "South", "West"];
  const colors = ["#e0864a", "#5f97c9", "#6fae62", "#c9a54a"];
  const badges = names.map((name, i) => {
    const a = (i / names.length) * Math.PI * 2 - Math.PI / 2;
    return { k: name.toLowerCase(), l: name, col: colors[i], x: 600 + Math.cos(a) * 560, y: 600 + Math.sin(a) * 560 };
  });
  const nodes = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const ring = 160 + (i % 4) * 90;
    return {
      id: "n" + i,
      name: "Sample step " + (i + 1),
      br: [badges[i % 4].k],
      t: 1 + (i % 3),
      st: i % 3 === 0 ? "un" : "av",
      pre: i === 0 ? [] : ["n" + (i - 1)],
      x: 600 + Math.cos(a) * ring,
      y: 600 + Math.sin(a) * ring,
      crit: "Practice it once",
      h: "soon",
      un: i % 3 === 0 ? "2026-01-02" : "",
      confirm: false,
    };
  });
  return {
    generatedAt: "2026-03-01",
    settings: {
      shift: { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
      savingsTargetPct: 15,
      redirectGift: { amountKRW: 1000 },
    },
    computed: {
      today: "2026-03-02",
      shifts: { "2026-03-02": "DAY", "2026-03-03": "DAY", "2026-03-04": "OFF" },
      omen: { date: "2026-03-02", text: "A sample omen for the screen.", why: "This is fake." },
      oracle: "A sample note.",
      bag: { ember: 1, hourglass: 1, reroll: 1 },
      coach: { date: "2026-03-01", slipping: "Nothing in particular.", step: "Drink some water." },
      char: {
        total: 100, earned: 100, spent: 0, lvl: 1, into: 100,
        cls: { name: "Walker", why: "A sample class." },
        aspiration: "A sample aim", aspDesc: "Not a real goal.",
        aspects: [{ name: "Body", cls: "Walker", col: "#e0864a", pts: 40, lvl: 1, into: 40 }],
        rooms: [],
        branches: [{ name: "North", col: "#e0864a", un: ["Sample step 1"], av: 2, gh: 0, hid: 0 }],
        nodeCounts: { un: 3, av: 5, gh: 0, hid: 0 },
        moves: [],
      },
      ledger: {
        target: 0, rows: 1,
        periods: [{ p: "2026-01-15", end: "2026-02-15", inc: 200, out: 80, give: 0, inv: 0, rate: 0.6 }],
        pcats: {}, pmerch: {}, give: {}, recent: [],
        redirect: {},
      },
    },
    collections: {
      quests: [{ id: "q", title: "Sample quest", giver: "coach", type: "side", status: "active", window: "any", rewards: { xp: 10 }, conditions: [], flavor: "A sample line." }],
      inventory: [],
      blueprints: [],
      entries: [],
      readings: [],
      runes: [],
      series: [],
      beatnotes: [],
      pins: [{ id: "p", name: "Sample place", category: "home", note: "Nowhere in particular" }],
    },
    skill_web: { RB: 600, r: [120, 215, 310, 405, 500], nodes, badges },
  };
}
