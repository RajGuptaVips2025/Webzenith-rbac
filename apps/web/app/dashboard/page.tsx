"use client";

import React from "react";
import { useRBAC } from "../rbac/rbacContext";

export default function UsersPerRolePage() {
  const { state } = useRBAC();

  // Prepare role cards
  const roles = state.roles.map((role) => ({
    roleName: role.name,
    roleId: role.id,
    color: role.color || "bg-gray-600",
    description: role.description || "No description available",
    totalPermissions: role.permissions?.length ?? 0,
    users: state.users.filter((u) => u.roleId === role.id)
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-3xl font-bold mb-6">Roles Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {roles.map((role) => (
          <div
            key={role.roleId}
            className="bg-white p-6 rounded-2xl shadow border border-gray-200 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{role.roleName}</h2>

              <span
                className={`text-sm text-white px-3 py-1 rounded-full ${role.color}`}
              >
                {role.users.length} users
              </span>
            </div>

            <p className="text-gray-600 text-sm">{role.description}</p>

            <hr className="my-4" />

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total Permissions
              </p>

              <p className="mt-1 text-lg font-semibold">
                {role.totalPermissions}
              </p>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}