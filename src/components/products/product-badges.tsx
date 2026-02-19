'use client';

import { Badge } from '@/components/ui/badge';
import { Flame, Sparkles, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import type { Product } from '@/types';

interface ProductBadgesProps {
  product: Product;
  discount?: number;
  className?: string;
}

export function ProductBadges({ product, discount = 0, className = '' }: ProductBadgesProps) {
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const isNew = product.createdAt 
    ? (new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7 
    : false;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Out of Stock Badge */}
      {isOutOfStock && (
        <Badge variant="destructive" className="shadow-md">
          <AlertCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </Badge>
      )}

      {/* Low Stock Badge */}
      {isLowStock && !isOutOfStock && (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
          <Clock className="w-3 h-3 mr-1" />
          Only {product.stockQuantity} left
        </Badge>
      )}

      {/* Discount Badge */}
      {discount > 0 && !isOutOfStock && (
        <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md">
          <Flame className="w-3 h-3 mr-1" />
          {discount}% OFF
        </Badge>
      )}

      {/* New Product Badge */}
      {isNew && !isOutOfStock && (
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
          <Sparkles className="w-3 h-3 mr-1" />
          New
        </Badge>
      )}

      {/* Bulk Pricing Badge */}
      {product.bulkPrices && product.bulkPrices.length > 0 && !isOutOfStock && (
        <Badge variant="outline" className="bg-white/90 backdrop-blur shadow-md border-emerald-500 text-emerald-700">
          <TrendingDown className="w-3 h-3 mr-1" />
          Bulk Pricing
        </Badge>
      )}

      {/* Prescription Required Badge */}
      {product.requiresPrescription && (
        <Badge variant="outline" className="bg-white/90 backdrop-blur shadow-md">
          Rx Required
        </Badge>
      )}
    </div>
  );
}
