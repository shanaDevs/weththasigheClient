'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight, Package, Truck, Clock, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { orderService } from '@/lib/api';
import { useCartStore } from '@/store';
import { useSettings } from '@/hooks/use-settings';
import { Order } from '@/types';
import { toast } from 'sonner';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('order_id') || searchParams.get('order_number');
    const { clearCart } = useCartStore();
    const { settings, formatPrice } = useSettings();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!orderNumber) {
            setLoading(false);
            return;
        }

        const verifyOrder = async () => {
            try {
                const orderData = await orderService.verifyPayment(orderNumber);
                setOrder(orderData);

                // If payment is confirmed, clear the cart to be safe
                if (orderData.paymentStatus === 'paid' || orderData.status !== 'pending') {
                    clearCart();
                    setLoading(false);
                    return;
                }

                // If still pending, retry a few times (polling)
                if (retryCount < 5) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 2000);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error verifying order:', error);
                setLoading(false);
            }
        };

        verifyOrder();
    }, [orderNumber, retryCount, clearCart]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Verifying your payment...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="shadow-xl border-none overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-10 text-center text-white">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle className="w-12 h-12 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                            <p className="text-emerald-50 opacity-90">Thank you for your purchase</p>
                        </div>

                        <CardContent className="p-6 lg:p-10 space-y-8">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Order Reference</p>
                                    <p className="font-mono font-bold text-slate-900">{orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order?.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {order?.paymentStatus === 'paid' ? 'Payment Success' : 'Payment Processing'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                    Order Summary
                                </h3>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    {order?.items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">
                                                {item.productName} <span className="text-slate-400">x{item.quantity}</span>
                                            </span>
                                            <span className="font-medium">{formatPrice(item.total)}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-bold text-lg text-slate-900">
                                        <span>Total Paid</span>
                                        <span className="text-emerald-600">{formatPrice(order?.total || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6 pt-2">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <Truck className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Delivery</h4>
                                        <p className="text-xs text-slate-500">Shipping to your selected address</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Processing</h4>
                                        <p className="text-xs text-slate-500">Usually ships within 24-48 hours</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-500">
                                A confirmation email has been sent to your registered email address.
                                You can track your order status in your dashboard.
                            </p>
                        </CardContent>

                        <CardFooter className="p-6 lg:p-10 bg-slate-50 flex flex-col md:flex-row gap-4">
                            <Button
                                className="flex-1 bg-slate-900 hover:bg-slate-800 h-12 text-white"
                                onClick={() => router.push(orderNumber ? `/orders/${orderNumber}` : '/orders')}
                            >
                                Track Order
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-12 border-slate-300"
                                onClick={() => {
                                    if (orderNumber) {
                                        orderService.downloadInvoice(orderNumber);
                                    } else {
                                        toast.error("Order number not found");
                                    }
                                }}
                            >
                                <FileDown className="mr-2 w-5 h-5" />
                                Download Invoice
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-12 border-slate-300"
                                onClick={() => router.push('/')}
                            >
                                <ShoppingBag className="mr-2 w-5 h-5" />
                                Continue Shopping
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
