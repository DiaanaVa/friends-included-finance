import { NextResponse } from "next/server";
import { approveSale, TransactionError } from "@/lib/domain/transactions";
import { firstValidationError, saleApprovalSchema } from "@/lib/domain/validation";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";
import { deliverDecisionNotification, syncTransaction } from "@/lib/server/integrations";

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const role = await currentDemoRole();
  if (!role) return NextResponse.json({ error: "Select a demonstration role first." }, { status: 401 });
  const parsed = saleApprovalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
  try {
    const { reference } = await params;
    const result=await approveSale(createTransactionRepository(), role, reference, { richard: parsed.data.richardPct, anastasia: parsed.data.anastasiaPct, jean_claude: parsed.data.jeanClaudePct });
    if(!result.alreadyProcessed){ await syncTransaction("SALE",reference); await deliverDecisionNotification("SALE",reference); }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TransactionError) return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 500 });
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
