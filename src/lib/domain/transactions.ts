import type { EmployeeIdentity } from "./employees";
import type { ExpenseSubmission, SaleSubmission } from "./validation";
import type { ExpenseAllocation, ExpenseRecord, SaleRecord, CommissionSplit, CommissionAmounts } from "./types";
import { calculateCommission } from "./finance";

export class TransactionError extends Error {
  constructor(public readonly code: "FORBIDDEN" | "DUPLICATE" | "DATABASE", message: string) {
    super(message);
  }
}

export interface TransactionRepository {
  findEmployee(code: string): Promise<EmployeeIdentity | null>;
  insertSale(input: Record<string, unknown>): Promise<void>;
  insertExpense(input: Record<string, unknown>): Promise<void>;
  listSales(): Promise<SaleRecord[]>;
  listExpenses(): Promise<ExpenseRecord[]>;
  approvePendingSale(reference: string, approverId: string, split: CommissionSplit, amounts: CommissionAmounts): Promise<"UPDATED" | "ALREADY_PROCESSED" | "NOT_FOUND">;
  allocatePendingExpense(reference: string, approverId: string, allocation: ExpenseAllocation): Promise<"UPDATED" | "ALREADY_PROCESSED" | "NOT_FOUND">;
}

export type SubmissionContext = { channel: "WEB" | "TELEGRAM"; telegramChatId?: number };
const webContext: SubmissionContext = { channel: "WEB" };

async function requireManager(repo: TransactionRepository, actorCode: string) {
  const actor = await repo.findEmployee(actorCode);
  if (!actor || actor.role !== "manager") throw new TransactionError("FORBIDDEN", "Only Svetlana can make manager decisions.");
  return actor;
}

export async function approveSale(repo: TransactionRepository, actorCode: string, reference: string, split: CommissionSplit) {
  const actor = await requireManager(repo, actorCode);
  const sale = (await repo.listSales()).find((item) => item.reference === reference);
  if (!sale) throw new TransactionError("DATABASE", "Sale not found.");
  const amounts = calculateCommission(sale.amount_cents, split);
  const outcome = await repo.approvePendingSale(reference, actor.id, split, amounts);
  if (outcome === "NOT_FOUND") throw new TransactionError("DATABASE", "Sale not found.");
  return { reference, status: "APPROVED" as const, alreadyProcessed: outcome === "ALREADY_PROCESSED" };
}

export async function allocateExpense(repo: TransactionRepository, actorCode: string, reference: string, allocation: ExpenseAllocation) {
  const actor = await requireManager(repo, actorCode);
  const outcome = await repo.allocatePendingExpense(reference, actor.id, allocation);
  if (outcome === "NOT_FOUND") throw new TransactionError("DATABASE", "Expense not found.");
  return { reference, status: "ALLOCATED" as const, alreadyProcessed: outcome === "ALREADY_PROCESSED" };
}

export async function submitSale(repo: TransactionRepository, actorCode: string, input: SaleSubmission, context: SubmissionContext = webContext) {
  const actor = await repo.findEmployee(actorCode);
  if (!actor || actor.role !== "salesperson") {
    throw new TransactionError("FORBIDDEN", "Only a salesperson can submit a sale.");
  }

  await repo.insertSale({
    reference: input.reference,
    submission_channel: context.channel,
    submitting_employee_id: actor.id,
    original_telegram_chat_id: context.telegramChatId ?? null,
    customer: input.customer,
    project: input.project,
    description: input.description,
    amount_cents: input.amount,
    proposed_richard_pct: input.proposedRichardPct,
    proposed_anastasia_pct: input.proposedAnastasiaPct,
    proposed_jean_claude_pct: input.proposedJeanClaudePct,
    status: "PENDING_APPROVAL",
  });
  return { reference: input.reference, status: "PENDING_APPROVAL" as const };
}

export async function submitExpense(repo: TransactionRepository, actorCode: string, input: ExpenseSubmission, context: SubmissionContext = webContext) {
  const actor = await repo.findEmployee(actorCode);
  if (!actor || actor.role !== "expense_reporter") {
    throw new TransactionError("FORBIDDEN", "Only Kevin can submit an expense.");
  }

  const overhead = input.proposedAllocation === "OVERHEAD";
  await repo.insertExpense({
    reference: input.reference,
    submission_channel: context.channel,
    submitting_employee_id: actor.id,
    original_telegram_chat_id: context.telegramChatId ?? null,
    description: input.description,
    category: input.category,
    amount_cents: input.amount,
    proposed_allocation: input.proposedAllocation,
    final_allocation: overhead ? "OVERHEAD" : null,
    status: overhead ? "ALLOCATED" : "AWAITING_ALLOCATION",
    allocated_at: overhead ? new Date().toISOString() : null,
  });
  return { reference: input.reference, status: overhead ? "ALLOCATED" as const : "AWAITING_ALLOCATION" as const };
}
