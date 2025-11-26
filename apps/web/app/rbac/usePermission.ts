// apps/web/app/rbac/usePermission.tsx
"use client";

import type { Permission } from "./rbacTypes";
import { useRBAC } from "./rbacContext";

export function usePermission(userId: string | undefined) {
  const { state } = useRBAC();

  // allow everything for now
  return {
    permissions: state.permissions as Permission[],
    has: (_perm: Permission) => true,
  };
}