import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase.server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { roleId } = await req.json();

  const { error } = await supabaseAdmin
    .from("app_users")
    .update({ role_id: roleId })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}