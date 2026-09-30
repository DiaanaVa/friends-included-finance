import type { CommissionAmounts, CommissionSplit, SalespersonCode } from "./types";

const tieBreakOrder: SalespersonCode[] = ["richard", "anastasia", "jean_claude"];

export function assertPositiveCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be a positive whole number of cents.");
  }
}

export function assertValidSplit(split: CommissionSplit): void {
  const values = Object.values(split);
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error("Each commission share must be between 0 and 100 percent.");
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.000001) {
    throw new Error("Commission shares must total 100 percent.");
  }
}

export function calculateCommission(amountCents: number, split: CommissionSplit): CommissionAmounts {
  assertPositiveCents(amountCents);
  assertValidSplit(split);

  const poolCents = Math.round(amountCents * 0.1);
  const raw = {
    richard: (poolCents * split.richard) / 100,
    anastasia: (poolCents * split.anastasia) / 100,
    jean_claude: (poolCents * split.jean_claude) / 100,
  };
  const rounded = {
    richard: Math.round(raw.richard),
    anastasia: Math.round(raw.anastasia),
    jean_claude: Math.round(raw.jean_claude),
  };
  const difference = poolCents - Object.values(rounded).reduce((sum, value) => sum + value, 0);
  if (difference !== 0) {
    const largestPercentage = Math.max(...Object.values(split));
    const recipient = tieBreakOrder.find((person) => split[person] === largestPercentage)!;
    rounded[recipient] += difference;
  }

  return {
    poolCents,
    richardCents: rounded.richard,
    anastasiaCents: rounded.anastasia,
    jeanClaudeCents: rounded.jean_claude,
  };
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
