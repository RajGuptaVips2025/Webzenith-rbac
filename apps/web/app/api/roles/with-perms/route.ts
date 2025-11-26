import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase.server";

export async function GET() {
  try {
    const { data: rawRoles, error: rolesErr } = await supabaseAdmin
      .from("roles")
      .select("id, name, description, enabled, color, created_at");

    if (rolesErr) {
      return NextResponse.json({ error: rolesErr.message }, { status: 500 });
    }

    const roles = (rawRoles ?? []) as {
      id: string;
      name: string;
      description: string | null;
      enabled: boolean;
      color: string | null;
      created_at: string;
    }[];

    const { data: rawRpRows, error: rpErr } = await supabaseAdmin
      .from("role_permissions")
      .select("role_id, permission");

    if (rpErr) {
      return NextResponse.json({ error: rpErr.message }, { status: 500 });
    }

    const rpRows = (rawRpRows ?? []) as {
      role_id: string;
      permission: string;
    }[];

    const permsByRole: Record<string, string[]> = {};

    rpRows.forEach((row) => {
      const roleId = row.role_id;
      const perm = row.permission;

      if (!permsByRole[roleId]) permsByRole[roleId] = [];
      permsByRole[roleId].push(perm);
    });

    const rolesWithPerms = roles.map((role) => ({
      ...role,
      createdAt: role.created_at,
      permissions: permsByRole[role.id] ?? [],
    }));

    return NextResponse.json({ roles: rolesWithPerms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

