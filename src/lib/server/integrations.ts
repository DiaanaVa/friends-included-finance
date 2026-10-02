import "server-only";
import { decisionText } from "@/lib/domain/integration-messages";
import { createSupabaseAdmin } from "./supabase-admin";
import { upsertExpense, upsertSale } from "./sheets";
import { sendTelegramMessage } from "./telegram";

type Kind = "SALE" | "EXPENSE";
async function recordAttempt(kind:Kind,id:string,operation:"SHEETS_SYNC"|"TELEGRAM_NOTIFICATION",succeeded:boolean,error?:string) {
  const db=createSupabaseAdmin();
  const {count}=await db.from("integration_attempts").select("id",{count:"exact",head:true}).eq("transaction_kind",kind).eq("transaction_id",id).eq("operation",operation);
  await db.from("integration_attempts").insert({transaction_kind:kind,transaction_id:id,operation,attempt_number:(count??0)+1,succeeded,error_message:error??null});
}

export async function syncTransaction(kind:Kind,reference:string) {
  const db=createSupabaseAdmin(); const table=kind==="SALE"?"sales":"expenses";
  const {data,error}=await db.from(table).select("*").eq("reference",reference).single();
  if(error||!data) throw new Error(`${kind} not found for Sheets synchronization.`);
  try {
    const {data:submitter,error:submitterError}=await db.from("employees").select("display_name").eq("id",data.submitting_employee_id).single();
    if(submitterError||!submitter) throw new Error("Submitting employee not found for Sheets synchronization.");
    const sheetRow={...data,submitter_name:submitter.display_name};
    if(kind==="SALE") await upsertSale(sheetRow); else await upsertExpense(sheetRow);
    await db.from(table).update({sheets_sync_status:"SYNCED",sheets_sync_error:null,updated_at:new Date().toISOString()}).eq("id",data.id);
    await recordAttempt(kind,data.id,"SHEETS_SYNC",true);
    return {synced:true};
  } catch(error) {
    const message=error instanceof Error?error.message:"Sheets synchronization failed.";
    await db.from(table).update({sheets_sync_status:"FAILED",sheets_sync_error:message,updated_at:new Date().toISOString()}).eq("id",data.id);
    await recordAttempt(kind,data.id,"SHEETS_SYNC",false,message);
    return {synced:false,error:message};
  }
}

export async function deliverDecisionNotification(kind:Kind,reference:string) {
  const db=createSupabaseAdmin(); const table=kind==="SALE"?"sales":"expenses";
  const {data,error}=await db.from(table).select("*").eq("reference",reference).single();
  if(error||!data) throw new Error(`${kind} not found for notification.`);
  if(!data.original_telegram_chat_id) {
    await db.from(table).update({notification_status:"NOT_REQUIRED",notification_error:null}).eq("id",data.id);
    return {sent:false,notRequired:true};
  }
  if(data.notification_status==="SENT") return {sent:true,alreadySent:true};
  await db.from(table).update({notification_status:"PENDING",notification_error:null}).eq("id",data.id);
  try {
    await sendTelegramMessage(Number(data.original_telegram_chat_id),decisionText(kind,data));
    await db.from(table).update({notification_status:"SENT",notification_error:null,updated_at:new Date().toISOString()}).eq("id",data.id);
    await recordAttempt(kind,data.id,"TELEGRAM_NOTIFICATION",true); return {sent:true};
  } catch(error) {
    const message=error instanceof Error?error.message:"Telegram delivery failed.";
    await db.from(table).update({notification_status:"FAILED",notification_error:message,updated_at:new Date().toISOString()}).eq("id",data.id);
    await recordAttempt(kind,data.id,"TELEGRAM_NOTIFICATION",false,message); return {sent:false,error:message};
  }
}
