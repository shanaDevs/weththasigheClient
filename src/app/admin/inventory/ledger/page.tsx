'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ClipboardList, Search, Filter, ArrowUpRight, ArrowDownLeft,
    RotateCcw, AlertTriangle, Calendar, User as UserIcon,
    Package, History, Loader2, Download, ExternalLink,
    Tag, ShoppingCart, RefreshCw, Trash2, ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Movement {
    id: number;
    productId: number;
    product?: { name: string; sku: string };
    type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer' | 'damage' | 'expired' | 'reserved' | 'unreserved';
    quantityBefore: number;
    quantityChange: number;
    quantityAfter: number;
    referenceType?: string;
    referenceNumber?: string;
    reason?: string;
    batchNumber?: string;
    createdByName?: string;
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOVEMENT_TYPES: Record<string, { label: string; color: string; icon: any }> = {
    purchase: { label: 'Purchase Receipt', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Package },
    sale: { label: 'Order Sale', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: ShoppingCart },
    return: { label: 'Return', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: RotateCcw },
    adjustment: { label: 'Manual Adjustment', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Filter },
    damage: { label: 'Damage', color: 'text-red-600 bg-red-50 border-red-100', icon: Trash2 },
    expired: { label: 'Expired', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: ShieldAlert },
    reserved: { label: 'Reserved', color: 'text-slate-500 bg-slate-50 border-slate-100', icon: History },
    unreserved: { label: 'Released', color: 'text-slate-400 bg-slate-50 border-slate-100', icon: RefreshCw },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryLedgerPage() {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        type: 'all',
        startDate: '',
        endDate: '',
        search: ''
    });

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { ...filters };
            if (params.type === 'all') delete params.type;
            const res = await adminApi.getInventoryMovements(params);
            setMovements(res.data.movements || []);
        } catch (error) {
            toast.error('Failed to load inventory history');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await adminApi.getInventoryStats();
            setStats(res.data);
        } catch { }
    }, []);

    useEffect(() => { fetchMovements(); }, [fetchMovements]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleFilterChange = (key: string, val: any) => {
        setFilters(f => ({ ...f, [key]: val, page: 1 }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-emerald-600" />
                        Inventory Ledger
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Track every stock movement and audit trail across the system
                    </p>
                </div>
                <Button variant="outline" className="border-slate-200">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.totalProducts || 0}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase">Tracked Products</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.lowStockProducts || 0}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase">Low Stock Alerts</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-red-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.outOfStockProducts || 0}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase">Out of Stock</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Card */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <CardTitle className="text-base font-bold text-slate-900 flex-1">Movement History</CardTitle>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search product or reference..."
                                    value={filters.search}
                                    onChange={e => handleFilterChange('search', e.target.value)}
                                    className="pl-9 h-9 text-sm w-56 border-slate-200"
                                />
                            </div>

                            <Select value={filters.type} onValueChange={v => handleFilterChange('type', v)}>
                                <SelectTrigger className="h-9 text-sm w-44">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Movement Types</SelectItem>
                                    {Object.entries(MOVEMENT_TYPES).map(([val, info]) => (
                                        <SelectItem key={val} value={val}>{info.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={e => handleFilterChange('startDate', e.target.value)}
                                    className="h-9 text-xs w-32 border-slate-200"
                                />
                                <span className="text-slate-400">to</span>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={e => handleFilterChange('endDate', e.target.value)}
                                    className="h-9 text-xs w-32 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                            <p className="text-sm text-slate-500">Loading movement logs...</p>
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="text-center py-20">
                            <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium tracking-tight">No stock movements found</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3">Timestamp</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Product</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Type</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Change</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-right font-mono">Stock Level</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Reference / Reason</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">User</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.map((move) => {
                                    const typeInfo = MOVEMENT_TYPES[move.type] || { label: move.type, color: 'text-slate-500 bg-slate-50', icon: Tag };
                                    const TypeIcon = typeInfo.icon;
                                    const isPositive = move.quantityChange > 0;

                                    return (
                                        <TableRow key={move.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900">
                                                        {new Date(move.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                                                        {new Date(move.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[180px]">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{move.product?.name || 'Unknown Product'}</p>
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> {move.product?.sku || 'N/A'}
                                                        {move.batchNumber && (
                                                            <span className="bg-slate-100 px-1 rounded">Batch: {move.batchNumber}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0 border-transparent flex items-center gap-1.5 w-fit", typeInfo.color)}>
                                                    <TypeIcon className="w-3 h-3" />
                                                    {typeInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={cn(
                                                    "flex items-center justify-end font-bold text-sm",
                                                    isPositive ? "text-emerald-600" : move.quantityChange < 0 ? "text-rose-600" : "text-slate-400"
                                                )}>
                                                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : move.quantityChange < 0 ? <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" /> : null}
                                                    {isPositive ? '+' : ''}{move.quantityChange}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-slate-900">{move.quantityAfter}</span>
                                                    <span className="text-[9px] text-slate-400">was {move.quantityBefore}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px]">
                                                    {move.referenceNumber && (
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded leading-none">{move.referenceNumber}</span>
                                                            <span className="text-[9px] text-slate-400 italic">via {move.referenceType}</span>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-slate-500 line-clamp-1">{move.reason || '—'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <UserIcon className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">{move.createdByName || 'System'}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

                {/* Pagination */}
                {!loading && movements.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Showing <span className="font-bold">{movements.length}</span> most recent movements
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs disabled:opacity-50">Previous</Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs">Next</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
