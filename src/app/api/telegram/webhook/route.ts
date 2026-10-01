import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getTelegramEnv } from "@/lib/server/env";
import { handleTelegramUpdate } from "@/lib/server/telegram-handler";
import type { TelegramUpdate } from "@/lib/server/telegram";

function validSecret(value:string|null,expected:string){if(!value)return false;const a=Buffer.from(value),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
export async function POST(request:Request){
 const {TELEGRAM_WEBHOOK_SECRET}=getTelegramEnv();
 if(!validSecret(request.headers.get("x-telegram-bot-api-secret-token"),TELEGRAM_WEBHOOK_SECRET))return NextResponse.json({error:"Unauthorized"},{status:401});
 const update=await request.json().catch(()=>null) as TelegramUpdate|null;
 if(!update||!Number.isSafeInteger(update.update_id))return NextResponse.json({error:"Invalid Telegram update."},{status:400});
 await handleTelegramUpdate(update);return NextResponse.json({ok:true});
}
