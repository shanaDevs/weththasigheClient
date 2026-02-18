'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Pill,
  Heart,
  Brain,
  Eye,
  Stethoscope,
  Activity,
  Bone,
  Wind,
  Droplets,
  Shield,
  Search,
  ChevronRight,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { categoryService } from '@/lib/api';
import type { Category } from '@/types';

// Icon mapping for categories
const categoryIcons: Record<string, React.ElementType> = {
  'medicines': Pill,
  'cardiac': Heart,
  'neurology': Brain,
  'ophthalmology': Eye,
  'diagnostics': Stethoscope,
  'cardiovascular': Activity,
  'orthopedic': Bone,
  'respiratory': Wind,
  'diabetes': Droplets,
  'immune': Shield,
};

// Color mapping for categories
const categoryColors: Record<number, string> = {
  0: 'from-emerald-500 to-teal-600',
  1: 'from-blue-500 to-indigo-600',
  2: 'from-purple-500 to-pink-600',
  3: 'from-orange-500 to-red-600',
  4: 'from-cyan-500 to-blue-600',
  5: 'from-rose-500 to-pink-600',
  6: 'from-amber-500 to-orange-600',
  7: 'from-teal-500 to-emerald-600',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await categoryService.getCategories();
        setCategories(categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const filteredCategories = categories.filter((category) =>
    searchQuery
      ? category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const getIcon = (category: Category): React.ElementType => {
    const slug = category.slug.toLowerCase();
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (slug.includes(key)) return icon;
    }
    return Package;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-16 lg:py-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">Browse Categories</h1>
            <p className="text-lg lg:text-xl text-emerald-100 max-w-2xl mx-auto mb-8">
              Explore our comprehensive range of pharmaceutical categories
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/95 backdrop-blur border-0 text-slate-900"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="w-16 h-16 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No categories found</h2>
            <p className="text-slate-600 mb-6">Try a different search term</p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => {
              const Icon = getIcon(category);
              const colorClass = categoryColors[index % Object.keys(categoryColors).length];

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/products?category=${category.slug}`}>
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
                      <CardContent className="p-6">
                        <div
                          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform overflow-hidden`}
                        >
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                          ) : category.icon ? (
                            <span className="text-3xl">{category.icon}</span>
                          ) : (
                            <Icon className="w-8 h-8" />
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {category.productCount !== undefined && (
                            <Badge variant="secondary">
                              {category.productCount} products
                            </Badge>
                          )}
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Subcategories - For parent categories that have children */}
        {filteredCategories.some((c) => c.children && c.children.length > 0) && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Category Details</h2>
            <div className="space-y-8">
              {filteredCategories
                .filter((c) => c.children && c.children.length > 0)
                .map((parent) => (
                  <motion.div
                    key={parent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">{parent.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {parent.children?.map((child) => (
                            <Link
                              key={child.id}
                              href={`/products?category=${child.slug}`}
                            >
                              <Badge
                                variant="outline"
                                className="hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-colors"
                              >
                                {child.name}
                                {child.productCount !== undefined && (
                                  <span className="ml-1 text-slate-400">({child.productCount})</span>
                                )}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </section>
        )}

        {/* Browse All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="text-slate-600 mb-6">Browse all our products or use the search function</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <Link href="/products">
              Browse All Products
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
