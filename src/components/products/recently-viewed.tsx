'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { productService } from '@/lib/api';
import type { Product } from '@/types';
import { ProductCard } from './product-card';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export function RecentlyViewedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setProducts([]);
      return;
    }

    try {
      const productIds: number[] = JSON.parse(stored);
      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      
      // Fetch product details for each ID
      const productPromises = productIds.map(id => 
        productService.getProductById(id).catch(() => null)
      );
      
      const fetchedProducts = await Promise.all(productPromises);
      const validProducts = fetchedProducts.filter((p): p is Product => p !== null);
      
      setProducts(validProducts);
    } catch (error) {
      console.error('Failed to load recently viewed products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            Recently Viewed
          </CardTitle>
          {products.length > 4 && (
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {products.slice(0, 6).map((product, index) => (
                <div key={product.id} className="w-[250px] flex-shrink-0">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to add a product to recently viewed
export function addToRecentlyViewed(productId: number) {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let productIds: number[] = stored ? JSON.parse(stored) : [];

    // Remove the product if it already exists
    productIds = productIds.filter(id => id !== productId);

    // Add to the beginning
    productIds.unshift(productId);

    // Keep only the last MAX_ITEMS
    productIds = productIds.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  } catch (error) {
    console.error('Failed to save to recently viewed:', error);
  }
}

// Helper function to get recently viewed product IDs
export function getRecentlyViewedIds(): number[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
