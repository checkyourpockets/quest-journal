import type { ReactNode } from "react";
import { C, GIVERS, SERIF } from "./constants";
import { pLong, pShort, won } from "../lib/dates";
import type { BranchView, CharView, Period } from "./model";

export function icon(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /<(path|circle)([^>]*)\/>/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(src)) !== null) {
    const at: Record<string, string> = {};
    const ar = /(\w+)="([^"]*)"/g;
    let a: RegExpExecArray | null;
    while ((a = ar.exec(m[2])) !== null) at[a[1]] = a[2];
    out.push(m[1] === "path" ? <path key={k++} d={at.d} /> : <circle key={k++} cx={at.cx} cy={at.cy} r={at.r} />);
  }
  return out;
}

export function Sigil({ g, size = 28 }: { g: string; size?: number }) {
  const x = GIVERS[g];
  if (!x) {
    return (
      <span title={g} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flex: "0 0 auto", background: C.teal, borderRadius: 8, color: "#fff", fontSize: size * 0.45, fontWeight: 700 }}>
        {g.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span title={x.n} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flex: "0 0 auto", background: x.c, ...x.shape }}>
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{icon(x.ic)}</svg>
    </span>
  );
}

export function Checks({ p, label }: { p: number[]; label?: string }) {
  const boxes = Array.from({ length: p[1] }, (_, i) => i);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8, alignItems: "center" }} aria-label={p[0] + " of " + p[1] + " logged"}>
      {boxes.map((i) => (
        <span key={i} className="box" style={{ background: i < p[0] ? C.good : "transparent", borderColor: i < p[0] ? C.good : "#8a9a9b" }}>{i < p[0] ? "✓" : ""}</span>
      ))}
      <span className="sub num" style={{ marginLeft: 4 }}>{label || p[0] + " of " + p[1] + " logged this week"}</span>
    </div>
  );
}

export function Bar({ v, max, col }: { v: number; max: number; col: string }) {
  const w = Math.max(0, Math.min(100, max ? (v / max) * 100 : 0));
  return <div className="bar"><i style={{ width: w + "%", background: col }} /></div>;
}

export function Tag({ text, col }: { text: string; col: string }) {
  return <span className="tag" style={{ color: col }}><i style={{ background: col }} />{text}</span>;
}

export function Panel({ title, sub, children, tint, id }: { title?: string; sub?: string; children?: ReactNode; tint?: boolean; id?: string }) {
  return (
    <div id={id} className={"pn anchor" + (tint ? " tint" : "")}>
      {title ? <div className="ph"><h3>{title}</h3>{sub ? <p>{sub}</p> : null}</div> : null}
      {children}
    </div>
  );
}

export function TabTitle({ title, sub }: { title: string; sub: string }) {
  return <div className="tt"><h2>{title}</h2><p>{sub}</p><div className="rule" /></div>;
}

export function Ring({ into, max, label }: { into: number; max: number; label: string }) {
  const L = 2 * Math.PI * 27;
  const frac = max ? Math.max(0, Math.min(1, into / max)) : 0;
  return (
    <svg viewBox="0 0 64 64" width="92" height="92" aria-hidden="true">
      <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(15,110,110,.15)" strokeWidth="5" />
      <circle cx="32" cy="32" r="27" fill="none" stroke={C.amber} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${frac * L} ${L}`} transform="rotate(-90 32 32)" />
      <text x="32" y="39" textAnchor="middle" fontSize="21" fontWeight="700" fill={C.tealDk} style={{ fontFamily: SERIF }}>{label}</text>
    </svg>
  );
}

export function Radar({ aspects }: { aspects: CharView["aspects"] }) {
  if (aspects.length < 3) return <div className="sub" style={{ textAlign: "center" }}>Aspects appear once quests have been cleared.</div>;
  const cx = 150, cy = 140, R = 100;
  const maxL = Math.max(1, ...aspects.map((a) => a.lvl));
  const pt = (i: number, r: number) => {
    const t = ((i * (360 / aspects.length) - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  };
  const poly = aspects.map((a, i) => pt(i, 18 + (R - 18) * (a.lvl / maxL)).map((v) => v.toFixed(1)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 300 285" width="100%" style={{ maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="Aspect radar">
      {[0.33, 0.66, 1].map((f) => <polygon key={f} points={aspects.map((_, i) => pt(i, R * f).join(",")).join(" ")} fill="none" stroke={C.gold} strokeDasharray="3 3" strokeWidth="1" />)}
      <polygon points={poly} fill="rgba(15,110,110,.18)" stroke={C.teal} strokeWidth="2" />
      {aspects.map((a, i) => {
        const [x, y] = pt(i, R + 24);
        const [px, py] = pt(i, 18 + (R - 18) * (a.lvl / maxL));
        return (
          <g key={a.name}>
            <circle cx={px} cy={py} r="4" fill={a.col} />
            <text x={x} y={y - 2} textAnchor="middle" fontSize="14" fontWeight="700" fill={C.tealDk} style={{ fontFamily: SERIF }}>{a.name}</text>
            <text x={x} y={y + 12} textAnchor="middle" fontSize="10.5" fill={C.muted} style={{ fontFamily: SANS }}>{`Lv ${a.lvl} · ${a.pts}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

const SANS = "'Source Sans 3', sans-serif";

export function PeriodBars({ periods, target }: { periods: Period[]; target: number | null }) {
  if (!periods.length) return null;
  const hi = Math.max(1, ...periods.map((m) => Math.max(m.inc, m.out)));
  const W = 680, H = 150, bw = W / periods.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 42}`} width="100%" style={{ fontFamily: SANS }} role="img" aria-label="Income and spending by pay period">
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke="#e2d7c4" strokeWidth="1" />)}
      {periods.map((m, i) => {
        const x = i * bw;
        const h1 = (m.inc / hi) * H, h2 = (m.out / hi) * H;
        const rate = m.rate == null ? null : Math.round(m.rate * 100);
        return (
          <g key={m.p}>
            <rect x={x + bw * 0.14} y={H - h1} width={bw * 0.34} height={h1} rx="2" fill={C.teal}><title>{pLong(m)} income {won(m.inc)}</title></rect>
            <rect x={x + bw * 0.52} y={H - h2} width={bw * 0.34} height={h2} rx="2" fill="#d9825b"><title>{pLong(m)} spending {won(m.out)}</title></rect>
            <text x={x + bw / 2} y={H + 15} textAnchor="middle" fontSize="11.5" fill={C.muted}>{pShort(m.p)}</text>
            <text x={x + bw / 2} y={H + 32} textAnchor="middle" fontSize="12" fontWeight="700" fill={rate == null || target == null ? C.muted : rate >= target ? C.good : C.bad}>{rate == null ? "–" : rate + "%"}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function branchLine(b: BranchView): string {
  return b.un.length ? b.un.join(" · ") : "Nothing unlocked yet";
}
