import { z } from "zod";

const reference = (prefix: "S" | "E") =>
  z.string().trim().regex(new RegExp(`^${prefix}[0-9]+$`), `Reference must look like ${prefix}01.`);

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`).max(500);

const positiveMoney = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a positive amount with at most two decimals.").transform((value, ctx) => {
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    ctx.addIssue({ code: "custom", message: "Amount must be greater than zero." });
    return z.NEVER;
  }
  return cents;
});

const percentage = z.coerce.number().min(0).max(100);

export const saleSubmissionSchema = z.object({
  reference: reference("S"),
  customer: requiredText("Customer"),
  project: z.enum(["A", "B"]),
  description: requiredText("Description"),
  amount: positiveMoney,
  proposedRichardPct: percentage,
  proposedAnastasiaPct: percentage,
  proposedJeanClaudePct: percentage,
}).superRefine((value, ctx) => {
  if (value.proposedRichardPct + value.proposedAnastasiaPct + value.proposedJeanClaudePct !== 100) {
    ctx.addIssue({ code: "custom", path: ["proposedRichardPct"], message: "Commission shares must total exactly 100%." });
  }
});

export const expenseSubmissionSchema = z.object({
  reference: reference("E"),
  description: requiredText("Description"),
  category: z.enum(["Materials", "Travel", "Other"]),
  amount: positiveMoney,
  proposedAllocation: z.enum(["A", "B", "OVERHEAD"]),
});

export const saleApprovalSchema = z.object({
  richardPct: percentage,
  anastasiaPct: percentage,
  jeanClaudePct: percentage,
}).superRefine((value, ctx) => {
  if (Math.abs(value.richardPct + value.anastasiaPct + value.jeanClaudePct - 100) > 0.000001) {
    ctx.addIssue({ code: "custom", path: ["richardPct"], message: "Final commission shares must total exactly 100%." });
  }
});

export const expenseAllocationSchema = z.object({ allocation: z.enum(["A", "B", "OVERHEAD"]) });

export type SaleSubmission = z.output<typeof saleSubmissionSchema>;
export type ExpenseSubmission = z.output<typeof expenseSubmissionSchema>;
export type SaleApproval = z.output<typeof saleApprovalSchema>;
export type ExpenseAllocationDecision = z.output<typeof expenseAllocationSchema>;

export function firstValidationError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the submitted information.";
}
