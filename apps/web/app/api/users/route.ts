import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase.server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id, name, email, role_id, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleId: u.role_id,
      createdAt: u.created_at,
    })),
  });
}


export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, email, roleId } = body;

  const { error } = await supabaseAdmin
    .from("app_users")
    .insert([{ id, name, email, role_id: roleId }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}