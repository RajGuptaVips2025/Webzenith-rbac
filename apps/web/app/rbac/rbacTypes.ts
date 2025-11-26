// rbacTypes.ts
export type Operation = "create" | "read" | "update" | "delete";
export type Entity = string;
export type Permission = `${Entity}.${Operation}`;

export interface Role {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  permissions: Permission[];
  color?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  createdAt: string;
}

export interface RBACState {
  entities: Entity[];
  operations: Operation[];
  permissions: Permission[];
  roles: Role[];
  users: User[];
}
