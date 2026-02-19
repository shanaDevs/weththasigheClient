'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import api from '@/lib/api/client';
import { toast } from 'sonner';

function SetupPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Invalid token');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/users/setup-password', {
                token,
                password
            });

            if (response.data.success) {
                setSuccess(true);
                toast.success('Password set successfully!');
            } else {
                throw new Error(response.data.message || 'Failed to set password');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to set password. Link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-lg">
                    <CardContent className="p-8 text-center flex flex-col items-center">
                        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Invalid Access</h2>
                        <p className="text-slate-500 mb-6">No setup token provided. Please check your email and try again.</p>
                        <Button className="w-full" onClick={() => router.push('/login')}>Go to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
                    <Card className="border-0 shadow-2xl shadow-emerald-500/10 overflow-hidden text-center">
                        <div className="h-2 bg-emerald-500" />
                        <CardContent className="p-10 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">All Set!</h2>
                                <p className="text-slate-500 mt-2">Your password has been updated and your account is ready to use.</p>
                            </div>
                            <Button
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                                onClick={() => router.push('/login')}
                            >
                                Sign In Now
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="border-0 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Setup Password</CardTitle>
                        <CardDescription>Secure your account with a new password</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-10 h-11"
                                        placeholder="At least 6 characters"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-11"
                                    placeholder="Repeat your password"
                                    required
                                />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password Requirements</p>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                                    <li>Minimum 6 characters</li>
                                    <li>Ideally include numbers and symbols</li>
                                    <li>Choose something you haven't used elsewhere</li>
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Set Password and Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            </div>
        }>
            <SetupPasswordContent />
        </Suspense>
    );
}
