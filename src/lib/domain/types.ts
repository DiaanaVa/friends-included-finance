export const employeeRoles = ["manager", "salesperson", "expense_reporter"] as const;
export type EmployeeRole = (typeof employeeRoles)[number];

export const salespersonCodes = ["richard", "anastasia", "jean_claude"] as const;
export type SalespersonCode = (typeof salespersonCodes)[number];
export type ProjectCode = "A" | "B";
export type ExpenseAllocation = ProjectCode | "OVERHEAD";

export type CommissionSplit = Record<SalespersonCode, number>;

export interface CommissionAmounts {
  poolCents: number;
  richardCents: number;
  anastasiaCents: number;
  jeanClaudeCents: number;
}

export interface DashboardTotals {
  projectA: { incomeCents: number; commissionCents: number; expensesCents: number; resultCents: number };
  projectB: { incomeCents: number; commissionCents: number; expensesCents: number; resultCents: number };
  company: {
    incomeCents: number;
    commissionCents: number;
    recordedExpensesCents: number;
    overheadCents: number;
    awaitingAllocationCents: number;
    resultCents: number;
  };
  commissionsByEmployee: Record<SalespersonCode, number>;
  pendingSales: number;
  pendingExpenseAllocations: number;
}

export interface SaleRecord {
  id: string; reference: string; submitted_at: string; submitting_employee_id: string; submitter_name?: string;
  customer: string; project: ProjectCode; description: string; amount_cents: number; status: "PENDING_APPROVAL" | "APPROVED";
  proposed_richard_pct: number; proposed_anastasia_pct: number; proposed_jean_claude_pct: number;
  approved_richard_pct: number | null; approved_anastasia_pct: number | null; approved_jean_claude_pct: number | null;
  commission_pool_cents: number; richard_commission_cents: number; anastasia_commission_cents: number; jean_claude_commission_cents: number;
  approved_at: string | null; approved_by: string | null;
}

export interface ExpenseRecord {
  id: string; reference: string; submitted_at: string; submitting_employee_id: string; submitter_name?: string;
  description: string; category: string; amount_cents: number; proposed_allocation: ExpenseAllocation;
  final_allocation: ExpenseAllocation | null; status: "AWAITING_ALLOCATION" | "ALLOCATED";
  allocated_at: string | null; allocated_by: string | null;
}
