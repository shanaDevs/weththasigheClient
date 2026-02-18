'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Grid3X3,
  LayoutList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductGrid } from '@/components/products';
import { productService, categoryService } from '@/lib/api';
import { debounce } from '@/lib/utils';
import type { Product, Category, ProductQueryParams } from '@/types';

const sortOptions = [
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'sellingPrice-asc', label: 'Price: Low to High' },
  { value: 'sellingPrice-desc', label: 'Price: High to Low' },
  { value: 'createdAt-desc', label: 'Newest First' },
];

const priceRanges = [
  { min: 0, max: 100, label: 'Under Rs.100' },
  { min: 100, max: 500, label: 'Rs.100 - Rs.500' },
  { min: 500, max: 1000, label: 'Rs.500 - Rs.1,000' },
  { min: 1000, max: 5000, label: 'Rs.1,000 - Rs.5,000' },
  { min: 5000, max: null, label: 'Above Rs.5,000' },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categorySlug') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number | null } | null>(null);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>((searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC');

  const fetchProducts = useCallback(async (params: ProductQueryParams) => {
    setIsLoading(true);
    try {
      const response = await productService.getProducts(params);
      setProducts(response.products);
      setTotalProducts(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getCategories({ activeOnly: true });
      setCategories(response);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const params: ProductQueryParams = {
      page: currentPage,
      limit: 20,
      sortBy: sortBy as 'name' | 'sellingPrice' | 'createdAt',
      sortOrder,
    };

    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.categorySlug = selectedCategory;
    if (selectedPriceRange) {
      params.minPrice = selectedPriceRange.min;
      if (selectedPriceRange.max) params.maxPrice = selectedPriceRange.max;
    }

    fetchProducts(params);
  }, [currentPage, searchQuery, selectedCategory, selectedPriceRange, sortBy, sortOrder, fetchProducts]);

  const handleSearch = debounce((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 300);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order.toUpperCase() as 'ASC' | 'DESC');
    setCurrentPage(1);
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? '' : slug);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: { min: number; max: number | null }) => {
    if (selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max) {
      setSelectedPriceRange(null);
    } else {
      setSelectedPriceRange(range);
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPriceRange(null);
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedPriceRange || searchQuery;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Categories</h4>
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategory === category.slug}
                  onCheckedChange={() => handleCategoryChange(category.slug)}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm text-slate-600 cursor-pointer flex-1"
                >
                  {category.name}
                  {category.productCount && (
                    <span className="text-slate-400 ml-1">({category.productCount})</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Price Range</h4>
        <div className="space-y-2">
          {priceRanges.map((range, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`price-${index}`}
                checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                onCheckedChange={() => handlePriceRangeChange(range)}
              />
              <Label
                htmlFor={`price-${index}`}
                className="text-sm text-slate-600 cursor-pointer"
              >
                {range.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 lg:top-20 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search medicines, healthcare products..."
                defaultValue={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <Select
                value={`${sortBy}-${sortOrder.toLowerCase()}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-48 h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="hidden md:flex items-center border border-slate-200 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile Filter Toggle */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-11">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge className="ml-2 bg-emerald-500">!</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mt-4"
            >
              <span className="text-sm text-slate-500">Active Filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedCategory('')}
                  />
                </Badge>
              )}
              {selectedPriceRange && (
                <Badge variant="secondary" className="gap-1">
                  {priceRanges.find(
                    r => r.min === selectedPriceRange.min && r.max === selectedPriceRange.max
                  )?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedPriceRange(null)}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-44">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 -mr-2"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                Showing <span className="font-semibold text-slate-900">{products.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalProducts}</span> products
              </p>
            </div>

            <ProductGrid products={products} isLoading={isLoading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
