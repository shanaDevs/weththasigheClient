'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Wallet,
    History,
    CreditCard,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Filter,
    ArrowRight,
    Loader2,
    Plus,
    Receipt,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
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
import { toast } from 'sonner';
import { doctorService } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store';
import Link from 'next/link';

export default function DoctorPaymentsPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });

    // Dialogs
    const [showSettleDialog, setShowSettleDialog] = useState(false);
    const [isSettling, setIsSettling] = useState(false);
    const [settleData, setSettleData] = useState({
        amount: '',
        method: 'bank_transfer',
        transactionId: '',
        notes: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, paymentsRes] = await Promise.all([
                doctorService.getCreditSummary(),
                doctorService.getMyPayments({ page: pagination.page, limit: 10 })
            ]);
            setSummary(summaryRes);
            setPayments(paymentsRes.data.payments);
            setPagination(paymentsRes.data.pagination);
        } catch (error) {
            toast.error('Failed to load payment data');
        } finally {
            setLoading(false);
        }
    }, [pagination.page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSettle = async () => {
        if (!settleData.amount) return;
        setIsSettling(true);
        try {
            await doctorService.settleOutstanding({
                amount: parseFloat(settleData.amount),
                method: settleData.method,
                transactionId: settleData.transactionId,
                notes: settleData.notes
            });
            toast.success('Wait for admin approval of payment if required. Settlement processed successfully.');
            setShowSettleDialog(false);
            setSettleData({ amount: '', method: 'bank_transfer', transactionId: '', notes: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to settle outstanding');
        } finally {
            setIsSettling(false);
        }
    };

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const availableCredit = summary?.availableCredit || 0;
    const creditLimit = summary?.creditLimit || 0;
    const usedCredit = summary?.currentCredit || 0;
    const creditPercentage = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-emerald-600" />
                        Payments & Credit
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your credit facility and payment history</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowSettleDialog(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-6"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Settle Outstanding
                    </Button>
                </div>
            </div>

            {/* Credit Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400">Available Credit</CardDescription>
                        <CardTitle className="text-4xl font-bold">{formatCurrency(availableCredit)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Used: {formatCurrency(usedCredit)}</span>
                                <span className="text-slate-400">Limit: {formatCurrency(creditLimit)}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <motion.div
                                    className="bg-emerald-500 h-1.5 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (100 - creditPercentage))}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white border border-slate-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">Total Outstanding</p>
                            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(usedCredit)}</h3>
                            {summary?.pendingOrders?.length > 0 && (
                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-2">
                                    <AlertCircle className="w-3 h-3" />
                                    {summary.pendingOrders.length} Pending Bills
                                </p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Receipt className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white border border-slate-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500">Credit Terms</p>
                            <h3 className="text-2xl font-bold text-slate-900">{summary?.paymentTerms || 30} Days</h3>
                            <p className="text-xs text-slate-400 mt-2 italic">Standard credit period</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Outstanding Bills */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Payment History</CardTitle>
                                <CardDescription>Your recent transactions and applied payments</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8">
                                <History className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                                No payment history found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payments.map((payment) => (
                                            <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="text-xs text-slate-500">
                                                    {formatDate(payment.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {payment.order ? `Order #${payment.order.orderNumber}` : 'Account Payment'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{payment.notes || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] capitalize">
                                                        {payment.method.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            payment.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-red-50 text-red-700 border-red-100'
                                                    }>
                                                        {payment.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                                        {payment.status === 'pending' ? 'Outstanding' : payment.status}

                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Outstanding Bills List */}
                <div className="space-y-6">
                    <Card className="border-slate-100 shadow-sm sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center justify-between">
                                Outstanding Bills
                                <Badge className="bg-emerald-100 text-emerald-700 border-0">{summary?.pendingOrders?.length || 0}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {summary?.pendingOrders?.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 italic text-sm">
                                    No outstanding bills
                                </div>
                            ) : (
                                summary?.pendingOrders.map((bill: any) => (
                                    <div key={bill.id} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">#{bill.orderNumber}</p>
                                                <p className="text-[10px] text-slate-400">{formatDate(bill.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(bill.total)}</p>
                                                <p className="text-[10px] text-red-500 font-medium italic">Due: {formatDate(bill.creditDueDate)}</p>
                                            </div>
                                        </div>
                                        <Link href={`/orders/${bill.orderNumber}`}>
                                            <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-slate-500 hover:text-emerald-600">
                                                View Order <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </CardContent>
                        {usedCredit > 0 && (
                            <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                                <Button
                                    onClick={() => {
                                        setSettleData(prev => ({ ...prev, amount: usedCredit.toString() }));
                                        setShowSettleDialog(true);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                                >
                                    Settle Full Balance
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Settle Dialog */}
            <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                            Settle Outstanding
                        </DialogTitle>
                        <DialogDescription>
                            Pay your outstanding balance. This will be applied to your oldest bills first.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between">
                            <span className="text-sm text-amber-800">Total Outstanding</span>
                            <span className="font-bold text-amber-900">{formatCurrency(usedCredit)}</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-amount">Payment Amount *</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Rs.</div>
                                <Input
                                    id="settle-amount"
                                    type="number"
                                    placeholder="Enter amount"
                                    className="pl-10 h-12 text-lg font-bold"
                                    value={settleData.amount}
                                    onChange={e => setSettleData({ ...settleData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-method">Payment Method *</Label>
                            <select
                                id="settle-method"
                                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={settleData.method}
                                onChange={e => setSettleData({ ...settleData, method: e.target.value })}
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash / Physical Deposit</option>
                                <option value="upi">UPI / Online Transfer</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-txid">Transaction Reference / ID</Label>
                            <Input
                                id="settle-txid"
                                placeholder="Ref number, Cheque no, etc."
                                value={settleData.transactionId}
                                onChange={e => setSettleData({ ...settleData, transactionId: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-notes">Notes (Optional)</Label>
                            <textarea
                                id="settle-notes"
                                className="w-full min-h-[80px] p-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Any additional information..."
                                value={settleData.notes}
                                onChange={e => setSettleData({ ...settleData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettleDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                            onClick={handleSettle}
                            disabled={isSettling || !settleData.amount}
                        >
                            {isSettling ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Update Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
