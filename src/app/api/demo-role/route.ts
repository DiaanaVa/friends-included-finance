import { NextResponse } from "next/server";
import { isEmployeeCode } from "@/lib/domain/employees";
import { demoRoleCookie, makeDemoRoleToken } from "@/lib/server/demo-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { code?: string } | null;
  if (!body?.code || !isEmployeeCode(body.code)) {
    return NextResponse.json({ error: "Choose a valid demonstration role." }, { status: 400 });
  }
  const response = NextResponse.json({ code: body.code });
  response.cookies.set(demoRoleCookie, makeDemoRoleToken(body.code), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
