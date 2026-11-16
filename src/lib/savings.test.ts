import { describe, expect, it } from "vitest";
import { combinedSavings, usdFlow } from "./savings";

describe("usd savings", () => {
  it("counts money set aside as saved and leaves transfers and gifts out", () => {
    const flow = usdFlow([
      { toInvest: 100, spend: 40, fromKorea: 500, gifts: 25 },
      { toInvest: 50, spend: 10 },
    ]);
    expect(flow.saved).toBe(150);
    expect(flow.spend).toBe(50);
    expect(flow.rate).toBeCloseTo(0.75);
  });

  it("hides the combined rate until a USD to KRW rate is set", () => {
    const base = { krwIncome: 1000, krwSaved: 400, usdSaved: 10, usdSpend: 10, usdKrw: null as number | null };
    expect(combinedSavings(base)).toBeNull();
    const combined = combinedSavings({ ...base, usdKrw: 1000 });
    expect(combined?.savedKrw).toBe(400 + 10 * 1000);
    expect(combined?.baseKrw).toBe(1000 + 20 * 1000);
    expect(combined?.rate).toBeCloseTo(10400 / 21000);
  });
});
