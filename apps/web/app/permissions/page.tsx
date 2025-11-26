'use client';

import React, { useMemo, useState } from 'react';
import type { Permission } from '../rbac/rbacTypes';
import { Check, PlusCircle, Save, XCircle } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { usePermission } from '../rbac/usePermission';
import { useRBAC } from '../rbac/rbacContext';
import type { Role } from "../rbac/rbacTypes";

export default function PermissionsPage() {
    const { state, assignPermission, removePermission, updateRole, addRole } = useRBAC();

    const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(state.roles[0]?.id);
    const [creatingBundle, setCreatingBundle] = useState(false);
    const [bundleName, setBundleName] = useState('');
    const [bundleDescription, setBundleDescription] = useState('');
    const [mutating, setMutating] = useState(false);

    const { data: user } = useCurrentUser();
    const { has } = usePermission(user?.id);

    const entities = state.entities;
    const operations = state.operations;

    const currentPermSet = useMemo(() => {
        const role = state.roles.find(r => r.id === selectedRoleId);
        return new Set<string>(role?.permissions ?? []);
    }, [state.roles, selectedRoleId]);

    const permFor = (entity: string, op: string) => `${entity}.${op}` as Permission;

    React.useEffect(() => {
        if (!selectedRoleId && state.roles.length > 0) {
            setSelectedRoleId(state.roles[0]?.id);
        }
    }, [state.roles, selectedRoleId]);

    // -----------------------------------------------------
    // FIXED: Safe togglePerm (no optimistic UI, no 409 spam)
    // -----------------------------------------------------
    async function togglePerm(entity: string, op: string) {
        if (!selectedRoleId || mutating) return;

        const p = permFor(entity, op);
        const alreadyHas = currentPermSet.has(p);

        setMutating(true);
        try {
            if (alreadyHas) {
                // remove only if present
                await removePermission(selectedRoleId, p);
            } else {
                // assign only if missing
                await assignPermission(selectedRoleId, p);
            }
        } catch (err: any) {
            const msg = err?.message ?? "Unknown error";
            if (!msg.includes("already assigned") && !msg.includes("409")) {
                alert("Failed to update permission: " + msg);
            }
        } finally {
            setMutating(false);
        }
    }

    // -----------------------------------------------------
    // FIXED bulk toggle — safe, conflict-free
    // -----------------------------------------------------
    async function toggleEntity(entity: string) {
        if (!selectedRoleId || mutating) return;

        const all = operations.map(op => permFor(entity, op));
        const hasAll = all.every(p => currentPermSet.has(p));

        setMutating(true);
        try {
            if (hasAll) {
                const toRemove = all.filter(p => currentPermSet.has(p));
                await Promise.allSettled(toRemove.map(p => removePermission(selectedRoleId, p)));
            } else {
                const toAdd = all.filter(p => !currentPermSet.has(p));
                await Promise.allSettled(toAdd.map(p => assignPermission(selectedRoleId, p)));
            }
        } finally {
            setMutating(false);
        }
    }

    async function toggleOperation(op: string) {
        if (!selectedRoleId || mutating) return;

        const all = entities.map(e => permFor(e, op));
        const hasAll = all.every(p => currentPermSet.has(p));

        setMutating(true);
        try {
            if (hasAll) {
                const toRemove = all.filter(p => currentPermSet.has(p));
                await Promise.allSettled(toRemove.map(p => removePermission(selectedRoleId, p)));
            } else {
                const toAdd = all.filter(p => !currentPermSet.has(p));
                await Promise.allSettled(toAdd.map(p => assignPermission(selectedRoleId, p)));
            }
        } finally {
            setMutating(false);
        }
    }

    async function toggleAll() {
        if (!selectedRoleId || mutating) return;

        const all = entities.flatMap(e => operations.map(o => permFor(e, o)));
        const hasAll = all.every(p => currentPermSet.has(p));

        setMutating(true);
        try {
            if (hasAll) {
                const toRemove = all.filter(p => currentPermSet.has(p));
                await Promise.allSettled(toRemove.map(p => removePermission(selectedRoleId, p)));
            } else {
                const toAdd = all.filter(p => !currentPermSet.has(p));
                await Promise.allSettled(toAdd.map(p => assignPermission(selectedRoleId, p)));
            }
        } finally {
            setMutating(false);
        }
    }

    // function createPermissionBundle() {
    //     if (!bundleName.trim()) {
    //         alert('Bundle name required');
    //         return;
    //     }

    //     const perms = Array.from(currentPermSet) as Permission[];

    //     const newRole = {
    //         id: `role_${Date.now()}`,
    //         name: bundleName.trim(),
    //         description: bundleDescription.trim() || undefined,
    //         enabled: true,
    //         permissions: perms,
    //         color: 'bg-gray-600',
    //         createdAt: new Date().toISOString(),
    //     };

    //     addRole(newRole);
    //     setCreatingBundle(false);
    //     setBundleName('');
    //     setBundleDescription('');
    //     setSelectedRoleId(newRole.id);
    // }

    // inside PermissionsPage component
    async function createPermissionBundle() {
        if (!bundleName.trim()) {
            alert("Bundle name required");
            return;
        }

        const perms = Array.from(currentPermSet) as Permission[];

        // payload for creating role — do NOT include `id` (server will create UUID)
        const payload = {
            name: bundleName.trim(),
            description: bundleDescription.trim() || undefined,
            enabled: true,
            color: "bg-gray-600",
        };

        try {
            // addRole now returns the created role (with real id)
            const createdRole = await addRole(payload as any) as Role;

            // assign each permission to the newly created role
            await Promise.allSettled(perms.map((p) => assignPermission(createdRole.id, p)));

            // update UI
            setCreatingBundle(false);
            setBundleName("");
            setBundleDescription("");
            setSelectedRoleId(createdRole.id);
        } catch (err: any) {
            console.error("Failed to create bundle:", err);
            alert("Failed to create role bundle: " + (err?.message ?? String(err)));
        }
    }


    if (!has("permissions.read")) {
        return <div className="p-8 text-center text-red-600 text-xl font-bold">403 — Forbidden</div>;
    }

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Permissions Matrix</h1>

                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700">Select role</label>
                        <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="px-3 py-2 border rounded-lg"
                        >
                            {state.roles.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name} {r.enabled ? '' : '(disabled)'}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => toggleAll()}
                            disabled={mutating}
                            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <Check size={14} /> Toggle All
                        </button>

                        <button
                            onClick={() => setCreatingBundle(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <PlusCircle size={16} /> Save as bundle
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200 p-4">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left">Entity / Operation</th>
                                {operations.map(op => (
                                    <th key={op} className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {op}
                                            <button
                                                onClick={() => toggleOperation(op)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Toggle
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {entities.map(entity => (
                                <tr key={entity} className="border-b last:border-b-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span>{entity}</span>
                                            <button
                                                onClick={() => toggleEntity(entity)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Toggle row
                                            </button>
                                        </div>
                                    </td>

                                    {operations.map(op => {
                                        const p = permFor(entity, op);
                                        const checked = currentPermSet.has(p);

                                        return (
                                            <td key={op} className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={mutating}
                                                    onChange={() => togglePerm(entity, op)}
                                                    className="h-4 w-4 disabled:opacity-50 disabled:cursor-wait"
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {creatingBundle && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Create Permission Bundle</h2>
                            <button onClick={() => setCreatingBundle(false)}>
                                <XCircle />
                            </button>
                        </div>

                        <label>Bundle name</label>
                        <input
                            className="border w-full px-3 py-2 rounded-md mt-1"
                            value={bundleName}
                            onChange={(e) => setBundleName(e.target.value)}
                        />

                        <label className="mt-3 block">Description</label>
                        <input
                            className="border w-full px-3 py-2 rounded-md mt-1"
                            value={bundleDescription}
                            onChange={(e) => setBundleDescription(e.target.value)}
                        />

                        <div className="flex justify-end gap-3 mt-5">
                            <button onClick={() => setCreatingBundle(false)} className="px-4 py-2 border rounded">
                                Cancel
                            </button>
                            <button onClick={createPermissionBundle} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                                <Save size={14} /> Save bundle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}