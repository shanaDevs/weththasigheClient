'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    ChevronRight,
    Check,
    X,
    Save,
    AlertCircle,
    Loader2,
    Lock,
    Search,
    Users
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import type { Role, Permission } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [rolePermissions, setRolePermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData] = await Promise.all([
                adminApi.getRoles(),
                adminApi.getPermissions()
            ]);
            setRoles(rolesData);
            setAllPermissions(permsData);
            if (rolesData.length > 0) {
                handleSelectRole(rolesData[0]);
            }
        } catch (error) {
            toast.error('Failed to fetch roles and permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = (role: Role) => {
        setSelectedRole(role);
        setRolePermissions(role.permissions?.map(p => p.id) || []);
    };

    const togglePermission = (permId: number) => {
        setRolePermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        try {
            setSaving(true);
            await adminApi.updateRolePermissions(selectedRole.id, rolePermissions);
            toast.success(`Permissions updated for ${selectedRole.displayName}`);

            // Refresh roles to get updated permissions
            const updatedRoles = await adminApi.getRoles();
            setRoles(updatedRoles);
            const updatedSelectedRole = updatedRoles.find(r => r.id === selectedRole.id);
            if (updatedSelectedRole) setSelectedRole(updatedSelectedRole);
        } catch (error) {
            toast.error('Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Roles & Permissions</h1>
                    <p className="text-slate-500">Manage user roles and their access levels across the platform</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !selectedRole}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Roles List */}
                <Card className="lg:col-span-1 border-0 shadow-lg shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-600" />
                            User Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    className={`flex items-center justify-between p-4 text-left transition-all border-l-4 ${selectedRole?.id === role.id
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                            : 'border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    <div>
                                        <div className="font-semibold">{role.displayName}</div>
                                        <div className="text-xs opacity-70">{role.name}</div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedRole?.id === role.id ? 'rotate-90' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions Grid */}
                <Card className="lg:col-span-3 border-0 shadow-lg shadow-slate-200/50">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
                        <div>
                            <CardTitle className="text-lg">
                                {selectedRole ? `Permissions for ${selectedRole.displayName}` : 'Select a Role'}
                            </CardTitle>
                            <CardDescription>Configure what this role can see and do</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search permissions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-white border-slate-200"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {!selectedRole ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Shield className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a role from the left to manage its permissions</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedPermissions).map(([module, perms]) => {
                                    const filteredPerms = perms.filter(p =>
                                        p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    if (filteredPerms.length === 0) return null;

                                    return (
                                        <div key={module} className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">
                                                    {module.replace(/_/g, ' ')} Management
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filteredPerms.map((perm) => {
                                                    const isSelected = rolePermissions.includes(perm.id);
                                                    return (
                                                        <button
                                                            key={perm.id}
                                                            onClick={() => togglePermission(perm.id)}
                                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isSelected
                                                                    ? 'bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-500/20'
                                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                                                                }`}>
                                                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <div className={`font-semibold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                                    {perm.displayName}
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-1">
                                                                    {perm.description || `Can ${perm.action} ${perm.module}`}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
