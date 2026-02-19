'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FolderTree, Plus, Search, Edit, Trash2, MoreHorizontal,
    CheckCircle, XCircle, Loader2, ArrowUp, ArrowDown, RefreshCw,
    Package, FolderOpen, Folder, ChevronLeft, ChevronRight, X,
    ExternalLink, ImageOff
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
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import type { Category, Product } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatCategory extends Category {
    depth: number;
    childCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flattenTree(categories: Category[], depth = 0): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const cat of categories) {
        const childCount = cat.children?.length || 0;
        result.push({ ...cat, depth, childCount });
        if (cat.children && cat.children.length > 0) {
            result.push(...flattenTree(cat.children, depth + 1));
        }
    }
    return result;
}

const emptyForm = (): Partial<Category> => ({
    name: '', description: '', icon: '', image: '',
    parentId: null, sortOrder: 0, isActive: true,
});

// ─── Product List Dialog ──────────────────────────────────────────────────────

function ProductListDialog({
    category,
    onClose,
}: {
    category: FlatCategory | null;
    onClose: () => void;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

    const fetchProducts = useCallback(async (p = 1) => {
        if (!category) return;
        setLoading(true);
        try {
            const data = await adminApi.getCategoryProducts(category.id, { page: p, limit: 10 });
            setProducts(data.products || []);
            setPagination(data.pagination);
            setPage(p);
        } catch {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        if (category) fetchProducts(1);
    }, [category, fetchProducts]);

    if (!category) return null;

    return (
        <Dialog open={!!category} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            {category.childCount > 0
                                ? <FolderOpen className="w-4 h-4 text-amber-600" />
                                : <Folder className="w-4 h-4 text-amber-600" />
                            }
                        </div>
                        <div>
                            <span>{category.name}</span>
                            <span className="ml-2 text-sm font-normal text-slate-400">
                                — {pagination.total} product{pagination.total !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Products assigned to this category
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="ml-2 text-sm text-slate-500">Loading products...</span>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No products in this category</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3 w-12">#</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Product</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">SKU</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Price</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">Stock</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product, idx) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50/60">
                                        <TableCell className="text-xs text-slate-400 font-mono">
                                            {(page - 1) * pagination.limit + idx + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {/* Product image */}
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <ImageOff className="w-4 h-4 text-slate-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{product.name}</p>
                                                    {product.genericName && (
                                                        <p className="text-[10px] text-slate-400">{product.genericName}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {product.sku || '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-sm font-semibold text-slate-800">
                                                Rs.{parseFloat(String(product.sellingPrice || 0)).toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(product.stockQuantity || 0) > 10
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : (product.stockQuantity || 0) > 0
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-red-50 text-red-700'
                                                }`}>
                                                {product.stockQuantity ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {product.isActive !== false
                                                ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px]">Active</Badge>
                                                : <Badge variant="outline" className="text-slate-400 text-[10px]">Inactive</Badge>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                        <p className="text-xs text-slate-500">
                            Page {page} of {pagination.totalPages} · {pagination.total} products
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline" size="sm"
                                className="h-8 w-8 p-0"
                                disabled={page <= 1}
                                onClick={() => fetchProducts(page - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-8 w-8 p-0"
                                disabled={page >= pagination.totalPages}
                                onClick={() => fetchProducts(page + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Category Row ─────────────────────────────────────────────────────────────

function CategoryRow({
    cat, allFlat, onEdit, onDelete, onToggleActive, onMoveUp, onMoveDown,
    onViewProducts, isFirst, isLast,
}: {
    cat: FlatCategory;
    allFlat: FlatCategory[];
    onEdit: (c: Category) => void;
    onDelete: (c: Category) => void;
    onToggleActive: (c: Category) => void;
    onMoveUp: (c: Category) => void;
    onMoveDown: (c: Category) => void;
    onViewProducts: (c: FlatCategory) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const count = Number(cat.productCount ?? 0);

    return (
        <TableRow className="hover:bg-slate-50/60 transition-colors group">
            {/* Category name */}
            <TableCell>
                <div className="flex items-center gap-1" style={{ paddingLeft: `${cat.depth * 20}px` }}>
                    {cat.depth > 0 && <span className="text-slate-300 mr-1 text-xs">└</span>}
                    {cat.childCount > 0
                        ? <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        : <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    }
                    <div className="ml-2">
                        <p className="font-semibold text-slate-900 text-sm">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{cat.slug}</p>
                    </div>
                </div>
            </TableCell>

            {/* Description */}
            <TableCell>
                <span className="text-xs text-slate-500 line-clamp-1 max-w-[180px]">
                    {cat.description || <span className="text-slate-300">—</span>}
                </span>
            </TableCell>

            {/* Parent */}
            <TableCell>
                {cat.parentId
                    ? <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {allFlat.find(c => c.id === cat.parentId)?.name || `#${cat.parentId}`}
                    </span>
                    : <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">Root</Badge>
                }
            </TableCell>

            {/* Products — clickable */}
            <TableCell className="text-center">
                <button
                    onClick={() => onViewProducts(cat)}
                    title={count > 0 ? `View ${count} products` : 'No products'}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${count > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-sm cursor-pointer'
                        : 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                        }`}
                >
                    <Package className="w-3 h-3" />
                    {count}
                </button>
            </TableCell>

            {/* Children */}
            <TableCell className="text-center">
                {cat.childCount > 0
                    ? <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">{cat.childCount} sub</Badge>
                    : <span className="text-slate-300 text-xs">—</span>
                }
            </TableCell>

            {/* Sort order */}
            <TableCell className="text-center">
                <span className="text-xs text-slate-500 font-mono">{cat.sortOrder ?? 0}</span>
            </TableCell>

            {/* Status */}
            <TableCell>
                {cat.isActive !== false
                    ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs border">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                    </Badge>
                    : <Badge variant="outline" className="text-slate-400 border-slate-200 text-xs">
                        <XCircle className="w-3 h-3 mr-1" /> Inactive
                    </Badge>
                }
            </TableCell>

            {/* Actions */}
            <TableCell>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                        disabled={isFirst} onClick={() => onMoveUp(cat)} title="Move up"
                    >
                        <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                        disabled={isLast} onClick={() => onMoveDown(cat)} title="Move down"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => onViewProducts(cat)}>
                                <Package className="w-4 h-4 mr-2" /> View Products
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(cat)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleActive(cat)}>
                                {cat.isActive !== false
                                    ? <><XCircle className="w-4 h-4 mr-2" /> Deactivate</>
                                    : <><CheckCircle className="w-4 h-4 mr-2" /> Activate</>
                                }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(cat)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
    const [flatList, setFlatList] = useState<FlatCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Dialogs
    const [showDialog, setShowDialog] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>(emptyForm());
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [productViewCat, setProductViewCat] = useState<FlatCategory | null>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const tree = await adminApi.getCategories({ includeInactive: true });
            setFlatList(flattenTree(tree));
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    // ── Dialog helpers ─────────────────────────────────────────────────────────

    const openCreate = (parentId?: number | null) => {
        setEditingCat(null);
        setFormData({ ...emptyForm(), parentId: parentId ?? null });
        setShowDialog(true);
    };

    const openEdit = (cat: Category) => {
        setEditingCat(cat);
        setFormData({
            name: cat.name,
            description: cat.description || '',
            icon: cat.icon || '',
            image: cat.image || '',
            parentId: cat.parentId ?? null,
            sortOrder: cat.sortOrder ?? 0,
            isActive: cat.isActive !== false,
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) { toast.error('Category name is required'); return; }
        setSaving(true);
        try {
            if (editingCat) {
                await adminApi.updateCategory(editingCat.id, formData);
                toast.success('Category updated successfully');
            } else {
                await adminApi.createCategory(formData);
                toast.success('Category created successfully');
            }
            setShowDialog(false);
            fetchCategories();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await adminApi.deleteCategory(deleteTarget.id);
            toast.success('Category deleted successfully');
            setDeleteTarget(null);
            fetchCategories();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete category');
        } finally {
            setDeleting(false);
        }
    };

    // ── Toggle active ──────────────────────────────────────────────────────────

    const handleToggleActive = async (cat: Category) => {
        try {
            await adminApi.updateCategory(cat.id, { isActive: !cat.isActive });
            toast.success(`Category ${cat.isActive ? 'deactivated' : 'activated'}`);
            fetchCategories();
        } catch {
            toast.error('Failed to update category status');
        }
    };

    // ── Reorder ────────────────────────────────────────────────────────────────

    const handleMove = async (cat: FlatCategory, direction: 'up' | 'down') => {
        const siblings = flatList.filter(c => c.parentId === cat.parentId);
        const idx = siblings.findIndex(c => c.id === cat.id);
        if (direction === 'up' && idx <= 0) return;
        if (direction === 'down' && idx >= siblings.length - 1) return;
        const swapWith = siblings[direction === 'up' ? idx - 1 : idx + 1];
        try {
            await adminApi.reorderCategories([
                { id: cat.id, sortOrder: swapWith.sortOrder ?? 0 },
                { id: swapWith.id, sortOrder: cat.sortOrder ?? 0 },
            ]);
            fetchCategories();
        } catch {
            toast.error('Failed to reorder');
        }
    };

    // ── Filtered list ──────────────────────────────────────────────────────────

    const filtered = flatList.filter(c => {
        const matchSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.slug.toLowerCase().includes(search.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(search.toLowerCase());
        const matchActive = showInactive || c.isActive !== false;
        return matchSearch && matchActive;
    });

    // Stats
    const rootCount = flatList.filter(c => !c.parentId).length;
    const activeCount = flatList.filter(c => c.isActive !== false).length;
    const totalProducts = flatList.reduce((sum, c) => sum + Number(c.productCount || 0), 0);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FolderTree className="w-6 h-6 text-emerald-600" />
                        Categories
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Classification and hierarchy of medical products
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchCategories} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                    <Button
                        onClick={() => openCreate()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Category
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Categories', value: flatList.length, color: 'from-emerald-50 to-teal-50', icon: FolderTree, iconColor: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Root Categories', value: rootCount, color: 'from-blue-50 to-indigo-50', icon: Folder, iconColor: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Active', value: activeCount, color: 'from-violet-50 to-purple-50', icon: CheckCircle, iconColor: 'text-violet-600', bg: 'bg-violet-100' },
                    { label: 'Total Products', value: totalProducts, color: 'from-amber-50 to-orange-50', icon: Package, iconColor: 'text-amber-600', bg: 'bg-amber-100' },
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
                        <CardTitle className="text-base font-semibold text-slate-900">All Categories</CardTitle>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                            <Label htmlFor="show-inactive" className="text-xs text-slate-500 cursor-pointer">Show inactive</Label>
                        </div>
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search categories..."
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
                            <span className="ml-2 text-sm text-slate-500">Loading categories...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <FolderTree className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">
                                {search ? 'No categories match your search' : 'No categories yet'}
                            </p>
                            {!search && (
                                <Button onClick={() => openCreate()} variant="outline" className="mt-4 text-emerald-600 border-emerald-200">
                                    <Plus className="w-4 h-4 mr-2" /> Add First Category
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3">Category</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Description</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Parent</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">
                                        Products
                                        <span className="ml-1 text-[9px] text-slate-400 normal-case font-normal">(click to view)</span>
                                    </TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">Children</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-center">Order</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                                    <TableHead className="w-28" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(cat => {
                                    const siblings = filtered.filter(c => c.parentId === cat.parentId);
                                    const sibIdx = siblings.findIndex(c => c.id === cat.id);
                                    return (
                                        <CategoryRow
                                            key={cat.id}
                                            cat={cat}
                                            allFlat={flatList}
                                            onEdit={openEdit}
                                            onDelete={setDeleteTarget}
                                            onToggleActive={handleToggleActive}
                                            onMoveUp={c => handleMove(c as FlatCategory, 'up')}
                                            onMoveDown={c => handleMove(c as FlatCategory, 'down')}
                                            onViewProducts={setProductViewCat}
                                            isFirst={sibIdx === 0}
                                            isLast={sibIdx === siblings.length - 1}
                                        />
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Product List Dialog ── */}
            <ProductListDialog
                category={productViewCat}
                onClose={() => setProductViewCat(null)}
            />

            {/* ── Create / Edit Dialog ── */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <FolderTree className="w-5 h-5 text-emerald-600" />
                            {editingCat ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCat ? 'Update the category details below.' : 'Fill in the details to create a new product category.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="cat-name" className="text-xs font-medium text-slate-700">
                                Category Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="cat-name"
                                placeholder="e.g. Antibiotics"
                                value={formData.name || ''}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cat-desc" className="text-xs font-medium text-slate-700">Description</Label>
                            <textarea
                                id="cat-desc"
                                rows={2}
                                placeholder="Brief description of this category"
                                value={formData.description || ''}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-700">Parent Category</Label>
                            <Select
                                value={formData.parentId?.toString() || 'none'}
                                onValueChange={v => setFormData(p => ({ ...p, parentId: v === 'none' ? null : parseInt(v) }))}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="None (Root category)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Root category)</SelectItem>
                                    {flatList
                                        .filter(c => c.id !== editingCat?.id)
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {'  '.repeat(c.depth)}{c.depth > 0 ? '└ ' : ''}{c.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cat-icon" className="text-xs font-medium text-slate-700">Icon (emoji or name)</Label>
                                <Input
                                    id="cat-icon"
                                    placeholder="e.g. 💊 or pill"
                                    value={formData.icon || ''}
                                    onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cat-order" className="text-xs font-medium text-slate-700">Sort Order</Label>
                                <Input
                                    id="cat-order"
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={formData.sortOrder ?? 0}
                                    onChange={e => setFormData(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cat-image" className="text-xs font-medium text-slate-700">Image URL</Label>
                            <Input
                                id="cat-image"
                                placeholder="https://..."
                                value={formData.image || ''}
                                onChange={e => setFormData(p => ({ ...p, image: e.target.value }))}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Active</p>
                                <p className="text-xs text-slate-500">Visible to customers on the store</p>
                            </div>
                            <Switch
                                checked={formData.isActive !== false}
                                onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {saving
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                : editingCat ? 'Update Category' : 'Create Category'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                            {Number(deleteTarget?.productCount ?? 0) > 0 && (
                                <span className="block mt-2 text-orange-600 font-medium">
                                    ⚠️ This category has {deleteTarget?.productCount} products. Move them to another category first.
                                </span>
                            )}
                            {((deleteTarget as FlatCategory)?.childCount ?? 0) > 0 && (
                                <span className="block mt-2 text-orange-600 font-medium">
                                    ⚠️ This category has {(deleteTarget as FlatCategory)?.childCount} subcategories. Delete them first.
                                </span>
                            )}
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
