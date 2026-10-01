import type { EmployeeRole } from "./types";

export const employeeCodes = ["svetlana", "richard", "anastasia", "jean_claude", "kevin"] as const;
export type EmployeeCode = (typeof employeeCodes)[number];

export interface EmployeeIdentity {
  id: string;
  code: EmployeeCode;
  displayName: string;
  role: EmployeeRole;
  telegramChatId?: number | null;
}

export const demonstrationEmployees: Array<Omit<EmployeeIdentity, "id">> = [
  { code: "svetlana", displayName: "Svetlana de Monte Carlo", role: "manager" },
  { code: "richard", displayName: "Richard Darling", role: "salesperson" },
  { code: "anastasia", displayName: "Anastasia Ferrari", role: "salesperson" },
  { code: "jean_claude", displayName: "Jean-Claude Berzins", role: "salesperson" },
  { code: "kevin", displayName: "Kevin von Whatever", role: "expense_reporter" },
];

export function isEmployeeCode(value: string): value is EmployeeCode {
  return employeeCodes.includes(value as EmployeeCode);
}
