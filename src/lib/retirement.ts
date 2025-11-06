export type DollarsMode = "today" | "target";

export interface TargetPortfolioInput {
  mode: DollarsMode; // "today" | "target"
  desiredIncome: number; // I_today if mode="today", else I_target
  withdrawalRatePct: number; // w% e.g. 4
  inflationPct: number; // i% e.g. 3
  todayYear: number; // T (default: new Date().getFullYear())
  retirementYear: number; // R
  targetYear: number; // N (N >= R)
}

export interface TargetPortfolioResult {
  year1Withdrawal: number; // W_R (in year R dollars)
  portfolioNeeded: number; // P_needed (at year R)
  targetYearIncome: number; // income in target year dollars (year N)
}

/**
 * Computes the target portfolio needed for retirement.
 *
 * Formulas:
 * Let w = withdrawalRatePct / 100
 * Let i = inflationPct / 100
 * Let T = todayYear
 * Let R = retirementYear
 * Let N = targetYear
 *
 * Mode A — "target-year dollars" (user enters I_target at year N):
 *   W_R       = I_target / (1 + i)^(N - R)
 *   P_needed  = W_R / w
 *   targetYearIncome = I_target  // just echo back
 *
 * Mode B — "today's dollars" (user enters I_today at year T):
 *   W_R       = I_today * (1 + i)^(R - T)
 *   P_needed  = W_R / w
 *   targetYearIncome = I_today * (1 + i)^(N - T)
 *
 * Important property: In "today" mode, P_needed depends only on (R - T)
 * and is invariant to N. (Changing Target Year must NOT change portfolioNeeded.)
 */
export function computeTargetPortfolio(
  input: TargetPortfolioInput,
): TargetPortfolioResult {
  const {
    mode,
    desiredIncome,
    withdrawalRatePct,
    inflationPct,
    todayYear,
    retirementYear,
    targetYear,
  } = input;

  // Guard invalid inputs
  if (
    withdrawalRatePct <= 0 ||
    targetYear < retirementYear ||
    !Number.isFinite(desiredIncome) ||
    !Number.isFinite(withdrawalRatePct) ||
    !Number.isFinite(inflationPct) ||
    !Number.isFinite(todayYear) ||
    !Number.isFinite(retirementYear) ||
    !Number.isFinite(targetYear)
  ) {
    return {
      year1Withdrawal: 0,
      portfolioNeeded: 0,
      targetYearIncome: 0,
    };
  }

  const w = withdrawalRatePct / 100;
  const i = inflationPct / 100;

  // Helper: compute (1+i)^k, handling i=0 safely
  const pow = (k: number): number => {
    if (i === 0 || k === 0) {
      return 1;
    }
    return Math.pow(1 + i, k);
  };

  let year1Withdrawal: number;
  let portfolioNeeded: number;
  let targetYearIncome: number;

  if (mode === "target") {
    // Mode A — "target-year dollars"
    // W_R = I_target / (1 + i)^(N - R)
    const yearsFromRetirementToTarget = targetYear - retirementYear;
    year1Withdrawal = desiredIncome / pow(yearsFromRetirementToTarget);
    portfolioNeeded = year1Withdrawal / w;
    targetYearIncome = desiredIncome; // echo back
  } else {
    // Mode B — "today's dollars"
    // W_R = I_today * (1 + i)^(R - T)
    const yearsFromTodayToRetirement = retirementYear - todayYear;
    year1Withdrawal = desiredIncome * pow(yearsFromTodayToRetirement);
    portfolioNeeded = year1Withdrawal / w;
    // targetYearIncome = I_today * (1 + i)^(N - T)
    const yearsFromTodayToTarget = targetYear - todayYear;
    targetYearIncome = desiredIncome * pow(yearsFromTodayToTarget);
  }

  // Validate results are finite
  if (
    !Number.isFinite(year1Withdrawal) ||
    !Number.isFinite(portfolioNeeded) ||
    !Number.isFinite(targetYearIncome)
  ) {
    return {
      year1Withdrawal: 0,
      portfolioNeeded: 0,
      targetYearIncome: 0,
    };
  }

  return {
    year1Withdrawal,
    portfolioNeeded,
    targetYearIncome,
  };
}
