'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Edit, Trash2, MoreHorizontal,
    CheckCircle, XCircle, Loader2, RefreshCw,
    Shield, ShieldAlert, GraduationCap, Building2,
    Phone, Mail, CreditCard, ExternalLink, User,
    Eye, MapPin, Wallet, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import adminApi from '@/lib/api/admin';
import type { Doctor } from '@/types';

export default function AdminDoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Dialogs
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const [showCreditDialog, setShowCreditDialog] = useState(false);
    const [showSettleDialog, setShowSettleDialog] = useState(false);


    // Form states
    const [creditLimit, setCreditLimit] = useState<string>('0');
    const [isVerifying, setIsVerifying] = useState(false);
    const [updatingCredit, setUpdatingCredit] = useState(false);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [registerData, setRegisterData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        phone: '',
        email: '',
        licenseNumber: '',
        specialization: '',
        hospitalClinic: ''
    });
    const [isCreating, setIsCreating] = useState(false);
    const [settleData, setSettleData] = useState({
        amount: '',
        method: 'cash',
        transactionId: '',
        notes: ''
    });
    const [isSettling, setIsSettling] = useState(false);


    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminApi.getDoctors({ page: 1, limit: 100 });
            setDoctors(response.data);
        } catch (error) {
            toast.error('Failed to load doctors');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleVerify = async (isVerified: boolean) => {
        if (!selectedDoctor) return;
        setIsVerifying(true);
        try {
            await adminApi.verifyDoctor(selectedDoctor.id, {
                status: isVerified ? 'approved' : 'rejected',
                creditLimit: parseFloat(creditLimit),
                paymentTerms: 30 // Defaulting to 30 for now
            });
            toast.success(`Doctor ${isVerified ? 'verified' : 'unverified'} successfully`);
            setShowVerifyDialog(false);
            fetchDoctors();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to verify doctor');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleUpdateCredit = async () => {
        if (!selectedDoctor) return;
        setUpdatingCredit(true);
        try {
            await adminApi.updateDoctorCredit(selectedDoctor.id, parseFloat(creditLimit));
            toast.success('Credit limit updated successfully');
            setShowCreditDialog(false);
            fetchDoctors();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update credit limit');
        } finally {
            setUpdatingCredit(false);
        }
    };

    const handleResendEmail = async (doctor: Doctor) => {
        try {
            const result = await adminApi.resendDoctorVerification(doctor.id);
            toast.success(`Verification email sent to ${result?.sentTo || doctor.email || 'doctor'}`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to resend email');
        }
    };

    const handleSettle = async () => {
        if (!selectedDoctor || !settleData.amount) return;
        setIsSettling(true);
        try {
            await adminApi.settleDoctorOutstanding(selectedDoctor.id, {
                amount: parseFloat(settleData.amount),
                method: settleData.method,
                transactionId: settleData.transactionId,
                notes: settleData.notes
            });
            toast.success('Outstanding settled successfully');
            setShowSettleDialog(false);
            setSettleData({
                amount: '',
                method: 'cash',
                transactionId: '',
                notes: ''
            });
            fetchDoctors();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to settle outstanding');
        } finally {
            setIsSettling(false);
        }
    };


    // ── Open Helpers ──────────────────────────────────────────────────────────

    const openDetails = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setShowDetailDialog(true);
    };

    const openVerify = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setCreditLimit(doctor.creditLimit || '0');
        setShowVerifyDialog(true);
    };

    const openCreditUpdate = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setCreditLimit(doctor.creditLimit || '0');
        setShowCreditDialog(true);
    };

    const openSettle = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setSettleData({
            amount: '', // Default to empty, let admin enter
            method: 'cash',
            transactionId: '',
            notes: ''
        });
        setShowSettleDialog(true);
    };


    // ── Filtered List ──────────────────────────────────────────────────────────

    const filtered = doctors.filter(doc => {
        const matchesSearch = !search ||
            doc.user?.firstName.toLowerCase().includes(search.toLowerCase()) ||
            doc.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            doc.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
            doc.hospitalClinic?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'verified' && doc.isVerified) ||
            (statusFilter === 'pending' && !doc.isVerified);

        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalCount = doctors.length;
    const verifiedCount = doctors.filter(d => d.isVerified).length;
    const pendingCount = totalCount - verifiedCount;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-6 h-6 text-emerald-600" />
                        Doctor Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Verify and manage specialized healthcare providers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowRegisterDialog(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" /> Register Doctor
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchDoctors} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Doctors', value: totalCount, color: 'from-blue-50 to-indigo-50', icon: User, iconColor: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Verified', value: verifiedCount, color: 'from-emerald-50 to-teal-50', icon: CheckCircle, iconColor: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Pending Verification', value: pendingCount, color: 'from-amber-50 to-orange-50', icon: ShieldAlert, iconColor: 'text-amber-600', bg: 'bg-amber-100' },
                ].map(({ label, value, color, icon: Icon, iconColor, bg }) => (
                    <Card key={label} className={`border-0 shadow-sm bg-gradient-to-br ${color}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{value}</p>
                                <p className="text-xs text-slate-500">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Table Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                        <CardTitle className="text-base font-semibold text-slate-900">All Doctors</CardTitle>
                        <div className="flex-1" />
                        <div className="flex items-center gap-3">
                            <select
                                className="text-sm border border-slate-200 rounded-md px-2 py-1 h-9 outline-none focus:ring-2 focus:ring-emerald-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="verified">Verified</option>
                                <option value="pending">Pending</option>
                            </select>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search doctors, license, clinic..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="ml-2 text-sm text-slate-500">Loading doctors...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No doctors found matching your criteria</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold uppercase py-3">Doctor</TableHead>
                                    <TableHead className="text-xs font-bold uppercase">License & Info</TableHead>
                                    <TableHead className="text-xs font-bold uppercase">Clinic / Hospital</TableHead>
                                    <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-right">Credit Limit</TableHead>
                                    <TableHead className="w-20" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(doc => (
                                    <TableRow key={doc.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                                    {doc.user ? (doc.user.firstName[0] + (doc.user.lastName ? doc.user.lastName[0] : '')) : 'D'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">
                                                        {doc.user ? `Dr. ${doc.user.firstName} ${doc.user.lastName || ''}` : 'Unknown Doctor'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs text-slate-500">{doc.user?.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100 w-fit px-1.5 py-0.5 rounded border border-slate-200">
                                                    <Shield className="w-3 h-3 text-indigo-500" />
                                                    {doc.licenseNumber}
                                                </div>
                                                {doc.specialization && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <GraduationCap className="w-3 h-3" />
                                                        {doc.specialization}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {doc.hospitalClinic ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-slate-700">{doc.hospitalClinic}</p>
                                                    {doc.city && (
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <MapPin className="w-3 h-3" />
                                                            {doc.city}, {doc.state}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs italic">Not provided</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {doc.isVerified ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px]">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[10px]">
                                                    <ShieldAlert className="w-3 h-3 mr-1" /> Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-900">
                                                    Rs. {parseFloat(doc.creditLimit || '0').toLocaleString()}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                                                    <Wallet className="w-3 h-3" />
                                                    Used: Rs. {parseFloat(doc.creditUsed || '0').toLocaleString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openDetails(doc)}>
                                                        <Eye className="w-4 h-4 mr-2" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openVerify(doc)}>
                                                        <CheckCircle className="w-4 h-4 mr-2" /> Verify / Status
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openCreditUpdate(doc)}>
                                                        <CreditCard className="w-4 h-4 mr-2" /> Update Credit Limit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openSettle(doc)} className="text-emerald-600 focus:text-emerald-700">
                                                        <Wallet className="w-4 h-4 mr-2" /> Settle Outstanding
                                                    </DropdownMenuItem>
                                                    {!doc.isVerified && (

                                                        <DropdownMenuItem onClick={() => handleResendEmail(doc)}>
                                                            <Mail className="w-4 h-4 mr-2" /> Resend Verification
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-700">
                                                        <History className="w-4 h-4 mr-2" /> Credit History
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Doctor Detail Dialog ── */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                            Doctor Profile Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDoctor && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Basic Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Name</span>
                                            <span className="text-sm font-semibold text-slate-900">Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Phone</span>
                                            <span className="text-sm font-mono text-slate-900">{selectedDoctor.user?.phone}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Email</span>
                                            <span className="text-sm text-slate-900">{selectedDoctor.email || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">License Number</span>
                                            <span className="text-sm font-mono font-bold text-indigo-600">{selectedDoctor.licenseNumber}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Practice Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-sm text-slate-500">Clinic/Hospital</span>
                                            <span className="text-sm font-semibold text-slate-900 text-right">{selectedDoctor.hospitalClinic || '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Specialization</span>
                                            <span className="text-sm text-slate-900 italic">{selectedDoctor.specialization || 'Not specified'}</span>
                                        </div>
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-sm text-slate-500">Address</span>
                                            <span className="text-sm text-slate-900 text-right">
                                                {selectedDoctor.address ? (
                                                    <>{selectedDoctor.address}<br />{selectedDoctor.city}, {selectedDoctor.state} {selectedDoctor.postalCode}</>
                                                ) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 h-full flex flex-col">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                                        License Photo
                                        {selectedDoctor.licensePhoto && (
                                            <a href={selectedDoctor.licensePhoto} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> View Large
                                            </a>
                                        )}
                                    </h3>
                                    <div className="flex-1 bg-white rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]">
                                        {selectedDoctor.licensePhoto ? (
                                            <img src={selectedDoctor.licensePhoto} alt="Doctor License" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <div className="text-center p-6">
                                                <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                                <p className="text-xs text-slate-400">No license photo uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => { setShowDetailDialog(false); openVerify(selectedDoctor!); }}
                        >
                            Change Verification status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Verify / Unverify Dialog ── */}
            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            Doctor Verification
                        </DialogTitle>
                        <DialogDescription>
                            Confirm identity and clinical credentials for Dr. {selectedDoctor?.user?.firstName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-5">
                        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <Label className="text-sm font-bold text-indigo-900">Set Credit Limit</Label>
                                <p className="text-xs text-indigo-700 mb-2">Assign purchasing power for this healthcare provider</p>
                                <Input
                                    type="number"
                                    value={creditLimit}
                                    onChange={e => setCreditLimit(e.target.value)}
                                    className="bg-white border-indigo-200 h-10"
                                    placeholder="Amount in Rs."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Quick Action</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleVerify(false)}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    Mark Pending
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleVerify(true)}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Approve & Verify
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Update Credit Limit Dialog ── */}
            <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Update Credit Limit</DialogTitle>
                        <DialogDescription>
                            Modify the credit limit for Dr {selectedDoctor?.user?.firstName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="credit-limit">Credit Limit (Rs.)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</div>
                                <Input
                                    id="credit-limit"
                                    type="number"
                                    value={creditLimit}
                                    onChange={e => setCreditLimit(e.target.value)}
                                    className="pl-12 h-12 text-lg font-bold"
                                />
                            </div>
                        </div>

                        <div className="rounded-lg bg-emerald-50 p-3 flex gap-2 border border-emerald-100">
                            <Wallet className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] text-emerald-800">
                                Current Credit Used: <strong>Rs. {parseFloat(selectedDoctor?.creditUsed || '0').toLocaleString()}</strong>
                                <br />Available power: <strong>Rs. {(parseFloat(creditLimit || '0') - parseFloat(selectedDoctor?.creditUsed || '0')).toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreditDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={handleUpdateCredit}
                            disabled={updatingCredit}
                        >
                            {updatingCredit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Admin Register Doctor Dialog ── */}
            <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-emerald-600" />
                            Register New Doctor
                        </DialogTitle>
                        <DialogDescription>
                            Create a new doctor account. A verification link & temporary password will be sent.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsCreating(true);
                        try {
                            await adminApi.adminCreateUser({
                                ...registerData,
                                roleName: 'doctor'
                            });
                            toast.success('Doctor registered successfully');
                            setShowRegisterDialog(false);
                            setRegisterData({
                                firstName: '',
                                lastName: '',
                                userName: '',
                                phone: '',
                                email: '',
                                licenseNumber: '',
                                specialization: '',
                                hospitalClinic: ''
                            });
                            fetchDoctors();
                        } catch (error: any) {
                            toast.error(error?.response?.data?.message || 'Failed to register doctor');
                        } finally {
                            setIsCreating(false);
                        }
                    }} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-firstName">First Name *</Label>
                                <Input
                                    id="reg-firstName"
                                    required
                                    value={registerData.firstName}
                                    onChange={e => setRegisterData({ ...registerData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-lastName">Last Name</Label>
                                <Input
                                    id="reg-lastName"
                                    value={registerData.lastName}
                                    onChange={e => setRegisterData({ ...registerData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-phone">Phone Number *</Label>
                                <Input
                                    id="reg-phone"
                                    required
                                    placeholder="Enter 9-11 digits"
                                    value={registerData.phone}
                                    onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-userName">Username *</Label>
                                <Input
                                    id="reg-userName"
                                    required
                                    value={registerData.userName}
                                    onChange={e => setRegisterData({ ...registerData, userName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-email">Email Address *</Label>
                            <Input
                                id="reg-email"
                                type="email"
                                required
                                placeholder="doctor@example.com"
                                value={registerData.email}
                                onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-license">Medical License Number *</Label>
                            <Input
                                id="reg-license"
                                required
                                value={registerData.licenseNumber}
                                onChange={e => setRegisterData({ ...registerData, licenseNumber: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-clinic">Clinic / Hospital</Label>
                                <Input
                                    id="reg-clinic"
                                    value={registerData.hospitalClinic}
                                    onChange={e => setRegisterData({ ...registerData, hospitalClinic: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-specialization">Specialization</Label>
                                <Input
                                    id="reg-specialization"
                                    value={registerData.specialization}
                                    onChange={e => setRegisterData({ ...registerData, specialization: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isCreating}
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Register Doctor
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* ── Settle Outstanding Dialog ── */}
            <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                            Settle Outstanding
                        </DialogTitle>
                        <DialogDescription>
                            Record a payment for Dr. {selectedDoctor?.user?.firstName}. This will be applied to oldest outstanding orders first.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                            <span className="text-sm text-emerald-800">Available Credit Limit</span>
                            <span className="font-bold text-emerald-900">Rs. {parseFloat(selectedDoctor?.creditLimit || '0').toLocaleString()}</span>
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
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                                <option value="upi">UPI</option>
                                <option value="other">Other</option>
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
                            <textarea
                                id="settle-notes"
                                className="w-full min-h-[80px] p-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Any internal notes about this payment..."
                                value={settleData.notes}
                                onChange={e => setSettleData({ ...settleData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettleDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleSettle}
                            disabled={isSettling || !settleData.amount}
                        >
                            {isSettling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Process Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

