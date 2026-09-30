import { NextResponse } from "next/server";
import { calculateDashboard, recordsVisibleTo } from "@/lib/domain/dashboard";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";

export async function GET() {
  const code = await currentDemoRole();
  if (!code) return NextResponse.json({ error: "Select a demonstration role first." }, { status: 401 });
  const repo = createTransactionRepository();
  const actor = await repo.findEmployee(code);
  if (!actor) return NextResponse.json({ error: "Employee not found." }, { status: 403 });
  const [allSales, allExpenses] = await Promise.all([repo.listSales(), repo.listExpenses()]);
  const { sales, expenses } = recordsVisibleTo(actor.id, actor.role === "manager", allSales, allExpenses);
  return NextResponse.json({ role: actor.role, sales, expenses, totals: actor.role === "manager" ? calculateDashboard(allSales, allExpenses) : null });
}
