import { describe, expect, it } from "vitest";
import { calculateDashboard, recordsVisibleTo } from "./dashboard";
import type { ExpenseRecord, SaleRecord } from "./types";

const sale = (overrides: Partial<SaleRecord> = {}): SaleRecord => ({ id:"s",reference:"S1",submitted_at:"",submitting_employee_id:"r",customer:"C",project:"A",description:"D",amount_cents:10000,status:"APPROVED",proposed_richard_pct:50,proposed_anastasia_pct:30,proposed_jean_claude_pct:20,approved_richard_pct:50,approved_anastasia_pct:30,approved_jean_claude_pct:20,commission_pool_cents:1000,richard_commission_cents:500,anastasia_commission_cents:300,jean_claude_commission_cents:200,approved_at:"",approved_by:"m",...overrides});
const expense = (overrides: Partial<ExpenseRecord> = {}): ExpenseRecord => ({ id:"e",reference:"E1",submitted_at:"",submitting_employee_id:"k",description:"D",category:"Other",amount_cents:2000,proposed_allocation:"A",final_allocation:"A",status:"ALLOCATED",allocated_at:"",allocated_by:"m",...overrides});
describe("financial dashboard",()=>{
 it("calculates project and company results from approved and recorded transactions",()=>{const t=calculateDashboard([sale()],[expense()]);expect(t.projectA.resultCents).toBe(7000);expect(t.company.resultCents).toBe(7000);expect(t.commissionsByEmployee.richard).toBe(500);});
 it("excludes pending sales and keeps awaiting expenses out of projects but in company result",()=>{const t=calculateDashboard([sale({status:"PENDING_APPROVAL",approved_at:null,approved_by:null})],[expense({status:"AWAITING_ALLOCATION",final_allocation:null,allocated_at:null,allocated_by:null})]);expect(t.projectA.resultCents).toBe(0);expect(t.company.resultCents).toBe(-2000);expect(t.company.awaitingAllocationCents).toBe(2000);expect(t.pendingSales).toBe(1);});
 it("includes a ten-euro sale exactly once only after approval",()=>{
  const pending=sale({amount_cents:1000,status:"PENDING_APPROVAL",approved_at:null,approved_by:null,commission_pool_cents:0,richard_commission_cents:0,anastasia_commission_cents:0,jean_claude_commission_cents:0});
  const before=calculateDashboard([pending],[]);
  expect(before.company.incomeCents).toBe(0);expect(before.company.commissionCents).toBe(0);expect(before.pendingSales).toBe(1);
  const approved=sale({amount_cents:1000,commission_pool_cents:100,richard_commission_cents:20,anastasia_commission_cents:30,jean_claude_commission_cents:50,approved_richard_pct:20,approved_anastasia_pct:30,approved_jean_claude_pct:50});
  const after=calculateDashboard([approved],[]);
  expect(after.projectA.resultCents).toBe(900);expect(after.company.resultCents).toBe(900);expect(after.commissionsByEmployee).toEqual({richard:20,anastasia:30,jean_claude:50});
 });
 it("shows employees only their records and managers everything",()=>{const sales=[sale(),sale({id:"s2",submitting_employee_id:"x"})];expect(recordsVisibleTo("r",false,sales,[]).sales).toHaveLength(1);expect(recordsVisibleTo("m",true,sales,[]).sales).toHaveLength(2);});
});
