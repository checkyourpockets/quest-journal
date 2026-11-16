export type UsdMonth = { toInvest: number; spend: number; fromKorea?: number; gifts?: number };

/** Saved is money set aside to invest. Spending is monthly.spend only. Transfers and gifts stay out of both. */
export function usdFlow(months: UsdMonth[]): { saved: number; spend: number; rate: number | null } {
  let saved = 0;
  let spend = 0;
  for (const month of months) {
    saved += month.toInvest;
    spend += month.spend;
  }
  const base = saved + spend;
  return { saved, spend, rate: base > 0 ? saved / base : null };
}

/** One rate across KRW pay and USD months. Null until a positive exchange rate is set. */
export function combinedSavings(input: {
  krwIncome: number;
  krwSaved: number;
  usdSaved: number;
  usdSpend: number;
  usdKrw: number | null;
}): { savedKrw: number; baseKrw: number; rate: number } | null {
  const fx = input.usdKrw;
  if (fx == null || !(fx > 0)) return null;
  const savedKrw = input.krwSaved + input.usdSaved * fx;
  const baseKrw = input.krwIncome + (input.usdSaved + input.usdSpend) * fx;
  if (!(baseKrw > 0)) return null;
  return { savedKrw, baseKrw, rate: savedKrw / baseKrw };
}
