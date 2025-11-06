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
import { computeTargetPortfolio } from "@/lib/retirement";

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

    // Use the pure math function
    const computed = computeTargetPortfolio({
      mode: v.dollarsMode,
      desiredIncome: desired,
      withdrawalRatePct: withdrawalRate,
      inflationPct: inflationRate,
      todayYear: now,
      retirementYear: retirementYear,
      targetYear: targetYear,
    });

    const { portfolioNeeded, year1Withdrawal, targetYearIncome } = computed;

    // Build explainer text based on mode
    let explainer: string;
    const yearsFromRetirementToTarget = targetYear - retirementYear;
    const yearsFromTodayToTarget = targetYear - now;
    const yearsFromTodayToRetirement = retirementYear - now;
    const isSameYear = yearsFromRetirementToTarget === 0;

    if (v.dollarsMode === "today") {
      if (isSameYear) {
        explainer = `You entered ${currency(desired)} in today's purchasing power. Since retirement and target year are the same (${v.targetYear}), this means your first-year withdrawal in ${v.targetYear} should have the purchasing power of ${currency(desired)} today (${currency(targetYearIncome)} in ${v.targetYear} dollars, adjusted for ${v.inflationPct}% inflation from ${now} to ${v.targetYear}). To support that withdrawal, you'll need ${currency(portfolioNeeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      } else {
        explainer = `You entered ${currency(desired)} in today's purchasing power. We inflated this from ${now} to ${v.targetYear} (${yearsFromTodayToTarget} years at ${v.inflationPct}% inflation) to get ${currency(targetYearIncome)} in ${v.targetYear} dollars. Then we discounted this back from ${v.targetYear} to ${v.retirementYear} (${yearsFromRetirementToTarget} years) to get the year 1 withdrawal of ${currency(year1Withdrawal)}. To support that withdrawal, you'll need ${currency(portfolioNeeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      }
    } else {
      // target-year dollars mode
      if (isSameYear) {
        explainer = `You entered ${currency(desired)} in ${v.targetYear} dollars. Since retirement and target year are the same, this is your first-year withdrawal amount. To support ${currency(desired)} in ${v.targetYear}, you'll need ${currency(portfolioNeeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      } else {
        explainer = `You entered ${currency(desired)} in ${v.targetYear} dollars. We discounted this back from ${v.targetYear} to ${v.retirementYear} (${yearsFromRetirementToTarget} years at ${v.inflationPct}% inflation) to get the year 1 withdrawal of ${currency(year1Withdrawal)}. To support that withdrawal, you'll need ${currency(portfolioNeeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
      }
    }

    return {
      Pneeded: portfolioNeeded,
      year1Withdrawal: year1Withdrawal,
      desiredInTargetYear: targetYearIncome,
      explainer,
    };
  }, [v, now]);

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
