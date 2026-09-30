import { NextResponse } from "next/server";
import { allocateExpense, TransactionError } from "@/lib/domain/transactions";
import { expenseAllocationSchema, firstValidationError } from "@/lib/domain/validation";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const role = await currentDemoRole();
  if (!role) return NextResponse.json({ error: "Select a demonstration role first." }, { status: 401 });
  const parsed = expenseAllocationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
  try {
    const { reference } = await params;
    return NextResponse.json(await allocateExpense(createTransactionRepository(), role, reference, parsed.data.allocation));
  } catch (error) {
    if (error instanceof TransactionError) return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 500 });
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
