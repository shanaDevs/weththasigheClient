'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ShoppingCart, RefreshCcw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { orderService } from '@/lib/api';
import { Order } from '@/types';

function CancelContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('order_id') || searchParams.get('order_number');
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (orderNumber) {
            orderService.verifyPayment(orderNumber)
                .then(setOrder)
                .catch(err => console.error('Error fetching order for cancel page:', err));
        }
    }, [orderNumber]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <Card className="shadow-2xl border-none overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 py-10 text-center text-white">
                        <motion.div
                            initial={{ rotate: -10, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <XCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
                        <p className="text-red-50 opacity-90">The transaction couldn't be completed</p>
                    </div>

                    <CardContent className="p-8 space-y-6">
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 text-red-800">
                            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">Why did this happen?</p>
                                <ul className="list-disc list-inside space-y-1 opacity-80">
                                    <li>Payment was cancelled by the user</li>
                                    <li>Insufficient funds in the account</li>
                                    <li>3D Secure authentication failed</li>
                                    <li>Network issues during transaction</li>
                                </ul>
                            </div>
                        </div>

                        {orderNumber && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-500">Order Reference</span>
                                    <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
                                </div>

                                <p className="text-slate-600 text-sm text-center">
                                    Don't worry, your order is pending and your items are still reserved.
                                    You can try the payment again or choose a different method.
                                </p>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-8 bg-slate-50 flex flex-col gap-3">
                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg text-white font-semibold shadow-lg shadow-slate-200"
                            onClick={() => router.push(orderNumber ? `/checkout?retry=${orderNumber}` : '/checkout')}
                        >
                            <RefreshCcw className="mr-2 w-5 h-5 text-emerald-400" />
                            Try Payment Again
                        </Button>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button
                                variant="outline"
                                className="h-12 border-slate-300"
                                onClick={() => router.push('/cart')}
                            >
                                <ShoppingCart className="mr-2 w-5 h-5" />
                                Cart
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-12 text-slate-500"
                                onClick={() => router.push('/')}
                            >
                                <ArrowLeft className="mr-2 w-4 h-4" />
                                Home
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}

export default function PaymentCancelPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CancelContent />
        </Suspense>
    );
}
