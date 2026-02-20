'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Package,
    ArrowRight,
    ShoppingBag,
    HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store';
import { productService } from '@/lib/api';
import { formatDate, getImageUrl } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import Image from 'next/image';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    partially_approved: { label: 'Partially Approved', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function OrderRequestsPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { formatPrice } = useSettings();

    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/order-requests');
            return;
        }

        const loadRequests = async () => {
            setIsLoading(true);
            try {
                const data = await productService.getMyOrderRequests({
                    page,
                    limit: 10
                });
                setRequests(data.requests);
                setTotalPages(data.pagination.totalPages);
            } catch (error) {
                console.error('Failed to load requests:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRequests();
    }, [isAuthenticated, router, page]);

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Bulk Order Requests</h1>
                    </div>
                    <p className="text-slate-600 ml-13">View and track requests for quantities exceeding the maximum order limit.</p>
                </motion.div>

                {/* List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-none shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-16 h-16 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200"
                    >
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                            <HelpCircle className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">No requests found</h2>
                        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                            Submitted requests for extra stock quantities will appear here once you make them from the product page.
                        </p>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link href="/products">Browse Products</Link>
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request, index) => {
                            const status = statusConfig[request.status] || statusConfig.pending;
                            const StatusIcon = status.icon;
                            const product = request.product || {};

                            return (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow border-slate-200 overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                                {/* Product Info */}
                                                <div className="p-6 flex-1 flex gap-4">
                                                    <div className="relative w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                                        {product.thumbnail ? (
                                                            <Image
                                                                src={getImageUrl(product.thumbnail)}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-8 h-8 text-slate-200" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Badge className={`${status.color} mb-2`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {status.label}
                                                        </Badge>
                                                        <Link href={`/products/${product.slug}`} className="block">
                                                            <h3 className="font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate">
                                                                {product.name}
                                                            </h3>
                                                        </Link>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-400">SKU: {product.sku}</span>
                                                            <span className="text-xs text-slate-300">•</span>
                                                            <span className="text-xs text-slate-500">{formatDate(request.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Request Details */}
                                                <div className="p-6 w-full md:w-64 bg-slate-50/50 flex flex-col justify-center">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs text-slate-500 font-medium">Requested Qty:</span>
                                                        <span className="text-sm font-bold text-slate-900">{request.requestedQuantity}</span>
                                                    </div>
                                                    {request.status === 'approved' && (
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs text-emerald-600 font-medium">Released Qty:</span>
                                                            <span className="text-sm font-bold text-emerald-600">{request.releasedQuantity}</span>
                                                        </div>
                                                    )}
                                                    <div className="mt-2 pt-2 border-t border-slate-200/50">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Note:</p>
                                                        <p className="text-xs text-slate-600 italic line-clamp-2 mt-0.5">
                                                            {request.note || 'No note provided'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Admin Action */}
                                                <div className="p-6 w-full md:w-64 flex flex-col justify-center bg-white">
                                                    {request.adminNote ? (
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Admin Response:</p>
                                                            <p className="text-xs text-slate-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                                                {request.adminNote}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-2">
                                                            {request.status === 'pending' ? (
                                                                <span className="text-xs text-slate-400 italic flex items-center justify-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    Waiting for review...
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">No admin note</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {request.status === 'approved' && (
                                                        <Button size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 w-full" asChild>
                                                            <Link href={`/products/${product.slug}`}>
                                                                Order Now <ArrowRight className="w-4 h-4 ml-1" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
