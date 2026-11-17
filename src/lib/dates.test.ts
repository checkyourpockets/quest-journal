import { describe, expect, it } from "vitest";
import { dueDay, kstToday } from "./dates";

describe("Korea's date", () => {
  it("follows KST across midnight without using the device zone", () => {
    const real = Date.now;
    try {
      Date.now = () => Date.parse("2026-11-16T14:30:00.000Z");
      expect(kstToday()).toBe("2026-11-16");
      Date.now = () => Date.parse("2026-11-16T15:30:00.000Z");
      expect(kstToday()).toBe("2026-11-17");
    } finally {
      Date.now = real;
    }
  });

  it("reads a due instant as its calendar day", () => {
    expect(dueDay("2026-11-17T23:30:00.000Z")).toBe("2026-11-17");
    expect(dueDay("2026-11-17")).toBe("2026-11-17");
    expect(dueDay("")).toBeNull();
    expect(dueDay(null)).toBeNull();
  });
});
