// apps/web/app/rbac/RequirePermission.tsx
"use client";

import React from "react";
import type { Permission } from "./rbacTypes";

export default function RequirePermission({
  children,
}: {
  perm?: Permission;
  children: React.ReactNode;
}) {
  // No permission gating: always render children
  return <>{children}</>;
}