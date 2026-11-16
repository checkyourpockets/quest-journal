import { useMemo, useState } from "react";
import { C, SANS, SERIF } from "./constants";
import { dayLabel } from "../lib/dates";
import type { WebData, WebNode } from "./model";

const WC = 600;
const RING_L = ["now", "next", "~1 month", "~3 months", "~6 months"];

export function SkillWeb({ web }: { web: WebData | null }) {
  const [sel, setSel] = useState<string>("");
  const [br, setBr] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const nodes = web?.nodes ?? [];
  const badges = web?.badges ?? [];
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  if (!web) return <div className="sub" style={{ textAlign: "center" }}>The skill web hasn't loaded yet.</div>;

  const colOf = (key: string) => badges.find((b) => b.k === key)?.col || C.teal;
  const inBr = (n: WebNode) => !br || n.br.includes(br);
  const hidden = (st: string) => st === "gh" || st === "hid";
  const counts = {
    u: nodes.filter((n) => n.st === "un").length,
    a: nodes.filter((n) => n.st === "av").length,
    g: nodes.filter((n) => hidden(n.st)).length,
  };
  const sn = sel ? byId.get(sel) : undefined;
  const leads = sn ? nodes.filter((n) => n.pre.includes(sn.id) && !hidden(n.st)) : [];
  const lab = (s: string) => (s.length > 24 ? s.slice(0, 23) + "…" : s);
  const rings = web.rings.filter((r) => r < (web.RB || 600) + 20);

  return (
    <div>
      <div className="chips" style={{ marginBottom: 10 }}>
        <select value={br} onChange={(e) => { setBr(e.target.value); setSel(""); }} aria-label="Filter the web by branch">
          <option value="">All {badges.length || 17} branches</option>
          {badges.map((b) => <option key={b.k} value={b.k}>{b.l}</option>)}
        </select>
        <div className="seg" role="group" aria-label="Zoom">
          <button type="button" onClick={() => setZoom(Math.max(1, zoom - 0.5))} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => setZoom(Math.min(3, zoom + 0.5))} aria-label="Zoom in">+</button>
        </div>
        <span className="sub"><span style={{ color: C.amberTx }}>●</span> {counts.u} unlocked · <span style={{ color: C.teal }}>○</span> {counts.a} open · ? {counts.g} hidden</span>
      </div>
      <div className="webbox">
        <svg viewBox="-70 -70 1340 1340" style={{ width: zoom * 100 + "%", minWidth: zoom * 100 + "%" }} role="group" aria-label="Skill web">
          {rings.map((r, i) => (
            <g key={r}>
              <circle cx={WC} cy={WC} r={r} fill="none" stroke="#d8cfbd" strokeDasharray="3 7" />
              <text x={WC + 6} y={WC - r + 18} fontSize="15" fill="#8a8475" style={{ fontFamily: SANS }}>{RING_L[i] || ""}</text>
            </g>
          ))}
          {badges.map((b) => (
            <line key={b.k} x1={WC} y1={WC} x2={b.x} y2={b.y} stroke={b.col} strokeOpacity={!br || br === b.k ? 0.28 : 0.08} strokeWidth="2" />
          ))}
          {nodes.map((n) => {
            const parents = n.pre.length ? n.pre : [""];
            return parents.map((p) => {
              const parent = p ? byId.get(p) : undefined;
              const a = parent ? [parent.x, parent.y] : [WC, WC];
              const lit = n.st === "un";
              const gh = hidden(n.st);
              const hot = !!br && inBr(n);
              const dim = !!br && !inBr(n);
              return <line key={n.id + "-" + p} x1={a[0]} y1={a[1]} x2={n.x} y2={n.y} stroke={hot ? colOf(n.br[0] || "") : lit ? C.gold : "#b9b1a2"} strokeWidth={hot ? 3.5 : lit ? 2.6 : 1.4} strokeOpacity={dim ? 0.12 : gh ? 0.4 : 0.85} strokeDasharray={gh ? "4 5" : undefined} />;
            });
          })}
          <circle cx={WC} cy={WC} r="32" fill={C.teal} stroke={C.gold} strokeWidth="3" />
          <text x={WC} y={WC + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" style={{ fontFamily: SERIF }}>YOU</text>
          {nodes.map((n) => {
            const dim = !!br && !inBr(n);
            const on = sel === n.id;
            const c = colOf(n.br[0] || "");
            if (hidden(n.st)) {
              return (
                <g key={n.id} className="snode" opacity={dim ? 0.15 : n.st === "hid" ? 0.45 : 0.8} onClick={() => setSel(on ? "" : n.id)} role="button" aria-label="Hidden skill">
                  <circle cx={n.x} cy={n.y} r={on ? 14 : 11} fill="#fff" stroke={on ? C.teal : "#a39b8b"} strokeWidth={on ? 3 : 1.5} strokeDasharray="2 3" />
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fill="#8a8475">?</text>
                </g>
              );
            }
            return (
              <g key={n.id} className="snode" opacity={dim ? 0.18 : 1} onClick={() => setSel(on ? "" : n.id)} role="button" aria-label={n.name || "Skill"}>
                {on ? <circle cx={n.x} cy={n.y} r="27" fill="none" stroke={C.teal} strokeWidth="3" /> : null}
                <circle cx={n.x} cy={n.y} r="17" fill={n.st === "un" ? "#f0c36a" : "#fff"} stroke={c} strokeWidth={n.st === "av" ? 3.5 : 2.5} strokeDasharray={n.confirm ? "4 3" : undefined} />
                {n.st === "un" ? <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#5a3d06">✓</text> : null}
                {n.br.length > 1 ? <circle cx={n.x + 13} cy={n.y - 13} r="6" fill={colOf(n.br[1])} stroke="#fff" strokeWidth="1.5" /> : null}
                <text x={n.x} y={n.y + 34} textAnchor="middle" fontSize="13.5" fontWeight="600" fill="#2b3a3c" stroke="#fbf8f1" strokeWidth="4" paintOrder="stroke" style={{ fontFamily: SANS }}>{lab(n.name)}</text>
              </g>
            );
          })}
          {badges.map((b) => {
            const on = br === b.k;
            return (
              <g key={b.k} className="snode" onClick={() => { setBr(on ? "" : b.k); setSel(""); }} opacity={br && !on ? 0.45 : 1} role="button" aria-label={b.l}>
                <circle cx={b.x} cy={b.y} r={on ? 46 : 40} fill={on ? C.teal : "#fff"} stroke={b.col} strokeWidth={on ? 5 : 3} />
                <text x={b.x} y={b.y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={on ? "#fff" : "#2b3a3c"} style={{ fontFamily: SANS }}>{b.l}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="pn tint" style={{ marginTop: 12, marginBottom: 0 }}>
        {!sn ? <div className="sub" style={{ textAlign: "center" }}>Tap a skill to see what unlocks it. Tap a branch name on the rim (or use the menu) to light up one branch. Gold with a tick means unlocked. White means open to try now. A dashed question mark stays hidden until a neighbour unlocks. A dashed ring is a rehab step to check with your physio first.</div>
          : hidden(sn.st) ? (
            <div>
              <div className="lbl">Hidden skill · {sn.br.map((k) => badges.find((b) => b.k === k)?.l || k).join(" + ")}</div>
              <div className="t">Something lies this way</div>
              <div>Unlock {sn.pre.map((id) => byId.get(id)).filter((n) => n && n.st !== "un").map((n) => n && !hidden(n.st) ? n.name : "a hidden skill").join(" and ") || "its neighbour"} to reveal it.{sn.h ? " Rough horizon: " + sn.h + "." : ""}</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 4 }}>
              <div className="lbl">{sn.st === "un" ? "Unlocked" + (sn.un ? " " + dayLabel(sn.un) : "") : "Open to try now"} · {sn.br.map((k) => badges.find((b) => b.k === k)?.l || k).join(" + ")}{sn.st !== "un" && sn.h ? " · aim: " + sn.h : ""}</div>
              <div className="t">{sn.name}</div>
              {sn.crit ? <div><span className="lbl">To unlock: </span>{sn.crit}</div> : null}
              {sn.pre.length ? <div className="sub">Comes after: {sn.pre.map((id) => { const n = byId.get(id); if (!n || hidden(n.st)) return "a hidden skill"; return n.name || "a hidden skill"; }).join(", ")}</div> : <div className="sub">Starts from the centre of the web.</div>}
              {leads.length ? <div className="sub">Leads to: {leads.map((n) => n.name).filter(Boolean).join(", ")}</div> : null}
              {sn.confirm ? <div className="note">Rehab progression: confirm the threshold with your physio before chasing it.</div> : null}
            </div>
          )}
      </div>
    </div>
  );
}
