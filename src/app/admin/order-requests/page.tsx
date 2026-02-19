'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Inbox,
    CheckCircle,
    XCircle,
    Eye,
    Search,
    Filter,
    ArrowRight,
    MessageSquare,
    Clock,
    User,
    Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin';
import type { OrderRequest } from '@/types';
import { format } from 'date-fns';

export default function AdminOrderRequestsPage() {
    const [requests, setRequests] = useState<OrderRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
    const [filters, setFilters] = useState({ page: 1, limit: 10, status: 'pending' as any });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(null);
    const [showProcessDialog, setShowProcessDialog] = useState(false);
    const [processAction, setProcessAction] = useState<'approved' | 'rejected'>('approved');
    const [adminNote, setAdminNote] = useState('');
    const [releasedQty, setReleasedQty] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.getOrderRequests({ ...filters, search: searchQuery });
            setRequests(result.data);
            setPagination(result.pagination);
        } catch (error) {
            toast.error('Failed to load order requests');
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleProcess = async () => {
        if (!selectedRequest) return;

        if (processAction === 'approved' && (!releasedQty || parseInt(releasedQty) <= 0)) {
            toast.error('Please enter a valid released quantity');
            return;
        }

        setSubmitting(true);
        try {
            // Note: backend might need second param for quantity if status is approved
            // Using the current adminApi method but might need to adjust based on backend controller
            await adminApi.processOrderRequest(selectedRequest.id, {
                status: processAction,
                releasedQuantity: parseInt(releasedQty),
                adminNote
            });

            toast.success(`Request ${processAction === 'approved' ? 'approved' : 'rejected'}`);
            setShowProcessDialog(false);
            setSelectedRequest(null);
            setAdminNote('');
            setReleasedQty('');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process request');
        } finally {
            setSubmitting(false);
        }
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        partially_approved: 'bg-blue-100 text-blue-700 border-blue-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Inbox className="w-6 h-6 text-emerald-600" />
                        Order Requests
                    </h1>
                    <p className="text-slate-500">Manage bulk order requests from users</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search user/product..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant={filters.status === 'pending' ? 'default' : 'outline'}
                        onClick={() => setFilters({ ...filters, status: 'pending', page: 1 })}
                        className={filters.status === 'pending' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filters.status === 'approved' ? 'default' : 'outline'}
                        onClick={() => setFilters({ ...filters, status: 'approved', page: 1 })}
                        className={filters.status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={filters.status === 'rejected' ? 'default' : 'outline'}
                        onClick={() => setFilters({ ...filters, status: 'rejected', page: 1 })}
                        className={filters.status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        Rejected
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Requested On</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-center">Req. Qty</TableHead>
                                <TableHead className="text-center">Limit</TableHead>
                                <TableHead className="text-center">Released</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8} className="h-16 animate-pulse">
                                            <div className="h-4 bg-slate-100 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-slate-500 italic">
                                        No order requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Clock className="w-3.5 h-3.5" />
                                                {format(new Date(request.createdAt), 'MMM d, h:mm a')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">
                                                    {request.user?.firstName} {request.user?.lastName}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {request.user?.phone}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 line-clamp-1">
                                                    {request.product?.name}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    SKU: {request.product?.sku}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-emerald-600">
                                            {request.requestedQuantity}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-500">
                                            {request.product?.maxOrderQuantity}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-blue-600">
                                            {request.releasedQuantity || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusColors[request.status]}>
                                                {request.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {request.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setProcessAction('rejected');
                                                            setShowProcessDialog(true);
                                                        }}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setProcessAction('approved');
                                                            setReleasedQty(request.requestedQuantity.toString());
                                                            setShowProcessDialog(true);
                                                        }}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                </div>
                                            )}
                                            {request.status !== 'pending' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowProcessDialog(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" /> View Details
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing {requests.length} of {pagination.total} requests
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.totalPages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={pagination.page === i + 1 ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => setFilters({ ...filters, page: i + 1 })}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Process Dialog */}
            <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRequest?.status === 'pending'
                                ? `${processAction === 'approved' ? 'Approve' : 'Reject'} Request`
                                : 'Request Details'}
                        </DialogTitle>
                        <DialogDescription>
                            Order request for {selectedRequest?.product?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Requested By
                                </p>
                                <p className="text-sm font-medium">{selectedRequest?.user?.firstName} {selectedRequest?.user?.lastName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Package className="w-3 h-3" /> Product
                                </p>
                                <p className="text-sm font-medium line-clamp-1">{selectedRequest?.product?.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">Requested Qty</p>
                                <p className="text-sm font-bold text-emerald-600">{selectedRequest?.requestedQuantity}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">Market Price (MRP)</p>
                                <p className="text-sm font-medium">{selectedRequest?.product?.mrp}</p>
                            </div>
                        </div>

                        {selectedRequest?.note && (
                            <div className="space-y-1.5 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> User Note:
                                </p>
                                <p className="text-sm italic text-slate-600">"{selectedRequest.note}"</p>
                            </div>
                        )}

                        {selectedRequest?.status === 'pending' ? (
                            <>
                                {processAction === 'approved' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="released-qty">Approved Quantity</Label>
                                        <Input
                                            id="released-qty"
                                            type="number"
                                            value={releasedQty}
                                            onChange={(e) => setReleasedQty(e.target.value)}
                                            placeholder="Enter quantity to approve"
                                        />
                                        <p className="text-[10px] text-slate-500">
                                            The user will be able to add this exact quantity to their cart once.
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="admin-note">Admin Note (Optional)</Label>
                                    <Textarea
                                        id="admin-note"
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Provide a reason or instructions..."
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">Final Outcome:</span>
                                    <Badge variant="outline" className={statusColors[selectedRequest?.status || '']}>
                                        {selectedRequest?.status.toUpperCase()}
                                    </Badge>
                                </div>
                                {selectedRequest?.releasedQuantity !== undefined && selectedRequest.status === 'approved' && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Quantity Approved:</span>
                                        <span className="text-sm font-bold text-emerald-600">{selectedRequest.releasedQuantity}</span>
                                    </div>
                                )}
                                {selectedRequest?.adminNote && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-slate-700">Admin Note:</p>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                            {selectedRequest.adminNote}
                                        </p>
                                    </div>
                                )}
                                {selectedRequest?.processedAt && (
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>Processed on:</span>
                                        <span>{format(new Date(selectedRequest.processedAt), 'PPP p')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
                            {selectedRequest?.status === 'pending' ? 'Cancel' : 'Close'}
                        </Button>
                        {selectedRequest?.status === 'pending' && (
                            <Button
                                className={processAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                                onClick={handleProcess}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : `Confirm ${processAction === 'approved' ? 'Approval' : 'Rejection'}`}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
