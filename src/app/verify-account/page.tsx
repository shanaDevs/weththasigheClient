'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api/client';
import { toast } from 'sonner';

function VerifyAccountContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your account...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Missing token.');
            return;
        }

        const verify = async () => {
            try {
                const response = await api.get(`/users/verify?token=${token}`);
                if (response.data.success) {
                    setStatus('success');
                    setMessage(response.data.message || 'Account verified successfully!');
                    toast.success('Account verified!');
                } else {
                    throw new Error(response.data.message || 'Verification failed');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
                toast.error('Verification failed');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="border-0 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Account Verification</CardTitle>
                        <CardDescription>Finalizing your secure access to MediPharm</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {status === 'loading' && (
                                <div className="py-8 flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                                    <p className="text-slate-600 font-medium">{message}</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="py-8 space-y-6">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Success!</h3>
                                            <p className="text-slate-500 mt-1">{message}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800">
                                        Your account is now active. You can proceed to set up your password to secure your account.
                                    </div>

                                    <Button
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                        onClick={() => router.push(`/setup-password?token=${token}`)}
                                    >
                                        Setup Password
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="py-8 space-y-6 w-full">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                            <XCircle className="w-10 h-10 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Verification Failed</h3>
                                            <p className="text-slate-500 mt-1">{message}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12"
                                            onClick={() => router.push('/login')}
                                        >
                                            Back to Login
                                        </Button>
                                        <p className="text-xs text-slate-400">
                                            If you believe this is an error, please contact your administrator or support.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function VerifyAccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            </div>
        }>
            <VerifyAccountContent />
        </Suspense>
    );
}
