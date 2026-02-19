'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Building2, Plus, Search, Edit, Trash2, MoreHorizontal,
    Phone, Mail, MapPin, User, Tag, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import type { Agency } from '@/types';

const emptyForm: Partial<Agency> = {
    name: '',
    code: '',
    description: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
};

export default function AdminAgenciesPage() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
    const [formData, setFormData] = useState<Partial<Agency>>(emptyForm);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchAgencies = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAgencies();
            setAgencies(data);
        } catch {
            toast.error('Failed to load agencies');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

    const openCreate = () => {
        setEditingAgency(null);
        setFormData(emptyForm);
        setShowDialog(true);
    };

    const openEdit = (agency: Agency) => {
        setEditingAgency(agency);
        setFormData({
            name: agency.name,
            code: agency.code,
            description: agency.description,
            contactPerson: agency.contactPerson,
            email: agency.email,
            phone: agency.phone,
            address: agency.address,
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            toast.error('Agency name is required');
            return;
        }
        setSaving(true);
        try {
            if (editingAgency) {
                await adminApi.updateAgency(editingAgency.id, formData);
                toast.success('Agency updated successfully');
            } else {
                await adminApi.createAgency(formData);
                toast.success('Agency created successfully');
            }
            setShowDialog(false);
            fetchAgencies();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save agency');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            // Use updateAgency to soft-delete (set isActive: false) since deleteAgency isn't in adminApi yet
            await adminApi.updateAgency(deleteTarget.id, { isActive: false } as any);
            toast.success('Agency removed successfully');
            setDeleteTarget(null);
            fetchAgencies();
        } catch {
            toast.error('Failed to delete agency');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = agencies.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.code?.toLowerCase().includes(search.toLowerCase()) ||
        a.contactPerson?.toLowerCase().includes(search.toLowerCase())
    );

    const field = (key: keyof typeof formData, label: string, placeholder: string, type = 'text') => (
        <div className="space-y-1.5">
            <Label htmlFor={key} className="text-xs font-medium text-slate-700">{label}</Label>
            <Input
                id={key}
                type={type}
                placeholder={placeholder}
                value={(formData[key] as string) || ''}
                onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                className="h-9 text-sm"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-emerald-600" />
                        Agencies
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage manufacturers and distributors (e.g. SPMC, SPC)
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Agency
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{agencies.length}</p>
                            <p className="text-xs text-slate-500">Total Agencies</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{agencies.filter(a => a.isActive !== false).length}</p>
                            <p className="text-xs text-slate-500">Active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{agencies.filter(a => a.code).length}</p>
                            <p className="text-xs text-slate-500">With Code</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-base font-semibold text-slate-900">All Agencies</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search agencies..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="ml-2 text-sm text-slate-500">Loading agencies...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">
                                {search ? 'No agencies match your search' : 'No agencies yet'}
                            </p>
                            {!search && (
                                <Button onClick={openCreate} variant="outline" className="mt-4 text-emerald-600 border-emerald-200">
                                    <Plus className="w-4 h-4 mr-2" /> Add First Agency
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3">Agency</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Code</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Contact</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Phone</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Email</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(agency => (
                                    <TableRow key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-emerald-700">
                                                        {agency.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{agency.name}</p>
                                                    {agency.description && (
                                                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{agency.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {agency.code ? (
                                                <Badge variant="outline" className="font-mono text-xs border-slate-200 text-slate-600">
                                                    {agency.code}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {agency.contactPerson ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    {agency.contactPerson}
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {agency.phone ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {agency.phone}
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {agency.email ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="truncate max-w-[140px]">{agency.email}</span>
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {agency.isActive !== false ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-400 border-slate-200 text-xs">
                                                    <XCircle className="w-3 h-3 mr-1" /> Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => openEdit(agency)}>
                                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteTarget(agency)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            {editingAgency ? 'Edit Agency' : 'Add New Agency'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingAgency
                                ? 'Update the agency details below.'
                                : 'Fill in the details to register a new agency.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            {field('name', 'Agency Name *', 'e.g. State Pharma Corp')}
                            {field('code', 'Agency Code', 'e.g. SPMC')}
                        </div>
                        {field('description', 'Description', 'Brief description of the agency')}
                        <div className="grid grid-cols-2 gap-4">
                            {field('contactPerson', 'Contact Person', 'Full name')}
                            {field('phone', 'Phone', '+94 77 123 4567')}
                        </div>
                        {field('email', 'Email', 'contact@agency.com', 'email')}
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-xs font-medium text-slate-700">Address</Label>
                            <textarea
                                id="address"
                                rows={2}
                                placeholder="Full address"
                                value={formData.address || ''}
                                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : (
                                editingAgency ? 'Update Agency' : 'Create Agency'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Agency</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? This will deactivate
                            the agency and it will no longer appear in product assignments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
