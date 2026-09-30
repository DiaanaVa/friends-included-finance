import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isEmployeeCode, type EmployeeCode } from "@/lib/domain/employees";
import { getSupabaseEnv } from "./env";

const cookieName = "friends_demo_role";

function signature(code: string) {
  return createHmac("sha256", getSupabaseEnv().DEMO_ACCESS_SECRET).update(code).digest("base64url");
}

export function makeDemoRoleToken(code: EmployeeCode): string {
  return `${code}.${signature(code)}`;
}

export function verifyDemoRoleToken(token: string | undefined): EmployeeCode | null {
  if (!token) return null;
  const [code, supplied] = token.split(".");
  if (!code || !supplied || !isEmployeeCode(code)) return null;
  const expected = signature(code);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? code : null;
}

export async function currentDemoRole(): Promise<EmployeeCode | null> {
  return verifyDemoRoleToken((await cookies()).get(cookieName)?.value);
}

export const demoRoleCookie = cookieName;
