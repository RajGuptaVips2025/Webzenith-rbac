'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import type { User, Role } from '../rbac/rbacTypes';
import { useRBAC } from '../rbac/rbacContext';
import { useCurrentUser } from '../../hooks/useAuth';
import { usePermission } from '../rbac/usePermission';

export default function ActualUsersPage() {
  const { state, addUser, assignRoleToUser } = useRBAC();
  const { data: loggedInUser } = useCurrentUser();
  const { isAdmin, isManager } = usePermission(loggedInUser?.id);

  const canManageUsers = isAdmin || isManager;

  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const roles = state.roles;
  const users = state.users;

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);


  function openCreateUser() {
    if (!canManageUsers) return;
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEditUser(user: User) {
    if (!canManageUsers) return;

    if (loggedInUser?.id === user.id) return;

    setEditingUser(user);
    setModalOpen(true);
  }

  function closeModal() {
    setEditingUser(null);
    setModalOpen(false);
  }

  function saveUser(form: { name: string; email: string; roleId: string }) {
    if (!canManageUsers) return;

    if (editingUser) {
      if (editingUser.id === loggedInUser?.id) return;

      assignRoleToUser(editingUser.id, form.roleId);
    }

    else {
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: form.name,
        email: form.email,
        roleId: form.roleId,
        createdAt: new Date().toISOString(),
      };
      addUser(newUser);
    }

    closeModal();
  }


  useEffect(() => {
    async function loadRoles() {
      const res = await fetch("/api/roles/with-perms");
      const json = await res.json();
      state.roles = json.roles;
    }

    async function loadUsers() {
      const res = await fetch("/api/users");
      const json = await res.json();
      state.users = json.users;
    }

    loadRoles();
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow border">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Users</h1>

          {canManageUsers ? (
            <button
              onClick={openCreateUser}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} /> Add User
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed"
            >
              <Plus size={16} /> Add User
            </button>
          )}
        </div>

        {/* TABLE */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => {
              const role = roles.find((r) => r.id === user.roleId);
              const isSelf = loggedInUser?.id === user.id;

              const rowRoleName = role?.name?.toLowerCase() || "";
              const rowIsAdmin = rowRoleName === "admin";
              const rowIsManager = rowRoleName === "manager";

              const canSeeThreeDots =
                canManageUsers &&
                !isSelf &&
                !rowIsAdmin &&
                !rowIsManager;

              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-blue-600 underline">{user.email}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs ${
                        role?.color || 'bg-gray-600'
                      }`}
                    >
                      {role?.name || 'No Role'}
                    </span>
                  </td>

                  <td className="px-4 py-3">{user.createdAt.split('T')[0]}</td>

                  <td className="px-4 py-3">
                    {canSeeThreeDots ? (
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-2 hover:bg-gray-200 rounded-md"
                      >
                        <MoreVertical size={18} />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-2 opacity-0 cursor-default"
                      >
                        <MoreVertical size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-6">
            No users found.
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <UserModal
          roles={roles}
          user={editingUser}
          loggedInUserId={loggedInUser?.id}
          canEdit={canManageUsers}
          onClose={closeModal}
          onSave={saveUser}
        />
      )}
    </div>
  );
}

function UserModal({
  roles,
  user,
  loggedInUserId,
  canEdit,
  onClose,
  onSave,
}: {
  roles: Role[];
  user: User | null;
  loggedInUserId?: string;
  canEdit: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; roleId: string }) => void;
}) {
  const isSelf = user?.id === loggedInUserId;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [roleId, setRoleId] = useState<string>(user?.roleId ?? roles[0]?.id ?? "");

  const disableRoleChange = isSelf || !canEdit;

  const existingAdmin = roles.find((r) => r.name.toLowerCase() === "admin");
  const existingManager = roles.find((r) => r.name.toLowerCase() === "manager");

  const editingUserRole = roles.find((r) => r.id === user?.roleId);
  const isEditingAdmin = editingUserRole?.name?.toLowerCase() === "admin";
  const isEditingManager = editingUserRole?.name?.toLowerCase() === "manager";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{user ? 'Edit User' : 'Add User'}</h2>

        {!user && (
          <>
            <div className="mb-3">
              <label className="text-sm font-medium">Name</label>
              <input
                disabled={!canEdit}
                className="w-full border rounded-lg px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="text-sm font-medium">Email</label>
              <input
                disabled={!canEdit}
                className="w-full border rounded-lg px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="mb-6">
          <label className="text-sm font-medium">Role</label>

          <select
            disabled={disableRoleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {roles
              .filter((role) => {
                const name = role.name.toLowerCase();

                if (name === "admin" && existingAdmin && !isEditingAdmin) return false;

                if (name === "manager" && existingManager && !isEditingManager) return false;

                return true;
              })
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>

          {isSelf && (
            <p className="text-red-500 text-xs mt-1">
              You cannot change your own role.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>

          <button
            disabled={disableRoleChange}
            onClick={() => onSave({ name, email, roleId })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {user ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

