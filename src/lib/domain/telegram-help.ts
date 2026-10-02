import type { EmployeeRole } from "./types";

export function telegramHelpText(displayName: string, role: EmployeeRole) {
  if (role === "salesperson") return `Hello ${displayName}. Your linked role is salesperson. Use /sale to submit a sale.`;
  if (role === "expense_reporter") return `Hello ${displayName}. Your linked role is expense reporter. Use /expense to submit an expense.`;
  return `Hello ${displayName}. Your linked role is manager. Use the website manager view for approvals and Telegram account transfers.`;
}
