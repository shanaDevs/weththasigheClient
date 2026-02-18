'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  ArrowLeft,
  MapPin,
  CreditCard,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store';
import { orderService } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  returned: { label: 'Returned', color: 'bg-slate-100 text-slate-700', icon: Package },
};

const orderTimeline = [
  { status: 'pending', label: 'Order Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const orderNumber = params.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderNumber}`);
      return;
    }

    const loadOrder = async () => {
      try {
        const data = await orderService.getOrderByNumber(orderNumber);
        setOrder(data);
      } catch (error) {
        console.error('Failed to load order:', error);
        toast.error('Order not found');
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [isAuthenticated, router, orderNumber]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const updatedOrder = await orderService.cancelOrder(order.id);
      setOrder(updatedOrder);
      toast.success('Order cancelled successfully');
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    toast.success('Order number copied!');
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.status === 'cancelled' || order.status === 'returned') return -1;
    const index = orderTimeline.findIndex(t => t.status === order.status);
    return index >= 0 ? index : 0;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                Order #{order.orderNumber}
              </h1>
              <button
                onClick={handleCopyOrderNumber}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-slate-600">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Badge className={`${status.color} text-sm`}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {status.label}
          </Badge>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            {order.status !== 'cancelled' && order.status !== 'returned' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="flex justify-between">
                        {orderTimeline.map((step, index) => {
                          const isCompleted = index <= currentStep;
                          const isCurrent = index === currentStep;
                          return (
                            <div
                              key={step.status}
                              className="flex flex-col items-center relative z-10"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                    : 'bg-slate-200 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <p
                                className={`text-xs mt-2 text-center ${
                                  isCompleted ? 'text-slate-900 font-medium' : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {/* Progress Line */}
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-0">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
                          style={{ width: `${(currentStep / (orderTimeline.length - 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {order.estimatedDelivery && order.status !== 'delivered' && (
                      <div className="mt-6 p-4 bg-emerald-50 rounded-lg flex items-center gap-3">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm text-emerald-700">
                          Estimated delivery: <strong>{formatDate(order.estimatedDelivery)}</strong>
                        </p>
                      </div>
                    )}

                    {order.trackingNumber && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Tracking Number</p>
                          <p className="text-blue-900">{order.trackingNumber}</p>
                        </div>
                        {order.trackingUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                              Track <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Cancelled/Returned Status */}
            {(order.status === 'cancelled' || order.status === 'returned') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-900">
                          Order {order.status === 'cancelled' ? 'Cancelled' : 'Returned'}
                        </h3>
                        {order.cancelReason && (
                          <p className="text-sm text-red-700 mt-1">Reason: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items ({order.itemCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.productSlug || item.productId}`} className="hover:underline">
                            <h4 className="font-medium text-slate-900">{item.productName}</h4>
                          </Link>
                          <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Shipping & Payment Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{order.shippingAddress.contactName}</p>
                  <p className="text-sm text-slate-600">
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                  </p>
                  <p className="text-sm text-slate-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">{order.shippingAddress.contactPhone}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-600 capitalize mt-1">
                    Status: 
                    <Badge
                      variant="outline"
                      className={`ml-2 ${
                        order.paymentStatus === 'paid'
                          ? 'text-emerald-600 border-emerald-200'
                          : 'text-yellow-600 border-yellow-200'
                      }`}
                    >
                      {order.paymentStatus}
                    </Badge>
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Notes */}
            {order.customerNotes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{order.customerNotes}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax</span>
                      <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                    {parseFloat(order.discountAmount) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Shipping</span>
                      <span className="text-emerald-600">FREE</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/products">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buy Again
                      </Link>
                    </Button>

                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
