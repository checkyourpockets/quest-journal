import { addMonths, kstToday, newId } from "../lib/dates";
import { blankSrs, schedule, type Grade } from "../lib/srs";
import type { DocMap, EventDraft } from "./types";

export type Mutation = { docs: DocMap; event: EventDraft };

function cloneDocs(docs: DocMap): DocMap {
  return structuredClone(docs);
}

function collectionsOf(docs: DocMap): Record<string, unknown> {
  const col = docs.collections;
  if (!col || typeof col !== "object" || Array.isArray(col)) {
    const next: Record<string, unknown> = {};
    docs.collections = next;
    return next;
  }
  return col as Record<string, unknown>;
}

function list(col: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const v = col[key];
  if (!Array.isArray(v)) {
    col[key] = [];
    return col[key] as Record<string, unknown>[];
  }
  return v as Record<string, unknown>[];
}

function event(kind: string, payload: Record<string, unknown>): EventDraft {
  return { id: newId(), kind, payload, at: new Date().toISOString() };
}

export function addChronicle(docs: DocMap, session: "morning" | "night", text: string, today = kstToday()): Mutation {
  const next = cloneDocs(docs);
  const col = collectionsOf(next);
  const id = newId();
  const row = {
    id,
    date: today,
    session,
    text,
    createdAt: new Date().toISOString(),
    source: "journal",
    photo: null,
  };
  list(col, "entries").push(row);
  return { docs: next, event: event("chronicle", { id, date: today, session, text }) };
}

export function toggleHabitToday(docs: DocMap, questId: string, today = kstToday()): Mutation {
  const next = cloneDocs(docs);
  const quests = list(collectionsOf(next), "quests");
  const q = quests.find((x) => x.id === questId);
  if (!q) return { docs: next, event: event("habit_check", { id: questId, missing: true }) };
  const tally = (q.tally && typeof q.tally === "object" ? q.tally : {}) as Record<string, unknown>;
  const dates = Array.isArray(tally["0"]) ? (tally["0"] as string[]).slice() : [];
  const had = dates.includes(today);
  const nextDates = had ? dates.filter((d) => d !== today) : dates.concat(today).sort();
  tally["0"] = nextDates;
  q.tally = tally;
  return {
    docs: next,
    event: event("habit_check", { id: questId, title: q.title, date: today, logged: !had }),
  };
}

export function setQuestStatus(docs: DocMap, questId: string, status: string): Mutation {
  const next = cloneDocs(docs);
  const q = list(collectionsOf(next), "quests").find((x) => x.id === questId);
  if (!q) return { docs: next, event: event("quest_update", { id: questId, missing: true }) };
  const from = q.status;
  q.status = status;
  if (status === "completed") q.completedAt = new Date().toISOString();
  else if (from === "completed" && status !== "completed") q.completedAt = null;
  return { docs: next, event: event("quest_update", { id: questId, title: q.title, from, status }) };
}

export function toggleQuestStep(docs: DocMap, questId: string, index: number, today = kstToday()): Mutation {
  const next = cloneDocs(docs);
  const q = list(collectionsOf(next), "quests").find((x) => x.id === questId);
  if (!q) return { docs: next, event: event("quest_update", { id: questId, missing: true }) };
  const evidence = (q.evidence && typeof q.evidence === "object" ? { ...(q.evidence as object) } : {}) as Record<string, unknown>;
  const checks = (q.checks && typeof q.checks === "object" ? { ...(q.checks as object) } : {}) as Record<string, unknown>;
  const key = String(index);
  const was = Boolean(evidence[key] || checks[key]);
  if (was) {
    delete evidence[key];
    delete checks[key];
  } else {
    evidence[key] = today;
    checks[key] = today;
  }
  q.evidence = evidence;
  q.checks = checks;
  const conds = Array.isArray(q.conditions) ? q.conditions.length : 0;
  const done = Object.keys(evidence).length;
  if (conds) q.step = Math.min(done, conds);
  return {
    docs: next,
    event: event("quest_update", { id: questId, title: q.title, step: index, done: !was, date: today }),
  };
}

export function adjustItem(docs: DocMap, itemId: string, qty: number | null, flag: string | null): Mutation {
  const next = cloneDocs(docs);
  const item = list(collectionsOf(next), "inventory").find((x) => x.id === itemId);
  if (!item) return { docs: next, event: event("backpack", { id: itemId, missing: true }) };
  const before = { qty: item.qty ?? null, flag: item.flag ?? null };
  item.qty = qty;
  if (flag) item.flag = flag;
  else delete item.flag;
  return {
    docs: next,
    event: event("backpack", {
      id: itemId,
      name: item.name,
      from: before,
      qty,
      flag: flag || null,
    }),
  };
}

export function gradeRune(docs: DocMap, runeId: string, grade: Grade, today = kstToday()): Mutation {
  const next = cloneDocs(docs);
  const rune = list(collectionsOf(next), "runes").find((x) => x.id === runeId);
  if (!rune) return { docs: next, event: event("rune_review", { id: runeId, missing: true }) };
  const srs = schedule((rune.srs as Partial<import("../lib/srs").Srs>) || blankSrs(today), grade, today);
  rune.srs = srs;
  return {
    docs: next,
    event: event("rune_review", { id: runeId, w: rune.w, grade, due: srs.due, srs }),
  };
}

export function addRune(docs: DocMap, input: { w: string; h: string; m: string; c: string }, today = kstToday()): Mutation {
  const next = cloneDocs(docs);
  const id = newId();
  const row = {
    id,
    w: input.w,
    base: input.w,
    hanja: input.h || null,
    meaning: input.m,
    ctx: input.c || null,
    known: false,
    createdAt: new Date().toISOString(),
    src: "journal",
    readingId: null,
    srs: { ...blankSrs(today), due: today },
  };
  list(collectionsOf(next), "runes").push(row);
  return { docs: next, event: event("rune_add", { id, w: input.w, hanja: input.h, meaning: input.m, example: input.c }) };
}

export function addReading(
  docs: DocMap,
  input: { title: string; ko: string; en: string; work: boolean },
  today = kstToday(),
): Mutation {
  const next = cloneDocs(docs);
  const id = newId();
  const row = {
    id,
    title: input.title || "untitled",
    ko: input.ko,
    en: input.en,
    work: input.work,
    pickDate: today,
    createdAt: new Date().toISOString(),
    topic: "",
    srcName: "journal",
  };
  list(collectionsOf(next), "readings").push(row);
  return {
    docs: next,
    event: event("reading_add", { id, title: row.title, work: input.work, ko: input.ko, en: input.en }),
  };
}

export function requestEpisode(docs: DocMap): Mutation {
  const next = cloneDocs(docs);
  const col = collectionsOf(next);
  const seriesList = list(col, "series");
  const series = seriesList[0] || null;
  const arc = series && Array.isArray(series.arc) ? (series.arc as { title?: string }[]) : [];
  const episodes = series && series.episodes && typeof series.episodes === "object" ? (series.episodes as Record<string, unknown>) : {};
  let n = 1;
  let arcTitle = "";
  for (let i = 0; i < Math.max(arc.length, 1); i++) {
    if (!episodes[String(i + 1)]) {
      n = i + 1;
      arcTitle = arc[i]?.title || "";
      break;
    }
    n = i + 2;
    arcTitle = "";
  }
  const id = newId();
  const req = { id, at: new Date().toISOString(), type: "episode", episode: n, arc: arcTitle, seriesId: series?.id ?? null, title: series?.title ?? "" };
  const requests = list(col, "storyRequests");
  requests.push(req);
  return { docs: next, event: event("story_request", req) };
}

export function requestSeries(docs: DocMap, input: { theme: string; format: "story" | "articles"; length: number }): Mutation {
  const next = cloneDocs(docs);
  const id = newId();
  const req = {
    id,
    at: new Date().toISOString(),
    type: "series",
    theme: input.theme,
    format: input.format,
    episodes: input.length,
  };
  list(collectionsOf(next), "storyRequests").push(req);
  return { docs: next, event: event("story_request", req) };
}

export function rotationMonth(title: string, rules: unknown): string | null {
  if (!rules || typeof rules !== "object") return null;
  const rot = (rules as { rotation?: { order?: string[]; nextMonth?: string } }).rotation;
  if (!rot?.nextMonth || !Array.isArray(rot.order)) return null;
  const i = rot.order.indexOf(title);
  if (i < 0) return null;
  return addMonths(rot.nextMonth, i);
}
