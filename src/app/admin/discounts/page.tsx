'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Ticket, Plus, Search, Filter, Edit, Trash2, Eye,
    ChevronLeft, ChevronRight, Calendar, Percent, DollarSign,
    CheckCircle, XCircle, MoreHorizontal, Copy, RefreshCw,
    Loader2, Users, ShoppingBag, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin';
import type { Discount } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentage Off', icon: Percent },
    { value: 'fixed_amount', label: 'Fixed Amount Off', icon: DollarSign },
    { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: ShoppingBag },
    { value: 'free_shipping', label: 'Free Shipping', icon: Ticket },
] as const;

const APPLICABLE_TO = [
    { value: 'all', label: 'Entire Order' },
    { value: 'products', label: 'Specific Products' },
    { value: 'categories', label: 'Specific Categories' },
    { value: 'users', label: 'Specific Users' },
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminDiscountsPage() {
    // List State
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Dialog State
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Discount>>({});

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Options State
    const [agencyOptions, setAgencyOptions] = useState<{ label: string, value: string }[]>([]);
    const [manufacturerOptions, setManufacturerOptions] = useState<{ label: string, value: string }[]>([]);

    // Initial Data Fetch
    const fetchDiscounts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: any = { page, limit: 10 };
            if (search) params.search = search;
            if (typeFilter !== 'all') params.type = typeFilter;
            if (statusFilter === 'active') params.isActive = true;
            if (statusFilter === 'inactive') params.isActive = false;

            const res = await adminApi.getDiscounts(params);
            setDiscounts(res.discounts);
            setPagination(res.pagination);
        } catch (error) {
            toast.error('Failed to load discounts');
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter, statusFilter]);

    const fetchOptions = useCallback(async () => {
        try {
            const [agencies, manufacturers] = await Promise.all([
                adminApi.getAgencies(),
                adminApi.getManufacturers()
            ]);
            setAgencyOptions(agencies.map(a => ({ label: a.name, value: a.id.toString() })));
            setManufacturerOptions(manufacturers.map(m => ({ label: m, value: m })));
        } catch (error) {
            console.error('Failed to load options', error);
        }
    }, []);

    useEffect(() => {
        fetchDiscounts();
        fetchOptions();
    }, [fetchDiscounts, fetchOptions]);

    // ─── Actions ─────────────────────────────────────────────────────────────

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDiscounts(1);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            type: 'percentage',
            value: 0,
            isActive: true,
            applicableTo: 'all',
            startDate: new Date().toISOString().split('T')[0],
            isStackable: false,
        });
        setShowDialog(true);
    };

    const handleEdit = async (discount: Discount) => {
        setEditingId(discount.id);
        // Format dates for input
        const start = discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '';
        const end = discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '';

        setFormData({
            ...discount,
            startDate: start,
            endDate: end,
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.value) {
            toast.error('Code and Value are required');
            return;
        }

        setSaving(true);
        try {
            const dataToSave = { ...formData };
            // Ensure numbers are numbers
            if (dataToSave.value) dataToSave.value = Number(dataToSave.value);
            if (dataToSave.minOrderAmount) dataToSave.minOrderAmount = Number(dataToSave.minOrderAmount);
            if (dataToSave.usageLimit) dataToSave.usageLimit = Number(dataToSave.usageLimit);

            if (editingId) {
                await adminApi.updateDiscount(editingId, dataToSave);
                toast.success('Discount updated');
            } else {
                await adminApi.createDiscount(dataToSave);
                toast.success('Discount created');
            }
            setShowDialog(false);
            fetchDiscounts(pagination.page);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save discount');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await adminApi.deleteDiscount(deleteId);
            toast.success('Discount deleted');
            setDeleteId(null);
            fetchDiscounts(pagination.page);
        } catch (error) {
            toast.error('Failed to delete discount');
        } finally {
            setDeleting(false);
        }
    };

    const generateCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setFormData(prev => ({ ...prev, code: result }));
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const getStatusColor = (discount: Discount) => {
        if (!discount.isActive) return 'text-slate-500 bg-slate-100 border-slate-200';
        const now = new Date();
        const start = discount.startDate ? new Date(discount.startDate) : null;
        const end = discount.endDate ? new Date(discount.endDate) : null;

        if (start && start > now) return 'text-blue-600 bg-blue-50 border-blue-200'; // Scheduled
        if (end && end < now) return 'text-red-600 bg-red-50 border-red-200'; // Expired
        if (discount.usageLimit && (discount.usedCount || 0) >= discount.usageLimit) return 'text-orange-600 bg-orange-50 border-orange-200'; // Depleted

        return 'text-emerald-700 bg-emerald-50 border-emerald-200'; // Active
    };

    const getStatusText = (discount: Discount) => {
        if (!discount.isActive) return 'Inactive';
        const now = new Date();
        const start = discount.startDate ? new Date(discount.startDate) : null;
        const end = discount.endDate ? new Date(discount.endDate) : null;

        if (start && start > now) return 'Scheduled';
        if (end && end < now) return 'Expired';
        if (discount.usageLimit && (discount.usedCount || 0) >= discount.usageLimit) return 'Limit Reached';

        return 'Active';
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-emerald-600" />
                        Discounts & Coupons
                    </h1>
                    <p className="text-sm text-slate-500">Manage coupon codes and automatic discounts</p>
                </div>
                <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2">
                    <Plus className="w-4 h-4" /> Create Discount
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-emerald-600 uppercase">Active Coupons</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                {discounts.filter(d => d.isActive).length}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600 uppercase">Total Usage</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                {discounts.reduce((sum, d) => sum + (d.usedCount || 0), 0)}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by code or name..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[160px] h-9">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {DISCOUNT_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => fetchDiscounts(1)} className="h-9">
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Code / Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                                        <p className="text-sm text-slate-500">Loading discounts...</p>
                                    </TableCell>
                                </TableRow>
                            ) : discounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        No discounts found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                discounts.map((discount) => (
                                    <TableRow key={discount.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-sm">
                                                        {discount.code}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-slate-400 hover:text-emerald-600"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(discount.code || '');
                                                            toast.success('Code copied');
                                                        }}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <span className="text-xs text-slate-500 mt-1">{discount.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getStatusColor(discount)}`}>
                                                {getStatusText(discount)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                {discount.type === 'percentage' && <Percent className="w-4 h-4 text-purple-500" />}
                                                {discount.type === 'fixed_amount' && <DollarSign className="w-4 h-4 text-green-500" />}
                                                {discount.type === 'free_shipping' && <Ticket className="w-4 h-4 text-blue-500" />}
                                                <span className="capitalize">{discount.type.replace('_', ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-slate-700">
                                                {discount.type === 'percentage' ? `${discount.value}%` : `Rs. ${discount.value}`}
                                            </span>
                                            {discount.minOrderAmount && (
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    Min: Rs. {discount.minOrderAmount}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <span className="font-medium text-slate-700">{discount.usedCount || 0}</span>
                                                <span className="text-slate-400 mx-1">/</span>
                                                <span className="text-slate-500">{discount.usageLimit || '∞'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(discount)}>
                                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => setDeleteId(discount.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => fetchDiscounts(pagination.page - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchDiscounts(pagination.page + 1)}
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Discount' : 'Create New Discount'}</DialogTitle>
                        <DialogDescription>
                            Configure the discount rules and limits.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.code || ''}
                                        onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g., SUMMER2024"
                                        className="uppercase font-mono"
                                    />
                                    <Button variant="outline" onClick={generateCode} type="button">
                                        Generate
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Discount Name (Internal)</Label>
                                <Input
                                    value={formData.name || ''}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g., Summer Sale Campaign"
                                />
                            </div>
                        </div>

                        {/* Value & Type */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val: any) => setFormData(p => ({ ...p, type: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DISCOUNT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Discount Value</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={formData.value || ''}
                                        onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
                                        className="pl-8"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        {formData.type === 'percentage' ? '%' : 'Rs'}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {formData.type === 'percentage' ? 'Percentage off (0-100)' : 'Amount to deduct'}
                                </p>
                            </div>
                        </div>

                        {/* Applicability */}
                        <div className="grid gap-4 p-4 border rounded-lg">
                            <h3 className="text-sm font-medium text-slate-900 border-b pb-2 mb-2">Applicability</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Applicable to</Label>
                                    <Select
                                        value={formData.applicableTo || 'all'}
                                        onValueChange={(val: any) => setFormData(p => ({ ...p, applicableTo: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {APPLICABLE_TO.map(t => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Specific Agencies</Label>
                                    <MultiSelect
                                        options={agencyOptions}
                                        selected={formData.agencyIds?.map(String) || []}
                                        onChange={(vals) => setFormData(prev => ({
                                            ...prev,
                                            agencyIds: vals.map(Number)
                                        }))}
                                        placeholder="Select agencies..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Specific Brands</Label>
                                    <MultiSelect
                                        options={manufacturerOptions}
                                        selected={formData.manufacturers || []}
                                        onChange={(vals) => setFormData(prev => ({
                                            ...prev,
                                            manufacturers: vals
                                        }))}
                                        placeholder="Select brands..."
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Specific Batch IDs</Label>
                                    <Input
                                        placeholder="Enter batch IDs separated by comma (e.g. 1, 2, 3)"
                                        value={formData.batchIds?.join(', ') || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) setFormData(prev => ({ ...prev, batchIds: [] }));
                                            else {
                                                const ids = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                                                setFormData(prev => ({ ...prev, batchIds: ids }));
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Applies only to items from these inventory batches.</p>
                                </div>
                            </div>
                        </div>

                        {/* Usage Limits */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min Order Amount (Optional)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.minOrderAmount || ''}
                                    onChange={e => setFormData(p => ({ ...p, minOrderAmount: e.target.value }))}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Usage Limit (Total)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.usageLimit || ''}
                                    onChange={e => setFormData(p => ({ ...p, usageLimit: e.target.value }))}
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Active Status</Label>
                                <p className="text-xs text-slate-500">Enable or disable this discount code.</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={checked => setFormData(p => ({ ...p, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingId ? 'Save Changes' : 'Create Discount'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Discount?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the discount code.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
