import { NextResponse } from "next/server";
import { z } from "zod";
import { currentDemoRole } from "@/lib/server/demo-session";
import { createTransactionRepository } from "@/lib/server/transaction-repository";
import { createSupabaseAdmin } from "@/lib/server/supabase-admin";

const schema=z.object({code:z.enum(["svetlana","richard","anastasia","jean_claude","kevin"]),telegramUserId:z.coerce.number().int().positive(),telegramChatId:z.coerce.number().int().optional()});
export async function POST(request:Request){
 const role=await currentDemoRole();const manager=role&&await createTransactionRepository().findEmployee(role);
 if(!manager||manager.role!=="manager")return NextResponse.json({error:"Only Svetlana can link Telegram accounts."},{status:403});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter a valid employee and Telegram user ID."},{status:400});
 const {error}=await createSupabaseAdmin().from("employees").update({telegram_user_id:parsed.data.telegramUserId,telegram_chat_id:parsed.data.telegramChatId??parsed.data.telegramUserId,updated_at:new Date().toISOString()}).eq("code",parsed.data.code);
 if(error)return NextResponse.json({error:error.code==="23505"?"That Telegram account is already linked.":"The Telegram account could not be linked."},{status:400});
 return NextResponse.json({ok:true});
}
