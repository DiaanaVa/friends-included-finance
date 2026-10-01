import { NextResponse } from "next/server";
import { z } from "zod";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";
import { setTelegramWebhook } from "@/lib/server/telegram";
const schema=z.object({baseUrl:z.url().optional()});
export async function POST(request:Request){const role=await currentDemoRole();const employee=role&&await createTransactionRepository().findEmployee(role);if(!employee||employee.role!=="manager")return NextResponse.json({error:"Only Svetlana can configure the webhook."},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return NextResponse.json({error:"Invalid application URL."},{status:400});const base=(parsed.data.baseUrl??process.env.APP_BASE_URL??"").replace(/\/$/,"");if(!base.startsWith("https://"))return NextResponse.json({error:"APP_BASE_URL must be an HTTPS URL."},{status:400});return NextResponse.json(await setTelegramWebhook(`${base}/api/telegram/webhook`));}
