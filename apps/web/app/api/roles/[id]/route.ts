// apps/web/app/api/roles/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase.server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const updates = {
    name: body.name,
    description: body.description,
    enabled: body.enabled,
    color: body.color,
  };

  const { data, error } = await supabaseAdmin
    .from("roles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ role: data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const { error } = await supabaseAdmin.from("roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
