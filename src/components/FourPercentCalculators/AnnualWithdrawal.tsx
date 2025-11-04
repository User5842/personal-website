import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Info } from "lucide-react";

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

function currency(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function asNumber(value: string) {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  return cleaned === "" || cleaned === "." || cleaned === "-"
    ? NaN
    : Number(cleaned);
}

export default function AnnualWithdrawal() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnnualWithdrawalValues>({
    resolver: zodResolver(AnnualWithdrawalSchema),
    defaultValues: { portfolioValue: 1000000, withdrawalRatePct: 4 },
  });

  const values = watch();
  const withdrawal =
    (values.portfolioValue ?? 0) * ((values.withdrawalRatePct ?? 4) / 100);

  function onSubmit() {}

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
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="portfolioValue">Portfolio Value</Label>
              <Input
                id="portfolioValue"
                inputMode="decimal"
                placeholder="1000000"
                {...register("portfolioValue", {
                  setValueAs: (v) => asNumber(String(v)),
                })}
              />
              {errors.portfolioValue && (
                <p className="text-sm text-red-600">
                  {errors.portfolioValue.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalRatePct">Withdrawal Rate (%)</Label>
              <Input
                id="withdrawalRatePct"
                inputMode="decimal"
                placeholder="4"
                {...register("withdrawalRatePct", {
                  setValueAs: (v) => asNumber(String(v)),
                })}
              />
              {errors.withdrawalRatePct && (
                <p className="text-sm text-red-600">
                  {errors.withdrawalRatePct.message}
                </p>
              )}
            </div>
          </div>
          <Alert className="bg-blue-50 text-blue-950 border-blue-200 text-left">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-semibold text-left">Result</AlertTitle>
            <AlertDescription className="text-left">
              <div className="mt-2 text-lg font-bold">
                First-year withdrawal: {currency(Math.max(0, withdrawal))}
              </div>
              <div className="text-sm text-gray-600">
                Formula: {currency(values.portfolioValue ?? 0)} ×{" "}
                {(values.withdrawalRatePct ?? 4) / 100}.
              </div>
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button type="submit">Recalculate</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
