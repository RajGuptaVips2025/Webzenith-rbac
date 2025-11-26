// app/api/auth/set-cookie/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { session } = await req.json(); // session from client after signIn
  const res = NextResponse.json({ ok: true });

  // set access token cookie (httpOnly)
  res.cookies.set("sb-access-token", session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: session.expires_in,
  });

  // set refresh token
  res.cookies.set("sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // you can also set other cookies if needed
  return res;
}
