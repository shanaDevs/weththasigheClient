'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Truck,
  Shield,
  Clock,
  HeartPulse,
  Pill,
  Stethoscope,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductGrid } from '@/components/products';
import { productService, categoryService, promotionService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product, Category, Promotion } from '@/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Free shipping on orders above Rs.5000',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Genuine Products',
    description: '100% authentic medicines guaranteed',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round the clock customer service',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: HeartPulse,
    title: 'Credit Facility',
    description: 'Up to 30 days credit for verified doctors',
    color: 'from-orange-500 to-red-500',
  },
];

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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, promotionsRes] = await Promise.all([
          productService.getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'DESC' }),
          categoryService.getCategories({ hierarchical: false, activeOnly: true }),
          promotionService.getActivePromotions(),
        ]);
        setProducts(productsRes.products);
        setCategories(categoriesRes.slice(0, 8));
        // Sort promotions by displayOrder (lower value = higher priority, or vice versa? Backend uses 0 as default. Let's assume higher value = higher priority)
        // Usually 0 is highest or lowest. Let's do DESC sorting if we want "higher number = show first"
        // Actually, backend model says displayOrder. Let's sort DESC to match products.
        setPromotions(promotionsRes.sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0)));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 py-16 lg:py-24">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200/40 to-cyan-200/40 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-sm px-4 py-1">
                  Trusted by 10,000+ Healthcare Professionals
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Your Partner in
                  <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Healthcare Excellence
                  </span>
                </h1>
                <p className="text-lg text-slate-600 max-w-xl">
                  Premium quality medicines and healthcare products at wholesale prices.
                  Join thousands of doctors and clinics who trust us for their medical supplies.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 px-8 h-12 text-base">
                    Browse Products
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="border-2 border-slate-300 hover:border-emerald-500 hover:text-emerald-600 px-8 h-12 text-base">
                    Register as Doctor
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">50K+</div>
                  <div className="text-sm text-slate-500">Products</div>
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">10K+</div>
                  <div className="text-sm text-slate-500">Doctors</div>
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">500+</div>
                  <div className="text-sm text-slate-500">Cities</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-0 right-0 bg-white rounded-2xl shadow-xl p-6 z-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">50K+</div>
                      <div className="text-sm text-slate-500">Products</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute bottom-10 left-0 bg-white rounded-2xl shadow-xl p-6 z-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">30%</div>
                      <div className="text-sm text-slate-500">Avg. Savings</div>
                    </div>
                  </div>
                </motion.div>

                {/* Central Image/Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-72 h-72 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <div className="w-56 h-56 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 flex items-center justify-center">
                      <Stethoscope className="w-32 h-32 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border-0 shadow-lg shadow-slate-100 hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Promotions Section */}
      {promotions.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-slate-50 to-emerald-50/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Special Offers</h2>
              <p className="text-slate-600">Don&apos;t miss out on these limited-time deals</p>
            </motion.div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {promotions.map((promo) => (
                  <CarouselItem key={promo.id} className="md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="h-full"
                    >
                      <Link href={`/promotions/${promo.id}`}>
                        <Card className="group h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="aspect-[2/1] bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
                            {promo.bannerImage && (
                              <img
                                src={promo.bannerImage}
                                alt={promo.name}
                                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-110 transition-transform duration-500"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white p-6 relative z-10">
                                <Badge className="bg-white/20 text-white border-0 mb-3 backdrop-blur-sm">
                                  {promo.type.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <h3 className="text-2xl font-bold mb-2 drop-shadow-md">{promo.name}</h3>
                                {promo.discountValue && (
                                  <p className="text-4xl font-bold drop-shadow-lg">
                                    {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : formatCurrency(promo.discountValue)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <motion.div
                              className="absolute inset-0 bg-white/10"
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '100%' }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                          <CardContent className="p-4 bg-white">
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{promo.description}</p>
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              Shop Now <ChevronRight className="w-4 h-4" />
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-12" />
                <CarouselNext className="-right-12" />
              </div>
            </Carousel>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Shop by Category</h2>
              <p className="text-slate-600">Find what you need quickly</p>
            </div>
            <Link href="/categories">
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {categories.map((category) => (
                <motion.div key={category.id} variants={fadeInUp}>
                  <Link href={`/products?categorySlug=${category.slug}`}>
                    <Card className="group h-full border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                          ) : category.icon ? (
                            <span className="text-2xl">{category.icon}</span>
                          ) : (
                            <Pill className="w-7 h-7 text-emerald-600" />
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                          {category.name}
                        </h3>
                        {category.productCount && (
                          <p className="text-sm text-slate-500">
                            {category.productCount} products
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">New Arrivals</h2>
              <p className="text-slate-600">Check out our latest products</p>
            </div>
            <Link href="/products?sortBy=createdAt&sortOrder=DESC">
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <ProductGrid products={products} isLoading={isLoading} skeletonCount={8} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-lg text-emerald-100 mb-8">
              Join thousands of healthcare professionals who save time and money with MediPharm B2B.
              Register today and get access to exclusive deals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 h-12 font-semibold shadow-xl">
                  Register as Doctor
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-2 border-white/50 text-emerald-700 hover:bg-white/10 px-8 h-12 font-semibold">
                  Browse Products
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
