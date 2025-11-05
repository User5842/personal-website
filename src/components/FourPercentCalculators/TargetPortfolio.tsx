import * as React from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { asNumber, currency } from "@/lib/utils";

const dollarsModes = ["today", "target"] as const;

const TargetPortfolioSchema = z
  .object({
    desiredAnnualIncome: z
      .number({ invalid_type_error: "Enter a dollar amount" })
      .min(0, "Must be ≥ 0"),
    dollarsMode: z.enum(dollarsModes).default("today"),
    withdrawalRatePct: z
      .number({ invalid_type_error: "Enter a percentage" })
      .min(0.1, "Must be at least 0.1%")
      .max(100, "Must be at most 100%")
      .default(4),
    retirementYear: z
      .number({ invalid_type_error: "Enter a year" })
      .int("Must be a whole number")
      .min(1900, "Must be 1900 or later")
      .max(2120, "Must be 2120 or earlier"),
    targetYear: z
      .number({ invalid_type_error: "Enter a year" })
      .int("Must be a whole number")
      .min(1900, "Must be 1900 or later")
      .max(2120, "Must be 2120 or earlier"),
    inflationPct: z
      .number({ invalid_type_error: "Enter inflation %" })
      .min(0, "Must be ≥ 0%")
      .max(50, "Must be ≤ 50%")
      .default(3),
  })
  .refine((data) => data.targetYear >= data.retirementYear, {
    message: "Target year must be on or after retirement year",
    path: ["targetYear"],
  });

type TargetPortfolioValues = z.infer<typeof TargetPortfolioSchema>;

export default function TargetPortfolio() {
  const now = new Date().getFullYear();
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<TargetPortfolioValues>({
    resolver: zodResolver(
      TargetPortfolioSchema,
    ) as unknown as Resolver<TargetPortfolioValues>,
    defaultValues: {
      desiredAnnualIncome: 80000,
      dollarsMode: "today",
      withdrawalRatePct: 4,
      retirementYear: now + 10,
      targetYear: now + 15,
      inflationPct: 3,
    },
  });

  const v = watch();

  const result = React.useMemo(() => {
    // Validate inputs exist and are valid numbers
    const withdrawalRate = v.withdrawalRatePct ?? 4;
    const inflationRate = v.inflationPct ?? 0;
    const retirementYear = v.retirementYear ?? 0;
    const targetYear = v.targetYear ?? 0;
    const desired = v.desiredAnnualIncome ?? 0;

    // Early return for invalid inputs
    if (
      !Number.isFinite(withdrawalRate) ||
      !Number.isFinite(inflationRate) ||
      !Number.isFinite(retirementYear) ||
      !Number.isFinite(targetYear) ||
      !Number.isFinite(desired) ||
      withdrawalRate <= 0 ||
      targetYear < retirementYear
    ) {
      return {
        Pneeded: 0,
        year1Withdrawal: 0,
        desiredInTargetYear: desired,
        explainer: "Please enter valid values to calculate.",
      };
    }

    const w = withdrawalRate / 100; // e.g., 0.04
    const i = inflationRate / 100; // e.g., 0.03
    const yearsFromRetirementToTarget = targetYear - retirementYear;
    const inflFactorRetirementToTarget = Math.pow(
      1 + i,
      yearsFromRetirementToTarget,
    );
    const isSameYear = yearsFromRetirementToTarget === 0;

    // Calculate desired income in target year dollars
    let desiredInTargetYear: number;
    let yearsFromTodayToTarget: number;

    if (v.dollarsMode === "today") {
      // In "today's dollars" mode, inflate from today to target year
      yearsFromTodayToTarget = targetYear - now;
      const inflFactorTodayToTarget = Math.pow(1 + i, yearsFromTodayToTarget);
      desiredInTargetYear = desired * inflFactorTodayToTarget;
    } else {
      // In "target-year dollars" mode, use the value directly
      desiredInTargetYear = desired;
      yearsFromTodayToTarget = 0; // Not used in this mode
    }

    // To get desired income in target year, we need:
    // Year N withdrawal = Portfolio * withdrawalRate * (1 + inflation)^(N - retirementYear)
    // So: desiredInTargetYear = Pneeded * w * inflFactorRetirementToTarget
    // Therefore: Pneeded = desiredInTargetYear / (w * inflFactorRetirementToTarget)
    // Guard against division by zero
    const denominator = w * inflFactorRetirementToTarget;
    if (denominator === 0 || !Number.isFinite(denominator)) {
      return {
        Pneeded: 0,
        year1Withdrawal: 0,
        desiredInTargetYear: desired,
        explainer: "Cannot calculate: withdrawal rate must be greater than 0.",
      };
    }

    const Pneeded = desiredInTargetYear / denominator;
    const year1Withdrawal = Pneeded * w;

    // Validate results are finite
    if (!Number.isFinite(Pneeded) || !Number.isFinite(year1Withdrawal)) {
      return {
        Pneeded: 0,
        year1Withdrawal: 0,
        desiredInTargetYear: desired,
        explainer:
          "Calculation resulted in invalid values. Please check your inputs.",
      };
    }

    // Build explainer text based on mode and whether years are the same
    let explainer: string;
    if (isSameYear) {
      // When retirement year = target year, we're calculating for the first year of retirement
      if (v.dollarsMode === "today") {
        explainer = `You entered ${currency(desired)} in today's purchasing power. Since retirement and target year are the same (${v.targetYear}), this means your first-year withdrawal in ${v.targetYear} should have the purchasing power of ${currency(desired)} today (${currency(desiredInTargetYear)} in ${v.targetYear} dollars, adjusted for ${v.inflationPct}% inflation from ${now} to ${v.targetYear}). To support that withdrawal, you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      } else {
        explainer = `You entered ${currency(desired)} in ${v.targetYear} dollars. Since retirement and target year are the same, this is your first-year withdrawal amount. To support ${currency(desired)} in ${v.targetYear}, you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      }
    } else {
      if (v.dollarsMode === "today") {
        explainer = `You entered ${currency(desired)} in today's purchasing power. In ${v.targetYear}, that equals ${currency(desiredInTargetYear)} in nominal dollars (adjusted for ${v.inflationPct}% inflation over ${yearsFromTodayToTarget} years from ${now} to ${v.targetYear}). To support that withdrawal amount in ${v.targetYear}, you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate, which accounts for ${yearsFromRetirementToTarget} years of inflation growth from retirement to target year.`;
      } else {
        explainer = `You entered ${currency(desired)} in ${v.targetYear} dollars. To support that withdrawal amount in ${v.targetYear} (accounting for ${v.inflationPct}% inflation over ${yearsFromRetirementToTarget} years from retirement to target year), you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      }
    }

    return {
      Pneeded,
      year1Withdrawal,
      desiredInTargetYear,
      explainer,
    };
  }, [v]);

  return (
    <Card className="w-full max-w-2xl border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl">Target Portfolio</CardTitle>
        <CardDescription>
          See how much you’d need saved to retire comfortably based on your
          desired yearly income.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6">
          <FieldSet>
            <FieldLegend>Desired Income Input</FieldLegend>
            <Controller
              control={control}
              name="dollarsMode"
              render={({ field }) => (
                <RadioGroup
                  className="grid grid-cols-2 gap-2"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <RadioGroupItem id="today" value="today" />
                    <label className="cursor-pointer" htmlFor="today">
                      In today's dollars
                    </label>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <RadioGroupItem id="target" value="target" />
                    <label className="cursor-pointer" htmlFor="target">
                      In target-year dollars
                    </label>
                  </div>
                </RadioGroup>
              )}
            />
          </FieldSet>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="desiredAnnualIncome">
                Desired Annual Income
              </FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!errors.desiredAnnualIncome}
                  id="desiredAnnualIncome"
                  inputMode="decimal"
                  placeholder="80,000"
                  {...register("desiredAnnualIncome", {
                    setValueAs: (v) => asNumber(String(v)),
                  })}
                />
                <FieldError
                  errors={
                    errors.desiredAnnualIncome
                      ? [errors.desiredAnnualIncome]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="withdrawalRatePct">
                Withdrawal Rate (%)
              </FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!errors.withdrawalRatePct}
                  id="withdrawalRatePct"
                  inputMode="decimal"
                  placeholder="4"
                  {...register("withdrawalRatePct", {
                    setValueAs: (v) => asNumber(String(v)),
                  })}
                />
                <FieldError
                  errors={
                    errors.withdrawalRatePct
                      ? [errors.withdrawalRatePct]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="retirementYear">Retirement Year</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!errors.retirementYear}
                  id="retirementYear"
                  inputMode="numeric"
                  placeholder="2040"
                  {...register("retirementYear", {
                    setValueAs: (v) => asNumber(String(v)),
                  })}
                />
                <FieldError
                  errors={
                    errors.retirementYear ? [errors.retirementYear] : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="targetYear">Target Year</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!errors.targetYear}
                  id="targetYear"
                  inputMode="numeric"
                  placeholder="2050"
                  {...register("targetYear", {
                    setValueAs: (v) => asNumber(String(v)),
                  })}
                />
                <FieldError
                  errors={errors.targetYear ? [errors.targetYear] : undefined}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="inflationPct">Inflation (%/yr)</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!errors.inflationPct}
                  id="inflationPct"
                  inputMode="decimal"
                  placeholder="3"
                  {...register("inflationPct", {
                    setValueAs: (v) => asNumber(String(v)),
                  })}
                />
                <FieldError
                  errors={
                    errors.inflationPct ? [errors.inflationPct] : undefined
                  }
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <Alert
            aria-live="polite"
            className="bg-blue-50 text-blue-950 border-blue-200 text-left"
            role="status"
          >
            <Info className="h-4 w-4" />
            <AlertTitle className="font-semibold text-left">Result</AlertTitle>
            <AlertDescription className="text-left">
              <div className="mt-2 text-lg font-bold">
                Portfolio needed at retirement:{" "}
                {currency(Math.max(0, result.Pneeded))}
              </div>
              <div className="text-sm text-gray-600">
                Year 1 withdrawal ({v.retirementYear}):{" "}
                {currency(Math.max(0, result.year1Withdrawal))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {result.explainer}
              </div>
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}
