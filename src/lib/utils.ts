import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function asNumber(value: string) {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  return cleaned === "" || cleaned === "." || cleaned === "-"
    ? NaN
    : Number(cleaned);
}
