import { NextResponse } from "next/server";
import { approveSale, TransactionError } from "@/lib/domain/transactions";
import { firstValidationError, saleApprovalSchema } from "@/lib/domain/validation";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const role = await currentDemoRole();
  if (!role) return NextResponse.json({ error: "Select a demonstration role first." }, { status: 401 });
  const parsed = saleApprovalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
  try {
    const { reference } = await params;
    return NextResponse.json(await approveSale(createTransactionRepository(), role, reference, { richard: parsed.data.richardPct, anastasia: parsed.data.anastasiaPct, jean_claude: parsed.data.jeanClaudePct }));
  } catch (error) {
    if (error instanceof TransactionError) return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 500 });
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
