// apps/web/app/rbac/RequirePermission.tsx
"use client";

import React from "react";
import type { Permission } from "./rbacTypes";
import { useCurrentUser } from "../../hooks/useAuth";
import { usePermission } from "./usePermission";
import ForbiddenPage from "../forbidden/page";

export default function RequirePermission({
  perm,
  children,
}: {
  perm?: Permission | string;
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useCurrentUser();
  const { has } = usePermission(user?.id);

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!perm) {
    return <>{children}</>;
  }

  if (!has(perm)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
