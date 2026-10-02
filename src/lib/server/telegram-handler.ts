import "server-only";
import { telegramHelpText } from "@/lib/domain/telegram-help";
import { expenseSubmissionSchema, firstValidationError, saleSubmissionSchema } from "@/lib/domain/validation";
import { submitExpense, submitSale, TransactionError } from "@/lib/domain/transactions";
import { createTransactionRepository } from "./transaction-repository";
import { createSupabaseAdmin } from "./supabase-admin";
import { syncTransaction } from "./integrations";
import { sendTelegramMessage, type TelegramUpdate } from "./telegram";

type Conversation={telegram_user_id:number;telegram_chat_id:number;transaction_kind:"SALE"|"EXPENSE";step:string;payload:Record<string,string>};
const saleSteps=["reference","customer","project","description","amount","split"] as const;
const expenseSteps=["reference","category","description","amount","allocation"] as const;
const prompts:Record<string,string>={reference:"Enter the transaction reference (for example S01 or E01).",customer:"Enter the customer name.",project:"Enter project A or B.",description:"Enter a description.",amount:"Enter the amount in euros, for example 125.50.",split:"Enter Richard, Anastasia, and Jean-Claude percentages separated by commas, for example 50,30,20.",category:"Enter Materials, Travel, or Other.",allocation:"Enter A, B, or OVERHEAD."};

async function say(chatId:number,text:string){await sendTelegramMessage(chatId,text);}
async function loadEmployee(userId:number){const {data}=await createSupabaseAdmin().from("employees").select("id,code,display_name,role,telegram_user_id,telegram_chat_id").eq("telegram_user_id",userId).maybeSingle();return data;}
async function saveConversation(c:Conversation){await createSupabaseAdmin().from("telegram_conversations").upsert({...c,updated_at:new Date().toISOString()});}
async function clearConversation(userId:number){await createSupabaseAdmin().from("telegram_conversations").delete().eq("telegram_user_id",userId);}

export async function handleTelegramUpdate(update:TelegramUpdate){
 const db=createSupabaseAdmin();
 const {error:dedupeError}=await db.from("telegram_updates").insert({update_id:update.update_id});
 if(dedupeError?.code==="23505") return {duplicate:true};
 if(dedupeError) throw dedupeError;
 const message=update.message; if(!message?.from?.id||!message.text)return {ignored:true};
 const userId=message.from.id,chatId=message.chat.id,text=message.text.trim();
 if(text==="/whoami"){await say(chatId,`Your Telegram user ID is ${userId}. Ask Svetlana to link it to your employee record.`);return {handled:true};}
 const employee=await loadEmployee(userId);
 if(!employee){await say(chatId,"This Telegram account is not linked. Send /whoami, then ask Svetlana to link your ID in the website manager view.");return {handled:true};}
 await db.from("employees").update({telegram_chat_id:chatId,updated_at:new Date().toISOString()}).eq("id",employee.id);
 if(text==="/cancel"){await clearConversation(userId);await say(chatId,"Cancelled.");return {handled:true};}
 if(text==="/start"||text==="/help"){await say(chatId,telegramHelpText(employee.display_name,employee.role));return {handled:true};}
 if(text==="/sale"){
   if(employee.role!=="salesperson"){await say(chatId,"Only salespeople can submit sales.");return {handled:true};}
   await saveConversation({telegram_user_id:userId,telegram_chat_id:chatId,transaction_kind:"SALE",step:"reference",payload:{}});await say(chatId,prompts.reference);return {handled:true};
 }
 if(text==="/expense"){
   if(employee.role!=="expense_reporter"){await say(chatId,"Only Kevin can submit expenses.");return {handled:true};}
   await saveConversation({telegram_user_id:userId,telegram_chat_id:chatId,transaction_kind:"EXPENSE",step:"reference",payload:{}});await say(chatId,prompts.reference.replace("S01 or E01","E01"));return {handled:true};
 }
 const {data:conversation}=await db.from("telegram_conversations").select("*").eq("telegram_user_id",userId).maybeSingle() as {data:Conversation|null};
 if(!conversation){await say(chatId,"Send /sale or /expense to begin, or /help for instructions.");return {handled:true};}
 const payload={...conversation.payload,[conversation.step]:text};
 const steps=conversation.transaction_kind==="SALE"?saleSteps:expenseSteps; const index=steps.indexOf(conversation.step as never);
 if(index<steps.length-1){const next=steps[index+1];await saveConversation({...conversation,telegram_chat_id:chatId,step:next,payload});await say(chatId,prompts[next]);return {handled:true};}
 try{
   if(conversation.transaction_kind==="SALE"){
     const split=(payload.split??"").split(",").map(Number); const parsed=saleSubmissionSchema.safeParse({reference:payload.reference,customer:payload.customer,project:payload.project?.toUpperCase(),description:payload.description,amount:payload.amount,proposedRichardPct:split[0],proposedAnastasiaPct:split[1],proposedJeanClaudePct:split[2]});
     if(!parsed.success){await say(chatId,`${firstValidationError(parsed.error)} Send /sale to start again.`);await clearConversation(userId);return {handled:true};}
     const result=await submitSale(createTransactionRepository(),employee.code,parsed.data,{channel:"TELEGRAM",telegramChatId:chatId});await clearConversation(userId);await syncTransaction("SALE",result.reference);await say(chatId,`${result.reference} saved. Amount: €${(parsed.data.amount/100).toFixed(2)}. Project: ${parsed.data.project}. Status: PENDING APPROVAL.`);
   }else{
     const parsed=expenseSubmissionSchema.safeParse({reference:payload.reference,category:payload.category,description:payload.description,amount:payload.amount,proposedAllocation:payload.allocation?.toUpperCase()});
     if(!parsed.success){await say(chatId,`${firstValidationError(parsed.error)} Send /expense to start again.`);await clearConversation(userId);return {handled:true};}
     const result=await submitExpense(createTransactionRepository(),employee.code,parsed.data,{channel:"TELEGRAM",telegramChatId:chatId});await clearConversation(userId);await syncTransaction("EXPENSE",result.reference);await say(chatId,`${result.reference} saved. Amount: €${(parsed.data.amount/100).toFixed(2)}. Proposed allocation: ${parsed.data.proposedAllocation}. Status: ${result.status.replaceAll("_"," ")}.`);
   }
 }catch(error){await clearConversation(userId);await say(chatId,`${error instanceof TransactionError?error.message:"The transaction could not be saved."} Send the command again to retry.`);}
 return {handled:true};
}
