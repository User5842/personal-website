import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { asNumber, currency } from "@/lib/utils";

const AnnualWithdrawalSchema = z.object({
  portfolioValue: z
    .number({ invalid_type_error: "Enter a dollar amount" })
    .min(0, "Must be ≥ 0"),
  withdrawalRatePct: z
    .number({ invalid_type_error: "Enter a percentage" })
    .min(0.1, "Too low")
    .max(100, "Too high")
    .default(4),
});

type AnnualWithdrawalValues = z.input<typeof AnnualWithdrawalSchema>;

export default function AnnualWithdrawal() {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<AnnualWithdrawalValues>({
    resolver: zodResolver(AnnualWithdrawalSchema),
    defaultValues: { portfolioValue: 1000000, withdrawalRatePct: 4 },
  });

  const values = watch();

  // Validate inputs before calculating
  const portfolioValue = values.portfolioValue ?? 0;
  const withdrawalRate = values.withdrawalRatePct ?? 4;

  const withdrawal = React.useMemo(() => {
    if (
      !Number.isFinite(portfolioValue) ||
      !Number.isFinite(withdrawalRate) ||
      portfolioValue < 0 ||
      withdrawalRate <= 0
    ) {
      return 0;
    }
    return portfolioValue * (withdrawalRate / 100);
  }, [portfolioValue, withdrawalRate]);

  return (
    <Card className="w-full max-w-2xl border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl">Annual Withdrawal</CardTitle>
        <CardDescription>
          Compute first-year withdrawal:{" "}
          <span className="font-medium">Portfolio × (Rate⁄₁₀₀)</span>. Default
          rate 4%.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="portfolioValue">Portfolio Value</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!errors.portfolioValue}
                  id="portfolioValue"
                  inputMode="decimal"
                  placeholder="1,000,000"
                  {...register("portfolioValue", {
                    setValueAs: (v) => asNumber(String(v)),
                  })}
                />
                <FieldError
                  errors={
                    errors.portfolioValue ? [errors.portfolioValue] : undefined
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
                First-year withdrawal: {currency(Math.max(0, withdrawal))}
              </div>
              <div className="text-sm text-gray-600">
                Formula: {currency(portfolioValue)} × {withdrawalRate / 100}.
              </div>
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}
