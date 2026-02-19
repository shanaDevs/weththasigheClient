'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';

import {
    Wallet,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Banknote,
    Building2,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    Calendar,
    Eye,
    RotateCcw,
    Stethoscope,
    User,
    Package,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Plus,
    Clock,
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
import { adminApi } from '@/lib/api/admin';
import type { Payment } from '@/types';
import Link from 'next/link';

// ─── Constants ──────────────────────────────────────────────────────────────────

const PAYMENT_STATUSES = [
    { value: 'pending', label: 'Outstanding', color: 'bg-amber-100 text-amber-700 border-amber-200' },

    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'refunded', label: 'Refunded', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'partial_refund', label: 'Partial Refund', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
    { value: 'debit_card', label: 'Debit Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Wallet },
    { value: 'net_banking', label: 'Net Banking', icon: Building2 },
    { value: 'wallet', label: 'Wallet', icon: Wallet },
    { value: 'cheque', label: 'Cheque', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'credit', label: 'Doctor Credit', icon: Stethoscope },
    { value: 'other', label: 'Other', icon: CreditCard },
];

interface PaymentFilters {
    page: number;
    limit: number;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    doctorId?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

interface PaymentStats {
    totalPaid: number;
    totalRefunds: number;
    totalOutstanding: number;
    netPayments: number;
    byMethod: { method: string; count: number; total: number }[];
}


// ─── Helpers ────────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
    const config = PAYMENT_STATUSES.find(s => s.value === status);
    return (
        <Badge variant="outline" className={config?.color || 'bg-gray-100 text-gray-600'}>
            {config?.label || status}
        </Badge>
    );
}

function getMethodLabel(method: string): string {
    const m = PAYMENT_METHODS.find(pm => pm.value === method);
    return m?.label || method?.replace('_', ' ') || 'Unknown';
}

function getMethodIcon(method: string) {
    const m = PAYMENT_METHODS.find(pm => pm.value === method);
    const Icon = m?.icon || CreditCard;
    return <Icon className="w-4 h-4" />;
}

function formatCurrency(amount: string | number): string {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Rs.${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getCustomerName(payment: Payment): string {
    const doctor = payment.order?.doctor;
    if (doctor?.user) {
        return `Dr. ${doctor.user.firstName} ${doctor.user.lastName || ''}`.trim();
    }
    const user = payment.order?.user;
    if (user) {
        return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    return 'Unknown';
}

function getCustomerType(payment: Payment): 'doctor' | 'customer' {
    return payment.order?.doctorId ? 'doctor' : 'customer';
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [filters, setFilters] = useState<PaymentFilters>({ page: 1, limit: 20 });
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Refund Dialog
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refunding, setRefunding] = useState(false);

    // Detail Dialog
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

    // Settlement Dialog
    const [settleDialogOpen, setSettleDialogOpen] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [settleData, setSettleData] = useState({
        doctorId: '',
        amount: '',
        method: 'cash',
        transactionId: '',
        notes: ''
    });
    const [settling, setSettling] = useState(false);


    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.getPayments({
                ...filters,
                search: searchQuery || undefined,
            });
            setPayments(result.data);
            setPagination(result.pagination);
        } catch (error) {
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery]);

    const fetchStats = useCallback(async () => {
        try {
            const result = await adminApi.getPaymentStats(filters.startDate, filters.endDate);
            setStats(result);
        } catch (error) {
            console.error('Failed to load payment stats');
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const fetchDoctors = async () => {
        try {
            const res = await adminApi.getDoctors({ limit: 100 });
            setDoctors(res.data);
        } catch (error) {
            console.error('Failed to load doctors');
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const openRefundDialog = (payment: Payment) => {
        setRefundPayment(payment);
        setRefundAmount(payment.amount);
        setRefundReason('');
        setRefundDialogOpen(true);
    };

    const handleRefund = async () => {
        if (!refundPayment || !refundReason) {
            toast.error('Please provide a refund reason');
            return;
        }
        setRefunding(true);
        try {
            await adminApi.processRefund(refundPayment.id, {
                amount: parseFloat(refundAmount),
                reason: refundReason,
            });
            toast.success('Refund processed successfully');
            setRefundDialogOpen(false);
            fetchPayments();
            fetchStats();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to process refund');
        } finally {
            setRefunding(false);
        }
    };

    const openDetailDialog = (payment: Payment) => {
        setDetailPayment(payment);
        setDetailDialogOpen(true);
    };

    const toggleExpandRow = (id: number) => {
        setExpandedRow(prev => (prev === id ? null : id));
    };

    const handleSettle = async () => {
        if (!settleData.doctorId || !settleData.amount) {
            toast.error('Please select a doctor and enter an amount');
            return;
        }
        setSettling(true);
        try {
            await adminApi.settleDoctorOutstanding(parseInt(settleData.doctorId), {
                amount: parseFloat(settleData.amount),
                method: settleData.method,
                transactionId: settleData.transactionId,
                notes: settleData.notes
            });
            toast.success('Doctor account settled successfully');
            setSettleDialogOpen(false);
            setSettleData({ doctorId: '', amount: '', method: 'cash', transactionId: '', notes: '' });
            fetchPayments();
            fetchStats();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to settle account');
        } finally {
            setSettling(false);
        }
    };


    // ─── Stats Section ──────────────────────────────────────────────────────────

    const totalMethodBreakdown = stats?.byMethod || [];
    const topMethod = totalMethodBreakdown.length > 0
        ? totalMethodBreakdown.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), totalMethodBreakdown[0])
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
                    <p className="text-slate-500">Financial transaction tracking &amp; management ({pagination.total} records)</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setSettleDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Settle Doctor Account
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { fetchPayments(); fetchStats(); }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>


            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

                    <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-600 mb-1">Total Received</p>
                                    <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalPaid)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-rose-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-600 mb-1">Total Refunds</p>
                                    <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalRefunds)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                    <ArrowUpCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 mb-1">Net Payments</p>
                                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.netPayments)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-600 mb-1">Total Outstanding</p>
                                    <p className="text-2xl font-bold text-amber-900">{formatCurrency(stats.totalOutstanding)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600 mb-1">Top Method</p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {topMethod ? getMethodLabel(topMethod.method) : 'N/A'}
                                    </p>
                                    {topMethod && (
                                        <p className="text-xs text-purple-500 mt-0.5">{topMethod.count} transactions</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Method Breakdown Chips */}
            {totalMethodBreakdown.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">Payment Method Breakdown</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {totalMethodBreakdown.map(item => (
                                <div
                                    key={item.method}
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-default"
                                >
                                    {getMethodIcon(item.method)}
                                    <span className="text-sm font-medium text-slate-700">{getMethodLabel(item.method)}</span>
                                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-600 border">{item.count}×</span>
                                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Table Card */}
            <Card className="border-0 shadow-md">
                <CardHeader className="border-b bg-slate-50/50">
                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by transaction ID, notes..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {PAYMENT_STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.method || 'all'}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, method: v === 'all' ? undefined : v, page: 1 }))}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Methods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                {PAYMENT_METHODS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="pl-10 w-40"
                                    value={filters.startDate || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
                                    title="Start date"
                                />
                            </div>
                            <span className="text-slate-400">—</span>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="pl-10 w-40"
                                    value={filters.endDate || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))}
                                    title="End date"
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Apply
                        </Button>
                    </form>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                <p className="text-sm text-slate-500">Loading payments...</p>
                            </div>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-24">
                            <Wallet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No payments found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="w-8"></TableHead>
                                        <TableHead>Transaction</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Processed By</TableHead>
                                        <TableHead className="w-24 text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => {
                                        const isExpanded = expandedRow === payment.id;
                                        const isRefund = parseFloat(payment.amount) < 0;

                                        return (
                                            <Fragment key={payment.id}>

                                                <TableRow
                                                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''} ${isRefund ? 'bg-red-50/30' : ''}`}
                                                    onClick={() => toggleExpandRow(payment.id)}
                                                >

                                                    <TableCell className="px-2">
                                                        <Button variant="ghost" size="icon" className="w-6 h-6">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                                            ) : (
                                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-mono text-xs text-slate-500">
                                                                {payment.transactionId || `#PAY-${payment.id}`}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-600">
                                                        <div>
                                                            <p>{new Date(payment.createdAt).toLocaleDateString()}</p>
                                                            <p className="text-xs text-slate-400">{new Date(payment.createdAt).toLocaleTimeString()}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getCustomerType(payment) === 'doctor'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {getCustomerType(payment) === 'doctor'
                                                                    ? <Stethoscope className="w-3.5 h-3.5" />
                                                                    : <User className="w-3.5 h-3.5" />
                                                                }
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800 truncate max-w-[140px]">
                                                                    {getCustomerName(payment)}
                                                                </p>
                                                                <p className="text-xs text-slate-400 capitalize">
                                                                    {getCustomerType(payment)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.order ? (
                                                            <Link
                                                                href={`/admin/orders`}
                                                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {payment.order.orderNumber}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                                                {getMethodIcon(payment.method)}
                                                            </div>
                                                            <span className="text-sm text-slate-700">{getMethodLabel(payment.method)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-semibold ${isRefund ? 'text-red-600' : 'text-slate-900'}`}>
                                                            {isRefund ? '-' : ''}{formatCurrency(payment.amount)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(payment.status)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {payment.creator ? (
                                                            <span className="text-xs text-slate-500">
                                                                {payment.creator.firstName} {payment.creator.lastName?.[0] || ''}.
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">System</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="w-7 h-7"
                                                                onClick={() => openDetailDialog(payment)}
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </Button>
                                                            {['completed', 'pending', 'processing'].includes(payment.status) && parseFloat(payment.amount) > 0 && (

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-7 h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => openRefundDialog(payment)}
                                                                    title="Process Refund"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded Row - Order Details */}
                                                {isExpanded && (
                                                    <TableRow key={`${payment.id}-expanded`} className="bg-slate-50/80">
                                                        <TableCell colSpan={10} className="p-0">
                                                            <div className="px-6 py-4 border-t border-slate-100">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    {/* Order Items */}
                                                                    <div className="md:col-span-2">
                                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                                            <Package className="w-4 h-4" />
                                                                            Products in Order
                                                                        </h4>
                                                                        {payment.order?.items && payment.order.items.length > 0 ? (
                                                                            <div className="space-y-2">
                                                                                {payment.order.items.map(item => (
                                                                                    <div
                                                                                        key={item.id}
                                                                                        className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-slate-100"
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                                                                <Package className="w-4 h-4 text-slate-400" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-sm font-medium text-slate-800">{item.productName}</p>
                                                                                                <p className="text-xs text-slate-400">
                                                                                                    {item.quantity} × {formatCurrency(item.unitPrice)}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <span className="text-sm font-semibold text-slate-700">
                                                                                            {formatCurrency(item.total)}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-sm text-slate-400 italic">No items available</p>
                                                                        )}
                                                                    </div>

                                                                    {/* Payment/Order Summary */}
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Payment Info</h4>
                                                                        <div className="space-y-2.5 text-sm">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-500">Order Total</span>
                                                                                <span className="font-medium">
                                                                                    {payment.order ? formatCurrency(payment.order.total) : '—'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-500">Paid Amount</span>
                                                                                <span className="font-medium text-emerald-600">
                                                                                    {payment.order?.paidAmount ? formatCurrency(payment.order.paidAmount) : '—'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-500">Due Amount</span>
                                                                                <span className={`font-medium ${parseFloat(payment.order?.dueAmount || '0') > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                                    {payment.order?.dueAmount ? formatCurrency(payment.order.dueAmount) : '—'}
                                                                                </span>
                                                                            </div>
                                                                            <Separator />
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-500">Order Status</span>
                                                                                <Badge variant="outline" className="capitalize text-xs">
                                                                                    {payment.order?.status || '—'}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-500">Payment Status</span>
                                                                                <Badge variant="outline" className="capitalize text-xs">
                                                                                    {payment.order?.paymentStatus || '—'}
                                                                                </Badge>
                                                                            </div>
                                                                            {payment.notes && (
                                                                                <>
                                                                                    <Separator />
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-xs block mb-1">Notes</span>
                                                                                        <p className="text-slate-700 text-xs bg-white p-2 rounded border border-slate-100">
                                                                                            {payment.notes}
                                                                                        </p>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                            {payment.refundedAmount && parseFloat(payment.refundedAmount) > 0 && (
                                                                                <>
                                                                                    <Separator />
                                                                                    <div className="flex justify-between text-red-600">
                                                                                        <span>Refunded</span>
                                                                                        <span className="font-medium">{formatCurrency(payment.refundedAmount)}</span>
                                                                                    </div>
                                                                                    {payment.refundReason && (
                                                                                        <p className="text-xs text-slate-500 italic">Reason: {payment.refundReason}</p>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>

                                        );

                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between p-4 border-t">
                                <p className="text-sm text-slate-500">
                                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
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
                                    <span className="text-sm px-3">
                                        Page {pagination.page} of {pagination.totalPages || 1}
                                    </span>
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

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                            Payment Details
                        </DialogTitle>
                        <DialogDescription>
                            {detailPayment?.transactionId || `Payment #${detailPayment?.id}`}
                        </DialogDescription>
                    </DialogHeader>
                    {detailPayment && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-slate-500">Amount</p>
                                    <p className={`text-2xl font-bold ${parseFloat(detailPayment.amount) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                        {parseFloat(detailPayment.amount) < 0 ? '-' : ''}{formatCurrency(detailPayment.amount)}
                                    </p>
                                </div>
                                {getStatusBadge(detailPayment.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 mb-1">Method</p>
                                    <div className="flex items-center gap-2">
                                        {getMethodIcon(detailPayment.method)}
                                        <span className="font-medium">{getMethodLabel(detailPayment.method)}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-1">Date</p>
                                    <p className="font-medium">{new Date(detailPayment.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-1">Customer</p>
                                    <p className="font-medium">{getCustomerName(detailPayment)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-1">Order</p>
                                    <p className="font-medium">{detailPayment.order?.orderNumber || '—'}</p>
                                </div>
                                {detailPayment.provider && (
                                    <div>
                                        <p className="text-slate-500 mb-1">Provider</p>
                                        <p className="font-medium capitalize">{detailPayment.provider}</p>
                                    </div>
                                )}
                                {detailPayment.chequeNumber && (
                                    <div>
                                        <p className="text-slate-500 mb-1">Cheque #</p>
                                        <p className="font-medium">{detailPayment.chequeNumber}</p>
                                    </div>
                                )}
                                {detailPayment.bankName && (
                                    <div>
                                        <p className="text-slate-500 mb-1">Bank</p>
                                        <p className="font-medium">{detailPayment.bankName}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-slate-500 mb-1">Processed By</p>
                                    <p className="font-medium">
                                        {detailPayment.creator
                                            ? `${detailPayment.creator.firstName} ${detailPayment.creator.lastName || ''}`
                                            : 'System'}
                                    </p>
                                </div>
                            </div>

                            {detailPayment.notes && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Notes</p>
                                        <p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{detailPayment.notes}</p>
                                    </div>
                                </>
                            )}

                            {detailPayment.refundedAmount && parseFloat(detailPayment.refundedAmount) > 0 && (
                                <>
                                    <Separator />
                                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                        <p className="text-sm font-medium text-red-700 mb-1">Refund Information</p>
                                        <p className="text-sm text-red-600">
                                            Amount: {formatCurrency(detailPayment.refundedAmount)}
                                        </p>
                                        {detailPayment.refundReason && (
                                            <p className="text-sm text-red-500 mt-1">Reason: {detailPayment.refundReason}</p>
                                        )}
                                        {detailPayment.refunder && (
                                            <p className="text-xs text-red-400 mt-1">
                                                By: {detailPayment.refunder.firstName} {detailPayment.refunder.lastName || ''}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Order Items in Detail */}
                            {detailPayment.order?.items && detailPayment.order.items.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-2">Order Items</p>
                                        <div className="space-y-1.5">
                                            {detailPayment.order.items.map(item => (
                                                <div key={item.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                                                    <span className="text-slate-700">
                                                        {item.productName} × {item.quantity}
                                                    </span>
                                                    <span className="font-medium">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                            Close
                        </Button>
                        {detailPayment && detailPayment.status === 'completed' && parseFloat(detailPayment.amount) > 0 && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setDetailDialogOpen(false);
                                    openRefundDialog(detailPayment);
                                }}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Process Refund
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refund Dialog */}
            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <RotateCcw className="w-5 h-5" />
                            Process Refund
                        </DialogTitle>
                        <DialogDescription>
                            Refund for payment {refundPayment?.transactionId || `#${refundPayment?.id}`}
                        </DialogDescription>
                    </DialogHeader>
                    {refundPayment && (
                        <div className="space-y-4 py-2">
                            <div className="p-4 bg-slate-50 rounded-xl border">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500">Original Amount</p>
                                        <p className="text-lg font-bold text-slate-900">{formatCurrency(refundPayment.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Order</p>
                                        <p className="font-medium">{refundPayment.order?.orderNumber || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Customer</p>
                                        <p className="font-medium">{getCustomerName(refundPayment)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Method</p>
                                        <p className="font-medium">{getMethodLabel(refundPayment.method)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="refundAmount">Refund Amount</Label>
                                <Input
                                    id="refundAmount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={parseFloat(refundPayment.amount)}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Max: {formatCurrency(refundPayment.amount)}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="refundReason">Reason for Refund *</Label>
                                <Textarea
                                    id="refundReason"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Enter reason for this refund..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRefund}
                            disabled={refunding || !refundReason || !refundAmount}
                        >
                            {refunding ? 'Processing...' : 'Confirm Refund'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settle Doctor Account Dialog */}
            <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                            Settle Doctor Account
                        </DialogTitle>
                        <DialogDescription>
                            Record a payment for a doctor. This will be applied to their oldest outstanding orders first.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="settle-doctor">Select Doctor *</Label>
                            <select
                                id="settle-doctor"
                                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={settleData.doctorId}
                                onChange={e => setSettleData({ ...settleData, doctorId: e.target.value })}
                            >
                                <option value="">Select a doctor...</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        Dr. {doc.user?.firstName} {doc.user?.lastName} ({doc.licenseNumber})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-amount">Payment Amount *</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Rs.</div>
                                <Input
                                    id="settle-amount"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-10"
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
                                {PAYMENT_METHODS.filter(m => m.value !== 'credit').map(method => (
                                    <option key={method.value} value={method.value}>{method.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-txid">Transaction ID / Reference</Label>
                            <Input
                                id="settle-txid"
                                placeholder="Ref number, Cheque number etc."
                                value={settleData.transactionId}
                                onChange={e => setSettleData({ ...settleData, transactionId: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="settle-notes">Notes</Label>
                            <Textarea
                                id="settle-notes"
                                placeholder="Any internal notes about this payment..."
                                value={settleData.notes}
                                onChange={e => setSettleData({ ...settleData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSettleDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleSettle}
                            disabled={settling || !settleData.amount || !settleData.doctorId}
                        >
                            {settling ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                'Process Payment'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

