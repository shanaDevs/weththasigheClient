'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ShoppingCart, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function CancelContent() {
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
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-900">Payment Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600">
                            The payment process was cancelled or timed out. Don't worry, your order has been saved and you can try paying again.
                        </p>
                        {orderId && (
                            <div className="bg-slate-100 p-3 rounded-lg font-mono text-sm text-slate-700">
                                Order Reference: <span className="font-bold">{orderId}</span>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pb-10">
                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg text-white"
                            onClick={() => router.push('/checkout')}
                        >
                            <RefreshCcw className="mr-2 w-5 h-5" />
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 text-slate-600"
                            onClick={() => router.push('/cart')}
                        >
                            <ShoppingCart className="mr-2 w-5 h-5" />
                            Back to Cart
                        </Button>
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
                <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
            </div>
        }>
            <CancelContent />
        </Suspense>
    );
}
