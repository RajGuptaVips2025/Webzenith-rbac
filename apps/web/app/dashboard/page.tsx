"use client";

import React from "react";
import { useRBAC } from "../rbac/rbacContext";
// import { useRBAC } from "./rbac/rbacContext";

export default function UsersPerRolePage() {
  const { state } = useRBAC();

  // Group users by roles using RBAC state
  const grouped = state.roles.map((role) => ({
    roleName: role.name,
    roleId: role.id,
    color: role.color || "bg-gray-500",
    users: state.users.filter((u) => u.roleId === role.id)
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-3xl font-bold mb-6">Users by Roles</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* EACH ROLE CARD */}
        {grouped.map((role) => (
          <div key={role.roleId} className="bg-white p-6 rounded-2xl shadow border border-gray-200">

            {/* ROLE HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {role.roleName}
              </h2>

              <span className={`text-sm text-white px-3 py-1 rounded-full ${role.color}`}>
                {role.users.length} users
              </span>
            </div>

            {/* USERS LIST */}
            {role.users.map((user) => (
              <div
                key={user.id}
                className="p-4 mb-3 rounded-lg bg-gray-50 border hover:bg-gray-100 transition cursor-pointer"
              >
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            ))}

            {/* EMPTY STATE */}
            {role.users.length === 0 && (
              <div className="p-4 text-gray-500 text-center">
                No users in this role
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}