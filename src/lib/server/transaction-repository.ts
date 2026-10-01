import "server-only";
import type { EmployeeIdentity } from "@/lib/domain/employees";
import { isEmployeeCode } from "@/lib/domain/employees";
import { TransactionError, type TransactionRepository } from "@/lib/domain/transactions";
import type { ExpenseRecord, SaleRecord } from "@/lib/domain/types";
import { createSupabaseAdmin } from "./supabase-admin";

function translateDatabaseError(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new TransactionError("DUPLICATE", "That transaction reference already exists.");
  throw new TransactionError("DATABASE", "The transaction could not be saved. Please try again.");
}

export function createTransactionRepository(): TransactionRepository {
  const db = createSupabaseAdmin();
  return {
    async findEmployee(code) {
      const { data, error } = await db.from("employees").select("id,code,display_name,role,telegram_chat_id").eq("code", code).maybeSingle();
      if (error) translateDatabaseError(error);
      if (!data || !isEmployeeCode(data.code)) return null;
      return { id: data.id, code: data.code, displayName: data.display_name, role: data.role, telegramChatId: data.telegram_chat_id === null ? null : Number(data.telegram_chat_id) } as EmployeeIdentity;
    },
    async insertSale(input) {
      const { error } = await db.from("sales").insert(input);
      if (error) translateDatabaseError(error);
    },
    async insertExpense(input) {
      const { error } = await db.from("expenses").insert(input);
      if (error) translateDatabaseError(error);
    },
    async listSales() {
      const { data, error } = await db.from("sales").select("*").order("submitted_at", { ascending: false });
      if (error) translateDatabaseError(error);
      return (data ?? []).map((row) => ({ ...row, amount_cents: Number(row.amount_cents), proposed_richard_pct: Number(row.proposed_richard_pct), proposed_anastasia_pct: Number(row.proposed_anastasia_pct), proposed_jean_claude_pct: Number(row.proposed_jean_claude_pct), approved_richard_pct: row.approved_richard_pct === null ? null : Number(row.approved_richard_pct), approved_anastasia_pct: row.approved_anastasia_pct === null ? null : Number(row.approved_anastasia_pct), approved_jean_claude_pct: row.approved_jean_claude_pct === null ? null : Number(row.approved_jean_claude_pct), commission_pool_cents: Number(row.commission_pool_cents), richard_commission_cents: Number(row.richard_commission_cents), anastasia_commission_cents: Number(row.anastasia_commission_cents), jean_claude_commission_cents: Number(row.jean_claude_commission_cents) })) as SaleRecord[];
    },
    async listExpenses() {
      const { data, error } = await db.from("expenses").select("*").order("submitted_at", { ascending: false });
      if (error) translateDatabaseError(error);
      return (data ?? []).map((row) => ({ ...row, amount_cents: Number(row.amount_cents) })) as ExpenseRecord[];
    },
    async approvePendingSale(reference, approverId, split, amounts) {
      const { data, error } = await db.from("sales").update({
        approved_richard_pct: split.richard, approved_anastasia_pct: split.anastasia, approved_jean_claude_pct: split.jean_claude,
        commission_pool_cents: amounts.poolCents, richard_commission_cents: amounts.richardCents,
        anastasia_commission_cents: amounts.anastasiaCents, jean_claude_commission_cents: amounts.jeanClaudeCents,
        approved_by: approverId, approved_at: new Date().toISOString(), status: "APPROVED", updated_at: new Date().toISOString(),
      }).eq("reference", reference).eq("status", "PENDING_APPROVAL").select("id").maybeSingle();
      if (error) translateDatabaseError(error);
      if (data) return "UPDATED";
      const { data: existing, error: lookupError } = await db.from("sales").select("id").eq("reference", reference).maybeSingle();
      if (lookupError) translateDatabaseError(lookupError);
      return existing ? "ALREADY_PROCESSED" : "NOT_FOUND";
    },
    async allocatePendingExpense(reference, approverId, allocation) {
      const now = new Date().toISOString();
      const { data, error } = await db.from("expenses").update({ final_allocation: allocation, allocated_by: approverId, allocated_at: now, status: "ALLOCATED", updated_at: now })
        .eq("reference", reference).eq("status", "AWAITING_ALLOCATION").select("id").maybeSingle();
      if (error) translateDatabaseError(error);
      if (data) return "UPDATED";
      const { data: existing, error: lookupError } = await db.from("expenses").select("id").eq("reference", reference).maybeSingle();
      if (lookupError) translateDatabaseError(lookupError);
      return existing ? "ALREADY_PROCESSED" : "NOT_FOUND";
    },
  };
}
