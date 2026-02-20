'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ClipboardList, Plus, Search, Eye, Send, Download, MoreHorizontal,
    Package, Calendar, DollarSign, CheckCircle, Clock, XCircle,
    Loader2, Truck, ChevronLeft, AlertCircle, RefreshCw, FileText
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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type POStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';

interface POItem {
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    taxPercentage: number;
    taxAmount: number;
    total: number;
}

interface PurchaseOrder {
    id: number;
    poNumber: string;
    supplierId: number;
    supplier?: { name: string; code?: string; email?: string; contactPerson?: string };
    orderDate: string;
    expectedDate?: string;
    totalAmount: string | number;
    status: POStatus;
    paymentStatus: string;
    notes?: string;
    items?: POItem[];
    createdAt: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<POStatus, { label: string; className: string; icon: React.ElementType }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
    sent: { label: 'Sent', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
    partially_received: { label: 'Part. Received', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Package },
    received: { label: 'Received', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
};

function StatusBadge({ status }: { status: POStatus }) {
    const s = STATUS_MAP[status] || STATUS_MAP.draft;
    const Icon = s.icon;
    return (
        <Badge variant="outline" className={`text-xs font-medium ${s.className} flex items-center gap-1 w-fit`}>
            <Icon className="w-3 h-3" />{s.label}
        </Badge>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Detail view
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Create dialog
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [poForm, setPOForm] = useState({
        supplierId: '',
        expectedDate: '',
        notes: '',
        items: [{ productId: '', quantity: 1, unitPrice: '', taxPercentage: 0 }],
    });

    // Actions
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    // Receiving
    const [showReceive, setShowReceive] = useState(false);
    const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
    const [receiveForm, setReceiveForm] = useState<any[]>([]);
    const [isReceiving, setIsReceiving] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (statusFilter !== 'all') params.status = statusFilter;
            const data = await adminApi.getPurchaseOrders(params);
            setOrders(data?.purchaseOrders || data || []);
        } catch {
            toast.error('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const fetchSuppliers = useCallback(async () => {
        try {
            const data = await adminApi.getSuppliers({ limit: 200, status: 'active' });
            setSuppliers(data?.suppliers || data || []);
        } catch { }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const data = await adminApi.getProducts({ limit: 300, isActive: true });
            setProducts(data?.data || []);
        } catch { }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useEffect(() => { fetchSuppliers(); fetchProducts(); }, [fetchSuppliers, fetchProducts]);

    // ─── Open detail ──────────────────────────────────────────────────────────

    const openDetail = async (id: number) => {
        setDetailLoading(true);
        try {
            const data = await adminApi.getPurchaseOrder(id);
            setSelectedPO(data);
        } catch {
            toast.error('Failed to load purchase order details');
        } finally {
            setDetailLoading(false);
        }
    };

    // ─── Send PO ──────────────────────────────────────────────────────────────

    const handleSend = async (po: PurchaseOrder) => {
        setSendingId(po.id);
        try {
            const result = await adminApi.sendPurchaseOrder(po.id);
            if (result.success) {
                toast.success(`PO ${po.poNumber} sent to ${po.supplier?.email || 'supplier'} ✓`);
                fetchOrders();
                if (selectedPO?.id === po.id) openDetail(po.id);
            } else {
                toast.error(result.message || 'Failed to send PO');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send purchase order');
        } finally {
            setSendingId(null);
        }
    };

    // ─── Download PDF ─────────────────────────────────────────────────────────

    const handleDownload = async (po: PurchaseOrder) => {
        setDownloadingId(po.id);
        try {
            await adminApi.downloadPurchaseOrderPdf(po.id, po.poNumber);
            toast.success(`PDF downloaded for ${po.poNumber}`);
        } catch {
            toast.error('Failed to download PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    // ─── Update Status ────────────────────────────────────────────────────────

    const handleUpdateStatus = async (po: PurchaseOrder, status: string) => {
        try {
            await adminApi.updatePurchaseOrderStatus(po.id, status);
            toast.success(`Status updated to ${status}`);
            fetchOrders();
            if (selectedPO?.id === po.id) openDetail(po.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update status');
        }
    };

    // ─── Create PO ────────────────────────────────────────────────────────────

    const addItem = () =>
        setPOForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitPrice: '', taxPercentage: 0 }] }));

    const removeItem = (i: number) =>
        setPOForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

    const updateItem = (i: number, key: string, val: any) =>
        setPOForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item) }));

    const calcTotal = () =>
        poForm.items.reduce((acc, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unitPrice) || 0;
            const tax = Number(item.taxPercentage) || 0;
            const sub = qty * price;
            return acc + sub + (sub * tax / 100);
        }, 0);

    const handleCreate = async (sendNow = false) => {
        if (!poForm.supplierId) { toast.error('Please select a supplier'); return; }
        const validItems = poForm.items.filter(i => i.productId && Number(i.quantity) > 0 && Number(i.unitPrice) > 0);
        if (validItems.length === 0) { toast.error('Add at least one item with product, qty, and price'); return; }

        setCreating(true);
        try {
            const payload = {
                supplierId: Number(poForm.supplierId),
                expectedDate: poForm.expectedDate || undefined,
                notes: poForm.notes || undefined,
                items: validItems.map(i => ({
                    productId: Number(i.productId),
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice),
                    taxPercentage: Number(i.taxPercentage) || 0,
                })),
            };
            const newPO = await adminApi.createPurchaseOrder(payload);
            toast.success(`Purchase Order ${newPO.poNumber} created!`);
            setShowCreate(false);
            setPOForm({ supplierId: '', expectedDate: '', notes: '', items: [{ productId: '', quantity: 1, unitPrice: '', taxPercentage: 0 }] });
            fetchOrders();

            if (sendNow && newPO.id) {
                await handleSend(newPO);
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create purchase order');
        } finally {
            setCreating(false);
        }
    };

    // ─── Receiving ────────────────────────────────────────────────────────────

    const openReceiveModal = (po: PurchaseOrder) => {
        setReceivingPO(po);
        setReceiveForm((po.items || []).map(i => ({
            productId: i.productId,
            productName: i.productName || (i as any).product?.name,
            sku: i.sku || (i as any).product?.sku,
            orderedQty: i.quantity,
            alreadyReceived: (i as any).receivedQuantity || 0,
            receiveQty: 0,
            batchNumber: '',
            expiryDate: '',
        })));
        setShowReceive(true);
    };

    const handleReceive = async () => {
        if (!receivingPO) return;
        const itemsToReceive = receiveForm.filter(f => f.receiveQty > 0);
        if (itemsToReceive.length === 0) {
            toast.error('Please enter quantity for at least one item');
            return;
        }

        setIsReceiving(true);
        try {
            await adminApi.receivePurchaseOrderItems(receivingPO.id, itemsToReceive.map(i => ({
                productId: i.productId,
                quantity: i.receiveQty,
                batchNumber: i.batchNumber || undefined,
                expiryDate: i.expiryDate || undefined,
            })));
            toast.success('Inventory updated successfully!');
            setShowReceive(false);
            fetchOrders();
            if (selectedPO?.id === receivingPO.id) openDetail(receivingPO.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to receive items');
        } finally {
            setIsReceiving(false);
        }
    };

    // ─── Filtered ─────────────────────────────────────────────────────────────

    const filtered = orders.filter(o =>
        o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.supplier?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const draftCount = orders.filter(o => o.status === 'draft').length;
    const sentCount = orders.filter(o => o.status === 'sent').length;
    const receivedCount = orders.filter(o => o.status === 'received').length;

    // ─── Detail Panel ─────────────────────────────────────────────────────────

    if (selectedPO) {
        const po = selectedPO;
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPO(null)} className="text-slate-600">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to POs
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-emerald-600" />
                            {po.poNumber}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Created {new Date(po.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(po)}
                            disabled={downloadingId === po.id}
                            className="border-slate-200 text-slate-700"
                        >
                            {downloadingId === po.id
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : <Download className="w-4 h-4 mr-2" />}
                            Download PDF
                        </Button>
                        {po.status !== 'cancelled' && po.status !== 'received' && (
                            <Button
                                size="sm"
                                onClick={() => handleSend(po)}
                                disabled={sendingId === po.id || !po.supplier?.email}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {sendingId === po.id
                                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    : <Send className="w-4 h-4 mr-2" />}
                                {po.status === 'draft' ? 'Send to Supplier' : 'Resend Email'}
                            </Button>
                        )}
                        {po.status !== 'received' && po.status !== 'cancelled' && po.status !== 'draft' && (
                            <Button
                                size="sm"
                                onClick={() => openReceiveModal(po)}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Package className="w-4 h-4 mr-2" /> Receive Items
                            </Button>
                        )}
                    </div>
                </div>

                {/* Supplier email warning */}
                {!po.supplier?.email && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                <strong>Supplier has no email address.</strong> Update the supplier record with an email before sending this PO.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Info cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Status</p>
                                        <div className="mt-1"><StatusBadge status={po.status} /></div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Payment</p>
                                        <Badge variant="outline" className="mt-1 text-xs capitalize">{po.paymentStatus}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Order Date</p>
                                        <p className="text-sm font-medium text-slate-900 mt-1">
                                            {new Date(po.orderDate || po.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Expected Delivery</p>
                                        <p className="text-sm font-medium text-slate-900 mt-1">
                                            {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Grand Total</p>
                                        <p className="text-xl font-bold text-slate-900 mt-1">
                                            {Number(po.totalAmount).toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    {po.notes && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Notes</p>
                                            <p className="text-sm text-slate-700 mt-1 bg-slate-50 rounded-lg p-2">{po.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-sm font-semibold text-slate-900">Line Items</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">#</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">Product</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Ordered Qty</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Received Qty</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Unit Price</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Tax</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(po.items || []).map((item: any, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-sm text-slate-500">{i + 1}</TableCell>
                                                <TableCell>
                                                    <p className="text-sm font-medium text-slate-900">{item.product?.name || `Product #${item.productId}`}</p>
                                                    {item.product?.sku && <p className="text-xs text-slate-400">SKU: {item.product.sku}</p>}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-700 text-right font-medium">{item.quantity}</TableCell>
                                                <TableCell className="text-sm text-right">
                                                    <span className={item.receivedQuantity >= item.quantity ? "text-emerald-600 font-bold" : "text-amber-600 font-medium"}>
                                                        {item.receivedQuantity || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-700 text-right">{Number(item.unitPrice).toFixed(2)}</TableCell>
                                                <TableCell className="text-sm text-slate-700 text-right">
                                                    {Number(item.taxPercentage || 0).toFixed(1)}%
                                                    <span className="block text-xs text-slate-400">({Number(item.taxAmount || 0).toFixed(2)})</span>
                                                </TableCell>
                                                <TableCell className="text-sm font-semibold text-slate-900 text-right">
                                                    {Number(item.total).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="p-4 border-t border-slate-100 flex justify-end">
                                    <div className="w-48 space-y-1">
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Grand Total</span>
                                            <span className="font-bold text-slate-900">{Number(po.totalAmount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-emerald-600" />Supplier
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <p className="font-semibold text-slate-900">{po.supplier?.name || '—'}</p>
                                {po.supplier?.code && <p className="text-xs text-slate-500">Code: {po.supplier.code}</p>}
                                {po.supplier?.contactPerson && <p className="text-sm text-slate-600">{po.supplier.contactPerson}</p>}
                                {po.supplier?.email ? (
                                    <p className="text-sm text-blue-600 break-all">{po.supplier.email}</p>
                                ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">No email set</Badge>
                                )}
                            </CardContent>
                        </Card>

                        {/* Update Status */}
                        {po.status !== 'cancelled' && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-3 border-b border-slate-100">
                                    <CardTitle className="text-sm font-semibold text-slate-900">Update Status</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2">
                                    {(['sent', 'partially_received', 'received', 'cancelled'] as POStatus[])
                                        .filter(s => s !== po.status)
                                        .map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleUpdateStatus(po, s)}
                                                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                            >
                                                Mark as <span className="font-medium capitalize">{s.replace('_', ' ')}</span>
                                            </button>
                                        ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── List View ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-emerald-600" />
                        Purchase Orders
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Create and send purchase orders to suppliers
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Create PO
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                    { label: 'Total POs', value: orders.length, color: 'from-slate-50 to-slate-100', iconColor: 'bg-slate-100 text-slate-600', icon: ClipboardList },
                    { label: 'Draft', value: draftCount, color: 'from-amber-50 to-orange-50', iconColor: 'bg-amber-100 text-amber-600', icon: Clock },
                    { label: 'Sent', value: sentCount, color: 'from-blue-50 to-indigo-50', iconColor: 'bg-blue-100 text-blue-600', icon: Send },
                    { label: 'Received', value: receivedCount, color: 'from-emerald-50 to-teal-50', iconColor: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
                ] as const).map(stat => (
                    <Card key={stat.label} className={`border-0 shadow-sm bg-gradient-to-br ${stat.color}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters + Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <CardTitle className="text-base font-semibold text-slate-900 flex-1">All Purchase Orders</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search PO# or supplier..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-sm w-52"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 text-sm w-40">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="partially_received">Part. Received</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="ml-2 text-sm text-slate-500">Loading purchase orders...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">
                                {search || statusFilter !== 'all' ? 'No orders match your filter' : 'No purchase orders yet'}
                            </p>
                            {!search && statusFilter === 'all' && (
                                <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-4 text-emerald-600 border-emerald-200">
                                    <Plus className="w-4 h-4 mr-2" /> Create First PO
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 py-3">PO Number</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Supplier</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Date</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Expected</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Total</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Status</TableHead>
                                    <TableHead className="w-14" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(po => (
                                    <TableRow
                                        key={po.id}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                        onClick={() => openDetail(po.id)}
                                    >
                                        <TableCell>
                                            <span className="font-mono font-semibold text-slate-900 text-sm">{po.poNumber}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-emerald-700">
                                                        {po.supplier?.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{po.supplier?.name || '—'}</p>
                                                    {!po.supplier?.email && (
                                                        <p className="text-xs text-amber-600">No email</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {new Date(po.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </TableCell>
                                        <TableCell><StatusBadge status={po.status} /></TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem onClick={() => openDetail(po.id)}>
                                                        <Eye className="w-4 h-4 mr-2" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDownload(po)}
                                                        disabled={downloadingId === po.id}
                                                    >
                                                        {downloadingId === po.id
                                                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            : <Download className="w-4 h-4 mr-2" />}
                                                        Download PDF
                                                    </DropdownMenuItem>
                                                    {po.status !== 'cancelled' && po.status !== 'received' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleSend(po)}
                                                                disabled={sendingId === po.id || !po.supplier?.email}
                                                                className="text-emerald-700 focus:text-emerald-700"
                                                            >
                                                                {sendingId === po.id
                                                                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    : <Send className="w-4 h-4 mr-2" />}
                                                                Send to Supplier
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {po.status !== 'received' && po.status !== 'cancelled' && po.status !== 'draft' && (
                                                        <DropdownMenuItem
                                                            onClick={() => openReceiveModal(po)}
                                                            className="text-amber-700 focus:text-amber-700"
                                                        >
                                                            <Package className="w-4 h-4 mr-2" /> Receive Items
                                                        </DropdownMenuItem>
                                                    )}
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

            {/* Detail loading spinner */}
            {detailLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-slate-700 font-medium">Loading details...</span>
                    </div>
                </div>
            )}

            {/* ─── Create PO Dialog ──────────────────────────────────────────────── */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <ClipboardList className="w-5 h-5 text-emerald-600" />
                            Create Purchase Order
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the supplier and item details to create a new PO. You can save as draft or send immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Supplier + dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-1 space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">Supplier *</Label>
                                <Select value={poForm.supplierId} onValueChange={v => setPOForm(f => ({ ...f, supplierId: v }))}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span>{s.name}</span>
                                                    {!s.email && <span className="text-amber-500 text-xs">(no email)</span>}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">Expected Delivery</Label>
                                <Input
                                    type="date"
                                    value={poForm.expectedDate}
                                    onChange={e => setPOForm(f => ({ ...f, expectedDate: e.target.value }))}
                                    className="h-9 text-sm"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">Notes</Label>
                                <Input
                                    placeholder="Optional notes..."
                                    value={poForm.notes}
                                    onChange={e => setPOForm(f => ({ ...f, notes: e.target.value }))}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-slate-700">Line Items *</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="h-7 text-xs text-emerald-600 border-emerald-200"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Item
                                </Button>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide gap-2">
                                    <div className="col-span-4">Product</div>
                                    <div className="col-span-2 text-right">Qty</div>
                                    <div className="col-span-3 text-right">Unit Price</div>
                                    <div className="col-span-2 text-right">Tax %</div>
                                    <div className="col-span-1" />
                                </div>

                                {poForm.items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-12 px-3 py-2.5 gap-2 border-t border-slate-100 items-center">
                                        <div className="col-span-4">
                                            <Select
                                                value={item.productId}
                                                onValueChange={v => {
                                                    const p = products.find((x: any) => String(x.id) === v);
                                                    updateItem(i, 'productId', v);
                                                    if (p?.costPrice) updateItem(i, 'unitPrice', Number(p.costPrice).toFixed(2));
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p: any) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            <span className="text-xs">{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={e => updateItem(i, 'quantity', e.target.value)}
                                                className="h-8 text-xs text-right"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.unitPrice}
                                                onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                                                className="h-8 text-xs text-right"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step="0.5"
                                                placeholder="0"
                                                value={item.taxPercentage}
                                                onChange={e => updateItem(i, 'taxPercentage', e.target.value)}
                                                className="h-8 text-xs text-right"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            {poForm.items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(i)}
                                                    className="text-slate-300 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Total row */}
                                <div className="px-3 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                                    <div className="text-sm">
                                        <span className="text-slate-500 mr-3">Estimated Total:</span>
                                        <span className="font-bold text-slate-900 text-base">
                                            {calcTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</Button>
                        <Button
                            variant="outline"
                            onClick={() => handleCreate(false)}
                            disabled={creating}
                            className="text-slate-700 border-slate-300"
                        >
                            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                            Save as Draft
                        </Button>
                        <Button
                            onClick={() => handleCreate(true)}
                            disabled={creating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Create & Send to Supplier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Receive Items Dialog ──────────────────────────────────────────── */}
            <Dialog open={showReceive} onOpenChange={setShowReceive}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Package className="w-5 h-5 text-amber-600" />
                            Receive Items - {receivingPO?.poNumber}
                        </DialogTitle>
                        <DialogDescription>
                            Enter the quantities received for each item. This will update your inventory stock levels.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border border-slate-200 rounded-xl overflow-hidden my-2">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500">Product</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Ordered</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">To Receive</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 w-40">Batch Number</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-slate-500 w-40">Expiry Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receiveForm.map((item, idx) => (
                                    <TableRow key={item.productId} className={item.alreadyReceived >= item.orderedQty ? "bg-slate-50/50 opacity-60" : ""}>
                                        <TableCell>
                                            <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                                            <p className="text-xs text-slate-500">
                                                Already received: {item.alreadyReceived} / {item.orderedQty}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium">{item.orderedQty}</TableCell>
                                        <TableCell className="text-right">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={item.orderedQty - item.alreadyReceived}
                                                value={item.receiveQty}
                                                onChange={e => setReceiveForm(prev => prev.map((it, i) => i === idx ? { ...it, receiveQty: parseInt(e.target.value) || 0 } : it))}
                                                className="h-8 text-sm text-right w-20 ml-auto"
                                                disabled={item.alreadyReceived >= item.orderedQty}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="Batch #"
                                                value={item.batchNumber}
                                                onChange={e => setReceiveForm(prev => prev.map((it, i) => i === idx ? { ...it, batchNumber: e.target.value } : it))}
                                                className="h-8 text-xs"
                                                disabled={item.receiveQty <= 0}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="date"
                                                value={item.expiryDate}
                                                onChange={e => setReceiveForm(prev => prev.map((it, i) => i === idx ? { ...it, expiryDate: e.target.value } : it))}
                                                className="h-8 text-xs"
                                                disabled={item.receiveQty <= 0}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReceive(false)} disabled={isReceiving}>Cancel</Button>
                        <Button
                            onClick={handleReceive}
                            disabled={isReceiving || receiveForm.every(i => i.receiveQty <= 0)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isReceiving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Confirm Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
