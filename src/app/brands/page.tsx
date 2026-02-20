'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Tag,
    Search,
    ChevronRight,
    Package,
    Building2,
    Globe,
    Award,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { brandService } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import type { Brand } from '@/types';

// Color mapping for brands
const brandColors: Record<number, string> = {
    0: 'from-blue-500 to-indigo-600',
    1: 'from-emerald-500 to-teal-600',
    2: 'from-purple-500 to-pink-600',
    3: 'from-orange-500 to-red-600',
    4: 'from-cyan-500 to-blue-600',
    5: 'from-rose-500 to-pink-600',
    6: 'from-amber-500 to-orange-600',
    7: 'from-indigo-500 to-violet-600',
};

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

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadBrands = async () => {
            try {
                const data = await brandService.getBrands();
                setBrands(data);
            } catch (error) {
                console.error('Failed to load brands:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBrands();
    }, []);

    const filteredBrands = brands.filter((brand) =>
        searchQuery
            ? brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
            : true
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 py-20 lg:py-28 text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.1, scale: 1 }}
                    className="absolute top-0 right-0 p-12 pointer-events-none"
                >
                    <Building2 className="w-96 h-96 rotate-12" />
                </motion.div>

                <div className="container mx-auto px-4 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="bg-white/20 text-white border-0 mb-6 backdrop-blur-md px-4 py-1">
                            World-Class Manufacturers
                        </Badge>
                        <h1 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight">Our Trusted Brands</h1>
                        <p className="text-lg lg:text-2xl text-blue-100 mb-10 leading-relaxed font-medium">
                            We partner with leading pharmaceutical companies to bring you the highest quality healthcare products.
                        </p>
                        <div className="max-w-xl mx-auto relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by brand name or pharmaceutical company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 h-14 bg-white/95 backdrop-blur-xl border-0 text-slate-900 rounded-2xl shadow-2xl focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-10 mb-20 relative z-10">
                {/* Statistics/Highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
                >
                    {[
                        { icon: Globe, label: 'Global Presence', value: '25+ Countries' },
                        { icon: Award, label: 'Quality Certified', value: 'WHO-GMP' },
                        { icon: Package, label: 'Unique Products', value: '5000+' },
                        { icon: Building2, label: 'Partnered Labs', value: '100+' },
                    ].map((stat, i) => (
                        <Card key={i} className="border-0 shadow-xl bg-white/80 backdrop-blur-md">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* Brands Grid */}
                {isLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Card key={i} className="overflow-hidden border-0 shadow-lg">
                                <Skeleton className="aspect-video w-full" />
                                <CardContent className="p-8">
                                    <Skeleton className="h-8 w-3/4 mb-4" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-5/6" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredBrands.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-white rounded-[3rem] shadow-xl border border-slate-100"
                    >
                        <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8">
                            <Building2 className="w-16 h-16 text-slate-200" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">No brands found</h2>
                        <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg font-medium">We couldn&apos;t find any brands matching your search criteria. Try a different term or browse our categories.</p>
                        <Button size="lg" variant="outline" onClick={() => setSearchQuery('')} className="rounded-2xl px-10 border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600">
                            Clear Search
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        {filteredBrands.map((brand, index) => {
                            const colorClass = brandColors[index % Object.keys(brandColors).length];

                            return (
                                <motion.div
                                    key={brand.id}
                                    variants={fadeInUp}
                                    whileHover={{ y: -10 }}
                                    className="h-full"
                                >
                                    <Link href={`/products?brandId=${brand.id}`}>
                                        <Card className="group h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden rounded-[2.5rem] bg-white">
                                            <div className={`h-40 bg-gradient-to-br ${colorClass} p-8 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-700`}>
                                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {brand.logo ? (
                                                    <img src={getImageUrl(brand.logo)} alt={brand.name} className="w-full h-full object-contain filter brightness-0 invert drop-shadow-lg" />
                                                ) : (
                                                    <div className="text-4xl font-black text-white/50 tracking-tighter uppercase select-none group-hover:scale-110 transition-transform duration-500">
                                                        {brand.name.substring(0, 2)}
                                                    </div>
                                                )}
                                                <motion.div
                                                    className="absolute top-4 right-4"
                                                    initial={{ scale: 0 }}
                                                    whileHover={{ scale: 1.2 }}
                                                >
                                                    <Sparkles className="w-6 h-6 text-white/40" />
                                                </motion.div>
                                            </div>

                                            <CardContent className="p-8">
                                                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                                                    {brand.name}
                                                </h3>
                                                {brand.description ? (
                                                    <p className="text-slate-600 mb-8 line-clamp-3 leading-relaxed font-medium">
                                                        {brand.description}
                                                    </p>
                                                ) : (
                                                    <p className="text-slate-400 mb-8 italic font-medium">Explore premium products from {brand.name}.</p>
                                                )}
                                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-blue-600 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                                        View Products <ArrowRight className="w-5 h-5" />
                                                    </span>
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        <Tag className="w-5 h-5" />
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

                {/* Categories CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-32 rounded-[3.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">Looking for specific products?</h2>
                        <p className="text-xl text-blue-100/80 mb-12 font-medium leading-relaxed">Browse medicines and healthcare supplies across all brands or visit our category-specific collections.</p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-blue-50 hover:scale-105 transition-all rounded-2xl px-10 h-16 text-lg font-bold shadow-xl shadow-white/10">
                                <Link href="/products">
                                    Full Catalog <ChevronRight className="ml-2 w-6 h-6" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all rounded-2xl px-10 h-16 text-lg font-bold">
                                <Link href="/categories">Browse Categories</Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
