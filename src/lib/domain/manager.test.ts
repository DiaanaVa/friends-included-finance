import { describe, expect, it } from "vitest";
import { approveSale, allocateExpense, TransactionError, type TransactionRepository } from "./transactions";
import type { EmployeeIdentity } from "./employees";
import type { SaleRecord } from "./types";
const manager:EmployeeIdentity={id:"m",code:"svetlana",displayName:"Svetlana",role:"manager"}; const worker:EmployeeIdentity={id:"r",code:"richard",displayName:"Richard",role:"salesperson"};
const pending:SaleRecord={id:"s",reference:"S1",submitted_at:"",submitting_employee_id:"r",customer:"C",project:"A",description:"D",amount_cents:10005,status:"PENDING_APPROVAL",proposed_richard_pct:50,proposed_anastasia_pct:25,proposed_jean_claude_pct:25,approved_richard_pct:null,approved_anastasia_pct:null,approved_jean_claude_pct:null,commission_pool_cents:0,richard_commission_cents:0,anastasia_commission_cents:0,jean_claude_commission_cents:0,approved_at:null,approved_by:null};
function repo(actor:EmployeeIdentity,outcome:"UPDATED"|"ALREADY_PROCESSED"="UPDATED"){let approvals=0;const r:TransactionRepository={findEmployee:async()=>actor,insertSale:async()=>{},insertExpense:async()=>{},listSales:async()=>[pending],listExpenses:async()=>[],approvePendingSale:async(_ref,_id,_split,amounts)=>{approvals++;expect(amounts.poolCents).toBe(1001);expect(amounts.richardCents+amounts.anastasiaCents+amounts.jeanClaudeCents).toBe(1001);return outcome;},allocatePendingExpense:async()=>outcome};return{r,get approvals(){return approvals;}};}
describe("manager decisions",()=>{
 it("approves unchanged or changed valid splits and reports idempotent retries",async()=>{const a=repo(manager);await approveSale(a.r,"svetlana","S1",{richard:50,anastasia:25,jean_claude:25});expect(a.approvals).toBe(1);const b=repo(manager,"ALREADY_PROCESSED");expect((await approveSale(b.r,"svetlana","S1",{richard:40,anastasia:40,jean_claude:20})).alreadyProcessed).toBe(true);});
 it("denies non-managers before any mutation",async()=>{const x=repo(worker);await expect(allocateExpense(x.r,"richard","E1","A")).rejects.toBeInstanceOf(TransactionError);expect(x.approvals).toBe(0);});
});
