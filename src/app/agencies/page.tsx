'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Tag,
    Search,
    ChevronRight,
    Package,
    GanttChartSquare,
    Globe,
    Award,
    ArrowRight,
    ShieldCheck,
    Building2,
    Phone,
    Mail,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { agencyService } from '@/lib/api';
import type { Agency } from '@/types';

// Color mapping for agencies
const agencyColors: Record<number, string> = {
    0: 'from-emerald-500 to-teal-600',
    1: 'from-rose-500 to-pink-600',
    2: 'from-blue-500 to-indigo-600',
    3: 'from-amber-500 to-orange-600',
    4: 'from-purple-500 to-pink-600',
    5: 'from-cyan-500 to-blue-600',
    6: 'from-indigo-500 to-violet-600',
    7: 'from-orange-500 to-red-600',
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

export default function AgenciesPage() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadAgencies = async () => {
            try {
                const data = await agencyService.getAgencies();
                setAgencies(data.filter(a => a.isActive));
            } catch (error) {
                console.error('Failed to load agencies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAgencies();
    }, []);

    const filteredAgencies = agencies.filter((agency) =>
        searchQuery
            ? agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agency.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agency.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
            : true
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-20 lg:py-28 text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.1, scale: 1 }}
                    className="absolute top-0 right-0 p-12 pointer-events-none"
                >
                    <GanttChartSquare className="w-96 h-96 -rotate-12" />
                </motion.div>

                <div className="container mx-auto px-4 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="bg-white/20 text-white border-0 mb-6 backdrop-blur-md px-4 py-1">
                            Authorized Distribution Partners
                        </Badge>
                        <h1 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight">Our Agencies</h1>
                        <p className="text-lg lg:text-2xl text-emerald-100 mb-10 leading-relaxed font-medium">
                            Transparent and efficient distribution through our network of authorized pharmaceutical agencies.
                        </p>
                        <div className="max-w-xl mx-auto relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Search by agency name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 h-14 bg-white/95 backdrop-blur-xl border-0 text-slate-900 rounded-2xl shadow-2xl focus:ring-4 focus:ring-emerald-500/20 transition-all text-lg"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-10 mb-20 relative z-10">

                {/* Agencies Grid */}
                {isLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="overflow-hidden border-0 shadow-lg">
                                <Skeleton className="h-4 w-1/4 absolute top-6 right-6" />
                                <CardContent className="p-8 space-y-4">
                                    <Skeleton className="h-10 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <div className="pt-8 space-y-3">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredAgencies.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-white rounded-[3rem] shadow-xl border border-slate-100"
                    >
                        <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8">
                            <GanttChartSquare className="w-16 h-16 text-slate-200" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">No agencies found</h2>
                        <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg font-medium">We couldn&apos;t find any distribution agencies matching your search. Please check your spelling or contact support.</p>
                        <Button size="lg" variant="outline" onClick={() => setSearchQuery('')} className="rounded-2xl px-10 border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600">
                            Clear Search
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filteredAgencies.map((agency, index) => {
                            const colorClass = agencyColors[index % Object.keys(agencyColors).length];

                            return (
                                <motion.div
                                    key={agency.id}
                                    variants={fadeInUp}
                                    whileHover={{ y: -10 }}
                                    className="h-full"
                                >
                                    <Card className="group h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
                                        <div className={`h-3 bg-gradient-to-r ${colorClass}`} />

                                        <CardContent className="p-8 flex-grow">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg`}>
                                                    <Building2 className="w-7 h-7" />
                                                </div>
                                            </div>

                                            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">
                                                {agency.name}
                                            </h3>

                                            {agency.description && (
                                                <p className="text-slate-600 mb-8 line-clamp-3 leading-relaxed font-medium">
                                                    {agency.description}
                                                </p>
                                            )}

                                            <div className="space-y-4 py-8 border-t border-slate-50">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                                    Distribution Network Partner
                                                </p>
                                            </div>
                                        </CardContent>

                                        <div className="p-8 pt-0 mt-auto">
                                            <Link href={`/products?agencyId=${agency.id}`}>
                                                <Button className={`w-full h-12 rounded-xl bg-gradient-to-r ${colorClass} hover:opacity-90 shadow-lg shadow-emerald-500/10 text-white font-bold group-hover:scale-[1.02] transition-all`}>
                                                    View Agency Products <ArrowRight className="ml-2 w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Distribution CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 rounded-[3.5rem] bg-white p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl border border-emerald-100"
                >
                    <div className="absolute top-0 right-0 p-12 text-emerald-50 opacity-10 pointer-events-none">
                        <Globe className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Expand Your Distribution</h2>
                        <p className="text-xl text-slate-600 mb-12 font-medium leading-relaxed">Are you a pharmaceutical manufacturer looking for a reliable distribution partner? Join our network of verified agencies.</p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-all text-white rounded-2xl px-10 h-16 text-lg font-bold shadow-xl shadow-emerald-500/20">
                                <Link href="/register">
                                    Partner with Us <ArrowRight className="ml-2 w-6 h-6" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all rounded-2xl px-10 h-16 text-lg font-bold">
                                <Link href="/products">Quick Catalog Scan</Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
