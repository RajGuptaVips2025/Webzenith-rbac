'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "../hooks/useAuth";

type AppUserRow = {
  id: string;
  name: string;
  email: string;
  roleId?: string | null;
  createdAt?: string | null;
};

type RoleWithPerms = {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  color?: string | null;
  createdAt?: string | null;
  permissions?: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: supaUser, isLoading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [appUser, setAppUser] = useState<AppUserRow | null>(null);
  const [role, setRole] = useState<RoleWithPerms | null>(null);
  const [rolesLoadError, setRolesLoadError] = useState<string | null>(null);
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !supaUser) {
      router.replace("/login");
    }
  }, [userLoading, supaUser, router]);

  useEffect(() => {
    if (userLoading || !supaUser) return;

    const ac = new AbortController();
    setLoading(true);
    setRolesLoadError(null);
    setUsersLoadError(null);

    async function load() {
      try {
        const [uRes, rRes] = await Promise.all([
          fetch("/api/users", { signal: ac.signal }),
          fetch("/api/roles/with-perms", { signal: ac.signal }),
        ]);

        if (!uRes.ok) throw new Error(`users API ${uRes.status}`);
        if (!rRes.ok) throw new Error(`roles API ${rRes.status}`);

        const uJson = await uRes.json();
        const rJson = await rRes.json();

        const users: AppUserRow[] = uJson.users ?? [];

        const supaUserId = supaUser?.id;
        if (!supaUserId) return;

        const found = users.find((uu: AppUserRow) => uu.id === supaUserId) ?? null;
        setAppUser(found);

        const roles: RoleWithPerms[] = rJson.roles ?? [];

        const assignedRole = found?.roleId
          ? roles.find((r: RoleWithPerms) => r.id === found.roleId) ?? null
          : null;

        setRole(assignedRole);
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        const message = err?.message ?? String(err);
        if (message.includes("users API")) {
          setUsersLoadError("Failed to load users from server.");
        } else if (message.includes("roles API")) {
          setRolesLoadError("Failed to load roles from server.");
        } else {
          setUsersLoadError(message);
          setRolesLoadError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      ac.abort();
    };
  }, [userLoading, supaUser]);

  const displayName = useMemo(() => {
    if (appUser?.name) return appUser.name;
    return (supaUser as any)?.user_metadata?.full_name || supaUser?.email || "Unknown";
  }, [appUser, supaUser]);

  const lastSignedIn = useMemo(() => {
    return (supaUser as any)?.last_sign_in_at || (supaUser as any)?.user_metadata?.last_sign_in_at || null;
  }, [supaUser]);

  if (userLoading || loading || !supaUser) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow border">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
            <p className="text-sm text-gray-600 mt-1">{supaUser.email}</p>

            <div className="mt-4 space-y-1 text-sm text-gray-700">
              {appUser?.createdAt && (
                <div>
                  Account created:{" "}
                  <span className="font-medium">{new Date(appUser.createdAt).toLocaleString()}</span>
                </div>
              )}

              {lastSignedIn && (
                <div>
                  Last signed in:{" "}
                  <span className="font-medium">{new Date(lastSignedIn).toLocaleString()}</span>
                </div>
              )}

              {!appUser && (
                <div className="text-yellow-600">
                  No app user record found — an app_user will be created on first sign in (or via registration).
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">User ID</div>
            <div className="mt-1 font-mono text-sm text-gray-700 break-words">{supaUser.id}</div>
          </div>
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="text-lg font-semibold mb-3">Role & Permissions</h2>

          {rolesLoadError && <div className="text-red-600 mb-3">{rolesLoadError}</div>}

          {!role && appUser?.roleId && (
            <div className="text-yellow-600 mb-3">
              Role with id <span className="font-mono">{appUser.roleId}</span> not found in roles table.
            </div>
          )}

          {!appUser?.roleId && <div className="text-gray-600 mb-3">No role assigned to this user.</div>}

          {role ? (
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${role.color ?? "bg-gray-600"}`}>
                    <span className="font-semibold">{role.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}</span>
                  </div>

                  <div>
                    <div className="text-lg font-semibold">{role.name} {role.enabled ? '' : <span className="text-sm text-red-500">(disabled)</span>}</div>
                    <div className="text-sm text-gray-500">{role.description ?? "No description"}</div>
                    {role.createdAt && <div className="text-xs text-gray-400 mt-1">Role created: {new Date(role.createdAt).toLocaleDateString()}</div>}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <a href="/roles" className="text-sm text-blue-600 hover:underline">View roles</a>
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Permissions</h3>

              {/* Show total count if permissions exist */}
              {role?.permissions && role.permissions.length > 0 && (
                <span className="text-xs text-gray-500">
                  Total: <span className="font-semibold">{role.permissions.length}</span>
                </span>
              )}
            </div>

            {role && Array.isArray(role.permissions) && role.permissions.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-800"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500">No permissions assigned to this role.</div>
            )}
          </div>


        </div>

        <div className="mt-6 flex items-center gap-3">
          <a href="/users" className="px-4 py-2 rounded-lg border hover:bg-gray-50">Manage users</a>
          <a href="/roles" className="px-4 py-2 rounded-lg border hover:bg-gray-50">Manage roles</a>
          <a href="/permissions" className="px-4 py-2 rounded-lg border hover:bg-gray-50">Permissions matrix</a>
        </div>
      </div>
    </div>
  );
}












