// apps/web/app/rbac/usePermission.tsx
"use client";

import { useMemo } from "react";
import type { Permission } from "./rbacTypes";
import { useRBAC } from "./rbacContext";

export function usePermission(userId: string | undefined) {
  const { state } = useRBAC();

  const { permissionsSet, roleName } = useMemo(() => {
    if (!userId) return { permissionsSet: new Set<string>(), roleName: "" };

    const user = state.users.find((u) => u.id === userId);
    if (!user || !user.roleId) return { permissionsSet: new Set<string>(), roleName: "" };

    const role = state.roles.find((r) => r.id === user.roleId);
    if (!role) return { permissionsSet: new Set<string>(), roleName: "" };

    const set = new Set<string>(Array.isArray(role.permissions) ? role.permissions : []);
    return { permissionsSet: set, roleName: (role.name || "").toLowerCase() };
  }, [state.users, state.roles, userId]);

  function has(perm: Permission | string) {
    const p = String(perm);
    if (permissionsSet.has(p)) return true;

    // support entity.* wildcard (e.g., roles.*)
    const [entity, op] = p.split(".");
    if (!entity || !op) return false;

    if (permissionsSet.has(`${entity}.*`)) return true;
    if (permissionsSet.has(`*.${op}`)) return true;

    return false;
  }

  const isAdmin = useMemo(() => {
    if (roleName.includes("admin")) return true;
    if (permissionsSet.has("roles.*")) return true;
    if (permissionsSet.has("*.manage") || permissionsSet.has("*.admin")) return true;

    if (permissionsSet.has("roles.update") && permissionsSet.has("roles.delete")) return true;

    return false;
  }, [permissionsSet, roleName]);

  const isManager = useMemo(() => {
    if (roleName.includes("manager")) return true;
    if (permissionsSet.has("roles.update")) return true;

    return false;
  }, [permissionsSet, roleName]);

  return {
    permissions: Array.from(permissionsSet) as Permission[],
    has,
    isAdmin,
    isManager,
  };
}














// // apps/web/app/rbac/usePermission.tsx
// "use client";

// import { useMemo } from "react";
// import type { Permission } from "./rbacTypes";
// import { useRBAC } from "./rbacContext";

// /**
//  * Returns permission helpers for a given supabase user id
//  */
// export function usePermission(userId: string | undefined) {
//   const { state } = useRBAC();

//   // derive user's role permissions
//   const userPermissions = useMemo(() => {
//     if (!userId) return new Set<string>();

//     const user = state.users.find((u) => u.id === userId);
//     if (!user || !user.roleId) return new Set<string>();

//     const role = state.roles.find((r) => r.id === user.roleId);
//     if (!role || !Array.isArray(role.permissions)) return new Set<string>();

//     return new Set<string>(role.permissions);
//   }, [state.users, state.roles, userId]);

//   // checks:
//   // - exact match 'entity.operation'
//   // - wildcard 'entity.*' (e.g. 'roles.*')
//   // - wildcard '*.operation' (e.g. '*.read')
//   function has(perm: Permission | string) {
//     const p = String(perm);
//     if (userPermissions.has(p)) return true;

//     // check entity.* wildcard
//     const [entity, op] = p.split(".");
//     if (!entity || !op) return false;

//     if (userPermissions.has(`${entity}.*`)) return true;
//     if (userPermissions.has(`*.${op}`)) return true;

//     return false;
//   }

//   return {
//     permissions: Array.from(userPermissions) as Permission[],
//     has,
//   };
// }










// // apps/web/app/rbac/usePermission.tsx
// "use client";

// import type { Permission } from "./rbacTypes";
// import { useRBAC } from "./rbacContext";

// export function usePermission(userId: string | undefined) {
//   const { state } = useRBAC();

//   // allow everything for now
//   return {
//     permissions: state.permissions as Permission[],
//     has: (_perm: Permission) => true,
//   };
// }