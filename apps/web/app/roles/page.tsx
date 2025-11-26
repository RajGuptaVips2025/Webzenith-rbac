// RolesPage.tsx (client)
'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
// import { useRBAC } from '../rbac/rbacContext';
import type { Role } from '../rbac/rbacTypes';
import { useCurrentUser } from '../../hooks/useAuth';
import { usePermission } from '../rbac/usePermission';
import { useRBAC } from '../rbac/rbacContext';

type RoleForm = {
  name: string;
  description?: string;
  color?: string;
  enabled?: boolean;
};

const COLOR_OPTIONS = [
  'bg-purple-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-yellow-500',
  'bg-red-500',
  'bg-gray-600',
];

export default function RolesPage() {
  const { state, addRole, updateRole, deleteRole } = useRBAC();

  const { data: user } = useCurrentUser();
  const { has } = usePermission(user?.id);

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>({ name: '', description: '', color: COLOR_OPTIONS[0], enabled: true });

  const roles = useMemo(() => {
    if (!query) return state.roles;
    return state.roles.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  }, [state.roles, query]);

  function openCreate() {
    setEditingRole(null);
    setForm({ name: '', description: '', color: COLOR_OPTIONS[0], enabled: true });
    setIsModalOpen(true);
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description, color: role.color || COLOR_OPTIONS[0], enabled: role.enabled });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingRole(null);
  }

  function handleSave() {
    if (!form.name.trim()) {
      alert('Role name is required');
      return;
    }

    if (editingRole) {
      updateRole(editingRole.id, {
        name: form.name.trim(),
        description: form.description,
        color: form.color,
        enabled: form.enabled,
      });
    } else {
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: form.name.trim(),
        description: form.description,
        color: form.color,
        enabled: form.enabled ?? true,
        permissions: [],
        createdAt: new Date().toISOString(),
      };
      addRole(newRole);
    }

    closeModal();
  }

  function handleToggleEnabled(role: Role) {
    updateRole(role.id, { enabled: !role.enabled });
  }

  function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    deleteRole(role.id);
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Roles</h1>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search roles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* only show create if user has permission */}
            {has("roles.create") ? (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Create Role
              </button>
            ) : (
              <button
                disabled
                title="You don't have permission"
                className="flex items-center gap-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-lg"
              >
                <Plus size={16} /> Create Role
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-5 rounded-2xl shadow border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${role.color ?? 'bg-gray-600'}`}>
                    <span className="text-sm font-semibold">
                      {role.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description ?? 'No description'}</p>
                    <p className="text-xs text-gray-400 mt-2">Created: {new Date(role.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {has("roles.update") ? (
                      role.enabled ? (
                        <button
                          onClick={() => handleToggleEnabled(role)}
                          className="flex items-center gap-1 text-green-600 px-2 py-1 rounded-md hover:bg-gray-50"
                          title="Disable role"
                        >
                          <CheckCircle size={16} /> Enabled
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleEnabled(role)}
                          className="flex items-center gap-1 text-red-600 px-2 py-1 rounded-md hover:bg-gray-50"
                          title="Enable role"
                        >
                          <XCircle size={16} /> Disabled
                        </button>
                      )
                    ) : (
                      <div className="px-2 py-1 text-xs text-gray-400 rounded">No permission</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {has("roles.update") ? (
                      <button
                        onClick={() => openEdit(role)}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-50"
                        title="Edit role"
                      >
                        <Edit2 size={16} />
                      </button>
                    ) : (
                      <button className="p-2 rounded-md text-gray-300" disabled title="No permission">
                        <Edit2 size={16} />
                      </button>
                    )}

                    {has("roles.delete") ? (
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 rounded-md text-red-600 hover:bg-gray-50"
                        title="Delete role"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button className="p-2 rounded-md text-gray-300" disabled title="No permission">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Permissions: <span className="font-medium">{role.permissions.length}</span>
                </div>

                <div className="text-sm">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    {role.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {roles.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            No roles found. Create your first role.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Sales Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Badge color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(s => ({ ...s, color: c }))}
                      className={`w-10 h-8 rounded-md ${c} ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
                      aria-label={`Select ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="enabled"
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm(s => ({ ...s, enabled: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700">Enabled</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={closeModal} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  {editingRole ? 'Save changes' : 'Create role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}