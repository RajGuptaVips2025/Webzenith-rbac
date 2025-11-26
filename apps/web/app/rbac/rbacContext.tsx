"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { RBACState, Role, User, Permission } from "./rbacTypes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface RBACContextType {
    state: RBACState;
    addRole: (role: Partial<Role>) => Promise<Role>;   
    updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    assignPermission: (roleId: string, perm: Permission) => Promise<void>;
    removePermission: (roleId: string, perm: Permission) => Promise<void>;
    addUser: (user: User) => Promise<void>;
    assignRoleToUser: (userId: string, roleId: string) => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

async function fetchPermissions() {
    const res = await fetch("/api/permissions");
    if (!res.ok) throw new Error("Failed to load permissions");
    const json = await res.json();
    return json.permissions ?? [];
}

async function fetchRolesWithPerms() {
    const res = await fetch("/api/roles/with-perms");
    if (!res.ok) throw new Error("Failed to load roles");
    const json = await res.json();
    return json.roles ?? [];
}

async function fetchUsers() {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to load users");
    const json = await res.json();
    return json.users ?? [];
}

export function RBACProvider({ children }: { children: React.ReactNode }) {
    const qc = useQueryClient();

    const permsQuery = useQuery({
        queryKey: ["rbac", "permissions"],
        queryFn: fetchPermissions,
        staleTime: 1000 * 60 * 5,
    });

    const rolesQuery = useQuery({
        queryKey: ["rbac", "roles"],
        queryFn: fetchRolesWithPerms,
        staleTime: 1000 * 60 * 3,
    });

    const usersQuery = useQuery({
        queryKey: ["rbac", "users"],
        queryFn: fetchUsers,
        staleTime: 1000 * 60 * 3,
    });

    const operations = useMemo(() => ["create", "read", "update", "delete"] as const, []);
    const permissions = permsQuery.data ?? [];
    const entities = useMemo(() => {
        if (permissions.length) {
            const set = new Set<string>((permissions as any[]).map((p: any) => p.entity));
            return Array.from(set);
        }
        return ["users", "roles", "permissions", "projects", "tasks", "documents"];
    }, [permissions]);

    const state: RBACState = {
        entities,
        operations: Array.from(operations),
        permissions: (permissions as any[]).map((p: any) => p.perm_key ?? `${p.entity}.${p.operation}`),
        roles: rolesQuery.data ?? [],
        users: usersQuery.data ?? [],
    };

    const postRole = useMutation({
        mutationFn: async (payload: Partial<Role>) => {
            const res = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to create role");
            return res.json();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "roles"] }),
    });

    const patchRole = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Role> }) => {
            const res = await fetch(`/api/roles/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = (json && (json.error || json.message)) || `Failed to update role (${res.status})`;
                throw new Error(msg);
            }

            return json;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "roles"] }),
    });

    const deleteRoleMut = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete role");
            return res.json();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "roles"] }),
    });

    const assignPermMut = useMutation({
        mutationFn: async ({ roleId, permission }: { roleId: string; permission: Permission }) => {
            const res = await fetch(`/api/roles/${roleId}/permissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permission }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = (json && (json.error || json.message)) || `Failed to assign permission (${res.status})`;
                throw new Error(msg);
            }
            return json;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "roles"] }),
    });

    const removePermMut = useMutation({
        mutationFn: async ({ roleId, permission }: { roleId: string; permission: Permission }) => {
            const url = new URL(`${location.origin}/api/roles/${roleId}/permissions`);
            url.searchParams.set("permission", permission as string);
            const res = await fetch(url.toString(), { method: "DELETE" });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = (json && (json.error || json.message)) || `Failed to remove permission (${res.status})`;
                throw new Error(msg);
            }
            return json;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "roles"] }),
    });

    const addUserMut = useMutation({
        mutationFn: async (payload: User) => {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: payload.id, name: payload.name, email: payload.email, roleId: payload.roleId }),
            });
            if (!res.ok) throw new Error("Failed to add user");
            return res.json();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
    });

    const assignRoleToUserMut = useMutation({
        mutationFn: async ({ userId, roleId }: { userId: string; roleId?: string }) => {
            const res = await fetch(`/api/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleId }),
            });
            if (!res.ok) throw new Error("Failed to assign role to user");
            return res.json();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "users"] }),
    });

    const ctx: RBACContextType = {
        state,
        addRole: async (role) => {
            const res = await postRole.mutateAsync(role);
            return (res && (res.role ?? res)) as Role;
        },
        updateRole: async (id, updates) => {
            await patchRole.mutateAsync({ id, updates });
        },
        deleteRole: async (id) => {
            await deleteRoleMut.mutateAsync(id);
        },
        assignPermission: async (roleId, perm) => {
            await assignPermMut.mutateAsync({ roleId, permission: perm });
        },
        removePermission: async (roleId, perm) => {
            await removePermMut.mutateAsync({ roleId, permission: perm });
        },
        addUser: async (user) => {
            await addUserMut.mutateAsync(user);
        },
        assignRoleToUser: async (userId, roleId) => {
            await assignRoleToUserMut.mutateAsync({ userId, roleId });
            qc.invalidateQueries({ queryKey: ["rbac", "roles"] });
        },
    };

    return <RBACContext.Provider value={ctx}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
    const ctx = useContext(RBACContext);
    if (!ctx) throw new Error("useRBAC must be used inside RBACProvider");
    return ctx;
}