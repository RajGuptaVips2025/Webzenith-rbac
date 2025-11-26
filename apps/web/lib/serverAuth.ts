// apps/web/lib/serverAuth.ts (new file)
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );
}


export async function requirePermissionOrThrow(sbClient: ReturnType<typeof createServerClient>, permission: string) {
  const { data } = await sbClient.auth.getUser();
  const user = data.user ?? null;
  if (!user) throw new Error("Unauthenticated");

  const { data: appUser, error: appUserErr } = await sbClient
    .from("app_users")
    .select("role_id")
    .eq("id", user.id)
    .maybeSingle();

  if (appUserErr || !appUser?.role_id) throw new Error("Missing app_user or role");

  const { data: perms, error: rpErr } = await sbClient
    .from("role_permissions")
    .select("permission")
    .eq("role_id", appUser.role_id);

  if (rpErr) throw new Error("Failed to load permissions");

  const permList = (perms ?? []).map((p: any) => p.permission);
  if (!permList.includes(permission)) throw new Error("Forbidden");
  return true;
}
