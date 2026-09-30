import { describe, expect, it } from "vitest";
import type { EmployeeIdentity } from "./employees";
import { submitExpense, submitSale, TransactionError, type TransactionRepository } from "./transactions";

function repository(employee: EmployeeIdentity | null) {
  const sales: Array<Record<string, unknown>> = [];
  const expenses: Array<Record<string, unknown>> = [];
  const repo: TransactionRepository = {
    findEmployee: async () => employee,
    insertSale: async (input) => { sales.push(input); },
    insertExpense: async (input) => { expenses.push(input); },
    listSales: async () => [], listExpenses: async () => [],
    approvePendingSale: async () => "UPDATED", allocatePendingExpense: async () => "UPDATED",
  };
  return { repo, sales, expenses };
}

const salesperson: EmployeeIdentity = { id: "r", code: "richard", displayName: "Richard Darling", role: "salesperson" };
const kevin: EmployeeIdentity = { id: "k", code: "kevin", displayName: "Kevin von Whatever", role: "expense_reporter" };

describe("transaction permissions and persistence", () => {
  it("saves a website sale as pending", async () => {
    const { repo, sales } = repository(salesperson);
    await submitSale(repo, "richard", { reference: "S01", customer: "Olivia", project: "A", description: "Relatives", amount: 100000, proposedRichardPct: 50, proposedAnastasiaPct: 30, proposedJeanClaudePct: 20 });
    expect(sales[0]).toMatchObject({ reference: "S01", status: "PENDING_APPROVAL", submission_channel: "WEB", submitting_employee_id: "r" });
  });

  it("denies Kevin from submitting a sale", async () => {
    const { repo } = repository(kevin);
    await expect(submitSale(repo, "kevin", { reference: "S01", customer: "O", project: "A", description: "D", amount: 100, proposedRichardPct: 100, proposedAnastasiaPct: 0, proposedJeanClaudePct: 0 })).rejects.toBeInstanceOf(TransactionError);
  });

  it("allocates overhead immediately", async () => {
    const { repo, expenses } = repository(kevin);
    await submitExpense(repo, "kevin", { reference: "E03", description: "Website", category: "Other", amount: 10000, proposedAllocation: "OVERHEAD" });
    expect(expenses[0]).toMatchObject({ status: "ALLOCATED", final_allocation: "OVERHEAD", submission_channel: "WEB" });
  });

  it("leaves project expenses awaiting allocation", async () => {
    const { repo, expenses } = repository(kevin);
    await submitExpense(repo, "kevin", { reference: "E01", description: "Suit", category: "Materials", amount: 12000, proposedAllocation: "A" });
    expect(expenses[0]).toMatchObject({ status: "AWAITING_ALLOCATION", final_allocation: null });
  });
});
