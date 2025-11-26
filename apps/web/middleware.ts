// apps/web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";


function routePermissionMap(pathname: string): string | null {

  if (pathname.startsWith("/permissions")) return "permissions.read";
  if (pathname.startsWith("/roles")) return "roles.read";
  if (pathname.startsWith("/users")) return "users.read";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return null;

  return null;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
        },
      },
    }
  );

  const { data } = await sb.auth.getUser();
  const user = data.user ?? null;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const requiredPerm = routePermissionMap(pathname);
  if (requiredPerm && user) {
    try {
      const { data: appUser, error: appUserErr } = await sb
        .from("app_users")
        .select("role_id")
        .eq("id", user.id)
        .maybeSingle();

      if (appUserErr) {
        return NextResponse.redirect(new URL("/forbidden", req.url));
      }

      const roleId = appUser?.role_id;
      if (!roleId) {
        return NextResponse.redirect(new URL("/forbidden", req.url));
      }

      const { data: rpRows, error: rpErr } = await sb
        .from("role_permissions")
        .select("permission")
        .eq("role_id", roleId);

      if (rpErr) {
        return NextResponse.redirect(new URL("/forbidden", req.url));
      }

      const perms = (rpRows ?? []).map((r: any) => r.permission);
      if (!perms.includes(requiredPerm)) {
        return NextResponse.redirect(new URL("/forbidden", req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard",
    "/users/:path*",
    "/roles/:path*",
    "/permissions/:path*",
    "/login",
    "/register",
  ],
};