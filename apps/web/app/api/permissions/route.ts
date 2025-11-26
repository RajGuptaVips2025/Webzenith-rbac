// apps/web/app/api/permissions/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase.server";
// import { supabaseAdmin } from "@/lib/supabase.server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("permissions").select("perm_key, entity, operation");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ permissions: data });
}
