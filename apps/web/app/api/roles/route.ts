import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase.server";
import { createServerSupabaseClient, requirePermissionOrThrow } from "../../../lib/serverAuth";

function isValidUuid(s: any) {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("roles")
    .select("id, name, description, enabled, color, created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ roles: data });
}


export async function POST(req: Request) {
  const sb = await createServerSupabaseClient();

  try {
    await requirePermissionOrThrow(sb, "roles.create");
  } catch (err) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await req.json();
  const { id, name, description, enabled = true, color } = payload;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  let roleId: string;
  if (id && isValidUuid(id)) {
    roleId = id;
  } else if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    roleId = crypto.randomUUID();
  } else {
    return NextResponse.json(
      { error: "Server cannot generate UUID" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .insert([{ id: roleId, name, description, enabled, color }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ role: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

