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
  LayoutList,
  Building2,
  Tag,
  Wallet,
  ArrowRight,
  Stethoscope,
  Package
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
import { ProductGrid, QuickViewDialog, PriceRangeSlider, BulkOrderTable } from '@/components/products';
import { productService, categoryService, brandService, agencyService } from '@/lib/api';
import { debounce, cn } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import type { Product, Category, Brand, Agency, ProductQueryParams } from '@/types';

const sortOptions = [
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'sellingPrice-asc', label: 'Price: Low to High' },
  { value: 'sellingPrice-desc', label: 'Price: High to Low' },
  { value: 'createdAt-desc', label: 'Newest First' },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings, formatPrice } = useSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>((searchParams.get('view') as 'grid' | 'list') || 'list');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Filter states
  const [priceRangeSlider, setPriceRangeSlider] = useState<[number, number]>([0, 10000]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categorySlug') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brandId') || '');
  const [selectedAgency, setSelectedAgency] = useState(searchParams.get('agencyId') || '');
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

  const fetchFilterData = useCallback(async () => {
    try {
      const [categoriesRes, brandsRes, agenciesRes] = await Promise.all([
        categoryService.getCategories({ activeOnly: true }),
        brandService.getBrands(),
        agencyService.getAgencies()
      ]);
      setCategories(categoriesRes);
      setBrands(brandsRes);
      setAgencies(agenciesRes);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  }, []);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    const params: ProductQueryParams = {
      page: currentPage,
      limit: 20,
      sortBy: sortBy as 'name' | 'sellingPrice' | 'createdAt',
      sortOrder,
    };

    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.categorySlug = selectedCategory;
    if (selectedBrand) params.brandId = parseInt(selectedBrand);
    if (selectedAgency) params.agencyId = parseInt(selectedAgency);
    if (selectedPriceRange) {
      params.minPrice = selectedPriceRange.min;
      if (selectedPriceRange.max) params.maxPrice = selectedPriceRange.max;
    }

    fetchProducts(params);

    // Update URL without refreshing
    const url = new URL(window.location.href);
    if (searchQuery) url.searchParams.set('search', searchQuery); else url.searchParams.delete('search');
    if (selectedCategory) url.searchParams.set('categorySlug', selectedCategory); else url.searchParams.delete('categorySlug');
    if (selectedBrand) url.searchParams.set('brandId', selectedBrand); else url.searchParams.delete('brandId');
    if (selectedAgency) url.searchParams.set('agencyId', selectedAgency); else url.searchParams.delete('agencyId');
    url.searchParams.set('page', currentPage.toString());
    url.searchParams.set('view', viewMode);
    window.history.replaceState({}, '', url.toString());

  }, [currentPage, searchQuery, selectedCategory, selectedBrand, selectedAgency, selectedPriceRange, sortBy, sortOrder, viewMode, fetchProducts]);

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

  const handleBrandChange = (id: string) => {
    setSelectedBrand(id === selectedBrand ? '' : id);
    setCurrentPage(1);
  };

  const handleAgencyChange = (id: string) => {
    setSelectedAgency(id === selectedAgency ? '' : id);
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

  const handlePriceSliderChange = (value: [number, number]) => {
    setPriceRangeSlider(value);
    setSelectedPriceRange({ min: value[0], max: value[1] });
    setCurrentPage(1);
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedAgency('');
    setSelectedPriceRange(null);
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedBrand || selectedAgency || selectedPriceRange || searchQuery;

  const priceRanges = [
    { min: 0, max: 100 },
    { min: 100, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: 5000 },
    { min: 5000, max: null },
  ];

  const getPriceRangeLabel = (range: { min: number; max: number | null }) => {
    if (range.max === null) return `Above ${formatPrice(range.min)}`;
    if (range.min === 0) return `Under ${formatPrice(range.max)}`;
    return `${formatPrice(range.min)} - ${formatPrice(range.max)}`;
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-emerald-600" />
          Categories
        </h4>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-2.5">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-3 group">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategory === category.slug}
                  onCheckedChange={() => handleCategoryChange(category.slug)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 transition-colors"
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium text-slate-600 cursor-pointer flex-1 group-hover:text-emerald-600 transition-colors"
                >
                  {category.name}
                  {category.productCount && (
                    <span className="text-slate-400 ml-1.5 text-xs">({category.productCount})</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-slate-100" />

      {/* Brands */}
      <div>
        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" />
          Brands
        </h4>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-2.5">
            {brands.map((brand) => (
              <div key={brand.id} className="flex items-center space-x-3 group">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={selectedBrand === brand.id.toString()}
                  onCheckedChange={() => handleBrandChange(brand.id.toString())}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
                />
                <Label
                  htmlFor={`brand-${brand.id}`}
                  className="text-sm font-medium text-slate-600 cursor-pointer flex-1 group-hover:text-blue-600 transition-colors"
                >
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-slate-100" />

      {/* Agencies */}
      <div>
        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-orange-600" />
          Agencies
        </h4>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-2.5">
            {agencies.map((agency) => (
              <div key={agency.id} className="flex items-center space-x-3 group">
                <Checkbox
                  id={`agency-${agency.id}`}
                  checked={selectedAgency === agency.id.toString()}
                  onCheckedChange={() => handleAgencyChange(agency.id.toString())}
                  className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 transition-colors"
                />
                <Label
                  htmlFor={`agency-${agency.id}`}
                  className="text-sm font-medium text-slate-600 cursor-pointer flex-1 group-hover:text-orange-600 transition-colors"
                >
                  {agency.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-slate-100" />

      {/* Price Range */}
      <div>
        <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-purple-600" />
          Price Range
        </h4>

        {/* Price Range Slider */}
        <div className="px-1 mb-8">
          <PriceRangeSlider
            min={0}
            max={10000}
            value={priceRangeSlider}
            onChange={handlePriceSliderChange}
            step={100}
          />
        </div>

        <div className="space-y-2.5">
          {priceRanges.map((range, index) => (
            <div key={index} className="flex items-center space-x-3 group">
              <Checkbox
                id={`price-${index}`}
                checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                onCheckedChange={() => {
                  handlePriceRangeChange(range);
                  setPriceRangeSlider([range.min, range.max || 10000]);
                }}
                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <Label
                htmlFor={`price-${index}`}
                className="text-sm font-medium text-slate-600 cursor-pointer group-hover:text-purple-600 transition-colors"
              >
                {getPriceRangeLabel(range)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="pt-4">
          <Button variant="ghost" onClick={clearFilters} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl">
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Search & Sort Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-16 lg:top-20 z-40 transition-all duration-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                type="search"
                placeholder="Search products by name, generic name, or description..."
                defaultValue={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 h-14 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all text-base shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <Select
                value={`${sortBy}-${sortOrder.toLowerCase()}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-56 h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-sm">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-3 focus:bg-emerald-50">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="hidden sm:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50 shadow-inner">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all",
                    viewMode === 'grid' ? "bg-white text-emerald-600 shadow-lg border border-slate-200/50" : "text-slate-500 hover:text-emerald-600"
                  )}
                  onClick={() => setViewMode('grid')}
                  title="Retail View"
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all",
                    viewMode === 'list' ? "bg-white text-emerald-600 shadow-lg border border-slate-200/50" : "text-slate-500 hover:text-emerald-600"
                  )}
                  onClick={() => setViewMode('list')}
                  title="Bulk Order View"
                >
                  <LayoutList className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Filter Toggle */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-14 rounded-2xl px-6 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
                    <SlidersHorizontal className="w-5 h-5 mr-3" />
                    Filters
                    {hasActiveFilters && (
                      <Badge className="ml-3 bg-emerald-500 w-5 h-5 p-0 flex items-center justify-center rounded-full border-2 border-white">!</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[340px] p-0 border-l border-slate-100">
                  <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <SheetHeader className="flex flex-row items-center justify-between space-y-0">
                        <SheetTitle className="text-xl font-bold text-slate-900">Advanced Filters</SheetTitle>
                      </SheetHeader>
                    </div>
                    <ScrollArea className="flex-1 p-8">
                      <FilterContent />
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-48">
              <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Refine By</h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-3 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg -mr-2"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <FilterContent />
              </div>

              {/* Banner/Support Card */}
              <div className="mt-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-white/10 group-hover:scale-110 transition-transform duration-500">
                  <Stethoscope className="w-20 h-20 rotate-12" />
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-2">Need Bulk Order?</h4>
                  <p className="text-sm text-blue-100 mb-6">Contact our support for special wholesale pricing and delivery.</p>
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-blue-700 font-bold rounded-xl border-2">
                    WhatsApp Us
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Our Collection</h2>
                <p className="text-sm font-medium text-slate-500">
                  Showing <span className="text-emerald-600 font-bold">{products.length}</span> items
                </p>
              </div>

              {/* Active Filter Badges */}
              <div className="hidden xl:flex flex-wrap items-center gap-2">
                {selectedCategory && (
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 pl-3 pr-1 py-1.5 rounded-xl gap-2 shadow-sm font-medium">
                    Category: {categories.find(c => c.slug === selectedCategory)?.name}
                    <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full hover:bg-slate-100" onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></Button>
                  </Badge>
                )}
                {selectedBrand && (
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 pl-3 pr-1 py-1.5 rounded-xl gap-2 shadow-sm font-medium">
                    Brand: {brands.find(b => b.id.toString() === selectedBrand)?.name}
                    <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full hover:bg-slate-100" onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></Button>
                  </Badge>
                )}
                {selectedAgency && (
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 pl-3 pr-1 py-1.5 rounded-xl gap-2 shadow-sm font-medium">
                    Agency: {agencies.find(a => a.id.toString() === selectedAgency)?.name}
                    <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full hover:bg-slate-100" onClick={() => setSelectedAgency('')}><X className="w-3 h-3" /></Button>
                  </Badge>
                )}
              </div>
            </div>

            <div className={cn(
              "transition-all duration-500",
              viewMode === 'grid' ? "opacity-100" : "opacity-100"
            )}>
              {viewMode === 'grid' ? (
                <ProductGrid
                  products={products}
                  isLoading={isLoading}
                  onQuickView={handleQuickView}
                  skeletonCount={8}
                />
              ) : (
                <BulkOrderTable
                  products={products}
                  brands={brands}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Quick View Dialog */}
            <QuickViewDialog
              product={quickViewProduct}
              open={isQuickViewOpen}
              onOpenChange={setIsQuickViewOpen}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-20 border-t border-slate-100 pt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl h-12 px-6 border-slate-200 font-bold transition-all disabled:opacity-30"
                >
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-12 h-12 rounded-xl text-base font-bold transition-all",
                          currentPage === pageNum ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                        )}
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
                  className="rounded-xl h-12 px-6 border-slate-200 font-bold transition-all disabled:opacity-30"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 bg-white rounded-[3rem] shadow-xl border border-dashed border-slate-200"
              >
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8">
                  <Package className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">No match found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  We couldn&apos;t find any products matching your specific filters. Try broadening your search.
                </p>
                <Button onClick={clearFilters} variant="outline" className="h-12 border-2 border-slate-200 font-bold rounded-xl px-8 hover:border-emerald-500 hover:text-emerald-600">
                  View All Products
                </Button>
              </motion.div>
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
