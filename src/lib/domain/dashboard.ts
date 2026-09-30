import type { DashboardTotals, ExpenseRecord, SaleRecord } from "./types";

export function calculateDashboard(sales: SaleRecord[], expenses: ExpenseRecord[]): DashboardTotals {
  const result: DashboardTotals = {
    projectA: { incomeCents: 0, commissionCents: 0, expensesCents: 0, resultCents: 0 },
    projectB: { incomeCents: 0, commissionCents: 0, expensesCents: 0, resultCents: 0 },
    company: { incomeCents: 0, commissionCents: 0, recordedExpensesCents: 0, overheadCents: 0, awaitingAllocationCents: 0, resultCents: 0 },
    commissionsByEmployee: { richard: 0, anastasia: 0, jean_claude: 0 }, pendingSales: 0, pendingExpenseAllocations: 0,
  };
  for (const sale of sales) {
    if (sale.status !== "APPROVED") { result.pendingSales++; continue; }
    const project = sale.project === "A" ? result.projectA : result.projectB;
    project.incomeCents += sale.amount_cents; project.commissionCents += sale.commission_pool_cents;
    result.company.incomeCents += sale.amount_cents; result.company.commissionCents += sale.commission_pool_cents;
    result.commissionsByEmployee.richard += sale.richard_commission_cents;
    result.commissionsByEmployee.anastasia += sale.anastasia_commission_cents;
    result.commissionsByEmployee.jean_claude += sale.jean_claude_commission_cents;
  }
  for (const expense of expenses) {
    result.company.recordedExpensesCents += expense.amount_cents;
    if (expense.status === "AWAITING_ALLOCATION") { result.pendingExpenseAllocations++; result.company.awaitingAllocationCents += expense.amount_cents; }
    else if (expense.final_allocation === "OVERHEAD") result.company.overheadCents += expense.amount_cents;
    else if (expense.final_allocation === "A") result.projectA.expensesCents += expense.amount_cents;
    else if (expense.final_allocation === "B") result.projectB.expensesCents += expense.amount_cents;
  }
  result.projectA.resultCents = result.projectA.incomeCents - result.projectA.commissionCents - result.projectA.expensesCents;
  result.projectB.resultCents = result.projectB.incomeCents - result.projectB.commissionCents - result.projectB.expensesCents;
  result.company.resultCents = result.company.incomeCents - result.company.commissionCents - result.company.recordedExpensesCents;
  return result;
}

export function recordsVisibleTo(employeeId: string, isManager: boolean, sales: SaleRecord[], expenses: ExpenseRecord[]) {
  return isManager ? { sales, expenses } : {
    sales: sales.filter((row) => row.submitting_employee_id === employeeId),
    expenses: expenses.filter((row) => row.submitting_employee_id === employeeId),
  };
}
