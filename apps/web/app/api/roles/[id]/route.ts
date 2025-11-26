
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase.server";

export async function PATCH(
  req: Request, 
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const body = await req.json();

  const possibleKeys = ["name", "description", "enabled", "color"] as const;
  const updates: Record<string, any> = {};
  for (const k of possibleKeys) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      updates[k] = body[k];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid update fields provided" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || "Supabase update error" }, { status: 500 });
    }

    return NextResponse.json({ role: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request, 
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const { error } = await supabaseAdmin.from("roles").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}