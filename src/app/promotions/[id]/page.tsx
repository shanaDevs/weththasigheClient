'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    Tag,
    Gift,
    Zap,
    ShoppingBag,
    TrendingDown,
    Info,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGrid } from '@/components/products';
import { promotionService } from '@/lib/api';
import { useSettings } from '@/hooks/use-settings';
import type { Promotion, Product, Pagination } from '@/types';

const promotionColors: Record<string, string> = {
    flash_sale: 'from-orange-500 to-red-600',
    bundle: 'from-blue-500 to-indigo-600',
    bogo: 'from-purple-500 to-pink-600',
    percentage_off: 'from-emerald-500 to-teal-600',
    fixed_off: 'from-cyan-500 to-blue-600',
    bulk_discount: 'from-indigo-500 to-violet-600',
};

const promotionIcons: Record<string, React.ElementType> = {
    flash_sale: Zap,
    bundle: ShoppingBag,
    bogo: Gift,
    percentage_off: Tag,
    fixed_off: Tag,
    bulk_discount: TrendingDown,
};

export default function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { settings, formatPrice } = useSettings();
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const promoId = parseInt(id);

                // Fetch all active promotions to find this one
                const activePromos = await promotionService.getActivePromotions();
                const foundPromo = activePromos.find(p => p.id === promoId);

                if (!foundPromo) {
                    setIsError(true);
                    return;
                }

                setPromotion(foundPromo);

                // Fetch promotion products
                const productsData = await promotionService.getPromotionProducts(promoId);
                setProducts(productsData.products);
                setPagination(productsData.pagination);
            } catch (error) {
                console.error('Failed to fetch promotion details:', error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 py-12">
                <div className="container mx-auto px-4">
                    <Skeleton className="h-8 w-32 mb-8" />
                    <div className="grid lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2">
                            <Skeleton className="h-[400px] w-full rounded-3xl" />
                        </div>
                        <div>
                            <Skeleton className="h-[400px] w-full rounded-3xl" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-48 mb-6" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !promotion) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Promotion Not Found</h1>
                    <p className="text-slate-600 mb-8">
                        The promotion you're looking for might have expired or doesn't exist.
                    </p>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/promotions">
                            Back to Promotions
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const Icon = promotionIcons[promotion.type] || Tag;
    const colorClass = promotionColors[promotion.type] || 'from-slate-500 to-slate-700';

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/promotions" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to All Promotions
                    </Link>
                </div>
            </div>

            {/* Promotion Header */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Promo Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className={`relative h-[300px] md:h-[400px] rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${colorClass} shadow-2xl`}>
                                {promotion.bannerImage && (
                                    <img
                                        src={promotion.bannerImage}
                                        alt={promotion.name}
                                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                                    />
                                )}
                                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 text-white">
                                    <Badge className="w-fit bg-white/20 text-white border-0 mb-6 backdrop-blur-md px-4 py-1">
                                        {promotion.type.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    <h1 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-lg leading-tight">
                                        {promotion.name}
                                    </h1>
                                    {promotion.discountValue && (
                                        <div className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl">
                                            {promotion.discountType === 'percentage' ? `${promotion.discountValue}% OFF` : formatPrice(promotion.discountValue)}
                                        </div>
                                    )}
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                                    <Icon className="w-64 h-64 text-white rotate-12" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Sidebar Details */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="bg-white rounded-[2.5rem] p-8 h-full shadow-lg border border-slate-100 flex flex-col">
                                <div className="flex-grow space-y-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Info className="w-4 h-4" />
                                            About Promotion
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            {promotion.description || "Get exclusive discounts on selected medical supplies during this limited-time promotion."}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">Starts</div>
                                            <div className="font-bold text-slate-900">{formatDate(promotion.startDate)}</div>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-100">
                                            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">Ends</div>
                                            <div className="font-bold text-slate-900">{formatDate(promotion.endDate)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-50 text-emerald-700 text-sm font-medium">
                                        <Zap className="w-5 h-5" />
                                        Offer is automatically applied at checkout for eligible products.
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Offer Products</h2>
                            <p className="text-slate-600">Save on these high-quality healthcare items</p>
                        </div>
                    </div>

                    <ProductGrid
                        products={products}
                        isLoading={isLoading}
                        skeletonCount={8}
                    />

                    {products.length === 0 && !isLoading && (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
                            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
                            <p className="text-slate-600">This promotion applies to all products in the store or specific categories.</p>
                            <Button asChild className="mt-8 bg-emerald-600 hover:bg-emerald-700">
                                <Link href="/products">Browse All Products</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
