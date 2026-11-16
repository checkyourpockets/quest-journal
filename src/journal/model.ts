import { rotationMonth } from "../data/mutate";
import type { DocMap } from "../data/types";
import { kstToday } from "../lib/dates";

export type QuestView = {
  id: string;
  t: string;
  g: string;
  s: string;
  ty: string;
  xp: number;
  w: string;
  end: string | null;
  p: [number, number] | null;
  fl: string;
  cg: string[];
  work: boolean;
  oracle: boolean;
  done: string | null;
  how: string;
  asp: string;
  rot: string | null;
  merged: string | null;
  manual: boolean;
  loggedToday: boolean;
  tally: boolean;
  steps: { label: string; done: boolean }[];
};

export type InvItem = {
  id: string;
  n: string;
  cat: string;
  q: number | null;
  u: string;
  by: string | null;
  f: string | null;
};

export type RuneView = { id: string; w: string; h: string; m: string; due: string | null; known: boolean };
export type RecipeView = {
  id: string;
  n: string;
  k: string;
  y: string;
  m: [string, string, string, number][];
  s: string[];
  t: string[];
  no: string;
  u: string | null;
  v: [string, string, string][] | null;
  ph: boolean;
  mac: [number, number, number, number, string] | null;
  sk: string | null;
  ti: number | null;
  pa: string | null;
  lc: string | null;
  bu: string | null;
};
export type EntryView = { id: string; d: string; s: string; t: string };
export type ReadingView = { id: string; title: string; date: string; gist: string; ko: string; runes: number };
export type BeatView = { id: string; d: string; title: string; text: string };
export type EpisodeView = { n: number; arc: string; date: string | null; summary: string; ko: string };
export type PinView = { id: string; n: string; cat: string; note: string };
export type BranchView = { name: string; col: string; un: string[]; av: number; gh: number; hid: number };
export type WebNode = {
  id: string;
  name: string;
  br: string[];
  t: number;
  st: string;
  pre: string[];
  x: number;
  y: number;
  crit: string;
  h: string;
  un: string;
  confirm: boolean;
};
export type WebData = {
  RB: number;
  rings: number[];
  nodes: WebNode[];
  badges: { k: string; l: string; col: string; x: number; y: number }[];
};
export type Period = { p: string; end: string | null; inc: number; out: number; give: number; inv: number; rate: number | null };
export type CharView = {
  total: number;
  earned: number;
  spent: number;
  lvl: number;
  into: number;
  cls: { name: string; why: string };
  aspiration: string;
  aspDesc: string;
  aspects: { name: string; cls: string; col: string; pts: number; lvl: number; into: number }[];
  rooms: { name: string; giver: string; icon: string; xp: number; lvl: number; into: number }[];
  branches: BranchView[];
  nodeCounts: { un: number; av: number; gh: number; hid: number };
  inbody: Record<string, number | string> | null;
  inbodyPrev: Record<string, number | string> | null;
  moves: [string, number, number, string][];
};

export type JournalView = {
  today: string;
  asOf: string;
  shifts: Record<string, string>;
  weekStart: string;
  weekEnd: string;
  omen: { date: string; text: string; why: string };
  oracle: { date: string; text: string };
  coach: { date: string; slipping: string; step: string };
  bag: { ember: number; hourglass: number; reroll: number };
  char: CharView;
  quests: QuestView[];
  ledger: {
    target: number;
    rows: number;
    periods: Period[];
    pcats: Record<string, [string, number][]>;
    pmerch: Record<string, [string, number][]>;
    give: Record<string, [string, number, number][]>;
    recent: { d: string; w: string; c: string; a: number }[];
    redirect: { amount: number; to: string; from: string };
  };
  inv: InvItem[];
  runes: RuneView[];
  reads: ReadingView[];
  entries: EntryView[];
  beats: BeatView[];
  series: { title: string; premise: string; episodes: EpisodeView[]; pending: string[] };
  recipes: RecipeView[];
  pins: PinView[];
  web: WebData | null;
  rules: { offerCap: number; offerExpiryDays: number; habitCore: string[] };
  settings: SettingsView;
};

export type SettingsView = {
  shift: { start: string; end: string; days: number[] } | null;
  savingsTargetPct: number | null;
  redirectAmountKRW: number | null;
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseSettings(raw: unknown): SettingsView {
  const s = obj(raw);
  const shift = obj(s.shift);
  const start = str(shift.start);
  const end = str(shift.end);
  const days = arr(shift.days).map((n) => num(n)).filter((n) => n >= 1 && n <= 7);
  const gift = obj(s.redirectGift);
  return {
    shift: HHMM.test(start) && HHMM.test(end) ? { start, end, days } : null,
    savingsTargetPct: typeof s.savingsTargetPct === "number" && Number.isFinite(s.savingsTargetPct) ? s.savingsTargetPct : null,
    redirectAmountKRW: typeof gift.amountKRW === "number" && Number.isFinite(gift.amountKRW) ? gift.amountKRW : null,
  };
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function questSteps(q: Record<string, unknown>, today: string): Pick<QuestView, "p" | "loggedToday" | "tally" | "steps" | "manual" | "how"> {
  const conds = arr(q.conditions).map((c) => obj(c));
  const tally = obj(q.tally);
  const dates = arr(tally["0"]).filter((d): d is string => typeof d === "string");
  const evidence = obj(q.evidence);
  const checks = obj(q.checks);
  const tallyCond = conds.find((c) => c.kind === "tally");
  const how = conds.map((c) => str(c.prompt)).filter(Boolean).join(" · ");
  const manual = conds.some((c) => c.manual === true);
  if (tallyCond) {
    const start = str(q.start);
    const end = str(q.end);
    const n = dates.filter((d) => (!start || d >= start) && (!end || d <= end)).length;
    return {
      p: [n, num(tallyCond.min, 1)],
      loggedToday: dates.includes(today),
      tally: true,
      steps: [],
      manual,
      how,
    };
  }
  if (conds.length) {
    const evidenceKeys = Object.keys(evidence).filter((k) => evidence[k]);
    const useStep = evidenceKeys.length === 0 && Object.keys(checks).length === 0 && typeof q.step === "number";
    const steps = conds.map((c, i) => {
      const key = String(i);
      const marked = Boolean(evidence[key] || checks[key]);
      const fromStep = useStep && typeof q.step === "number" && i < q.step && c.kind === "quest";
      return { label: str(c.prompt, "Step " + (i + 1)), done: marked || fromStep };
    });
    return { p: [steps.filter((s) => s.done).length, steps.length], loggedToday: false, tally: false, steps, manual, how };
  }
  return { p: null, loggedToday: false, tally: false, steps: [], manual, how };
}

function mapQuests(raw: unknown[], rules: unknown, today: string): QuestView[] {
  const rows = raw.map((q) => obj(q));
  const titleById = new Map(rows.map((q) => [str(q.id), str(q.title)]));
  return rows
    .filter((q) => str(q.title))
    .map((q) => {
      const rewards = obj(q.rewards);
      const skills = arr(rewards.skills).filter((s): s is string => typeof s === "string");
      const id = str(q.id);
      const status = str(q.status, "active");
      const done = str(q.completedAt).slice(0, 10) || null;
      const mergedId = str(q.mergedInto);
      const prog = questSteps(q, today);
      return {
        id,
        t: str(q.title),
        g: str(q.giver, "coach"),
        s: status,
        ty: str(q.type, "side"),
        xp: num(rewards.xp),
        w: str(q.window, "any"),
        end: str(q.end) || str(q.expires) || null,
        fl: str(q.flavor),
        cg: arr(q.cogivers).filter((c): c is string => typeof c === "string"),
        work: str(q.window) === "shift",
        oracle: Boolean(str(q.oracleDate)),
        done: done || null,
        asp: skills.join(", "),
        rot: status === "rotation" ? rotationMonth(str(q.title), rules) : null,
        merged: mergedId ? titleById.get(mergedId) || mergedId : null,
        ...prog,
      };
    });
}

function mapChar(raw: unknown): CharView {
  const c = obj(raw);
  const cls = obj(c.cls);
  const branches = arr(c.branches).map((b) => {
    const x = obj(b);
    const av = x.av;
    return {
      name: str(x.name),
      col: str(x.col, "#0f6e6e"),
      un: arr(x.un).filter((n): n is string => typeof n === "string"),
      av: Array.isArray(av) ? av.length : num(av),
      gh: num(x.gh),
      hid: num(x.hid),
    };
  });
  const counts = obj(c.nodeCounts);
  const moves = arr(c.moves)
    .map((m) => (Array.isArray(m) ? m : null))
    .filter((m): m is unknown[] => !!m && typeof m[0] === "string")
    .map((m) => [String(m[0]), num(m[1]), num(m[2]), str(m[3])] as [string, number, number, string]);
  const inbody = obj(c.inbody);
  const prev = obj(c.inbodyPrev);
  return {
    total: num(c.total),
    earned: num(c.earned),
    spent: num(c.spent),
    lvl: num(c.lvl, 1),
    into: num(c.into),
    cls: { name: str(cls.name, "Unclassed"), why: str(cls.why) },
    aspiration: str(c.aspiration),
    aspDesc: str(c.aspDesc),
    aspects: arr(c.aspects).map((a) => {
      const x = obj(a);
      return { name: str(x.name), cls: str(x.cls), col: str(x.col, "#0f6e6e"), pts: num(x.pts), lvl: num(x.lvl, 1), into: num(x.into) };
    }),
    rooms: arr(c.rooms).map((r) => {
      const x = obj(r);
      return { name: str(x.name), giver: str(x.giver), icon: str(x.icon, "✦"), xp: num(x.xp), lvl: num(x.lvl, 1), into: num(x.into) };
    }),
    branches,
    nodeCounts: { un: num(counts.un), av: num(counts.av), gh: num(counts.gh), hid: num(counts.hid) },
    inbody: Object.keys(inbody).length ? (inbody as Record<string, number | string>) : null,
    inbodyPrev: Object.keys(prev).length ? (prev as Record<string, number | string>) : null,
    moves,
  };
}

function mapWeb(raw: unknown): WebData | null {
  const w = obj(raw);
  const nodes = arr(w.nodes).map((n) => {
    const x = obj(n);
    return {
      id: str(x.id),
      name: str(x.name),
      br: arr(x.br).filter((b): b is string => typeof b === "string"),
      t: num(x.t, 1),
      st: str(x.st, "av"),
      pre: arr(x.pre).filter((p): p is string => typeof p === "string"),
      x: num(x.x),
      y: num(x.y),
      crit: str(x.crit),
      h: str(x.h),
      un: str(x.un),
      confirm: x.confirm === true,
    };
  });
  if (!nodes.length) return null;
  const badges = arr(w.badges).map((b) => {
    const x = obj(b);
    return { k: str(x.k), l: str(x.l || x.k), col: str(x.col, "#0f6e6e"), x: num(x.x), y: num(x.y) };
  });
  const rings = arr(w.r).map((r) => num(r)).filter((r) => r > 0);
  return { RB: num(w.RB, 600), rings: rings.length ? rings : [120, 215, 310, 405, 500], nodes, badges };
}

function pairList(v: unknown): [string, number][] {
  return arr(v)
    .map((row) => (Array.isArray(row) ? row : null))
    .filter((row): row is unknown[] => !!row && typeof row[0] === "string")
    .map((row) => [String(row[0]), num(row[1])]);
}

function mapRecipes(raw: unknown[]): RecipeView[] {
  return raw.map((b) => obj(b)).filter((b) => str(b.name)).map((b) => {
    const macros = obj(b.macros);
    const mac = Object.keys(macros).length
      ? ([num(macros.kcal), num(macros.p), num(macros.c), num(macros.f), str(macros.per, "serving")] as [number, number, number, number, string])
      : null;
    const variations = arr(b.variations).map((v) => {
      const x = obj(v);
      return [str(x.title), str(x.change), str(x.why)] as [string, string, string];
    });
    return {
      id: str(b.id, str(b.name)),
      n: str(b.name),
      k: str(b.kind, "meal"),
      y: str(b.yield),
      m: arr(b.materials).map((m) => {
        const x = obj(m);
        const name = str(x.name);
        const optional = x.optional === true || /optional/i.test(name) ? 1 : 0;
        return [name, str(x.qty), str(x.match, name), optional] as [string, string, string, number];
      }),
      s: arr(b.steps).filter((s): s is string => typeof s === "string"),
      t: arr(b.tools).filter((s): s is string => typeof s === "string"),
      no: str(b.notes),
      u: str(b.unlocked) || null,
      v: variations.length ? variations : null,
      ph: Boolean(str(b.photo)),
      mac,
      sk: str(b.skill) || null,
      ti: typeof b.tier === "number" ? b.tier : null,
      pa: str(b.parent) || null,
      lc: str(b.lastCooked) || null,
      bu: str(b.built) || null,
    };
  });
}

function asOf(docs: DocMap, computed: Record<string, unknown>): string {
  const exported = str(computed.exportedAt);
  if (exported) {
    const d = new Date(exported);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }) + " KST";
    }
  }
  return str(docs.generatedAt);
}

export function buildView(docs: DocMap, today = kstToday()): JournalView {
  const computed = obj(docs.computed);
  const col = obj(docs.collections);
  const rules = obj(computed.rules);
  const shifts = obj(computed.shifts);
  const shiftMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(shifts)) if (typeof v === "string") shiftMap[k] = v;
  const shiftDays = Object.keys(shiftMap).sort();
  const omen = obj(computed.omen);
  const oracleRaw = computed.oracle;
  const oracle = typeof oracleRaw === "string"
    ? { date: str(computed.today, today), text: oracleRaw }
    : { date: str(obj(oracleRaw).date, str(computed.today, today)), text: str(obj(oracleRaw).text) };
  const coach = obj(computed.coach);
  const bag = obj(computed.bag);
  const ledger = obj(computed.ledger);
  const redirect = obj(ledger.redirect);
  const periods = arr(ledger.periods).map((p) => {
    const x = obj(p);
    return {
      p: str(x.p),
      end: str(x.end) || null,
      inc: num(x.inc),
      out: num(x.out),
      give: num(x.give),
      inv: num(x.inv),
      rate: typeof x.rate === "number" ? x.rate : null,
    };
  }).filter((p) => p.p);
  const pcats: Record<string, [string, number][]> = {};
  for (const [k, v] of Object.entries(obj(ledger.pcats))) pcats[k] = pairList(v);
  const pmerch: Record<string, [string, number][]> = {};
  for (const [k, v] of Object.entries(obj(ledger.pmerch))) pmerch[k] = pairList(v);
  const give: Record<string, [string, number, number][]> = {};
  for (const [k, v] of Object.entries(obj(ledger.give))) {
    give[k] = arr(v)
      .map((row) => (Array.isArray(row) ? row : null))
      .filter((row): row is unknown[] => !!row && typeof row[0] === "string")
      .map((row) => [String(row[0]), num(row[1]), num(row[2])]);
  }
  const recent = arr(ledger.recent).map((r) => {
    if (Array.isArray(r)) return { d: str(r[0]), w: str(r[1]), c: str(r[2]), a: num(r[3]) };
    const x = obj(r);
    const amount = num(x.a);
    const signed = str(x.dir) === "in" ? -Math.abs(amount) : amount;
    return { d: str(x.d), w: str(x.w), c: str(x.c), a: signed };
  });
  const flagByName = new Map<string, string | null>();
  for (const row of arr(computed.inv)) {
    const x = obj(row);
    flagByName.set(str(x.n), str(x.f) || null);
  }
  const inv = arr(col.inventory).map((row) => {
    const x = obj(row);
    const name = str(x.name);
    const own = "flag" in x ? (str(x.flag) || null) : flagByName.get(name) ?? null;
    return {
      id: str(x.id, name),
      n: name,
      cat: str(x.category, "Pantry"),
      q: typeof x.qty === "number" ? x.qty : null,
      u: str(x.unit),
      by: str(x.useBy) || null,
      f: own,
    };
  });
  const runes = arr(col.runes).map((row) => {
    const x = obj(row);
    const srs = obj(x.srs);
    return { id: str(x.id, str(x.w)), w: str(x.w), h: str(x.hanja), m: str(x.meaning), due: str(srs.due) || null, known: x.known === true };
  });
  const reads = arr(col.readings).map((row) => {
    const x = obj(row);
    return {
      id: str(x.id, str(x.title)),
      title: str(x.title, "Untitled"),
      date: str(x.pickDate) || str(x.createdAt).slice(0, 10),
      gist: str(x.topic) || str(x.srcName),
      ko: str(x.ko),
      runes: 0,
    };
  });
  const entries = arr(col.entries).map((row) => {
    const x = obj(row);
    return { id: str(x.id), d: str(x.date), s: str(x.session, "night"), t: str(x.text) };
  });
  const beats = arr(col.beatnotes).map((row) => {
    const x = obj(row);
    return { id: str(x.id, str(x.title)), d: str(x.date), title: str(x.title || x.beat), text: str(x.beat || x.moving) };
  });
  const seriesRaw = obj(arr(col.series)[0]);
  const arc = arr(seriesRaw.arc).map((a) => (typeof a === "string" ? a : str(obj(a).title)));
  const episodes = obj(seriesRaw.episodes);
  const readingById = new Map(arr(col.readings).map((r) => [str(obj(r).id), obj(r)]));
  const episodeViews: EpisodeView[] = arc.map((title, i) => {
    const ep = obj(episodes[String(i + 1)]);
    const reading = readingById.get(str(ep.readingId));
    const at = str(ep.at).slice(0, 10) || null;
    return { n: i + 1, arc: title, date: at, summary: str(ep.summary), ko: str(reading?.ko) };
  });
  const pending = arr(col.storyRequests).map((r) => {
    const x = obj(r);
    if (x.type === "episode") return "Episode " + num(x.episode) + (str(x.arc) ? " · " + str(x.arc) : "");
    return "New series · " + str(x.theme);
  });
  const pins = arr(col.pins).length
    ? arr(col.pins).map((p) => {
        const x = obj(p);
        return { id: str(x.id, str(x.name)), n: str(x.name), cat: str(x.category), note: str(x.note) };
      })
    : arr(computed.pins).map((p) => {
        const x = obj(p);
        return { id: str(x.n), n: str(x.n), cat: str(x.cat), note: "" };
      });
  return {
    today,
    asOf: asOf(docs, computed),
    shifts: shiftMap,
    weekStart: shiftDays[0] || today,
    weekEnd: shiftDays[shiftDays.length - 1] || today,
    omen: { date: str(omen.date, str(computed.today, today)), text: str(omen.text), why: str(omen.why) },
    oracle,
    coach: { date: str(coach.date), slipping: str(coach.slipping), step: str(coach.step) },
    bag: { ember: num(bag.ember), hourglass: num(bag.hourglass), reroll: num(bag.reroll) },
    char: mapChar(computed.char),
    quests: mapQuests(arr(col.quests), rules, today),
    ledger: {
      target: num(ledger.target),
      rows: num(ledger.rows),
      periods,
      pcats,
      pmerch,
      give,
      recent,
      redirect: { amount: num(redirect.amount), to: str(redirect.to), from: str(redirect.from) },
    },
    inv,
    runes,
    reads,
    entries,
    beats,
    series: { title: str(seriesRaw.title), premise: str(seriesRaw.premise), episodes: episodeViews, pending },
    recipes: mapRecipes(arr(col.blueprints)),
    pins,
    web: mapWeb(docs.skill_web),
    settings: parseSettings(docs.settings),
    rules: {
      offerCap: num(rules.offerCap, 3),
      offerExpiryDays: num(rules.offerExpiryDays, 7),
      habitCore: arr(rules.habitCore).filter((s): s is string => typeof s === "string"),
    },
  };
}
