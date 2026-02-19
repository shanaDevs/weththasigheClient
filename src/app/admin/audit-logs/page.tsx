'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Shield, Search, Filter, Download, RefreshCw, Eye,
    ChevronLeft, ChevronRight, AlertTriangle, Activity,
    User, Clock, Database, LogIn, Edit, Trash2, Plus,
    X, Calendar, BarChart3, Loader2, ChevronDown, ChevronUp
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
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { auditApi, type AuditLog, type AuditStats } from '@/lib/api/audit';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    update: 'bg-blue-50 text-blue-700 border-blue-200',
    delete: 'bg-red-50 text-red-700 border-red-200',
    login: 'bg-purple-50 text-purple-700 border-purple-200',
    logout: 'bg-slate-50 text-slate-600 border-slate-200',
    login_failed: 'bg-orange-50 text-orange-700 border-orange-200',
    view: 'bg-sky-50 text-sky-700 border-sky-200',
    export: 'bg-amber-50 text-amber-700 border-amber-200',
};

const RISK_COLORS: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    login: LogIn,
    logout: LogIn,
    login_failed: AlertTriangle,
    view: Eye,
    export: Download,
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
    });
}

function formatRelative(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
    label: string; value: string | number; icon: React.ElementType; color: string;
}) {
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className={`p-4 flex items-center gap-3 rounded-xl ${color}`}>
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs opacity-70">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function LogDetailDialog({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
    if (!log) return null;
    const ActionIcon = ACTION_ICONS[log.action] || Activity;

    return (
        <Dialog open={!!log} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Audit Log #{log.id}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Header row */}
                    <div className="flex flex-wrap gap-2">
                        <Badge className={`${ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-600 border-slate-200'} border text-xs font-medium`}>
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {log.action?.toUpperCase()}
                        </Badge>
                        {log.riskLevel && (
                            <Badge className={`${RISK_COLORS[log.riskLevel] || ''} border text-xs font-medium`}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {log.riskLevel?.toUpperCase()} RISK
                            </Badge>
                        )}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            { label: 'Timestamp', value: formatDate(log.createdAt), icon: Clock },
                            { label: 'User', value: log.user ? `${log.user.firstName} ${log.user.lastName || ''} (@${log.user.userName})` : 'System', icon: User },
                            { label: 'Entity Type', value: log.entityType || '—', icon: Database },
                            { label: 'Entity ID', value: log.entityId?.toString() || '—', icon: Database },
                            { label: 'Module', value: log.module || log.tableName || '—', icon: Activity },
                            { label: 'IP Address', value: log.ipAddress || '—', icon: Shield },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs text-slate-500 font-medium">{label}</span>
                                </div>
                                <p className="text-slate-800 font-medium text-sm break-all">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {log.description && (
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 font-medium mb-1">Description</p>
                            <p className="text-sm text-slate-800">{log.description}</p>
                        </div>
                    )}

                    {/* Old / New Values */}
                    {(log.oldValues || log.newValues) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {log.oldValues && (
                                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                    <p className="text-xs text-red-600 font-semibold mb-2">Before (Old Values)</p>
                                    <pre className="text-xs text-red-800 overflow-auto max-h-40 whitespace-pre-wrap">
                                        {JSON.stringify(log.oldValues, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {log.newValues && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                    <p className="text-xs text-emerald-600 font-semibold mb-2">After (New Values)</p>
                                    <pre className="text-xs text-emerald-800 overflow-auto max-h-40 whitespace-pre-wrap">
                                        {JSON.stringify(log.newValues, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'logins' | 'stats'>('logs');

    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        riskLevel: '',
        entityType: '',
        startDate: '',
        endDate: '',
    });

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 50,
                ...(filters.search && { search: filters.search }),
                ...(filters.action && { action: filters.action }),
                ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
                ...(filters.entityType && { entityType: filters.entityType }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate }),
            };
            const fn = activeTab === 'logins' ? auditApi.getLoginHistory : auditApi.getLogs;
            const data = await fn(params);
            setLogs(data.logs || []);
            setPagination(data.pagination);
        } catch {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [filters, activeTab]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const data = await auditApi.getStats(filters.startDate || undefined, filters.endDate || undefined);
            setStats(data);
        } catch {
            // stats optional
        } finally {
            setStatsLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => { fetchLogs(1); }, [fetchLogs]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleExport = async () => {
        setExporting(true);
        try {
            await auditApi.exportCSV({
                ...(filters.action && { action: filters.action }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate }),
            });
            toast.success('Audit logs exported successfully');
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const clearFilters = () => {
        setFilters({ search: '', action: '', riskLevel: '', entityType: '', startDate: '', endDate: '' });
    };

    const totalEvents = stats ? Object.values(stats.actions).reduce((a, b) => a + b, 0) : 0;
    const highRiskCount = stats?.riskLevels?.high || 0;
    const criticalCount = stats?.riskLevels?.critical || 0;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-emerald-600" />
                        Audit Logs
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">System-wide activity and security audit trail</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs(pagination.page)}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={exporting}
                        className="gap-2"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Events" value={statsLoading ? '…' : totalEvents.toLocaleString()} icon={Activity} color="bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800" />
                <StatCard label="High Risk" value={statsLoading ? '…' : highRiskCount} icon={AlertTriangle} color="bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800" />
                <StatCard label="Critical" value={statsLoading ? '…' : criticalCount} icon={Shield} color="bg-gradient-to-br from-red-50 to-rose-50 text-red-800" />
                <StatCard label="Active Users" value={statsLoading ? '…' : (stats?.activeUsers?.length || 0)} icon={User} color="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-800" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                {(['logs', 'logins', 'stats'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'logs' ? 'All Logs' : tab === 'logins' ? 'Login History' : 'Statistics'}
                    </button>
                ))}
            </div>

            {/* ── Stats Tab ── */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                    {statsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="ml-2 text-sm text-slate-500">Loading statistics...</span>
                        </div>
                    ) : stats ? (
                        <>
                            {/* Action Breakdown */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-3 border-b border-slate-100">
                                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                                        Action Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.entries(stats.actions).map(([action, count]) => {
                                            const ActionIcon = ACTION_ICONS[action] || Activity;
                                            return (
                                                <div key={action} className={`rounded-lg p-3 border ${ACTION_COLORS[action] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <ActionIcon className="w-4 h-4" />
                                                        <span className="text-xs font-semibold uppercase">{action.replace('_', ' ')}</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Risk Levels + Top Entities */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-3 border-b border-slate-100">
                                        <CardTitle className="text-base font-semibold text-slate-900">Risk Level Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {Object.entries(stats.riskLevels).map(([level, count]) => {
                                            const total = Object.values(stats.riskLevels).reduce((a, b) => a + b, 0);
                                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                            return (
                                                <div key={level}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="font-medium capitalize text-slate-700">{level}</span>
                                                        <span className="text-slate-500">{count} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${level === 'critical' ? 'bg-red-500' :
                                                                level === 'high' ? 'bg-orange-500' :
                                                                    level === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-3 border-b border-slate-100">
                                        <CardTitle className="text-base font-semibold text-slate-900">Top Entities</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        {stats.entities.slice(0, 8).map(({ entity, count }) => (
                                            <div key={entity} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm text-slate-700 font-medium">{entity || 'Unknown'}</span>
                                                </div>
                                                <Badge variant="outline" className="text-xs">{count}</Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Most Active Users */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-3 border-b border-slate-100">
                                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-emerald-600" />
                                        Most Active Users
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-xs font-bold uppercase text-slate-500">#</TableHead>
                                                <TableHead className="text-xs font-bold uppercase text-slate-500">User</TableHead>
                                                <TableHead className="text-xs font-bold uppercase text-slate-500">Username</TableHead>
                                                <TableHead className="text-xs font-bold uppercase text-slate-500 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.activeUsers.map(({ user, count }, i) => (
                                                <TableRow key={user?.id || i}>
                                                    <TableCell className="text-slate-400 text-sm font-medium">{i + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                                                {user?.firstName?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-800">
                                                                {user ? `${user.firstName} ${user.lastName || ''}` : 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-500">@{user?.userName || '—'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs">
                                                            {count.toLocaleString()}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Daily Activity */}
                            {stats.dailyActivity.length > 0 && (
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-3 border-b border-slate-100">
                                        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-600" />
                                            Daily Activity (Last 30 Days)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="flex items-end gap-1 h-24 overflow-x-auto pb-2">
                                            {(() => {
                                                const max = Math.max(...stats.dailyActivity.map(d => d.count), 1);
                                                return stats.dailyActivity.map(({ date, count }) => (
                                                    <div key={date} className="flex flex-col items-center gap-1 flex-shrink-0" title={`${date}: ${count} events`}>
                                                        <div
                                                            className="w-4 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
                                                            style={{ height: `${Math.max((count / max) * 80, 4)}px` }}
                                                        />
                                                        <span className="text-[9px] text-slate-400 rotate-45 origin-left w-6">{date.slice(5)}</span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-400">No statistics available</div>
                    )}
                </div>
            )}

            {/* ── Logs / Login History Tab ── */}
            {(activeTab === 'logs' || activeTab === 'logins') && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search logs..."
                                    value={filters.search}
                                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>

                            {/* Filter toggle */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(v => !v)}
                                className={`gap-2 ${showFilters ? 'bg-slate-100' : ''}`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>

                            {/* Clear */}
                            {(filters.action || filters.riskLevel || filters.entityType || filters.startDate || filters.endDate) && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500">
                                    <X className="w-3.5 h-3.5" /> Clear
                                </Button>
                            )}

                            <span className="ml-auto text-xs text-slate-400">
                                {pagination.total.toLocaleString()} total records
                            </span>
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Action</Label>
                                    <Select value={filters.action} onValueChange={v => setFilters(f => ({ ...f, action: v === 'all' ? '' : v }))}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="All actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All actions</SelectItem>
                                            {['create', 'update', 'delete', 'login', 'logout', 'login_failed', 'view', 'export'].map(a => (
                                                <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Risk Level</Label>
                                    <Select value={filters.riskLevel} onValueChange={v => setFilters(f => ({ ...f, riskLevel: v === 'all' ? '' : v }))}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="All levels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All levels</SelectItem>
                                            {['low', 'medium', 'high', 'critical'].map(r => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">Entity Type</Label>
                                    <Input
                                        placeholder="e.g. Product"
                                        value={filters.entityType}
                                        onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">From Date</Label>
                                    <Input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">To Date</Label>
                                    <Input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                <span className="ml-2 text-sm text-slate-500">Loading audit logs...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-16">
                                <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No audit logs found</p>
                                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500 py-3 w-14">ID</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">Time</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">Action</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">User</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">Entity</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">Description</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">Risk</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">IP</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map(log => {
                                            const ActionIcon = ACTION_ICONS[log.action] || Activity;
                                            return (
                                                <TableRow
                                                    key={log.id}
                                                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <TableCell className="text-xs text-slate-400 font-mono">#{log.id}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-xs text-slate-700 font-medium whitespace-nowrap">
                                                                {formatRelative(log.createdAt)}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                {new Date(log.createdAt).toLocaleDateString('en-IN')}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-600 border-slate-200'} border text-xs font-medium`}>
                                                            <ActionIcon className="w-3 h-3 mr-1" />
                                                            {log.action?.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.user ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0">
                                                                    {log.user.firstName?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-medium text-slate-800">{log.user.firstName}</p>
                                                                    <p className="text-[10px] text-slate-400">@{log.user.userName}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">System</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.entityType ? (
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-700">{log.entityType}</p>
                                                                {log.entityId && <p className="text-[10px] text-slate-400">#{log.entityId}</p>}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-xs text-slate-600 max-w-[200px] truncate">
                                                            {log.description || '—'}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.riskLevel ? (
                                                            <Badge className={`${RISK_COLORS[log.riskLevel] || ''} border text-[10px] font-medium`}>
                                                                {log.riskLevel}
                                                            </Badge>
                                                        ) : <span className="text-slate-300 text-xs">—</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-[10px] text-slate-400 font-mono">{log.ipAddress || '—'}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={e => { e.stopPropagation(); setSelectedLog(log); }}
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                disabled={pagination.page <= 1}
                                                onClick={() => fetchLogs(pagination.page - 1)}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                                const p = Math.max(1, pagination.page - 2) + i;
                                                if (p > pagination.totalPages) return null;
                                                return (
                                                    <Button
                                                        key={p}
                                                        variant={p === pagination.page ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={`h-8 w-8 p-0 text-xs ${p === pagination.page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                                        onClick={() => fetchLogs(p)}
                                                    >
                                                        {p}
                                                    </Button>
                                                );
                                            })}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                disabled={pagination.page >= pagination.totalPages}
                                                onClick={() => fetchLogs(pagination.page + 1)}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Detail Dialog ── */}
            <LogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
}
