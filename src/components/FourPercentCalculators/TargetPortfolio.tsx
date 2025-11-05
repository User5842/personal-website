import * as React from "react";
import { useForm, type Resolver, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

import { Info } from "lucide-react";
import { asNumber, currency } from "@/lib/utils";

const dollarsModes = ["today", "target"] as const;

const TargetPortfolioSchema = z.object({
  desiredAnnualIncome: z
    .number({ invalid_type_error: "Enter a dollar amount" })
    .min(0, "Must be ≥ 0"),
  dollarsMode: z.enum(dollarsModes).default("today"),
  withdrawalRatePct: z
    .number({ invalid_type_error: "Enter a percentage" })
    .min(0.1, "Too low")
    .max(100, "Too high")
    .default(4),
  retirementYear: z
    .number({ invalid_type_error: "Enter a year" })
    .int()
    .min(1900)
    .max(2120),
  targetYear: z
    .number({ invalid_type_error: "Enter a year" })
    .int()
    .min(1900)
    .max(2120),
  inflationPct: z
    .number({ invalid_type_error: "Enter inflation %" })
    .min(0)
    .max(50)
    .default(3),
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
    const w = (v.withdrawalRatePct ?? 4) / 100; // e.g., 0.04
    const i = (v.inflationPct ?? 0) / 100; // e.g., 0.03
    const years = (v.targetYear ?? 0) - (v.retirementYear ?? 0);
    const inflFactor = Math.pow(1 + i, years);
    const isSameYear = years === 0;

    const desired = v.desiredAnnualIncome ?? 0;

    // Calculate desired income in target year dollars
    const desiredInTargetYear =
      v.dollarsMode === "today" ? desired * inflFactor : desired;

    // To get desired income in target year, we need:
    // Year N withdrawal = Portfolio * withdrawalRate * (1 + inflation)^(N - retirementYear)
    // So: desiredInTargetYear = Pneeded * w * inflFactor
    // Therefore: Pneeded = desiredInTargetYear / (w * inflFactor)
    const Pneeded = desiredInTargetYear / (w * inflFactor);
    const year1Withdrawal = Pneeded * w;

    // Build explainer text based on mode and whether years are the same
    let explainer: string;
    if (isSameYear) {
      // When retirement year = target year, we're calculating for the first year of retirement
      explainer =
        v.dollarsMode === "today"
          ? `You entered ${currency(desired)} in today's purchasing power. Since retirement and target year are the same (${v.targetYear}), this means your first-year withdrawal in ${v.targetYear} should have the purchasing power of ${currency(desired)} today. To support that withdrawal, you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`
          : `You entered ${currency(desired)} in ${v.targetYear} dollars. Since retirement and target year are the same, this is your first-year withdrawal amount. To support ${currency(desired)} in ${v.targetYear}, you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
    } else {
      explainer =
        v.dollarsMode === "today"
          ? `You entered ${currency(desired)} in today's purchasing power. In ${v.targetYear}, that equals ${currency(desiredInTargetYear)} in nominal dollars (adjusted for ${v.inflationPct}% inflation over ${years} years). To support that withdrawal amount, you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`
          : `You entered ${currency(desired)} in ${v.targetYear} dollars. To support that withdrawal amount in ${v.targetYear} (accounting for ${v.inflationPct}% inflation over ${years} years from retirement to target year), you'll need ${currency(Pneeded)} at retirement using a ${v.withdrawalRatePct}% withdrawal rate.`;
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
              name="dollarsMode"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  className="grid grid-cols-2 gap-2"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <RadioGroupItem id="today" value="today" />
                    <label htmlFor="today" className="cursor-pointer">
                      In today's dollars
                    </label>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <RadioGroupItem id="target" value="target" />
                    <label htmlFor="target" className="cursor-pointer">
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
                  id="desiredAnnualIncome"
                  inputMode="decimal"
                  placeholder="80000"
                  aria-invalid={!!errors.desiredAnnualIncome}
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
                  id="withdrawalRatePct"
                  inputMode="decimal"
                  placeholder="4"
                  aria-invalid={!!errors.withdrawalRatePct}
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
                  id="retirementYear"
                  inputMode="numeric"
                  placeholder="2040"
                  aria-invalid={!!errors.retirementYear}
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
                  id="targetYear"
                  inputMode="numeric"
                  placeholder="2050"
                  aria-invalid={!!errors.targetYear}
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
                  id="inflationPct"
                  inputMode="decimal"
                  placeholder="3"
                  aria-invalid={!!errors.inflationPct}
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
            role="status"
            aria-live="polite"
            className="bg-blue-50 text-blue-950 border-blue-200 text-left"
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
