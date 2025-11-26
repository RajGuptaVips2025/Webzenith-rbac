import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase.server";

export async function POST(req: Request) {
  const { id, name, email, roleId } = await req.json();

  // Ensure no duplicates
  const { data: exists } = await supabaseAdmin
    .from("app_users")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (exists) {
    return NextResponse.json({ ok: true, message: "Already exists" });
  }

  const { error } = await supabaseAdmin
    .from("app_users")
    .insert([{ id, name, email, role_id: roleId }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
