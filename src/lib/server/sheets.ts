import "server-only";
import { google } from "googleapis";
import type { ExpenseRecord, SaleRecord } from "@/lib/domain/types";
import { getSheetsEnv } from "./env";

const saleHeaders = ["Reference","Submitted at","Channel","Employee","Customer","Project","Description","Amount","Status","Proposed Richard %","Proposed Anastasia %","Proposed Jean-Claude %","Final Richard %","Final Anastasia %","Final Jean-Claude %","Commission pool","Richard commission","Anastasia commission","Jean-Claude commission","Approved at"];
const expenseHeaders = ["Reference","Submitted at","Channel","Employee","Description","Category","Amount","Status","Proposed allocation","Final allocation","Allocated at"];

function client() {
  const env = getSheetsEnv();
  const auth = new google.auth.JWT({ email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g,"\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return { sheets: google.sheets({ version:"v4", auth }), spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID };
}

type NumberFormat = { startColumnIndex: number; endColumnIndex: number; pattern: string };

export function findUpsertRow(existing: unknown[][], reference: string) {
  const index = existing.findIndex((row) => row[0] === reference);
  return index < 0 ? existing.length + 2 : index + 2;
}

async function ensureSheet(title: string, headers: string[], formats: NumberFormat[]) {
  const { sheets, spreadsheetId } = client();
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields:"sheets.properties" });
  let target = meta.data.sheets?.find(s=>s.properties?.title===title)?.properties;
  if (!target) {
    const added = await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody:{requests:[{addSheet:{properties:{title}}}]} });
    target = added.data.replies?.[0]?.addSheet?.properties;
  }
  await sheets.spreadsheets.values.update({ spreadsheetId, range:`${title}!A1:${String.fromCharCode(64+headers.length)}1`, valueInputOption:"RAW", requestBody:{values:[headers]} });
  if (target?.sheetId !== undefined) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody:{requests:[
    {updateSheetProperties:{properties:{sheetId:target.sheetId,gridProperties:{frozenRowCount:1}},fields:"gridProperties.frozenRowCount"}},
    {setBasicFilter:{filter:{range:{sheetId:target.sheetId,startRowIndex:0,startColumnIndex:0,endColumnIndex:headers.length}}}},
    {autoResizeDimensions:{dimensions:{sheetId:target.sheetId,dimension:"COLUMNS",startIndex:0,endIndex:headers.length}}},
    ...formats.map((format) => ({ repeatCell: { range: { sheetId: target!.sheetId!, startRowIndex: 1, startColumnIndex: format.startColumnIndex, endColumnIndex: format.endColumnIndex }, cell: { userEnteredFormat: { numberFormat: { type: format.pattern.includes("%") ? "PERCENT" : "CURRENCY", pattern: format.pattern } } }, fields: "userEnteredFormat.numberFormat" } })),
  ]} });
  return { sheets, spreadsheetId };
}

async function upsert(title:string, headers:string[], reference:string, values:unknown[], formats:NumberFormat[]) {
  const { sheets, spreadsheetId } = await ensureSheet(title, headers, formats);
  const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range:`${title}!A2:A` });
  const row = findUpsertRow(existing.data.values ?? [], reference);
  await sheets.spreadsheets.values.update({ spreadsheetId, range:`${title}!A${row}`, valueInputOption:"USER_ENTERED", requestBody:{values:[values]} });
}

export async function upsertSale(s: SaleRecord & Record<string, unknown>) {
  await upsert("Sales",saleHeaders,s.reference,[s.reference,s.submitted_at,s.submission_channel,s.submitter_name??s.submitting_employee_id,s.customer,s.project,s.description,s.amount_cents/100,s.status,s.proposed_richard_pct/100,s.proposed_anastasia_pct/100,s.proposed_jean_claude_pct/100,s.approved_richard_pct===null?"":s.approved_richard_pct/100,s.approved_anastasia_pct===null?"":s.approved_anastasia_pct/100,s.approved_jean_claude_pct===null?"":s.approved_jean_claude_pct/100,s.commission_pool_cents/100,s.richard_commission_cents/100,s.anastasia_commission_cents/100,s.jean_claude_commission_cents/100,s.approved_at??""],[{startColumnIndex:7,endColumnIndex:8,pattern:"€#,##0.00"},{startColumnIndex:9,endColumnIndex:15,pattern:"0.00%"},{startColumnIndex:15,endColumnIndex:19,pattern:"€#,##0.00"}]);
}

export async function upsertExpense(e: ExpenseRecord & Record<string, unknown>) {
  await upsert("Expenses",expenseHeaders,e.reference,[e.reference,e.submitted_at,e.submission_channel,e.submitter_name??e.submitting_employee_id,e.description,e.category,e.amount_cents/100,e.status,e.proposed_allocation,e.final_allocation??"",e.allocated_at??""],[{startColumnIndex:6,endColumnIndex:7,pattern:"€#,##0.00"}]);
}
