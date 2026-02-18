'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { adminApi, type OrderFilters, type OrderStats } from '@/lib/api/admin';
import type { Order } from '@/types';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
];

const RANGE_TYPES = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'credit', label: 'Credit' },
  { value: 'refunded', label: 'Refunded' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, limit: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getOrders({ ...filters, search: searchQuery || undefined });
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await adminApi.getOrderStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleRangeChange = (value: string) => {
    setFilters((prev) => {
      const rangeType = value === 'all' ? undefined : (value as OrderFilters['rangeType']);
      return {
        ...prev,
        rangeType,
        startDate: rangeType === 'custom' ? prev.startDate : undefined,
        endDate: rangeType === 'custom' ? prev.endDate : undefined,
        page: 1,
      };
    });
  };

  const handleDownloadExcel = async () => {
    if (filters.rangeType === 'custom' && (!filters.startDate || !filters.endDate)) {
      toast.error('Please select start and end dates for custom range');
      return;
    }

    setDownloadingExcel(true);
    try {
      const { blob, fileName } = await adminApi.downloadOrdersExcel({
        ...filters,
        search: searchQuery || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download Excel file');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await adminApi.updateOrderStatus(selectedOrder.id, newStatus, statusNotes || undefined);
      toast.success('Order status updated');
      setShowStatusDialog(false);
      setNewStatus('');
      setStatusNotes('');
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNotes('');
    setShowStatusDialog(true);
  };

  const openDetailDialog = async (order: Order) => {
    try {
      const fullOrder = await adminApi.getOrder(order.id);
      setSelectedOrder(fullOrder);
      setShowDetailDialog(true);
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-700'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500">Manage customer orders ({pagination.total} total)</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-sm text-slate-500">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Rs.{parseFloat(stats.totalRevenue || '0').toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.statusBreakdown?.pending || 0}</p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.statusBreakdown?.shipped || 0}</p>
                  <p className="text-sm text-slate-500">Shipped</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by order #, customer..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filters.rangeType || 'all'} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {RANGE_TYPES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.rangeType === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-10 w-40"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-10 w-40"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))}
                  />
                </div>
              </div>
            )}
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.paymentStatus || 'all'}
              onValueChange={(v) => setFilters(prev => ({ ...prev, paymentStatus: v === 'all' ? undefined : v, page: 1 }))}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
            <Button type="button" onClick={handleDownloadExcel} disabled={downloadingExcel}>
              <Download className="w-4 h-4 mr-2" />
              {downloadingExcel ? 'Preparing...' : 'Download Excel'}
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No orders found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.itemCount} items</TableCell>
                      <TableCell className="text-right font-medium">
                        Rs.{parseFloat(order.total).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{order.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetailDialog(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openStatusDialog(order)}>
                            {getStatusIcon(order.status)}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-slate-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3">Page {pagination.page} of {pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedOrder.status)}
                <Badge variant="outline" className="capitalize">{selectedOrder.paymentMethod}</Badge>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-slate-500">SKU: {item.productSku} × {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">Rs.{parseFloat(item.total).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  {selectedOrder.shippingAddress && (
                    <div className="text-sm text-slate-600">
                      <p>{selectedOrder.shippingAddress.contactName}</p>
                      <p>{selectedOrder.shippingAddress.addressLine1}</p>
                      {selectedOrder.shippingAddress.addressLine2 && (
                        <p>{selectedOrder.shippingAddress.addressLine2}</p>
                      )}
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                      <p>{selectedOrder.shippingAddress.postalCode}</p>
                      <p className="mt-1">{selectedOrder.shippingAddress.contactPhone}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span>Rs.{parseFloat(selectedOrder.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <span>Rs.{parseFloat(selectedOrder.taxAmount).toLocaleString()}</span>
                    </div>
                    {parseFloat(selectedOrder.discountAmount || '0') > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-Rs.{parseFloat(selectedOrder.discountAmount).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>Rs.{parseFloat(selectedOrder.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            <Button onClick={() => { setShowDetailDialog(false); if (selectedOrder) openStatusDialog(selectedOrder); }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update status for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div>{selectedOrder && getStatusBadge(selectedOrder.status)}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea 
                id="notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status update..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleUpdateStatus}
              disabled={updatingStatus || !newStatus}
            >
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
