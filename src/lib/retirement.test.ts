import { describe, it, expect } from "vitest";
import { computeTargetPortfolio } from "./retirement";

// Fix "today" reference for repeatable tests:
const T = 2025;

function round(n: number) {
  return Math.round(n);
}

describe("computeTargetPortfolio", () => {
  it("Target-year dollars: 80k in 2040, retire 2035, 3% inflation, 4% WR", () => {
    const r = computeTargetPortfolio({
      mode: "target",
      desiredIncome: 80000, // I_target at N
      withdrawalRatePct: 4,
      inflationPct: 3,
      todayYear: T,
      retirementYear: 2035, // R
      targetYear: 2040, // N
    });
    expect(round(r.year1Withdrawal)).toBeCloseTo(69009, 0);
    expect(round(r.portfolioNeeded)).toBeCloseTo(1725218, 0);
  });

  it("Today's dollars: 80k today, retire 2035, target 2040, 3% inflation, 4% WR", () => {
    const r = computeTargetPortfolio({
      mode: "today",
      desiredIncome: 80000, // I_today
      withdrawalRatePct: 4,
      inflationPct: 3,
      todayYear: T,
      retirementYear: 2035,
      targetYear: 2040,
    });
    expect(round(r.year1Withdrawal)).toBeCloseTo(107513, 0);
    expect(round(r.portfolioNeeded)).toBeCloseTo(2687833, 0);
    // target-year income shown for UI:
    expect(round(r.targetYearIncome)).toBeCloseTo(124637, 0);
  });

  it("Today's dollars invariance to target year (R fixed at 2060)", () => {
    const base = {
      mode: "today" as const,
      desiredIncome: 100000,
      withdrawalRatePct: 4,
      inflationPct: 3,
      todayYear: T,
      retirementYear: 2060,
    };
    const a = computeTargetPortfolio({ ...base, targetYear: 2070 });
    const b = computeTargetPortfolio({ ...base, targetYear: 2080 });
    expect(round(a.portfolioNeeded)).toBeCloseTo(round(b.portfolioNeeded), 0);
  });

  it("Target-year dollars: farther N lowers P_needed (more years discounted)", () => {
    const base = {
      mode: "target" as const,
      desiredIncome: 100000,
      withdrawalRatePct: 4,
      inflationPct: 3,
      todayYear: T,
      retirementYear: 2060,
    };
    const n2070 = computeTargetPortfolio({ ...base, targetYear: 2070 });
    const n2080 = computeTargetPortfolio({ ...base, targetYear: 2080 });
    expect(n2080.portfolioNeeded).toBeLessThan(n2070.portfolioNeeded);
  });
});
