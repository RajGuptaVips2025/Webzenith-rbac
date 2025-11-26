// rbacUtils.ts
import { RBACState, Permission } from "./rbacTypes";

export function getRolePermissions(state: RBACState, roleId: string): Permission[] {
  return state.roles.find((r) => r.id === roleId)?.permissions ?? [];
}

export function getUserPermissions(state: RBACState, userId: string): Permission[] {
  const user = state.users.find((u) => u.id === userId);
  if (!user?.roleId) return [];
  const role = state.roles.find((r) => r.id === user.roleId);
  if (!role) return [];
  return role.permissions;
}