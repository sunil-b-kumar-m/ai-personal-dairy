import { describe, it, expect } from "vitest";
import { formatINR, formatDate, daysUntil } from "../utils/format";

describe("formatINR", () => {
  it("formats with Indian grouping", () => {
    expect(formatINR(12500000)).toBe("₹1,25,000");
  });

  it("formats lakhs", () => {
    expect(formatINR(100000000)).toBe("₹10,00,000");
  });

  it("formats crores", () => {
    expect(formatINR(1000000000)).toBe("₹1,00,00,000");
  });

  it("formats small amounts", () => {
    expect(formatINR(50000)).toBe("₹500");
  });

  it("formats zero", () => {
    expect(formatINR(0)).toBe("₹0");
  });

  it("handles string input (BigInt serialized)", () => {
    expect(formatINR("12500000")).toBe("₹1,25,000");
  });
});

describe("formatDate", () => {
  it("formats ISO date to DD MMM YYYY", () => {
    expect(formatDate("2026-04-02T00:00:00.000Z")).toBe("02 Apr 2026");
  });
});

describe("daysUntil", () => {
  it("returns 'Due today' for today's date", () => {
    const today = new Date().getDate();
    const result = daysUntil(today);
    expect(result.label).toBe("Due today");
  });
});
