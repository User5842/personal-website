import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type SavingsRow = {
  id: number;
  name: string;
  amount: string;
};

type SavingsState = {
  rows: SavingsRow[];
  rateInput: string;
  yearsInput: string;
};

const STORAGE_KEY = "savings-from-cuts-v3";
const AMOUNT_PATTERN = /^(\d+(\.\d{0,2})?)?$/;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function calculateFutureValueMonthly(
  monthlyAmount: number,
  annualRate: number,
  years: number,
): number {
  if (monthlyAmount <= 0 || annualRate <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 12;
  const n = years * 12;

  return monthlyAmount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
}

function isAmountValid(amount: string): boolean {
  const trimmed = amount.trim();
  if (trimmed === "") return false;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0;
}

function hasBlockingRows(rows: SavingsRow[]): boolean {
  return rows.some((row) => {
    const nameTrim = row.name.trim();
    const amountTrim = row.amount.trim();

    if (nameTrim === "" && amountTrim === "") return false;

    if (nameTrim === "" || amountTrim === "") return true;

    return !isAmountValid(amountTrim);
  });
}

export default function SavingsFromCuts() {
  const [rows, setRows] = React.useState<SavingsRow[]>([]);
  const [rateInput, setRateInput] = React.useState("8");
  const [yearsInput, setYearsInput] = React.useState("10");

  const nameInputRefs = React.useRef<Record<number, HTMLInputElement | null>>(
    {},
  );
  const [pendingFocusId, setPendingFocusId] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<SavingsState>;
      if (parsed.rows && Array.isArray(parsed.rows)) setRows(parsed.rows);
      if (typeof parsed.rateInput === "string") setRateInput(parsed.rateInput);
      if (typeof parsed.yearsInput === "string")
        setYearsInput(parsed.yearsInput);
    } catch (err) {
      console.error("Failed to load savings state", err);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const state: SavingsState = { rows, rateInput, yearsInput };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save savings state", err);
    }
  }, [rows, rateInput, yearsInput]);

  React.useEffect(() => {
    if (pendingFocusId == null) return;

    const el = nameInputRefs.current[pendingFocusId];
    if (el) {
      el.focus();
    }

    setPendingFocusId(null);
  }, [pendingFocusId, rows]);

  const totalMonthlySavings = rows.reduce((sum, row) => {
    const n = parseFloat(row.amount);
    if (Number.isNaN(n) || n <= 0) return sum;
    return sum + n;
  }, 0);

  const trimmedRate = rateInput.trim();
  const rateIsEmpty = trimmedRate === "";
  const parsedRatePercent = parseFloat(trimmedRate);
  const rateIsValid =
    !rateIsEmpty &&
    !Number.isNaN(parsedRatePercent) &&
    parsedRatePercent > 0 &&
    parsedRatePercent <= 25;
  const annualRate = rateIsValid ? parsedRatePercent / 100 : 0;

  const trimmedYears = yearsInput.trim();
  const yearsIsEmpty = trimmedYears === "";
  const parsedYears = parseInt(trimmedYears, 10);
  const yearsIsValid =
    !yearsIsEmpty &&
    !Number.isNaN(parsedYears) &&
    parsedYears > 0 &&
    parsedYears <= 60;
  const years = yearsIsValid ? parsedYears : 0;

  const canCalculate = totalMonthlySavings > 0 && rateIsValid && yearsIsValid;

  const futureValue = canCalculate
    ? calculateFutureValueMonthly(totalMonthlySavings, annualRate, years)
    : 0;

  const totalContributed = canCalculate ? totalMonthlySavings * 12 * years : 0;
  const growth = futureValue - totalContributed;

  const handleRowChange = (
    id: number,
    field: "name" | "amount",
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleAmountChange = (id: number, raw: string) => {
    if (raw === "" || AMOUNT_PATTERN.test(raw)) {
      handleRowChange(id, "amount", raw);
    }
  };

  const handleAddRow = (options?: { focusNewRow?: boolean }) => {
    if (hasBlockingRows(rows)) return;

    setRows((prev) => {
      const nextId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      const nextRows = [
        ...prev,
        {
          id: nextId,
          name: "",
          amount: "",
        },
      ];

      if (options?.focusNewRow) {
        setPendingFocusId(nextId);
      }

      return nextRows;
    });
  };

  const handleRemoveRow = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleRowEnter = (row: SavingsRow) => {
    const nameTrim = row.name.trim();
    const amountTrim = row.amount.trim();
    const valid = nameTrim !== "" && isAmountValid(amountTrim);

    if (valid && !hasBlockingRows(rows)) {
      handleAddRow({ focusNewRow: true });
    }
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
            <p className="text-sm font-medium text-gray-700">
              No items added yet
            </p>
            <p className="text-xs text-gray-500">
              Add expenses you removed from your budget to see how your savings
              can grow.
            </p>
            <Button
              variant="outline"
              className="mt-2 flex items-center gap-2"
              onClick={() => handleAddRow({ focusNewRow: true })}
            >
              <Plus className="h-4 w-4" />
              Add your first item
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Item</TableHead>
                <TableHead className="w-1/3 text-right">
                  Monthly amount saved
                </TableHead>
                <TableHead className="w-12 text-center">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const nameTrim = row.name.trim();
                const amountTrim = row.amount.trim();
                const amountInvalid =
                  amountTrim !== "" && !isAmountValid(amountTrim);

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        ref={(el) => {
                          nameInputRefs.current[row.id] = el;
                        }}
                        placeholder="Example: Streaming service"
                        value={row.name}
                        onChange={(e) =>
                          handleRowChange(row.id, "name", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRowEnter(row);
                            return;
                          }

                          if (e.key === "Backspace") {
                            const bothEmpty =
                              nameTrim === "" && amountTrim === "";

                            if (!bothEmpty) return;

                            const currentIndex = index;

                            e.preventDefault();

                            if (rows.length === 1) {
                              setRows([]);
                              return;
                            }

                            if (currentIndex > 0) {
                              const previousRowId = rows[currentIndex - 1].id;
                              setRows((prev) =>
                                prev.filter((r) => r.id !== row.id),
                              );
                              setPendingFocusId(previousRowId);
                            }
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-500">$</span>
                          <Input
                            className="max-w-[120px] text-right"
                            inputMode="decimal"
                            placeholder="0"
                            value={row.amount}
                            onChange={(e) =>
                              handleAmountChange(row.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleRowEnter(row);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-500">/mo</span>
                        </div>
                        {amountInvalid && (
                          <p className="text-[11px] text-red-500">
                            Enter a positive number.
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove row"
                        onClick={() => {
                          if (rows.length === 1) {
                            setRows([]);
                          } else {
                            handleRemoveRow(row.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow>
                <TableCell colSpan={3}>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 flex items-center gap-2"
                    onClick={() => handleAddRow({ focusNewRow: true })}
                  >
                    <Plus className="h-4 w-4" />
                    Add another item
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 border-t pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
          <div className="flex w-full flex-col items-center gap-1 text-center sm:w-44">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Average annual return
            </span>
            <Input
              className="mx-auto w-full max-w-xs text-right sm:w-20 sm:max-w-none"
              inputMode="decimal"
              placeholder="8"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
            />
            <span className="text-xs text-gray-500">percent</span>
            {!rateIsEmpty && !rateIsValid && (
              <p className="mt-1 text-[11px] text-red-500">
                Enter a value between 1 and 25.
              </p>
            )}
          </div>
          <div className="flex w-full flex-col items-center gap-1 text-center sm:w-44">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Time horizon
            </span>
            <Input
              className="mx-auto w-full max-w-xs text-right sm:w-20 sm:max-w-none"
              inputMode="numeric"
              placeholder="10"
              value={yearsInput}
              onChange={(e) => setYearsInput(e.target.value)}
            />
            <span className="text-xs text-gray-500">years</span>
            {!yearsIsEmpty && !yearsIsValid && (
              <p className="mt-1 text-[11px] text-red-500">
                Enter a value between 1 and 60.
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>
            Total monthly savings:{" "}
            <span className="font-semibold text-gray-900">
              {currencyFormatter.format(totalMonthlySavings)}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Based on investing this amount every month.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Potential future value
        </p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {currencyFormatter.format(futureValue)}
        </p>

        <p className="mt-2 text-xs text-gray-600">
          Over{" "}
          <span className="font-medium">
            {yearsIsValid ? years : "?"} year{years === 1 ? "" : "s"}
          </span>{" "}
          at an average return of{" "}
          <span className="font-medium">
            {rateIsValid ? parsedRatePercent.toFixed(1) : "?"} percent
          </span>
          , investing{" "}
          <span className="font-medium">
            {currencyFormatter.format(totalMonthlySavings)}
          </span>{" "}
          per month could grow to this amount.
        </p>
        {canCalculate && (
          <p className="mt-1 text-xs text-gray-500">
            Total contributed:{" "}
            <span className="font-medium">
              {currencyFormatter.format(totalContributed)}
            </span>{" "}
            • Growth:{" "}
            <span className="font-medium">
              {currencyFormatter.format(growth)}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
