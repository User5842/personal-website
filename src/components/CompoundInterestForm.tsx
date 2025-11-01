import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

type Frequency = "daily" | "monthly" | "annually";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

const compoundInterestFormSchema = z.object({
  initialInvestment: z
    .number({ required_error: "Initial investment is required" })
    .min(0, "Must be at least 0"),
  annualRateOfReturn: z
    .number({ required_error: "Annual rate of return is required" })
    .min(0, "Must be at least 0")
    .max(100, "Must be 100 or less"),
  contributionAmount: z
    .number({ required_error: "Contribution amount is required" })
    .min(0, "Must be at least 0"),
  //   contributionFrequency: z.enum(["daily", "monthly", "annually"], {
  //     required_error: "Select a contribution frequency",
  //   }),
  contributionFrequency: z.string().min(1, "Select a contribution frequency"),
  yearsInvested: z
    .number({ required_error: "Years invested is required" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
});

const contributionFrequencies = [
  {
    id: "daily",
    title: "Daily",
  },
  {
    id: "monthly",
    title: "Monthly",
  },
  {
    id: "annually",
    title: "Annually",
  },
];

/**
 * Returns an array of total portfolio values at the end of each year.
 * @param principal - Starting amount (initial investment)
 * @param annualRate - Annual rate of return (e.g. 0.07 for 7%)
 * @param contribution - Contribution amount per period
 * @param years - Number of years invested
 * @param frequency - Contribution & compounding frequency
 * @returns Array of totals for each year (floored to 2 decimals)
 */
function compoundInterestTotals(
  principal: number,
  annualRateInput: number, // accepts 8 or 0.08
  contributionPerPeriod: number,
  years: number,
  frequency: Frequency = "monthly",
): number[] {
  const periodsPerYear: Record<Frequency, number> = {
    daily: 365,
    monthly: 12,
    annually: 1,
  };

  const n = periodsPerYear[frequency];
  // normalize: if rate > 1, treat as percent
  const annualRate =
    annualRateInput > 1 ? annualRateInput / 100 : annualRateInput;
  const rPerPeriod = annualRate / n;

  let balance = principal;
  const totals: number[] = [];

  for (let y = 1; y <= years; y++) {
    for (let p = 0; p < n; p++) {
      balance *= 1 + rPerPeriod; // interest
      balance += contributionPerPeriod; // end-of-period contribution
    }
    totals.push(Math.round(balance));
  }
  return totals;
}

export default function CompoundInterestForm() {
  const compoundInterestForm = useForm<
    z.infer<typeof compoundInterestFormSchema>
  >({
    defaultValues: {
      initialInvestment: 10000,
      annualRateOfReturn: 8,
      contributionAmount: 0,
      contributionFrequency: "annually",
      yearsInvested: 10,
    },
    resolver: zodResolver(compoundInterestFormSchema),
  });

  function onSubmit(data: z.infer<typeof compoundInterestFormSchema>) {
    const compoundInterestTotalsData = compoundInterestTotals(
      data.initialInvestment,
      data.annualRateOfReturn,
      data.contributionAmount,
      data.yearsInvested,
      data.contributionFrequency as Frequency,
    );
    console.log(compoundInterestTotalsData);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compound Interest Calculator</CardTitle>
        <CardDescription>
          Simple compound interest calculator for your investments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          id="form-rhf-demo"
          onSubmit={compoundInterestForm.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={compoundInterestForm.control}
              name="initialInvestment"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    How much are you starting with?
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={compoundInterestForm.control}
              name="annualRateOfReturn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Annual Rate of Return (%)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <FieldGroup className="space-y-4">
              <Controller
                control={compoundInterestForm.control}
                name="contributionAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-title">
                      How much are you contributing?
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-title"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={compoundInterestForm.control}
                name="contributionFrequency"
                render={({ field, fieldState }) => (
                  <FieldSet>
                    <FieldLegend>Contributuion frequency</FieldLegend>
                    <FieldDescription>
                      Are you contributing daily, monthly or annually?
                    </FieldDescription>
                    <RadioGroup
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {contributionFrequencies.map((frequency) => (
                        <FieldLabel
                          key={frequency.id}
                          htmlFor={`form-rhf-radiogroup-${frequency.id}`}
                        >
                          <Field
                            orientation="horizontal"
                            data-invalid={fieldState.invalid}
                          >
                            <FieldContent>
                              <FieldTitle>{frequency.title}</FieldTitle>
                            </FieldContent>
                            <RadioGroupItem
                              value={frequency.id}
                              id={`form-rhf-radiogroup-${frequency.id}`}
                              aria-invalid={fieldState.invalid}
                            />
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldSet>
                )}
              />
            </FieldGroup>
            <Controller
              control={compoundInterestForm.control}
              name="yearsInvested"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Years invested:
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() => compoundInterestForm.reset()}
          >
            Reset
          </Button>
          <Button type="submit" form="form-rhf-demo">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
