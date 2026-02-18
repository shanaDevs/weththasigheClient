'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="max-w-md w-full text-center shadow-xl border-none">
                    <CardHeader className="pt-10 pb-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-emerald-600" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-900">Payment Successful!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600">
                            Thank you for your purchase. Your payment has been processed successfully and your order is being prepared.
                        </p>
                        {orderId && (
                            <div className="bg-slate-100 p-3 rounded-lg font-mono text-sm text-slate-700">
                                Order ID: <span className="font-bold">{orderId}</span>
                            </div>
                        )}
                        <p className="text-sm text-slate-500">
                            A confirmation email has been sent to your registered email address.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pb-10">
                        <Button
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-12 text-lg"
                            onClick={() => router.push(orderId ? `/orders/${orderId}` : '/orders')}
                        >
                            View Order Details
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12"
                            onClick={() => router.push('/')}
                        >
                            <ShoppingBag className="mr-2 w-5 h-5" />
                            Continue Shopping
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
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
