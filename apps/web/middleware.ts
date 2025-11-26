// apps/web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // create server-side supabase client using cookies (middleware-friendly)
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          /* noop for middleware */
        }
      }
    }
  );

  // get supabase user from cookies
  const { data } = await sb.auth.getUser();
  const user = data.user ?? null;

  // pages that are the "auth" pages
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // if unauthenticated and not on auth pages -> send to login
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // if authenticated and on auth pages -> send to root (NOT /dashboard)
  if (user && isAuthPage) {
    // redirect authenticated users away from auth pages to '/'
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

/*
 IMPORTANT: matcher intentionally excludes "/" to avoid redirect races on the homepage.
 If you *do* want "/" protected too then add it back — but you'll need to make sure your client
 redirect and middleware agree on the destination.
*/
export const config = {
  matcher: [
    // do NOT include "/" here — prevents race when client redirects to "/"
    "/dashboard",
    "/users/:path*",
    "/roles/:path*",
    "/permissions/:path*",
    "/login",
    "/register",
  ],
};