export type Grade = "again" | "hard" | "good" | "easy";

export type Srs = {
  due: string;
  ease: number;
  ivl: number;
  lapses: number;
  last: string | null;
  reps: number;
};

export function blankSrs(today: string): Srs {
  return { due: today, ease: 2.5, ivl: 0, lapses: 0, last: null, reps: 0 };
}

/** SM-2 style scheduling. Again comes back tomorrow; Good and Easy push the due date out. */
export function schedule(prev: Partial<Srs> | null | undefined, grade: Grade, today: string): Srs {
  let ease = typeof prev?.ease === "number" ? prev.ease : 2.5;
  let ivl = typeof prev?.ivl === "number" ? prev.ivl : 0;
  let reps = typeof prev?.reps === "number" ? prev.reps : 0;
  let lapses = typeof prev?.lapses === "number" ? prev.lapses : 0;

  if (grade === "again") {
    lapses += 1;
    reps = 0;
    ivl = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    if (reps === 0) ivl = 1;
    else if (reps === 1) ivl = 6;
    else ivl = Math.max(1, Math.round(ivl * ease));
    reps += 1;
    if (grade === "hard") {
      ease = Math.max(1.3, ease - 0.15);
      ivl = Math.max(1, Math.round(ivl * 1.2));
    } else if (grade === "easy") {
      ease = ease + 0.15;
      ivl = Math.max(1, Math.round(ivl * 1.3));
    }
  }

  const due = addUtcDays(today, ivl);
  return { due, ease: Math.round(ease * 100) / 100, ivl, lapses, last: today, reps };
}

function addUtcDays(iso: string, days: number): string {
  const t = new Date(iso.slice(0, 10) + "T00:00:00Z").getTime() + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}
