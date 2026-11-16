import type { CSSProperties } from "react";

export const C = {
  bg: "#f7f3ea",
  card: "#fffdf8",
  card2: "#fbf8f1",
  tint: "#eaf4f2",
  teal: "#0f6e6e",
  tealDk: "#0b4f53",
  tealLine: "#b7d3cf",
  ink: "#1e2b2d",
  muted: "#56676a",
  line: "#e2dacb",
  gold: "#d2ab6b",
  amber: "#d98b1f",
  amberTx: "#94550a",
  good: "#2e7d4f",
  bad: "#b3412e",
};

export const SERIF = "'Cormorant Garamond','EB Garamond',Garamond,'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
export const SANS = "'Source Sans 3','Source Sans Pro','Segoe UI','Helvetica Neue',Roboto,Arial,system-ui,sans-serif";

type Giver = { n: string; c: string; shape: CSSProperties; ic: string };

const hex = { clipPath: "polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)" };
const bowl = { borderRadius: "50% 50% 10px 10px" };
const square = { borderRadius: 9 };
const leaf = { borderRadius: "6px 60% 6px 60%" };
const pennant = { clipPath: "polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)" };
const gem = { borderRadius: "6px 6px 50% 50%" };
const shield = { clipPath: "polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)" };

export const GIVERS: Record<string, Giver> = {
  trainer: { n: "Trainer", c: "#c46f24", shape: hex, ic: '<path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/>' },
  physio: { n: "Physio", c: "#b85a3a", shape: hex, ic: '<path d="M4 12h16M8 8v8M16 8v8"/>' },
  cook: { n: "Cook", c: "#a87a22", shape: bowl, ic: '<circle cx="10" cy="14" r="5.5"/><path d="M15.5 14H22M8.5 4.5c0 1.5 1.5 1.5 1.5 3M12 3.5c0 1.5 1.5 1.5 1.5 3"/>' },
  nutritionist: { n: "Nutritionist", c: "#8d9a32", shape: bowl, ic: '<circle cx="12" cy="13" r="6"/><path d="M12 7v4M9 4.5c.5 1.4 1.6 1.6 1.6 3"/>' },
  coach: { n: "Warden", c: "#3a73a6", shape: square, ic: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>' },
  grower: { n: "Grower", c: "#2b857a", shape: leaf, ic: '<path d="M12 21v-9M12 12C8 12 5.5 9.5 5.5 5.5c4 0 6.5 2.5 6.5 6.5zM12 14.5c3.5 0 6.5-2 6.5-6-3.5 0-6.5 2-6.5 6z"/>' },
  storyteller: { n: "Bard", c: "#8c4f2a", shape: pennant, ic: '<path d="M20 3C13 4 8.5 9 7.5 16.5L5 21M7.5 16.5c4.5-.5 9-4 10-10"/>' },
  shotcaller: { n: "Shotcaller", c: "#6a6ea8", shape: pennant, ic: '<path d="M5 19l7-14 7 14M8 13h8"/>' },
  editor: { n: "Scholar", c: "#a23f86", shape: gem, ic: '<path d="M12 2.5l6 8.5-6 10.5-6-10.5z"/><path d="M12 11v10.5"/><circle cx="12" cy="10" r="1.6"/>' },
  sage: { n: "Sage", c: "#6d5aa8", shape: gem, ic: '<circle cx="12" cy="12" r="8"/><path d="M8 13c1.2 2 6.8 2 8 0M9 10h.1M15 10h.1"/>' },
  steward: { n: "Steward", c: "#9a7a1e", shape: shield, ic: '<circle cx="12" cy="12" r="8"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.8 2.8 2-1.2 2-2.8 2c-1.3 0-2.4-.5-2.9-1.5M12 6.5v1.3M12 16.2v1.3"/>' },
  engineer: { n: "Engineer", c: "#3d7d8c", shape: shield, ic: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>' },
};

export const WIN_WORK: Record<string, string> = {
  morning: "Morning, before work",
  commute_in: "On the way in",
  shift: "During the shift",
  commute_out: "On the way home",
  evening: "Late evening (home)",
  postshift: "After work",
  any: "Anytime",
};

export const SLOT_OF: Record<string, string> = {
  morning: "Morning",
  commute_in: "Morning",
  shift: "Afternoon",
  commute_out: "Evening",
  evening: "Evening",
  postshift: "Evening",
  any: "Anytime",
};

export const SLOTS = ["Morning", "Afternoon", "Evening", "Anytime"];
export const SLOT_SUB_WORK: Record<string, string> = {
  Morning: "Earlier in the day",
  Afternoon: "Middle of the day",
  Evening: "Later on",
  Anytime: "Whenever it fits",
};
export const SLOT_SUB_OFF: Record<string, string> = {
  Morning: "Morning",
  Afternoon: "Afternoon",
  Evening: "Evening",
  Anytime: "Whenever it fits",
};

/** Shift codes come from the journal data. OFF is a day off; any other code is a work day. Hours are not hardcoded. */
export function shiftInfo(code: string | undefined): { label: string; work: boolean } {
  if (!code || code === "OFF") return { label: "Day off", work: false };
  return { label: code, work: true };
}

export const FIN_COL: Record<string, string> = {
  "Food & dining": "#e5892f",
  Groceries: "#45a565",
  "Coffee & snacks": "#a8743a",
  Transport: "#4f86d9",
  "Housing & bills": "#8a6fd0",
  "Phone & subscriptions": "#2aa7c6",
  Shopping: "#d6506e",
  "Health & fitness": "#3fae9a",
  "Fun & games": "#c95bb8",
  "Gifts & family": "#d4ac2c",
  Travel: "#5c9ee0",
  "Fees & taxes": "#8a8f98",
  Other: "#9a9aa8",
  Transfer: "#b0a8bc",
  Donations: "#e0607e",
};

export const INV_CATS = ["Fridge", "Freezer", "Pantry", "Supplements", "Home equipment", "Project materials"];

export const STATUS_TONE: Record<string, string> = {
  active: "#94550a",
  offered: "#5b4b9a",
  rotation: "#0f6e6e",
  missed: "#b3412e",
  resting: "#3d64a8",
  merged: "#6b4fa8",
  expired: "#6e6a62",
  completed: "#2e7d4f",
  archived: "#6e6a62",
  declined: "#7a7385",
  faded: "#7a7385",
};

export const MORE_STATUSES = ["rotation", "missed", "resting", "merged", "expired", "archived", "declined", "faded"];
export const ALL_STATUSES = ["active", "offered", "completed", "declined", "resting", "missed", "archived", "rotation", "merged", "expired", "faded"];
export const SERIES_THEMES = ["Newsroom drama", "Seoul slice of life", "Mystery", "Korean history", "Business & tech", "Food & markets"];
export const CH_PROMPTS: Record<string, string[]> = {
  morning: ["Today matters because…", "The one thing I'll finish:", "What I'll let go of:"],
  night: ["What happened, in a sentence or two.", "One thing I noticed.", "One thing for tomorrow."],
};

export const TABS = ["Today", "Journal", "Chronicle", "Runes", "Crafting", "Backpack", "Ledger", "Character", "World"] as const;
export type TabName = (typeof TABS)[number];

export const R_EMO: [RegExp, string][] = [
  [/muffin/i, "🧁"],
  [/pancake/i, "🥞"],
  [/overnight/i, "🥣"],
  [/banana/i, "🍌"],
  [/wrap|taco/i, "🌮"],
  [/jam/i, "🫐"],
  [/pork/i, "🥓"],
  [/cake/i, "🍋"],
  [/kimchi|kimjang/i, "🥬"],
  [/shrimp fried rice|fried rice/i, "🍚"],
  [/shrimp/i, "🍤"],
  [/eggs/i, "🍳"],
  [/tuna/i, "🐟"],
  [/chicken/i, "🍗"],
  [/yogurt/i, "🥣"],
  [/pesto/i, "🌿"],
  [/bar/i, "🍫"],
];

export function recipeEmoji(name: string, kind: string): string {
  const hit = R_EMO.find((e) => e[0].test(name));
  return hit ? hit[1] : kind === "build" ? "🛠️" : "🍽️";
}

export function giverName(key: string): string {
  return GIVERS[key]?.n || key;
}
