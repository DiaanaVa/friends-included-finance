import { NextResponse } from "next/server";
import { z } from "zod";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";
import { deliverDecisionNotification } from "@/lib/server/integrations";
const schema=z.object({kind:z.enum(["SALE","EXPENSE"]),reference:z.string().regex(/^[SE][0-9]+$/)});
export async function POST(request:Request){const role=await currentDemoRole();const employee=role&&await createTransactionRepository().findEmployee(role);if(!employee||employee.role!=="manager")return NextResponse.json({error:"Only Svetlana can retry notifications."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid retry request."},{status:400});return NextResponse.json(await deliverDecisionNotification(parsed.data.kind,parsed.data.reference));}
