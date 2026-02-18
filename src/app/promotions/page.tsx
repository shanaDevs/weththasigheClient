'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Tag,
    Clock,
    ChevronRight,
    TrendingDown,
    Gift,
    Zap,
    ShoppingBag,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { promotionService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Promotion } from '@/types';

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
    percentage_off: PercentIcon,
    fixed_off: Tag,
    bulk_discount: TrendingDown,
};

function PercentIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPromotions = async () => {
            try {
                const data = await promotionService.getActivePromotions();
                setPromotions(data.sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0)));
            } catch (error) {
                console.error('Failed to load promotions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPromotions();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const isExpired = (endDate: string) => {
        return new Date(endDate) < new Date();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-16 lg:py-24">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles className="w-64 h-64 text-white rotate-12" />
                </div>

                <div className="container mx-auto px-4 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-white"
                    >
                        <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm px-4 py-1">
                            MediPharm Exclusive Deals
                        </Badge>
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6">Active Promotions</h1>
                        <p className="text-lg lg:text-2xl text-emerald-100 max-w-2xl mx-auto">
                            Save more on premium medicines and healthcare products with our curated offers.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="aspect-[2/1] w-full" />
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-4" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-5/6 mb-6" />
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : promotions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white rounded-3xl shadow-sm"
                    >
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                            <Tag className="w-12 h-12 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No active promotions</h2>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            We're currently refilling our special offers. Check back soon for new deals!
                        </p>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link href="/products">
                                Browse All Products
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {promotions.map((promo, index) => {
                            const Icon = promotionIcons[promo.type] || Tag;
                            const colorClass = promotionColors[promo.type] || 'from-slate-500 to-slate-700';
                            const expired = isExpired(promo.endDate);

                            return (
                                <motion.div key={promo.id} variants={fadeInUp}>
                                    <Link href={`/promotions/${promo.id}`}>
                                        <Card className="group h-full overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                            {/* Banner Area */}
                                            <div className={`relative aspect-[2/1] overflow-hidden bg-gradient-to-br ${colorClass}`}>
                                                {promo.bannerImage && (
                                                    <img
                                                        src={promo.bannerImage}
                                                        alt={promo.name}
                                                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
                                                    <div className="relative z-10">
                                                        <motion.div
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4"
                                                        >
                                                            <Icon className="w-8 h-8 text-white" />
                                                        </motion.div>
                                                        <Badge className="bg-white/20 text-white border-0 mb-3 backdrop-blur-sm">
                                                            {promo.type.replace('_', ' ').toUpperCase()}
                                                        </Badge>
                                                        {promo.discountValue && (
                                                            <div className="text-4xl font-black drop-shadow-xl tracking-tight">
                                                                {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : formatCurrency(promo.discountValue)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="absolute top-4 right-4">
                                                    {expired ? (
                                                        <Badge variant="destructive" className="shadow-lg">Expired</Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white shadow-lg">Active</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <CardContent className="p-6 flex flex-col flex-grow bg-white">
                                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                                                    {promo.name}
                                                </h3>
                                                {promo.description && (
                                                    <p className="text-slate-600 mb-6 line-clamp-3 flex-grow">
                                                        {promo.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Clock className="w-4 h-4 text-emerald-500" />
                                                        <span>Ends: {formatDate(promo.endDate)}</span>
                                                    </div>
                                                    <div className="text-emerald-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        View Offer <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* FAQ or Info Section */}
                <section className="mt-24">
                    <div className="bg-white rounded-[2rem] p-8 lg:p-12 shadow-sm border border-slate-100">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-6">How our promotions work?</h2>
                                <div className="space-y-6">
                                    {[
                                        {
                                            title: 'Automatic Application',
                                            desc: 'Most discounts are applied automatically at checkout when requirements are met.'
                                        },
                                        {
                                            title: 'Combine & Save',
                                            desc: 'Check individual promotion details to see if they can be combined with other offers.'
                                        },
                                        {
                                            title: 'Doctor Exclusives',
                                            desc: 'Registered healthcare professionals get access to private high-value bulk discounts.'
                                        }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                                <p className="text-slate-600">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center overflow-hidden">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.05, 1],
                                            rotate: [0, 5, 0]
                                        }}
                                        transition={{ duration: 6, repeat: Infinity }}
                                    >
                                        <Gift className="w-48 h-48 text-emerald-600/20" />
                                    </motion.div>

                                    {/* Floating badges */}
                                    <motion.div
                                        animate={{ y: [0, 20, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute top-10 left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">Flash Sale</div>
                                            <div className="font-bold text-emerald-600">Up to 40% OFF</div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
