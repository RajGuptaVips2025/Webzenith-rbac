
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase.server";
import { createServerSupabaseClient, requirePermissionOrThrow } from "../../../../../lib/serverAuth";

export async function POST(req: Request, ctx: { params: any }) {
  const sb = await createServerSupabaseClient();

  try {
    await requirePermissionOrThrow(sb, "roles.update"); 
  } catch (err) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const params = typeof ctx.params?.then === "function" ? await ctx.params : ctx.params;
  const { id: roleId } = params ?? {};
  if (!roleId) return NextResponse.json({ error: "missing role id" }, { status: 400 });

  const body = await req.json();
  const permission = body?.permission;
  if (!permission) return NextResponse.json({ error: "permission required" }, { status: 400 });

  try {
    const { data: permRow, error: permErr } = await supabaseAdmin
      .from("permissions")
      .select("perm_key")
      .eq("perm_key", permission)
      .maybeSingle();

    if (permErr) return NextResponse.json({ error: permErr.message }, { status: 500 });
    if (!permRow) return NextResponse.json({ error: `permission "${permission}" not found` }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("role_permissions")
      .insert([{ role_id: roleId, permission }]);

    if (error) {
      if ((error.code && error.code.toString().includes("23505")) || error.message?.includes("duplicate")) {
        return NextResponse.json({ error: "permission already assigned to role" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: any }) {
  const sb = await createServerSupabaseClient();

  try {
    await requirePermissionOrThrow(sb, "roles.update");
  } catch (err) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const params = typeof ctx.params?.then === "function" ? await ctx.params : ctx.params;
  const { id: roleId } = params ?? {};
  if (!roleId) return NextResponse.json({ error: "missing role id" }, { status: 400 });

  const url = new URL(req.url);
  const permission = url.searchParams.get("permission");
  if (!permission) return NextResponse.json({ error: "permission query param required" }, { status: 400 });

  try {
    const { error } = await supabaseAdmin
      .from("role_permissions")
      .delete()
      .match({ role_id: roleId, permission });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

