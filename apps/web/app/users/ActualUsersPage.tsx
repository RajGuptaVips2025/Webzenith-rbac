'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
// import { useRBAC } from '../rbac/rbacContext';
import type { User, Role } from '../rbac/rbacTypes';
import { useRBAC } from '../rbac/rbacContext';

export default function ActualUsersPage() {
  const { state, addUser, assignRoleToUser } = useRBAC();
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
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEditUser(user: User) {
    setEditingUser(user);
    setModalOpen(true);
  }

  function closeModal() {
    setEditingUser(null);
    setModalOpen(false);
  }

  function saveUser(form: { name: string; email: string; roleId: string }) {
    if (editingUser) {
      // Only update the role for mock (no full edit needed)
      assignRoleToUser(editingUser.id, form.roleId);
    } else {
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
      const res = await fetch("/api/roles/with-perms")
      const json = await res.json()
      state.roles = json.roles // update global store
    }

    async function loadUsers() {
      const res = await fetch("/api/users")
      const json = await res.json()
      state.users = json.users
    }

    loadRoles()
    loadUsers()
  }, [])


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow border">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
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

              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-blue-600 underline">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs ${role?.color || 'bg-gray-600'
                        }`}
                    >
                      {role?.name || 'No Role'}
                    </span>
                  </td>

                  <td className="px-4 py-3">{user.createdAt.split('T')[0]}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEditUser(user)}
                      className="p-2 hover:bg-gray-200 rounded-md"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* EMPTY STATE */}
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
  onClose,
  onSave,
}: {
  roles: Role[];
  user: User | null;
  onClose: () => void;
  onSave: (data: { name: string; email: string; roleId: string }) => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [roleId, setRoleId] = useState<string>(
    user?.roleId ?? roles[0]?.id ?? ""
  );


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{user ? 'Edit User' : 'Add User'}</h2>

        {!user && (
          <>
            {/* NAME */}
            <div className="mb-3">
              <label className="text-sm font-medium">Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* EMAIL */}
            <div className="mb-3">
              <label className="text-sm font-medium">Email</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </>
        )}

        {/* ROLE DROPDOWN */}
        <div className="mb-6">
          <label className="text-sm font-medium">Role</label>
          <select
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, email, roleId })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {user ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}




