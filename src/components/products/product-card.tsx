'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, AlertCircle, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore, useAuthStore } from '@/store';
import { formatCurrency, calculateDiscount, getImageUrl } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';
import { OrderRequestDialog } from './order-request-dialog';
import { getProductPrice } from '@/lib/product-utils';


interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart, getItemByProductId, updateQuantity, isLoading } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);


  const cartItem = getItemByProductId(product.id);
  const displayPrice = getProductPrice(product, user);
  const discount = calculateDiscount(product.mrp, displayPrice);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    console.log('[ProductCard] Adding to cart:', { productId: product.id, quantity: product.minOrderQuantity || 1 });
    setIsAdding(true);
    try {
      await addToCart(product.id, product.minOrderQuantity || 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      console.error('[ProductCard] Failed to add to cart:', error);

      // Extract error message
      let errorMessage = 'Failed to add item to cart';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check for axios error with response
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (!cartItem) return;

    if (newQuantity < (product.minOrderQuantity || 1)) {
      toast.error(`Minimum order quantity is ${product.minOrderQuantity || 1}`);
      return;
    }

    if (newQuantity > product.maxOrderQuantity) {
      toast.error(`Maximum order quantity is ${product.maxOrderQuantity}`);
      return;
    }

    try {
      await updateQuantity(cartItem.id, newQuantity);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="group h-full overflow-hidden border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300">
        <Link href={`/products/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
            {product.thumbnail ? (
              <Image
                src={getImageUrl(product.thumbnail)}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Pill className="w-16 h-16 text-slate-300" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {discount > 0 && (
                <Badge className="bg-red-500 hover:bg-red-500 text-white font-semibold">
                  {discount}% OFF
                </Badge>
              )}
              {product.requiresPrescription && (
                <Badge variant="outline" className="bg-white/90 text-amber-600 border-amber-300">
                  Rx Required
                </Badge>
              )}
              {product.isMaxOrderRestricted && (
                <Badge variant="outline" className="bg-white/90 text-orange-600 border-orange-300">
                  Limit: {product.maxOrderQuantity}
                </Badge>
              )}
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-sm font-semibold">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
        </Link>

        <CardContent className="p-4">
          <Link href={`/products/${product.slug}`}>
            <div className="mb-3">
              {product.category && (
                <span className="text-xs text-emerald-600 font-medium">
                  {product.category.name}
                </span>
              )}
              <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors mt-1">
                {product.name}
              </h3>
              {product.agency ? (
                <p className="text-xs font-semibold text-emerald-700 mt-1">{product.agency.name}</p>
              ) : product.manufacturer && (
                <p className="text-xs text-slate-500 mt-1">{product.manufacturer}</p>
              )}
            </div>
          </Link>

          {/* Pack Info */}
          {product.packSize && (
            <p className="text-xs text-slate-500 mb-2">{product.packSize}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(displayPrice)}
            </span>
            {parseFloat(product.mrp) > parseFloat(displayPrice) && (
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
            )}
          </div>

          {/* Bulk Pricing Hint */}
          {product.bulkPrices && product.bulkPrices.length > 0 && (
            <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Bulk discounts available
            </p>
          )}

          {/* Min Order */}
          <p className="text-xs text-slate-500 mb-3">
            Min. Order: {product.minOrderQuantity} units
          </p>

          {/* Add to Cart / Quantity Controls */}
          {cartItem ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-emerald-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-emerald-100"
                  onClick={() => handleUpdateQuantity(cartItem.quantity - 1)}
                  disabled={isLoading || cartItem.quantity <= (product.minOrderQuantity || 1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-emerald-700">
                  {cartItem.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-emerald-100"
                  onClick={() => handleUpdateQuantity(cartItem.quantity + 1)}
                  disabled={isLoading || cartItem.quantity >= product.maxOrderQuantity}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(parseFloat(cartItem.subtotal))}
              </span>
            </div>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition-all"
              disabled={isOutOfStock || isAdding || isLoading}
              onClick={handleAddToCart}
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Adding...
                </span>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          )}
          {cartItem && cartItem.quantity >= product.maxOrderQuantity && product.isMaxOrderRestricted && (
            <Button
              variant="link"
              className="w-full text-xs text-emerald-600 h-auto mt-2 p-0"
              onClick={() => setShowRequestDialog(true)}
            >
              Need more? Request here
            </Button>
          )}
        </CardContent>

        <OrderRequestDialog
          product={product}
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
        />
      </Card>
    </motion.div>
  );
}
