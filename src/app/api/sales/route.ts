import { NextResponse } from "next/server";
import { TransactionError, submitSale } from "@/lib/domain/transactions";
import { firstValidationError, saleSubmissionSchema } from "@/lib/domain/validation";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";
import { syncTransaction } from "@/lib/server/integrations";

export async function POST(request: Request) {
  const role = await currentDemoRole();
  if (!role) return NextResponse.json({ error: "Select a demonstration role first." }, { status: 401 });
  const parsed = saleSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
  try {
    const result=await submitSale(createTransactionRepository(), role, parsed.data); await syncTransaction("SALE",result.reference);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "DUPLICATE" ? 409 : 500 });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
