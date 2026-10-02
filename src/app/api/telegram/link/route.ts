import { NextResponse } from "next/server";
import { z } from "zod";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";

const schema=z.object({code:z.enum(["svetlana","richard","anastasia","jean_claude","kevin"]),telegramUserId:z.coerce.number().int().positive(),telegramChatId:z.coerce.number().int().optional()});
type TransferResult={previous_employee_name:string|null;target_employee_name:string};
export async function POST(request:Request){
 const role=await currentDemoRole();const manager=role&&await createTransactionRepository().findEmployee(role);
 if(!manager||manager.role!=="manager")return NextResponse.json({error:"Only Svetlana can move Telegram test accounts."},{status:403});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter a valid employee and Telegram user ID."},{status:400});
 const {data,error}=await createSupabaseAdmin().rpc("transfer_telegram_identity",{p_target_code:parsed.data.code,p_telegram_user_id:parsed.data.telegramUserId,p_telegram_chat_id:parsed.data.telegramChatId??null}).single();
 if(error||!data)return NextResponse.json({error:error?.code==="22023"?error.message:"The Telegram test account could not be moved."},{status:400});
 const transfer=data as TransferResult;const previous=transfer.previous_employee_name;const target=transfer.target_employee_name;
 const message=previous&&previous!==target?`Telegram test account moved from ${previous} to ${target}.`:`Telegram test account is linked to ${target}.`;
 return NextResponse.json({ok:true,previousEmployee:previous,currentEmployee:target,message});
}
