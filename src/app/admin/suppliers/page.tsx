'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Truck, Plus, Search, Edit, Trash2, MoreHorizontal,
    Phone, Mail, MapPin, User, Hash, CheckCircle, XCircle, Loader2
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

interface SupplierForm {
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    status: 'active' | 'inactive';
}

const emptyForm: SupplierForm = {
    name: '', code: '', contactPerson: '', email: '', phone: '', address: '', status: 'active',
};

export default function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState<SupplierForm>(emptyForm);

    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSuppliers({ limit: 200 });
            setSuppliers(data?.suppliers || data || []);
        } catch {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowDialog(true);
    };

    const openEdit = (s: any) => {
        setEditing(s);
        setForm({
            name: s.name || '',
            code: s.code || '',
            contactPerson: s.contactPerson || '',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            status: s.status || 'active',
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
        setSaving(true);
        try {
            if (editing) {
                await adminApi.updateSupplier(editing.id, form);
                toast.success('Supplier updated successfully');
            } else {
                await adminApi.createSupplier(form);
                toast.success('Supplier created successfully');
            }
            setShowDialog(false);
            fetch();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await adminApi.deleteSupplier(deleteTarget.id);
            toast.success('Supplier deleted');
            setDeleteTarget(null);
            fetch();
        } catch {
            toast.error('Failed to delete supplier');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = suppliers.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.code?.toLowerCase().includes(search.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const field = (key: keyof SupplierForm, label: string, placeholder: string, type = 'text') => (
        <div className="space-y-1.5">
            <Label htmlFor={key} className="text-xs font-medium text-slate-700">{label}</Label>
            <Input
                id={key}
                type={type}
                placeholder={placeholder}
                value={form[key] as string}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="h-9 text-sm"
            />
        </div>
    );

    const activeCount = suppliers.filter(s => s.status === 'active').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-emerald-600" />
                        Suppliers
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage your product suppliers and vendors
                    </p>
                </div>
                <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Supplier
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{suppliers.length}</p>
                            <p className="text-xs text-slate-500">Total Suppliers</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
                            <p className="text-xs text-slate-500">Active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{suppliers.length - activeCount}</p>
                            <p className="text-xs text-slate-500">Inactive</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-base font-semibold text-slate-900">All Suppliers</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search suppliers..."
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
                            <span className="ml-2 text-sm text-slate-500">Loading suppliers...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">
                                {search ? 'No suppliers match your search' : 'No suppliers yet'}
                            </p>
                            {!search && (
                                <Button onClick={openCreate} variant="outline" className="mt-4 text-emerald-600 border-emerald-200">
                                    <Plus className="w-4 h-4 mr-2" /> Add First Supplier
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3">Supplier</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Code</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Contact</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Phone</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Email</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(s => (
                                    <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-emerald-700">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                                                    {s.address && (
                                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate max-w-[160px]">{s.address}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {s.code ? (
                                                <Badge variant="outline" className="font-mono text-xs border-slate-200 text-slate-600 flex items-center gap-1 w-fit">
                                                    <Hash className="w-3 h-3" />{s.code}
                                                </Badge>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {s.contactPerson ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />{s.contactPerson}
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {s.phone ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />{s.phone}
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {s.email ? (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="truncate max-w-[150px]">{s.email}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">
                                                    No email
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {s.status === 'active' ? (
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
                                                    <DropdownMenuItem onClick={() => openEdit(s)}>
                                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteTarget(s)}
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
                            <Truck className="w-5 h-5 text-emerald-600" />
                            {editing ? 'Edit Supplier' : 'Add New Supplier'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing ? 'Update the supplier details below.' : 'Fill in the details to register a new supplier.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            {field('name', 'Supplier Name *', 'e.g. Pharma Distributors Ltd')}
                            {field('code', 'Code', 'e.g. PDL')}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {field('contactPerson', 'Contact Person', 'Full name')}
                            {field('phone', 'Phone', '+94 77 123 4567')}
                        </div>
                        {field('email', 'Email *', 'contact@supplier.com', 'email')}
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-xs font-medium text-slate-700">Address</Label>
                            <textarea
                                id="address"
                                rows={2}
                                placeholder="Full address"
                                value={form.address}
                                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-700">Status</Label>
                            <div className="flex gap-3">
                                {(['active', 'inactive'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setForm(prev => ({ ...prev, status: s }))}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${form.status === s
                                                ? s === 'active'
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                    : 'bg-slate-100 border-slate-300 text-slate-700'
                                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : (editing ? 'Update Supplier' : 'Create Supplier')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
