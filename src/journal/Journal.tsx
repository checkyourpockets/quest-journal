import { Fragment, useEffect, useMemo, useState } from "react";
import type { SavePhase } from "../data/types";
import type { Grade } from "../lib/srs";
import type { SettingsInput } from "../data/mutate";
import { dayLabel, daysTo, isoWeekday, longDate, mLong, pLong, pShort, wd, won, wonK } from "../lib/dates";
import { ALL_STATUSES, C, CH_PROMPTS, FIN_COL, GIVERS, INV_CATS, MORE_STATUSES, SERIES_THEMES, SLOTS, SLOT_OF, SLOT_SUB_OFF, SLOT_SUB_WORK, STATUS_TONE, TABS, WIN_WORK, giverName, recipeEmoji, shiftInfo, type TabName } from "./constants";
import type { InvItem, JournalView, QuestView, RecipeView, SettingsView } from "./model";
import { Bar, Checks, Panel, PeriodBars, Radar, Ring, Sigil, TabTitle, Tag, branchLine } from "./bits";
import { SkillWeb } from "./SkillWeb";

export type JournalActions = {
  phase: SavePhase;
  detail: string;
  email: string;
  mode: "remote" | "fixture";
  logChronicle: (session: "morning" | "night", text: string) => void;
  toggleHabitToday: (questId: string) => void;
  setQuestStatus: (questId: string, status: string) => void;
  toggleQuestStep: (questId: string, index: number) => void;
  adjustItem: (id: string, qty: number | null, flag: string | null) => void;
  gradeRune: (id: string, grade: Grade) => void;
  addRune: (input: { w: string; h: string; m: string; c: string }) => void;
  addReading: (input: { title: string; ko: string; en: string; work: boolean }) => void;
  requestEpisode: () => void;
  requestSeries: (input: { theme: string; format: "story" | "articles"; length: number }) => void;
  saveSettings: (settings: SettingsInput) => void;
  signOut: () => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayPlan(date: string, code: string | undefined, settings: SettingsView): { label: string; hours: string; work: boolean } {
  const base = shiftInfo(code);
  if (!settings.shift || settings.shift.days.length === 0) return { label: base.label, hours: "", work: base.work };
  const work = settings.shift.days.includes(isoWeekday(date));
  return {
    work,
    label: work ? (code && code !== "OFF" ? code : "Work") : "Day off",
    hours: work ? settings.shift.start + "–" + settings.shift.end : "",
  };
}

function phaseText(phase: SavePhase, detail: string): string {
  if (phase === "saving") return "Saving…";
  if (phase === "saved") return "Saved";
  if (phase === "queued") return "Saved on this device";
  if (phase === "error") return detail || "Could not save";
  return "";
}

function QuestRow({ q, onOpen, open, id, showWin, actions, today }: { q: QuestView; onOpen: (q: QuestView) => void; open?: boolean; id?: string; showWin?: boolean; actions?: JournalActions; today: string }) {
  const left = q.end ? daysTo(q.end, today) : null;
  const live = !["merged", "expired", "rotation", "completed", "archived", "declined", "faded"].includes(q.s);
  const giver = giverName(q.g) + q.cg.map((c) => " & " + giverName(c)).join("");
  const due = q.end && !q.done && live ? (left !== null && left < 0 ? "was due " + dayLabel(q.end) : left === 0 ? "due today" : "due " + dayLabel(q.end)) : "";
  return (
    <div id={id} className={"qwrap anchor" + (open ? " open" : "")}>
      <button type="button" className="qrow" onClick={() => onOpen(q)} aria-expanded={!!open}>
        <Sigil g={q.g} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span className="t">{q.t}</span>
            {q.ty !== "side" ? <Tag text={q.ty} col={q.ty === "epic" ? "#6b4fa8" : q.ty === "main" ? C.amberTx : "#2f5f8f"} /> : null}
            <Tag text={q.s} col={STATUS_TONE[q.s] || C.muted} />
            {q.oracle ? <Tag text="Oracle pick" col={C.amberTx} /> : null}
          </div>
          <div className="sub">
            {giver}
            {showWin && q.w ? " · " + (WIN_WORK[q.w] || q.w) : ""}
            {due ? " · " + due : ""}
            {q.done ? " · cleared " + dayLabel(q.done) : ""}
            {q.merged ? " · merged into " + q.merged : ""}
            {q.rot ? " · rotates in " + mLong(q.rot) : ""}
          </div>
          {q.p && live ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, maxWidth: 340 }}>
              <div style={{ flex: 1 }}><Bar v={q.p[0]} max={q.p[1]} col={C.amber} /></div>
              <span className="sub num">{q.p[0]}/{q.p[1]}</span>
            </div>
          ) : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="xp num">{q.xp} XP</div>
          <div className="go">{open === undefined ? "Open ›" : open ? "Close ▴" : "Details ▾"}</div>
        </div>
      </button>
      {open ? (
        <div className="qdetail">
          {q.fl ? <div className="fl">“{q.fl}”</div> : null}
          {q.how ? <div><span className="lbl">How to clear it: </span>{q.how}</div> : null}
          <div className="sub">
            Given by {giver} · {q.ty} quest · {q.xp} XP
            {q.asp ? " · feeds " + q.asp : ""}
            {q.w ? " · best time: " + (WIN_WORK[q.w] || q.w).toLowerCase() : ""}
            {q.work ? " · work quest" : ""}
          </div>
          {q.p ? <div className="sub num">Progress: {q.p[0]} of {q.p[1]} steps</div> : null}
          {actions && q.tally && live ? (
            <div>
              <button type="button" className={q.loggedToday ? "btn on sm" : "btn primary sm"} onClick={() => actions.toggleHabitToday(q.id)}>
                {q.loggedToday ? "Logged today · undo" : "Log today"}
              </button>
              {q.manual ? <div className="sub">Manual check-off. Tap when you've done it.</div> : null}
            </div>
          ) : null}
          {actions && q.steps.length ? (
            <div className="steps">
              {q.steps.map((step, i) => (
                <label key={i}>
                  <input type="checkbox" checked={step.done} onChange={() => actions.toggleQuestStep(q.id, i)} />
                  <span>{step.label}</span>
                </label>
              ))}
            </div>
          ) : null}
          {actions ? (
            <label className="sub">Status{" "}
              <select aria-label={"Status of " + q.t} value={ALL_STATUSES.includes(q.s) ? q.s : "active"} onChange={(e) => actions.setQuestStatus(q.id, e.target.value)}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Journal({ view, actions }: { view: JournalView; actions: JournalActions }) {
  const [tab, setTab] = useState<TabName>("Today");
  const [anchor, setAnchor] = useState("");
  const [sel, setSel] = useState(view.shifts[view.today] ? view.today : view.weekStart);
  const [jv, setJv] = useState("quests");
  const [sf, setSf] = useState("active");
  const [gf, setGf] = useState("");
  const [sort, setSort] = useState("status");
  const [focusQ, setFocusQ] = useState("");

  useEffect(() => {
    if (!anchor) return;
    const t = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setAnchor("");
    }, 80);
    return () => window.clearTimeout(t);
  }, [tab, anchor, jv, sf]);

  const go = (t: TabName, a?: string) => { setTab(t); setAnchor(a || "qj-top"); };
  const openQuest = (q: QuestView) => {
    setJv("quests");
    setSf(q.s === "completed" ? "done" : q.s);
    setGf("");
    setFocusQ(q.id);
    setTab("Journal");
    setAnchor("q-" + q.id);
  };
  const toggleQuest = (q: QuestView) => setFocusQ(focusQ === q.id ? "" : q.id);

  const QS = view.quests;
  const active = QS.filter((q) => q.s === "active");
  const habits = active.filter((q) => q.ty === "habit");
  const missed = QS.filter((q) => q.s === "missed");
  const rotation = QS.filter((q) => q.s === "rotation").slice().sort((a, b) => (a.rot || "").localeCompare(b.rot || ""));
  const offered = QS.filter((q) => q.s === "offered");
  const counts: Record<string, number> = {};
  QS.forEach((q) => { counts[q.s] = (counts[q.s] || 0) + 1; });
  const xpCleared = QS.filter((q) => q.s === "completed").reduce((t, q) => t + q.xp, 0);

  const journal = useMemo(() => {
    let a = QS.slice();
    if (sf === "done") a = a.filter((q) => q.s === "completed");
    else if (sf !== "all") a = a.filter((q) => q.s === sf);
    if (gf) a = a.filter((q) => q.g === gf || q.cg.includes(gf));
    const ord = ["active", "offered", "rotation", "missed", "resting", "merged", "completed", "expired", "archived", "declined", "faded"];
    if (sort === "xp") a.sort((x, y) => y.xp - x.xp);
    else if (sort === "name") a.sort((x, y) => x.t.localeCompare(y.t));
    else if (sort === "recent") a.sort((x, y) => (y.done || y.end || "").localeCompare(x.done || x.end || ""));
    else a.sort((x, y) => ord.indexOf(x.s) - ord.indexOf(y.s) || x.t.localeCompare(y.t));
    return a;
  }, [QS, sf, gf, sort]);

  const selShift = dayPlan(sel, view.shifts[sel], view.settings);
  const dayGroups = useMemo(() => {
    const out: Record<string, QuestView[]> = {};
    QS.filter((q) => (q.s === "active" || q.s === "offered") && q.ty !== "habit" && (!q.end || q.end >= sel)).forEach((q) => {
      const w = q.w || "any";
      let slot: string | null = SLOT_OF[w] || "Anytime";
      if (!selShift.work) {
        if (q.work) slot = null;
        else if (["commute_in", "commute_out", "shift"].includes(w)) slot = "Anytime";
      }
      if (slot) (out[slot] = out[slot] || []).push(q);
    });
    return out;
  }, [QS, sel, selShift.work]);

  const shiftDays = Object.keys(view.shifts).sort();
  const todayShift = dayPlan(view.today, view.shifts[view.today], view.settings);
  const pill = phaseText(actions.phase, actions.detail);
  const givers = Array.from(new Set(QS.flatMap((q) => [q.g, ...q.cg]))).sort();

  const chips = [
    { label: "Level " + view.char.lvl, tip: "Character level: " + view.char.total.toLocaleString() + " XP, " + Math.max(0, 250 - view.char.into) + " to the next level. Opens Character.", onClick: () => go("Character", "sec-level") },
    { label: view.char.cls.name, tip: "Your earned class. Opens the class section on Character.", onClick: () => go("Character", "sec-class") },
    { label: active.length + " active", tip: "Quests in play right now. Opens the Journal filtered to active.", onClick: () => { setJv("quests"); setSf("active"); setGf(""); go("Journal"); } },
    { label: "🔥 " + view.bag.ember + " XP boosts", tip: "You have " + view.bag.ember + " XP boosts. Use one and the next quest you clear gives 50% more XP. Opens Bonus items in your Backpack.", onClick: () => go("Backpack", "sec-items") },
    { label: "⏳ " + view.bag.hourglass, tip: view.bag.hourglass + " Hourglasses: add 2 days to a quest's deadline. Opens this week.", onClick: () => { setSel(view.shifts[view.today] ? view.today : view.weekStart); go("Today", "sec-week"); } },
    { label: "🎲 " + view.bag.reroll, tip: view.bag.reroll + " Oracle rerolls: ask for a fresh set of offered quests. Opens today's omen.", onClick: () => go("Today", "sec-oracle") },
  ];

  return (
    <div className="qj" id="qj-top">
      <div className="top">
        <div className="brand">Quest Journal</div>
        <div className="date">{longDate(view.today)} · KST · {todayShift.hours || todayShift.label}</div>
        {pill ? <div className={"savepill" + (actions.phase === "error" ? " bad" : "")} role="status">{pill}</div> : null}
        <div className="hchips">
          {chips.map((c) => <button key={c.label} type="button" className="hchip" data-tip={c.tip} title={c.tip} aria-label={c.tip} onClick={c.onClick}>{c.label}</button>)}
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} className={"tab" + (tab === t ? " on" : "")} onClick={() => go(t)}>{t}</button>)}
        </div>
      </div>
      <div className="wrap">
        {tab === "Today" ? <Today view={view} sel={sel} setSel={setSel} shiftDays={shiftDays} selShift={selShift} dayGroups={dayGroups} offered={offered.length} openQuest={openQuest} onHabits={() => { setJv("habits"); go("Journal"); }} /> : null}
        {tab === "Journal" ? <JournalTab view={view} actions={actions} jv={jv} setJv={setJv} sf={sf} setSf={setSf} gf={gf} setGf={setGf} sort={sort} setSort={setSort} focusQ={focusQ} toggleQuest={toggleQuest} journal={journal} counts={counts} xpCleared={xpCleared} givers={givers} habits={habits} rotation={rotation} missed={missed} openQuest={openQuest} /> : null}
        {tab === "Chronicle" ? <Chronicle view={view} actions={actions} /> : null}
        {tab === "Runes" ? <Runes view={view} actions={actions} /> : null}
        {tab === "Crafting" ? <Crafting view={view} /> : null}
        {tab === "Backpack" ? <Backpack view={view} actions={actions} /> : null}
        {tab === "Ledger" ? <Ledger view={view} /> : null}
        {tab === "Character" ? <Character view={view} actions={actions} /> : null}
        {tab === "World" ? <World view={view} /> : null}
      </div>
      <div className="foot">
        {view.asOf ? <div>Journal data as of {view.asOf}.</div> : null}
        <div>Chamwei reads your log and updates omens, episodes and XP each morning.</div>
        <details>
          <summary>Account</summary>
          <div style={{ marginTop: 8, color: C.ink }}>
            <p style={{ margin: "4px 0" }}>{actions.mode === "fixture" ? "Local fixture. Nothing is sent anywhere." : actions.email ? "Signed in as " + actions.email + "." : "Signed in."}</p>
            <p style={{ margin: "4px 0" }}>Edits save to your journal and to the log. Offline changes stay on this device and sync when you reconnect.</p>
            <button type="button" className="btn sm" onClick={actions.signOut}>Sign out</button>
          </div>
        </details>
      </div>
    </div>
  );
}

function Today({ view, sel, setSel, shiftDays, selShift, dayGroups, offered, openQuest, onHabits }: {
  view: JournalView;
  sel: string;
  setSel: (d: string) => void;
  shiftDays: string[];
  selShift: { label: string; hours: string; work: boolean };
  dayGroups: Record<string, QuestView[]>;
  offered: number;
  openQuest: (q: QuestView) => void;
  onHabits: () => void;
}) {
  return (
    <Fragment>
      <TabTitle title="Today" sub="Today's omen, your week, and the quests that fit each day." />
      <Panel id="sec-oracle" tint title="Today's omen" sub={view.omen.date ? "The Oracle's read on your day · omen of " + dayLabel(view.omen.date) : "The Oracle's read on your day"}>
        <div className="gentle">{view.omen.text ? "“" + view.omen.text + "”" : "The morning omen arrives with Chamwei's update."}</div>
        {view.omen.why ? <div className="sub" style={{ textAlign: "center", marginTop: 6 }}>{view.omen.why}</div> : null}
        {view.oracle.text ? <div style={{ maxWidth: 680, margin: "14px auto 0", fontSize: 15.5, color: "#33484a" }}><span className="lbl">The Oracle{view.oracle.date ? ", " + dayLabel(view.oracle.date) : ""}:</span> {view.oracle.text}</div> : null}
      </Panel>
      <Panel id="sec-week" title="This week" sub={shiftDays.length ? "Your shifts for " + pShort(view.weekStart) + "–" + pShort(view.weekEnd) + ". Tap a day to see its shift and quests. The page stays where it is. Tap a quest to open it in your Journal." : "No shift week is on file yet."}>
        <div className="days">
          {shiftDays.map((d) => {
            const s = dayPlan(d, view.shifts[d], view.settings);
            return (
              <button key={d} type="button" className={"day" + (sel === d ? " sel" : "") + (d === view.today ? " today" : "")} onClick={() => setSel(d)} aria-pressed={sel === d}>
                <div className="dw">{d === view.today ? "Today" : wd(d)}</div>
                <div className="dn num">{Number(d.slice(8))}</div>
                <div className="ds">{s.hours || (s.work ? s.label : "Off")}</div>
              </button>
            );
          })}
        </div>
        {sel ? (
          <div style={{ marginTop: 18, borderTop: "2px solid " + C.tint, paddingTop: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div className="serif" style={{ fontSize: 24, fontWeight: 700, color: C.tealDk }}>{dayLabel(sel)} · {selShift.label}</div>
              <div className="sub">{selShift.work ? (selShift.hours ? selShift.hours + ". Quests stay in their usual slots." : "Work day. Quests stay in their usual slots.") : "Day off. Work quests are tucked away and commute quests move to Anytime."}</div>
            </div>
            {SLOTS.filter((s) => dayGroups[s]).map((s) => (
              <div key={s} style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, borderBottom: "1px solid " + C.gold, paddingBottom: 2, flexWrap: "wrap" }}>
                  <span className="serif" style={{ fontSize: 21, fontWeight: 700, color: C.tealDk }}>{s}</span>
                  <span className="sub">{(selShift.work ? SLOT_SUB_WORK : SLOT_SUB_OFF)[s]}</span>
                </div>
                {dayGroups[s].map((q) => <QuestRow key={q.id} q={q} onOpen={openQuest} today={view.today} />)}
              </div>
            ))}
            <div className="sub" style={{ textAlign: "center", marginTop: 12 }}>Offer board: {offered} of {view.rules.offerCap} slots used. Offers expire after {view.rules.offerExpiryDays} days if you don't take them.</div>
          </div>
        ) : null}
      </Panel>
      {(view.coach.slipping || view.coach.step) ? (
        <Panel title="This week's nudge" sub={view.coach.date ? "From your check-in (" + dayLabel(view.coach.date) + "): the one thing slipping and one small next step." : "The one thing slipping, and one small next step."}>
          <div className="grid2">
            <div><div className="lbl" style={{ color: C.bad }}>Slipping</div><div>{view.coach.slipping}</div></div>
            <div><div className="lbl" style={{ color: C.good }}>One small step</div><div>{view.coach.step}</div></div>
          </div>
        </Panel>
      ) : null}
      <div style={{ textAlign: "center" }}><button type="button" className="btn" onClick={onHabits}>Your core habits, rotation and missed quests are in Journal › Habits</button></div>
    </Fragment>
  );
}

function JournalTab(props: {
  view: JournalView;
  actions: JournalActions;
  jv: string;
  setJv: (v: string) => void;
  sf: string;
  setSf: (v: string) => void;
  gf: string;
  setGf: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  focusQ: string;
  toggleQuest: (q: QuestView) => void;
  journal: QuestView[];
  counts: Record<string, number>;
  xpCleared: number;
  givers: string[];
  habits: QuestView[];
  rotation: QuestView[];
  missed: QuestView[];
  openQuest: (q: QuestView) => void;
}) {
  const { view, actions, jv, setJv, sf, setSf, gf, setGf, sort, setSort, focusQ, toggleQuest, journal, counts, xpCleared, givers, habits, rotation, missed, openQuest } = props;
  const QS = view.quests;
  return (
    <Fragment>
      <TabTitle title="Quest journal" sub="Every quest you've been given, plus the habits that run underneath them." />
      <div className="chips" style={{ marginBottom: 16 }}>
        <div className="seg" role="tablist" aria-label="Journal view">
          <button type="button" className={jv === "quests" ? "on" : ""} onClick={() => setJv("quests")}>Quests</button>
          <button type="button" className={jv === "habits" ? "on" : ""} onClick={() => setJv("habits")}>Habits</button>
        </div>
      </div>
      {jv === "quests" ? (
        <Fragment>
          <div className="chips" style={{ marginBottom: 16 }}>
            {[["Quests", String(QS.length)], ["Active", String(counts.active || 0)], ["Offered", String(counts.offered || 0)], ["Cleared", String(counts.completed || 0)], ["XP from clears", String(xpCleared)]].map((k) => <div key={k[0]} className="kpi"><span className="lbl">{k[0]}</span><b>{k[1]}</b></div>)}
          </div>
          <Panel>
            <div className="chips" style={{ marginBottom: 10 }}>
              <div className="seg" role="group" aria-label="Status">
                {([["active", "Active", counts.active || 0], ["offered", "Offered", counts.offered || 0], ["done", "Done", counts.completed || 0], ["all", "All", QS.length]] as const).map((x) => (
                  <button key={x[0]} type="button" className={sf === x[0] ? "on" : ""} onClick={() => setSf(x[0])}>{x[1]} · {x[2]}</button>
                ))}
              </div>
              <select value={MORE_STATUSES.includes(sf) ? sf : ""} onChange={(e) => { if (e.target.value) setSf(e.target.value); }} aria-label="More statuses" style={MORE_STATUSES.includes(sf) ? { background: C.teal, color: "#fff", borderColor: C.teal } : undefined}>
                <option value="">More statuses…</option>
                {MORE_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)} · {counts[s] || 0}</option>)}
              </select>
            </div>
            <div className="chips" style={{ marginBottom: 8 }}>
              <select value={gf} onChange={(e) => setGf(e.target.value)} aria-label="Quest giver">
                <option value="">All givers</option>
                {givers.map((g) => <option key={g} value={g}>{giverName(g)}</option>)}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                <option value="status">Sort: status</option>
                <option value="xp">Sort: XP</option>
                <option value="recent">Sort: recent</option>
                <option value="name">Sort: name</option>
              </select>
              <span className="sub">{journal.length} shown · tap a quest for details</span>
            </div>
            {journal.length === 0 ? <div className="sub" style={{ textAlign: "center", padding: 12 }}>Nothing here with these filters.</div> : null}
            {journal.map((q) => <QuestRow key={q.id} q={q} id={"q-" + q.id} onOpen={toggleQuest} open={focusQ === q.id} showWin actions={actions} today={view.today} />)}
          </Panel>
        </Fragment>
      ) : (
        <Fragment>
          <Panel id="sec-floor" title="Your floor: the core five" sub="Five small habits that never fully stop. Tap Done today to log a check. Ticks show what's logged in the current window.">
            <div className="grid">
              {habits.map((q) => (
                <div key={q.id} style={{ background: C.card2, border: "1px solid " + C.line, borderRadius: 12, padding: "10px 12px" }}>
                  <div className="lbl" style={{ color: C.amberTx }}>{(q.fl || q.asp || "Habit").split(" · ")[0]}</div>
                  <div className="t">{q.t}</div>
                  <div className="sub">{WIN_WORK[q.w] || q.w} · {q.xp} XP</div>
                  {q.p ? <Checks p={q.p} /> : null}
                  <button type="button" className={q.loggedToday ? "btn on sm" : "btn primary sm"} style={{ marginTop: 8 }} onClick={() => actions.toggleHabitToday(q.id)}>
                    {q.loggedToday ? "Logged today · undo" : "Done today"}
                  </button>
                </div>
              ))}
              {habits.length === 0 ? <div className="sub">No active habits on file.</div> : null}
            </div>
          </Panel>
          <Panel title="Rotation" sub="Only five habits are tracked at once. The others rest here, and one swaps in each month.">
            <div className="grid">
              {rotation.map((q) => (
                <div key={q.id} style={{ background: C.card2, border: "1px dashed " + C.line, borderRadius: 12, padding: "10px 12px" }}>
                  <div className="lbl" style={{ color: C.teal }}>{q.rot ? mLong(q.rot) : "Resting"}</div>
                  <div className="t">{q.t}</div>
                  <div className="sub">{q.manual ? "Manual check-off, " + (q.p ? q.p[1] : 0) + " a week when active" : (q.fl || q.how || "Habit").split(" · ")[0] + " · " + q.xp + " XP"}</div>
                </div>
              ))}
              {rotation.length === 0 ? <div className="sub">Nothing is resting in the rotation.</div> : null}
            </div>
          </Panel>
          <Panel title={"Missed · " + missed.length} sub="Quests whose window closed. Tap one for details.">
            {missed.map((q) => <QuestRow key={q.id} q={q} onOpen={openQuest} showWin today={view.today} />)}
            {missed.length === 0 ? <div className="sub">No missed quests.</div> : null}
          </Panel>
        </Fragment>
      )}
    </Fragment>
  );
}

function Chronicle({ view, actions }: { view: JournalView; actions: JournalActions }) {
  const [sess, setSess] = useState<"morning" | "night">(new Date(Date.now() + 9 * 3600e3).getUTCHours() < 15 ? "morning" : "night");
  const [text, setText] = useState("");
  const [cf, setCf] = useState("week");
  const entries = view.entries;
  const inView = (d: string) => (cf === "week" ? d >= view.weekStart && d <= view.weekEnd : d.startsWith(cf));
  const entryDays = Array.from(new Set(entries.filter((e) => inView(e.d)).map((e) => e.d))).sort().reverse();
  const entryMonths = Array.from(new Set(entries.map((e) => e.d.slice(0, 7)).filter(Boolean))).sort().reverse();
  const last = entries.slice().sort((a, b) => a.d.localeCompare(b.d)).slice(-1)[0];
  const save = () => {
    const t = text.trim();
    if (!t) return;
    actions.logChronicle(sess, t);
    setText("");
    setCf("week");
  };
  return (
    <Fragment>
      <TabTitle title="Chronicle" sub="Your morning and night journal entries, plus beat notes from the desk." />
      <Panel tint title="Write an entry" sub={dayLabel(view.today) + " · a few lines is plenty."}>
        <div className="chips" style={{ marginBottom: 8 }}>
          <div className="seg" role="group" aria-label="Session">
            <button type="button" className={sess === "morning" ? "on" : ""} onClick={() => setSess("morning")}>☀ Morning</button>
            <button type="button" className={sess === "night" ? "on" : ""} onClick={() => setSess("night")}>☾ Night</button>
          </div>
        </div>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="A few lines. On your phone, tap the mic on the keyboard to dictate." aria-label="Journal entry" />
        <div className="note" style={{ margin: "6px 0" }}>Prompts if you're stuck: {CH_PROMPTS[sess].join(" · ")}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" className="btn primary" disabled={!text.trim()} onClick={save}>Save entry</button>
          {actions.phase === "saved" ? <span className="ok">Saved</span> : null}
        </div>
      </Panel>
      <div className="grid2">
        <Panel title="Journal entries" sub="Pick a time span to read back.">
          <div className="chips" style={{ marginBottom: 12 }}>
            <select value={cf} onChange={(e) => setCf(e.target.value)} aria-label="Show entries from" style={{ fontSize: 16, padding: "8px 12px" }}>
              <option value="week">This week ({pShort(view.weekStart)}–{pShort(view.weekEnd)})</option>
              {entryMonths.map((m) => <option key={m} value={m}>{mLong(m)}</option>)}
            </select>
          </div>
          {entryDays.length === 0 ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div className="sub">{last ? "No entries in this span. The last one was " + dayLabel(last.d) + "." : "No entries yet."}</div>
              {last ? <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => setCf(last.d.slice(0, 7))}>Read {mLong(last.d.slice(0, 7))}</button> : null}
            </div>
          ) : entryDays.map((d) => (
            <div key={d} style={{ padding: "10px 0", borderTop: "1px solid #ece4d6" }}>
              <div className="serif" style={{ fontSize: 21, fontWeight: 700, color: C.tealDk }}>{dayLabel(d)}</div>
              {(["morning", "night"] as const).map((s) => {
                const es = entries.filter((e) => e.d === d && e.s === s);
                if (!es.length) return null;
                return (
                  <div key={s} style={{ marginTop: 6 }}>
                    <div className="lbl" style={{ color: s === "morning" ? C.amberTx : "#3d64a8" }}>{s === "morning" ? "☀ Morning" : "☾ Night"}</div>
                    {es.map((e) => <div key={e.id || e.t.slice(0, 12)} style={{ whiteSpace: "pre-wrap", fontSize: 15.5, marginTop: 2 }}>{e.t}</div>)}
                  </div>
                );
              })}
            </div>
          ))}
        </Panel>
        <Panel title="Beat notes" sub="Notes you saved.">
          {view.beats.slice().reverse().map((b) => (
            <div key={b.id} className="row"><div><div className="t">{b.title}</div><div className="sub">{b.d ? dayLabel(b.d) : ""}</div><div style={{ fontSize: 15, marginTop: 2 }}>{b.text}</div></div></div>
          ))}
          {view.beats.length === 0 ? <div className="sub">No beat notes yet.</div> : null}
        </Panel>
      </div>
    </Fragment>
  );
}

function Runes({ view, actions }: { view: JournalView; actions: JournalActions }) {
  const due = view.runes.filter((r) => !r.known && r.due && r.due <= view.today).slice().sort((a, b) => (a.due || "").localeCompare(b.due || ""));
  const [rf, setRf] = useState("due");
  const [revOn, setRevOn] = useState(false);
  const [revQ, setRevQ] = useState<string[]>([]);
  const [revShow, setRevShow] = useState(false);
  const [rw, setRw] = useState("");
  const [rh, setRh] = useState("");
  const [rm, setRm] = useState("");
  const [rc, setRc] = useState("");
  const [rdT, setRdT] = useState("");
  const [rdKo, setRdKo] = useState("");
  const [rdEn, setRdEn] = useState("");
  const [rdWork, setRdWork] = useState(true);
  const [srTheme, setSrTheme] = useState("");
  const [srCustom, setSrCustom] = useState("");
  const [srFmt, setSrFmt] = useState<"story" | "articles">("story");
  const [srLen, setSrLen] = useState(8);
  const byId = new Map(view.runes.map((r) => [r.id, r]));
  const rv = revOn && revQ.length ? byId.get(revQ[0]) : undefined;
  const list = rf === "due" ? due : rf === "known" ? view.runes.filter((r) => r.known) : rf === "soon" ? view.runes.filter((r) => !r.known && (!r.due || r.due > view.today)) : view.runes;
  const start = () => { setRevQ(due.map((r) => r.id)); setRevShow(false); setRevOn(true); };
  const grade = (g: Grade) => {
    const id = revQ[0];
    if (!id) return;
    actions.gradeRune(id, g);
    setRevQ(g === "again" ? revQ.slice(1).concat(id) : revQ.slice(1));
    setRevShow(false);
  };
  const known = view.runes.filter((r) => r.known).length;
  const hanja = view.runes.filter((r) => r.h).length;
  const nextEp = view.series.episodes.find((e) => !e.date);
  return (
    <Fragment>
      <TabTitle title="Runes" sub="Korean words saved from your readings, with review dates." />
      <div className="chips" style={{ marginBottom: 16 }}>
        <div className="kpi"><span className="lbl">Runes</span><b>{view.runes.length}</b><small>from {view.reads.length} readings</small></div>
        <div className="kpi"><span className="lbl">Due for review</span><b style={{ color: due.length ? C.amberTx : C.good }}>{due.length}</b><small>due on or before today</small></div>
        <div className="kpi"><span className="lbl">Known</span><b>{known}</b></div>
        <div className="kpi"><span className="lbl">With hanja</span><b>{hanja}</b></div>
      </div>
      <Panel tint title="Rune review" sub={due.length + " cards are due. Say each word's meaning in your head, flip it, then grade yourself honestly."}>
        {!revOn ? (
          <div style={{ textAlign: "center" }}>
            <button type="button" className="btn primary" style={{ fontSize: 17, padding: "10px 22px" }} onClick={start} disabled={!due.length}>Start rune review · {due.length} due</button>
          </div>
        ) : rv ? (
          <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
            <div className="sub num">{revQ.length} left in this sitting</div>
            <div className="rvword" lang="ko">{rv.w}</div>
            {revShow ? (
              <Fragment>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{rv.m}</div>
                {rv.h ? <div className="hanja" style={{ fontSize: 22 }}>{rv.h}</div> : null}
                <div className="chips">
                  {(["again", "hard", "good", "easy"] as const).map((g) => (
                    <button key={g} type="button" className={"btn" + (g === "good" ? " primary" : "")} onClick={() => grade(g)}>{g[0].toUpperCase() + g.slice(1)}</button>
                  ))}
                </div>
                <div className="note">Again brings the card back at the end of this sitting. The next due date is saved either way.</div>
                {actions.phase === "saved" ? <div className="ok">Saved</div> : null}
              </Fragment>
            ) : <button type="button" className="btn primary" onClick={() => setRevShow(true)}>Show meaning</button>}
            <button type="button" className="btn sm" onClick={() => setRevOn(false)}>Stop for now</button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div className="t">Review done. 수고하셨습니다!</div>
            {actions.phase === "saved" || actions.phase === "queued" ? <div className="ok">Saved</div> : null}
            <button type="button" className="btn sm" style={{ marginTop: 6 }} onClick={() => setRevOn(false)}>Close</button>
          </div>
        )}
        <details style={{ marginTop: 12 }}>
          <summary>Browse the whole deck ({view.runes.length} runes)</summary>
          <div className="chips" style={{ margin: "10px 0" }}>
            <div className="seg">{[["due", "Due now"], ["soon", "Not yet due"], ["known", "Known"], ["all", "All"]].map((x) => <button key={x[0]} type="button" className={rf === x[0] ? "on" : ""} onClick={() => setRf(x[0])}>{x[1]}</button>)}</div>
          </div>
          <div className="scroll"><table lang="ko"><thead><tr><th>Word</th><th>Hanja</th><th>Meaning</th><th className="r">Due</th></tr></thead>
            <tbody>{list.map((r) => <tr key={r.id}><td className="kw" style={{ fontWeight: 700, fontSize: 17 }}>{r.w}</td><td className="hanja kw">{r.h}</td><td>{r.m}</td><td className="r sub nw">{r.known ? "known" : r.due ? pShort(r.due) : "new"}</td></tr>)}</tbody>
          </table></div>
        </details>
      </Panel>
      <div className="grid2">
        <Panel title="Add runes" sub="Save a word you met. Hanja and the example sentence are optional.">
          <div style={{ display: "grid", gap: 8 }}>
            <input type="text" lang="ko" placeholder="Korean word" value={rw} onChange={(e) => setRw(e.target.value)} aria-label="Korean word" />
            <input type="text" placeholder="Hanja (optional)" value={rh} onChange={(e) => setRh(e.target.value)} aria-label="Hanja" />
            <input type="text" placeholder="Meaning in English" value={rm} onChange={(e) => setRm(e.target.value)} aria-label="Meaning" />
            <input type="text" lang="ko" placeholder="Example sentence (optional)" value={rc} onChange={(e) => setRc(e.target.value)} aria-label="Example sentence" />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" className="btn primary" disabled={!rw.trim() || !rm.trim()} onClick={() => { actions.addRune({ w: rw.trim(), h: rh.trim(), m: rm.trim(), c: rc.trim() }); setRw(""); setRh(""); setRm(""); setRc(""); }}>Add rune</button>
              {actions.phase === "saved" ? <span className="ok">Saved</span> : null}
            </div>
          </div>
        </Panel>
        <Panel title="Add a reading" sub="Paste a Korean article. It is saved to your readings, and Chamwei can turn it into a lesson.">
          <div style={{ display: "grid", gap: 8 }}>
            <input type="text" placeholder="Title (optional)" value={rdT} onChange={(e) => setRdT(e.target.value)} aria-label="Reading title" />
            <textarea lang="ko" rows={6} placeholder="Korean text" value={rdKo} onChange={(e) => setRdKo(e.target.value)} aria-label="Korean text" />
            <details className="plain"><summary>Add the published English translation (optional)</summary>
              <textarea rows={4} placeholder="English translation" value={rdEn} onChange={(e) => setRdEn(e.target.value)} aria-label="English translation" />
            </details>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 15 }}><input type="checkbox" checked={rdWork} onChange={(e) => setRdWork(e.target.checked)} /> Work article</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" className="btn primary" disabled={!rdKo.trim()} onClick={() => { actions.addReading({ title: rdT.trim(), ko: rdKo.trim(), en: rdEn.trim(), work: rdWork }); setRdT(""); setRdKo(""); setRdEn(""); }}>Save reading</button>
              {actions.phase === "saved" ? <span className="ok">Saved</span> : null}
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid2">
        <Panel title="Readings" sub="Articles you've read.">
          {view.reads.map((r) => (
            <details key={r.id}>
              <summary lang="ko">{r.title}</summary>
              <div className="sub" style={{ margin: "2px 0 6px" }}>{r.date ? dayLabel(r.date) : ""}{r.gist ? " · " + r.gist : ""}</div>
              <div lang="ko" style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.75 }}>{r.ko}</div>
            </details>
          ))}
          {view.reads.length === 0 ? <div className="sub">No readings yet.</div> : null}
        </Panel>
        <Panel title="Stories" sub={view.series.title ? view.series.episodes.filter((e) => e.date).length + " of " + view.series.episodes.length + " episodes read" : "A series Chamwei writes for you."}>
          {view.series.title ? <div className="serif" style={{ fontSize: 25, fontWeight: 700, color: C.tealDk, textAlign: "center" }} lang="ko">{view.series.title}</div> : null}
          {view.series.premise ? <div className="fl" lang="ko" style={{ textAlign: "center", marginBottom: 10 }}>{view.series.premise}</div> : null}
          {view.series.episodes.map((ep) => ep.date ? (
            <details key={ep.n}>
              <summary lang="ko">Ep. {ep.n} · {ep.arc} <span className="sub">✓ read {dayLabel(ep.date)}</span></summary>
              {ep.summary ? <div style={{ fontSize: 15, margin: "6px 0 8px", borderLeft: "3px solid " + C.gold, paddingLeft: 10 }}>{ep.summary}</div> : null}
              {ep.ko ? <div lang="ko" style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.75 }}>{ep.ko}</div> : null}
            </details>
          ) : (
            <div key={ep.n} style={{ padding: "8px 0", borderTop: "1px solid #ece4d6", color: C.muted }} lang="ko">Ep. {ep.n} · {ep.arc} <span className="sub">· not written yet</span></div>
          ))}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <button type="button" className="btn" onClick={actions.requestEpisode}>Ask for episode {nextEp ? nextEp.n : view.series.episodes.length + 1}</button>
            {actions.phase === "saved" ? <div className="ok">Saved</div> : null}
          </div>
          {view.series.pending.length ? <div className="sub" style={{ marginTop: 8 }}>Waiting on Chamwei: {view.series.pending.join(" · ")}</div> : null}
          <details style={{ marginTop: 10 }}>
            <summary>Start a new series</summary>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <div className="chips" style={{ justifyContent: "flex-start" }}>{SERIES_THEMES.map((t) => <button key={t} type="button" className={"btn sm" + (srTheme === t ? " on" : "")} onClick={() => setSrTheme(srTheme === t ? "" : t)}>{t}</button>)}</div>
              <input type="text" placeholder="…or describe your own theme" value={srCustom} onChange={(e) => setSrCustom(e.target.value)} aria-label="Custom theme" />
              <div className="seg" style={{ justifySelf: "start" }}>
                <button type="button" className={srFmt === "story" ? "on" : ""} onClick={() => setSrFmt("story")}>Story with recurring characters</button>
                <button type="button" className={srFmt === "articles" ? "on" : ""} onClick={() => setSrFmt("articles")}>Short themed articles</button>
              </div>
              <label style={{ fontSize: 15 }}>Episodes <select value={srLen} onChange={(e) => setSrLen(Number(e.target.value))} aria-label="Episode count">{[6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
              <button type="button" className="btn primary" disabled={!srTheme && !srCustom.trim()} onClick={() => actions.requestSeries({ theme: srCustom.trim() || srTheme, format: srFmt, length: srLen })}>Request series</button>
            </div>
          </details>
        </Panel>
      </div>
    </Fragment>
  );
}

function haveMat(inv: InvItem[], match: string): boolean {
  const key = match.toLowerCase();
  if (!key) return false;
  return inv.some((i) => i.n.toLowerCase().includes(key) && i.q !== 0 && i.f !== "out");
}

function Crafting({ view }: { view: JournalView }) {
  const [crf, setCrf] = useState("all");
  const meals = view.recipes.filter((r) => r.k === "meal");
  const unlocked = meals.filter((r) => r.u).length;
  const ready = meals.filter((r) => !r.m.some((m) => !m[3] && !haveMat(view.inv, m[2] || m[0]))).length;
  const builds = view.recipes.filter((r) => r.k === "build").length;
  const list = view.recipes.filter((r) => crf === "all" ? true : crf === "cooked" ? r.k === "meal" && !!r.u : crf === "totry" ? r.k === "meal" && !r.u : r.k === "build")
    .slice().sort((a, b) => (a.k === "build" ? 1 : 0) - (b.k === "build" ? 1 : 0) || (b.u ? 1 : 0) - (a.u ? 1 : 0) || a.n.localeCompare(b.n));
  return (
    <Fragment>
      <TabTitle title="Crafting" sub="Your recipe book and builds. Cook a recipe once to unlock it. Ticks show what your Backpack already has." />
      <div className="chips" style={{ marginBottom: 16 }}>
        <div className="kpi"><span className="lbl">Recipes unlocked</span><b>{unlocked} of {meals.length}</b></div>
        <div className="kpi"><span className="lbl">Ready to cook now</span><b>{ready}</b><small>every required ingredient in stock</small></div>
        <div className="kpi"><span className="lbl">Builds</span><b>{builds}</b></div>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        <div className="seg" role="group" aria-label="Recipe filter">
          {[["all", "All"], ["cooked", "Unlocked"], ["totry", "Not cooked yet"], ["build", "Builds"]].map((x) => <button key={x[0]} type="button" className={crf === x[0] ? "on" : ""} onClick={() => setCrf(x[0])}>{x[1]}</button>)}
        </div>
      </div>
      <div className="rgrid">
        {list.map((r) => <RecipeCard key={r.id} r={r} recipes={view.recipes} inv={view.inv} />)}
      </div>
      {list.length === 0 ? <div className="sub" style={{ textAlign: "center" }}>No recipes in this filter.</div> : null}
    </Fragment>
  );
}

function RecipeCard({ r, recipes, inv }: { r: RecipeView; recipes: RecipeView[]; inv: InvItem[] }) {
  const miss = r.k === "build" ? [] : r.m.filter((m) => !m[3] && !haveMat(inv, m[2] || m[0]));
  const parent = r.pa ? recipes.find((x) => x.id === r.pa) : undefined;
  return (
    <div className={"rcard" + (r.k === "meal" && !r.u ? " locked" : "")}>
      <div className="rimg" style={{ background: r.k === "build" ? "linear-gradient(135deg,#d7ebe7,#b9dad3)" : r.u ? "linear-gradient(135deg,#fbe3b5,#f3c98a)" : "linear-gradient(135deg,#efe9dc,#ddd5c4)" }}>
        <span aria-hidden="true" style={{ filter: r.k === "meal" && !r.u ? "grayscale(.6)" : undefined }}>{recipeEmoji(r.n, r.k)}</span>
        {r.ph ? <small>Photo stays with the old export</small> : null}
      </div>
      <div className="rbody">
        <div className="lbl">{r.k === "build" ? "Build" : "Meal"}{r.y ? " · " + r.y : ""}</div>
        <div className="t" style={{ fontSize: 18 }}>{r.n}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {r.k === "build" ? <Tag text={"built " + (r.bu ? pShort(r.bu) : "")} col={C.good} /> : r.u ? <Tag text={"unlocked " + pShort(r.u)} col={C.good} /> : <Tag text="not cooked yet" col={C.muted} />}
          {r.k === "meal" ? (miss.length ? <Tag text={"missing " + miss.length} col={C.bad} /> : <Tag text="ready to cook" col={C.teal} />) : null}
          {r.ti ? <Tag text={"tier " + r.ti} col="#6b4fa8" /> : null}
        </div>
        {r.mac ? <div className="sub num">{r.mac[0]} kcal · {r.mac[1]} g protein · {r.mac[2]} g carbs · {r.mac[3]} g fat <span>(per {r.mac[4]})</span></div> : null}
        {r.sk ? <div className="sub">Skill: {r.sk}{parent ? " · branches from " + parent.n : ""}</div> : null}
        <details className="plain">
          <summary>{r.k === "build" ? "Show the build" : "Show the recipe"}</summary>
          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            <div>
              <div className="lbl">{r.k === "build" ? "Parts" : "Ingredients"}</div>
              <ul className="mats">{r.m.map((m, i) => {
                const h = r.k === "build" ? false : haveMat(inv, m[2] || m[0]);
                return <li key={i}><span style={{ color: r.k === "build" ? C.muted : h ? C.good : m[3] ? C.muted : C.bad, fontWeight: 700 }}>{r.k === "build" ? "·" : h ? "✓" : m[3] ? "·" : "✗"}</span><span>{m[0]}{m[3] ? <span className="sub"> (optional)</span> : null}</span><span className="sub">{m[1]}</span></li>;
              })}</ul>
            </div>
            <div><div className="lbl">Steps</div><ol className="steps">{r.s.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
            {r.t.length ? <div className="sub"><b>Tools:</b> {r.t.join(", ")}</div> : null}
            {r.no ? <div style={{ borderLeft: "3px solid " + C.amber, paddingLeft: 10, fontSize: 15 }}>{r.no}</div> : null}
            {r.v ? <div><div className="lbl">Variations</div>{r.v.map((v) => <div key={v[0]} style={{ fontSize: 15, marginTop: 4 }}><b>{v[0]}</b>: {v[1]} <span className="sub">{v[2]}</span></div>)}</div> : null}
            {r.lc ? <div className="sub">Last cooked {dayLabel(r.lc)}</div> : null}
          </div>
        </details>
      </div>
    </div>
  );
}

function Backpack({ view, actions }: { view: JournalView; actions: JournalActions }) {
  const [hideOut, setHideOut] = useState(true);
  const inv = view.inv;
  const outItems = inv.filter((i) => i.f === "out");
  const expiring = inv.filter((i) => i.f === "expired" || (i.by && i.q !== 0 && daysTo(i.by, view.today) <= 3));
  const fmtQ = (i: InvItem) => (i.q == null ? "" : i.q + (i.u ? " " + i.u : ""));
  const cats = Array.from(new Set([...INV_CATS, ...inv.map((i) => i.cat)]));
  return (
    <Fragment>
      <TabTitle title="Backpack" sub="What's in your kitchen, supplements and gear, with anything past its date flagged." />
      <Panel id="sec-items" tint title="Bonus items" sub="Rewards from cleared quests. Tell Chamwei when you want to spend one.">
        <div className="grid">
          <div><div className="t">🔥 XP boost × {view.bag.ember}</div><div className="sub">Use one and the next quest you clear gives 50% more XP.</div></div>
          <div><div className="t">⏳ Hourglass × {view.bag.hourglass}</div><div className="sub">Adds 2 days to an active quest's deadline.</div></div>
          <div><div className="t">🎲 Oracle reroll × {view.bag.reroll}</div><div className="sub">Swaps today's offered quests for a fresh set.</div></div>
        </div>
      </Panel>
      <div className="chips" style={{ marginBottom: 16 }}>
        <div className="kpi"><span className="lbl">In stock</span><b>{inv.length - outItems.length}</b></div>
        <div className="kpi"><span className="lbl">Past date or use soon</span><b style={{ color: expiring.length ? C.bad : C.good }}>{expiring.length}</b><small>{expiring.map((i) => i.n).slice(0, 4).join(", ")}</small></div>
        <div className="kpi"><span className="lbl">Used up</span><b>{outItems.length}</b></div>
      </div>
      <Panel title="Update your stock" sub="Use − and + for counted items, and Ran out when something's gone. Recipes on Crafting follow along.">
        <div className="chips">
          <button type="button" className={"btn" + (hideOut ? "" : " on")} onClick={() => setHideOut(!hideOut)}>{hideOut ? "Show used-up items too" : "Hiding nothing · tap to hide used-up"}</button>
          {actions.phase === "saved" ? <span className="ok">Saved</span> : null}
        </div>
      </Panel>
      <div className="grid">
        {cats.map((cat) => {
          const items = inv.filter((i) => i.cat === cat && (!hideOut || i.f !== "out")).slice().sort((a, b) => (a.by || "9").localeCompare(b.by || "9") || a.n.localeCompare(b.n));
          if (!items.length) return null;
          return (
            <Panel key={cat} title={cat} sub={items.length + " items"}>
              {items.map((i) => {
                const left = i.by ? daysTo(i.by, view.today) : null;
                const out = i.f === "out";
                return (
                  <div key={i.id} className="inv" style={{ opacity: out ? 0.7 : 1 }}>
                    <span style={{ flex: "1 1 150px" }}>
                      {i.n}{" "}
                      {i.f === "expired" ? <Tag text="past date" col={C.bad} /> : null}
                      {i.f !== "expired" && left !== null && left <= 4 && i.q !== 0 ? <Tag text={"use by " + pShort(i.by || "")} col={C.amberTx} /> : null}
                      {out ? <Tag text="used up" col={C.muted} /> : null}
                      <span className="sub num"> {fmtQ(i)}</span>
                    </span>
                    <span style={{ display: "flex", gap: 6 }}>
                      {typeof i.q === "number" ? (
                        <Fragment>
                          <button type="button" className="ib" aria-label={"One less " + i.n} disabled={!i.q} onClick={() => { const nq = Math.max(0, Math.round((i.q! - 1) * 100) / 100); actions.adjustItem(i.id, nq, nq === 0 ? "out" : i.f === "out" ? null : i.f); }}>−</button>
                          <button type="button" className="ib" aria-label={"One more " + i.n} onClick={() => actions.adjustItem(i.id, Math.round(((i.q || 0) + 1) * 100) / 100, i.f === "out" ? null : i.f)}>+</button>
                        </Fragment>
                      ) : null}
                      {out
                        ? <button type="button" className="ib" onClick={() => actions.adjustItem(i.id, 1, null)}>Got more</button>
                        : <button type="button" className="ib warn" onClick={() => actions.adjustItem(i.id, typeof i.q === "number" ? 0 : i.q, "out")}>Ran out</button>}
                    </span>
                  </div>
                );
              })}
            </Panel>
          );
        })}
      </div>
    </Fragment>
  );
}

function Ledger({ view }: { view: JournalView }) {
  const L = view.ledger;
  const periods = L.periods;
  const [lm, setLm] = useState(periods[periods.length - 1]?.p || "");
  const years = Object.keys(L.give).sort().reverse();
  const [gy, setGy] = useState(years[0] || "");
  const cur = periods.find((m) => m.p === lm) || periods[periods.length - 1];
  const lastFull = periods.filter((m) => m.end).slice(-1)[0];
  const cats = (cur && L.pcats[cur.p]) || [];
  const catMax = Math.max(1, ...cats.map((c) => c[1]));
  const give = L.give[gy] || [];
  const giveTot = give.reduce((t, g) => t + g[1], 0);
  const credit = Math.min(giveTot, 1e7) * 0.15 + Math.max(0, giveTot - 1e7) * 0.3;
  const ytdInc = periods.reduce((t, m) => t + m.inc, 0);
  const ytdOut = periods.reduce((t, m) => t + m.out, 0);
  const ytdGive = periods.reduce((t, m) => t + m.give, 0);
  const recent = L.recent.slice(0, 30);
  const target = view.settings.savingsTargetPct;
  const redirectAmount = view.settings.redirectAmountKRW;
  if (!cur) return <Fragment><TabTitle title="Ledger" sub="Money in and out, measured payday to payday." /><Panel><div className="sub">No pay periods on file.</div></Panel></Fragment>;
  return (
    <Fragment>
      <TabTitle title="Ledger" sub={target == null ? "Money in and out, measured payday to payday." : "Money in and out, measured payday to payday, against your " + target + "% savings target."} />
      <Panel title={"Pay period · " + pLong(cur)} sub="Pick a pay period to see where the money went.">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <select value={lm} onChange={(e) => setLm(e.target.value)} aria-label="Pay period">
            {periods.slice().reverse().map((m) => <option key={m.p} value={m.p}>{pLong(m)}</option>)}
          </select>
        </div>
        <div className="chips">
          <div className="kpi"><span className="lbl">Income</span><b>{won(cur.inc)}</b></div>
          <div className="kpi"><span className="lbl">Spending</span><b>{won(cur.out)}</b></div>
          <div className="kpi"><span className="lbl">Saved</span><b style={{ color: cur.rate == null || target == null ? C.muted : cur.rate * 100 >= target ? C.good : C.bad }}>{cur.rate == null ? "–" : Math.round(cur.rate * 1000) / 10 + "%"}</b><small>{target == null ? "No target set" : "target " + target + "%" + (cur.end ? "" : ", so far this period")}</small></div>
          <div className="kpi"><span className="lbl">Donated</span><b>{won(cur.give)}</b></div>
          <div className="kpi"><span className="lbl">Sent to invest</span><b>{won(cur.inv)}</b></div>
        </div>
        {!cur.end && lastFull ? <div className="sub" style={{ marginTop: 10, textAlign: "center" }}>This period is still open. Last full period, {pLong(lastFull)}: {lastFull.rate == null ? "–" : Math.round(lastFull.rate * 1000) / 10 + "%"}.</div> : null}
        <div style={{ marginTop: 16 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>Where it went</div>
          {cats.length === 0 ? <div className="sub">No category split for this period.</div> : cats.map((c) => (
            <div key={c[0]} className="catrow">
              <span style={{ fontSize: 15 }}>{c[0]}</span>
              <div className="cb"><Bar v={c[1]} max={catMax} col={FIN_COL[c[0]] || C.muted} /></div>
              <span className="num ca" style={{ fontSize: 15 }}>{won(c[1])}</span>
            </div>
          ))}
        </div>
        {L.pmerch[cur.p] ? <div style={{ marginTop: 14 }}><div className="lbl" style={{ marginBottom: 6 }}>Top payees</div><div className="chips" style={{ justifyContent: "flex-start" }}>{L.pmerch[cur.p].map((x) => <span key={x[0]} className="tag" style={{ color: C.tealDk }}>{x[0]} · {wonK(x[1])}</span>)}</div></div> : null}
      </Panel>
      <Panel title="Pay periods" sub={target == null ? "Income versus spending. Set a savings target in Settings to color these bars." : "Income versus spending. Saved % sits under each period. Green is at or above " + target + "%."}>
        <div className="chips" style={{ marginBottom: 6, fontSize: 14 }}><span style={{ color: C.teal, fontWeight: 600 }}>■ Income</span><span style={{ color: "#c0643c", fontWeight: 600 }}>■ Spending</span></div>
        <div className="scroll"><div style={{ minWidth: 520 }}><PeriodBars periods={periods} target={target} /></div></div>
        {ytdInc ? (
          <div className="chips" style={{ marginTop: 10 }}>
            <div className="kpi"><span className="lbl">Income on file</span><b>{wonK(ytdInc)}</b></div>
            <div className="kpi"><span className="lbl">Spending on file</span><b>{wonK(ytdOut)}</b></div>
            <div className="kpi"><span className="lbl">Saved on file</span><b>{Math.round(((ytdInc - ytdOut - ytdGive) / ytdInc) * 1000) / 10}%</b></div>
          </div>
        ) : null}
        <details style={{ marginTop: 8 }}>
          <summary>Period by period</summary>
          <div className="scroll"><table><thead><tr><th>Pay period</th><th className="r">In</th><th className="r">Out</th><th className="r">Given</th><th className="r">Invested</th><th className="r">Saved</th></tr></thead>
            <tbody>{periods.slice().reverse().map((m) => <tr key={m.p}><td>{pLong(m)}{!m.end ? " *" : ""}</td><td className="r">{won(m.inc)}</td><td className="r">{won(m.out)}</td><td className="r">{won(m.give)}</td><td className="r">{m.inv ? won(m.inv) : "–"}</td><td className="r" style={{ color: m.rate == null || target == null ? C.muted : m.rate * 100 >= target ? C.good : C.bad }}>{m.rate == null ? "–" : Math.round(m.rate * 100) + "%"}</td></tr>)}</tbody>
          </table></div>
          <div className="sub">* In progress. Saved is income minus spending minus donations, from one salary deposit to the next.</div>
        </details>
      </Panel>
      <div className="grid2">
        <Panel title={"Donations" + (gy ? " · " + gy : "")} sub="Gifts tagged as donations, with a rough year-end tax credit.">
          <div className="chips" style={{ marginBottom: 10 }}>
            {years.length ? <div className="seg">{years.map((y) => <button key={y} type="button" className={gy === y ? "on" : ""} onClick={() => setGy(y)}>{y}</button>)}</div> : null}
            <span className="num" style={{ color: C.tealDk, fontSize: 18, fontWeight: 700 }}>{won(giveTot)}</span>
          </div>
          {give.map((g) => (
            <div key={g[0]} className="catrow">
              <span style={{ fontSize: 15 }}>{g[0]}</span>
              <div className="cb"><Bar v={g[1]} max={give[0]?.[1] || 1} col={FIN_COL.Donations} /></div>
              <span className="num ca" style={{ fontSize: 15 }}>{won(g[1])} <span className="sub">{g[2]}×</span></span>
            </div>
          ))}
          {giveTot ? <div style={{ borderLeft: "3px solid " + FIN_COL.Donations, paddingLeft: 10, marginTop: 12, fontSize: 15 }}>On Korea's regular system, about <b className="num">{won(credit * 1.1)}</b> could come back at year-end settlement ({won(credit)} credit plus 10% local tax). On the 19% flat rate, donation credits don't apply.</div> : <div className="sub">No donations tagged for this year.</div>}
        </Panel>
        <Panel title="Redirect the Gift" sub="The monthly amount from Settings.">
          {redirectAmount == null ? <div className="sub" style={{ textAlign: "center" }}>No amount set.</div> : <div className="serif" style={{ textAlign: "center", fontSize: 28, color: C.tealDk }}>{won(redirectAmount)} <span className="sub">a month</span></div>}
        </Panel>
      </div>
      <Panel title="Recent transactions" sub={L.rows ? "The latest " + recent.length + " of " + L.rows.toLocaleString() + " transactions on file." : "Latest transactions on file."}>
        <div className="scroll" style={{ maxHeight: 440, overflowY: "auto" }}><table><thead><tr><th>Date</th><th>Payee</th><th>Category</th><th className="r">Amount</th></tr></thead>
          <tbody>{recent.map((r, i) => <tr key={i}><td className="num nw">{r.d ? dayLabel(r.d) : ""}</td><td>{r.w}</td><td><span style={{ color: FIN_COL[r.c] || C.muted }}>●</span> {r.c}</td><td className="r" style={{ color: r.a < 0 ? C.good : C.ink }}>{r.a < 0 ? "+" + won(-r.a) : won(r.a)}</td></tr>)}</tbody>
        </table></div>
      </Panel>
    </Fragment>
  );
}

function SettingsPanel({ view, actions }: { view: JournalView; actions: JournalActions }) {
  const s = view.settings;
  const [start, setStart] = useState(s.shift?.start || "");
  const [end, setEnd] = useState(s.shift?.end || "");
  const [days, setDays] = useState<number[]>(s.shift?.days || []);
  const [pct, setPct] = useState(s.savingsTargetPct == null ? "" : String(s.savingsTargetPct));
  const [amount, setAmount] = useState(s.redirectAmountKRW == null ? "" : String(s.redirectAmountKRW));
  const [formError, setFormError] = useState("");

  const toggleDay = (n: number) => setDays((cur) => cur.includes(n) ? cur.filter((d) => d !== n) : cur.concat(n).sort((a, b) => a - b));

  const save = () => {
    const next: SettingsInput = {};
    const hasStart = start.trim() !== "";
    const hasEnd = end.trim() !== "";
    if (hasStart || hasEnd || days.length) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)) {
        setFormError("Shift times need to be HH:MM, or leave both blank.");
        return;
      }
      next.shift = { start, end, days };
    }
    if (pct.trim() !== "") {
      const n = Number(pct);
      if (!Number.isFinite(n)) { setFormError("Savings target needs to be a number, or blank."); return; }
      next.savingsTargetPct = n;
    }
    if (amount.trim() !== "") {
      const n = Number(amount);
      if (!Number.isFinite(n)) { setFormError("Redirect amount needs to be a number, or blank."); return; }
      next.redirectGift = { amountKRW: n };
    }
    setFormError("");
    actions.saveSettings(next);
  };

  return (
    <Panel id="settings" title="Settings" sub="Saved to your journal. Blank fields stay unset.">
      <div style={{ display: "grid", gap: 12, maxWidth: 560, margin: "0 auto" }}>
        <div>
          <div className="lbl">Shift hours</div>
          <div className="chips" style={{ justifyContent: "flex-start", marginTop: 6 }}>
            <label className="sub">Start <input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Shift start" style={{ width: "auto" }} /></label>
            <label className="sub">End <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Shift end" style={{ width: "auto" }} /></label>
          </div>
          <div className="daysel" style={{ marginTop: 8 }} role="group" aria-label="Shift days">
            {WEEKDAYS.map((name, i) => {
              const n = i + 1;
              const on = days.includes(n);
              return <button key={name} type="button" className={"btn sm" + (on ? " on" : "")} aria-pressed={on} onClick={() => toggleDay(n)}>{name}</button>;
            })}
          </div>
        </div>
        <label className="sub">Savings target %
          <input type="text" inputMode="decimal" placeholder="Not set" value={pct} onChange={(e) => setPct(e.target.value)} aria-label="Savings target percent" />
        </label>
        <label className="sub">Redirect the Gift (KRW per month)
          <input type="text" inputMode="numeric" placeholder="Not set" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Redirect amount in KRW" />
        </label>
        {formError ? <div className="err" role="alert">{formError}</div> : null}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="button" className="btn primary" onClick={save}>Save settings</button>
          {actions.phase === "saved" ? <span className="ok">Saved</span> : null}
        </div>
      </div>
    </Panel>
  );
}

function Character({ view, actions }: { view: JournalView; actions: JournalActions }) {
  const ch = view.char;
  const counts = ch.nodeCounts;
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Fragment>
      <TabTitle title="Character" sub="Your level, class, aspects, base rooms and skill web." />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "-8px 0 12px" }}>
        <button type="button" className="btn sm" aria-label="Settings" onClick={() => setSettingsOpen((v) => !v)}>⚙ Settings</button>
      </div>
      {settingsOpen ? <SettingsPanel view={view} actions={actions} /> : null}
      <div className="grid2">
        <Panel id="sec-level" title="Level & class" sub="XP comes from cleared quests. A level is 250 XP.">
          <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <Ring into={ch.into} max={250} label={String(ch.lvl)} />
            <div>
              <div className="num" style={{ fontSize: 19, color: C.tealDk, fontWeight: 700 }}>{ch.total.toLocaleString()} XP · {Math.max(0, 250 - ch.into)} to Lv {ch.lvl + 1}</div>
              <div className="sub">{ch.earned.toLocaleString()} earned − {ch.spent} spent reviving missed quests</div>
            </div>
          </div>
          <div id="sec-class" className="anchor" style={{ marginTop: 16, textAlign: "center" }}>
            <div className="lbl">Earned class</div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 700, color: C.amberTx }}>{ch.cls.name}</div>
            {ch.cls.why ? <div className="sub">{ch.cls.why}</div> : null}
          </div>
          {ch.aspiration ? (
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <div className="lbl">Aspiration</div>
              <div className="t">{ch.aspiration}</div>
              {ch.aspDesc ? <div className="sub">{ch.aspDesc}</div> : null}
            </div>
          ) : null}
        </Panel>
        <Panel title="Aspects" sub="Points come from cleared quests and unlocked skills.">
          <Radar aspects={ch.aspects} />
          {ch.aspects.length ? (
            <table><thead><tr><th>Aspect</th><th>Class</th><th className="r">Points</th><th className="r">Lv</th><th>To next</th></tr></thead>
              <tbody>{ch.aspects.map((a) => <tr key={a.name}><td style={{ color: a.col, fontWeight: 700 }}>{a.name}</td><td>{a.cls}</td><td className="r">{a.pts}</td><td className="r">{a.lvl}</td><td style={{ minWidth: 90 }}><Bar v={a.into} max={150} col={a.col} /></td></tr>)}</tbody>
            </table>
          ) : null}
        </Panel>
      </div>
      <Panel id="skill-web" title="Skill web" sub={counts.un + " unlocked · " + counts.av + " open to try · " + (counts.gh + counts.hid) + " still hidden. Rings run from now, on the inside, to about six months. The web starts fitted to the screen."}>
        <SkillWeb web={view.web} />
        {ch.branches.length ? (
          <details style={{ marginTop: 12 }}>
            <summary>Branch-by-branch list</summary>
            <div className="grid" style={{ marginTop: 8 }}>
              {ch.branches.map((b) => (
                <div key={b.name} style={{ borderLeft: "4px solid " + b.col, paddingLeft: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span className="serif" style={{ color: C.tealDk, fontSize: 19, fontWeight: 700 }}>{b.name}</span><span className="sub num">{b.un.length} ✓ · {b.av} open · {b.gh + b.hid} hidden</span></div>
                  <div className="sub">{branchLine(b)}</div>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </Panel>
      {ch.rooms.length ? (
        <Panel title="Base rooms" sub="Each quest giver lives in a room. The room levels up every 200 XP from that giver.">
          <div className="grid">
            {ch.rooms.map((r) => (
              <div key={r.name} style={{ background: C.card2, border: "1px solid " + C.line, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="t">{r.icon} {r.name}</span><span className="num" style={{ color: C.tealDk, fontWeight: 700 }}>Lv {r.lvl}</span></div>
                <div className="sub" style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 8px" }}><Sigil g={r.giver} size={16} /> {giverName(r.giver)} lives here · {r.xp} XP</div>
                <Bar v={r.into} max={200} col={GIVERS[r.giver]?.c || C.teal} />
                <div className="sub num" style={{ fontSize: 13, marginTop: 2 }}>{r.into}/200 to Lv {r.lvl + 1}</div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
      <div className="grid2">
        {ch.inbody ? (
          <Panel title="InBody" sub={typeof ch.inbody.date === "string" ? "Scan of " + dayLabel(String(ch.inbody.date)) : "Latest scan"}>
            <div className="chips">
              {([["Weight", "weight", " kg"], ["Muscle (SMM)", "smm", " kg"], ["Body fat", "bf", "%"], ["Score", "score", ""], ["BMR", "bmr", " kcal"]] as const).map((k) => {
                const v = Number(ch.inbody?.[k[1]]);
                const p = Number(ch.inbodyPrev?.[k[1]]);
                const d = Number.isFinite(v) && Number.isFinite(p) ? v - p : null;
                return <div key={k[0]} className="kpi"><span className="lbl">{k[0]}</span><b>{Number.isFinite(v) ? v : "–"}{k[2]}</b>{d != null ? <small>{d >= 0 ? "+" : "−"}{Math.abs(Math.round(d * 10) / 10)} since last scan</small> : null}</div>;
              })}
            </div>
          </Panel>
        ) : null}
        {ch.moves.length ? (
          <Panel title="Best lifts" sub="From your training log.">
            <table><tbody>{ch.moves.map((m) => <tr key={m[0]}><td>{m[0]}</td><td className="r">{m[1]} kg × {m[2]}</td><td className="r sub">{m[3] ? dayLabel(m[3]) : ""}</td></tr>)}</tbody></table>
          </Panel>
        ) : null}
      </div>
    </Fragment>
  );
}

function World({ view }: { view: JournalView }) {
  const iconFor = (cat: string) => cat === "home" ? "🏠" : cat === "work" ? "📰" : cat === "gym" ? "🏋️" : "📍";
  return (
    <Fragment>
      <TabTitle title="World" sub="The places your quests attach to." />
      <Panel title="Pinned places" sub="The map itself isn't drawn here. This is the short list.">
        {view.pins.map((p) => (
          <div key={p.id} className="row">
            <span style={{ fontSize: 22 }}>{iconFor(p.cat)}</span>
            <div><div className="t">{p.n}</div><div className="sub">{p.note || p.cat}</div></div>
          </div>
        ))}
        {view.pins.length === 0 ? <div className="sub">No places pinned yet.</div> : null}
      </Panel>
    </Fragment>
  );
}
