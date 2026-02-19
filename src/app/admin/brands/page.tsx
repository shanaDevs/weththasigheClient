'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Edit, Trash2, MoreHorizontal,
    CheckCircle, XCircle, Loader2, RefreshCw,
    Package, ImageOff, Tag, Upload
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
import { Switch } from '@/components/ui/switch';
import adminApi from '@/lib/api/admin';
import { toast } from 'sonner';
import type { Brand } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyForm = (): Partial<Brand> => ({
    name: '',
    description: '',
    logo: '',
    isActive: true,
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Dialogs
    const [showDialog, setShowDialog] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState<Partial<Brand>>(emptyForm());
    const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getBrands();
            setBrands(data);
        } catch {
            toast.error('Failed to load brands');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBrands(); }, [fetchBrands]);

    // ── Dialog helpers ─────────────────────────────────────────────────────────

    const openCreate = () => {
        setEditingBrand(null);
        setFormData(emptyForm());
        setShowDialog(true);
    };

    const openEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            description: brand.description || '',
            logo: brand.logo || '',
            isActive: brand.isActive !== false,
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) { toast.error('Brand name is required'); return; }
        setSaving(true);
        try {
            if (editingBrand) {
                await adminApi.updateBrand(editingBrand.id, formData);
                toast.success('Brand updated successfully');
            } else {
                await adminApi.createBrand(formData);
                toast.success('Brand created successfully');
            }
            setShowDialog(false);
            fetchBrands();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save brand');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await adminApi.deleteBrand(deleteTarget.id);
            toast.success('Brand deleted successfully');
            setDeleteTarget(null);
            fetchBrands();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete brand');
        } finally {
            setDeleting(false);
        }
    };

    // ── Toggle active ──────────────────────────────────────────────────────────

    const handleToggleActive = async (brand: Brand) => {
        try {
            await adminApi.updateBrand(brand.id, { isActive: !brand.isActive });
            toast.success(`Brand ${brand.isActive ? 'deactivated' : 'activated'}`);
            fetchBrands();
        } catch {
            toast.error('Failed to update brand status');
        }
    };

    // ── Image Upload ─────────────────────────────────────────────────────────────

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const url = await adminApi.uploadCategoryImage(file); // Reusing uploadSingle logic
            setFormData(prev => ({ ...prev, logo: url }));
            toast.success('Logo uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
            e.target.value = '';
        }
    };

    // ── Filtered list ──────────────────────────────────────────────────────────

    const filtered = brands.filter(b => {
        const matchSearch = !search ||
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.slug.toLowerCase().includes(search.toLowerCase()) ||
            (b.description || '').toLowerCase().includes(search.toLowerCase());
        const matchActive = showInactive || b.isActive !== false;
        return matchSearch && matchActive;
    });

    // Stats
    const activeCount = brands.filter(b => b.isActive !== false).length;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-indigo-600" />
                        Brands
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage product manufacturers and brand names
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchBrands} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                    <Button
                        onClick={() => openCreate()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Brand
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Brands', value: brands.length, color: 'from-indigo-50 to-blue-50', icon: Tag, iconColor: 'text-indigo-600', bg: 'bg-indigo-100' },
                    { label: 'Active Brands', value: activeCount, color: 'from-emerald-50 to-teal-50', icon: CheckCircle, iconColor: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Inactive Brands', value: brands.length - activeCount, color: 'from-slate-50 to-slate-100', icon: XCircle, iconColor: 'text-slate-400', bg: 'bg-slate-200' },
                ].map(({ label, value, color, icon: Icon, iconColor, bg }) => (
                    <Card key={label} className={`border-0 shadow-sm bg-gradient-to-br ${color}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{value}</p>
                                <p className="text-xs text-slate-500">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-base font-semibold text-slate-900">All Brands</CardTitle>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                            <Label htmlFor="show-inactive" className="text-xs text-slate-500 cursor-pointer">Show inactive</Label>
                        </div>
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search brands..."
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
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            <span className="ml-2 text-sm text-slate-500">Loading brands...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Tag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">
                                {search ? 'No brands match your search' : 'No brands yet'}
                            </p>
                            {!search && (
                                <Button onClick={() => openCreate()} variant="outline" className="mt-4 text-indigo-600 border-indigo-200">
                                    <Plus className="w-4 h-4 mr-2" /> Add First Brand
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3">Brand</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Slug</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Description</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                                    <TableHead className="w-28" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(brand => (
                                    <TableRow key={brand.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                                                    {brand.logo ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <Tag className="w-5 h-5 text-slate-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{brand.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">ID: {brand.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                {brand.slug}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-500 line-clamp-1 max-w-[300px]">
                                                {brand.description || <span className="text-slate-300">—</span>}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {brand.isActive !== false
                                                ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs border">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                </Badge>
                                                : <Badge variant="outline" className="text-slate-400 border-slate-200 text-xs text-[10px]">
                                                    <XCircle className="w-3 h-3 mr-1" /> Inactive
                                                </Badge>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                                                    onClick={() => openEdit(brand)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => handleToggleActive(brand)}>
                                                            {brand.isActive !== false
                                                                ? <><XCircle className="w-4 h-4 mr-2" /> Deactivate</>
                                                                : <><CheckCircle className="w-4 h-4 mr-2" /> Activate</>
                                                            }
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteTarget(brand)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Create / Edit Dialog ── */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Tag className="w-5 h-5 text-indigo-600" />
                            {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBrand ? 'Update the brand details below.' : 'Fill in the details to create a new product brand.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="brand-name" className="text-xs font-medium text-slate-700">
                                Brand Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="brand-name"
                                placeholder="e.g. Pfizer"
                                value={formData.name || ''}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="brand-desc" className="text-xs font-medium text-slate-700">Description</Label>
                            <textarea
                                id="brand-desc"
                                rows={3}
                                placeholder="Brief description of this brand"
                                value={formData.description || ''}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-700">Brand Logo</Label>
                            <div className="flex items-center gap-4">
                                {formData.logo ? (
                                    <div className="relative w-24 h-24 bg-slate-100 rounded-lg overflow-hidden group border border-slate-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.logo} alt="Brand Logo" className="w-full h-full object-contain p-2" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingLogo}
                                            onChange={handleLogoUpload}
                                        />
                                        {uploadingLogo ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                <span className="text-[10px] text-slate-500 mt-1 font-medium">Upload Logo</span>
                                            </>
                                        )}
                                    </label>
                                )}
                                <div className="flex-1 space-y-1">
                                    <p className="text-[11px] text-slate-500 font-medium">PNG, JPG or SVG</p>
                                    <p className="text-[10px] text-slate-400">Recommended size: 200x200px</p>
                                    <div className="mt-2">
                                        <Input
                                            placeholder="Or paste URL here..."
                                            value={formData.logo || ''}
                                            onChange={e => setFormData(p => ({ ...p, logo: e.target.value }))}
                                            className="h-7 text-[10px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Active Status</p>
                                <p className="text-xs text-slate-500">Enabled brands appear in product forms</p>
                            </div>
                            <Switch
                                checked={formData.isActive !== false}
                                onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            {saving
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                : editingBrand ? 'Update Brand' : 'Create Brand'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Brand</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                            This action cannot be undone and may affect products associated with this brand.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? 'Deleting...' : 'Delete Brand'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
