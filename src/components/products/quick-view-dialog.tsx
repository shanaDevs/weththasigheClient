'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  AlertCircle,
  Check,
  ExternalLink,
  Pill,
  Package,
  Shield,
  Truck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore, useAuthStore } from '@/store';
import { formatCurrency, calculateDiscount, getImageUrl } from '@/lib/utils';
import { getProductPrice } from '@/lib/product-utils';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface QuickViewDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewDialog({ product, open, onOpenChange }: QuickViewDialogProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart, getItemByProductId, updateQuantity } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const cartItem = getItemByProductId(product.id);
  const displayPrice = getProductPrice(product, user);
  const discount = calculateDiscount(product.mrp, displayPrice);
  const isOutOfStock = product.stockQuantity <= 0;
  const images = product.images?.length ? product.images : [product.thumbnail];

  const getCurrentPrice = () => {
    if (!product.bulkPrices || product.bulkPrices.length === 0) {
      return parseFloat(displayPrice);
    }

    const applicableBulkPrice = [...product.bulkPrices]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find(bp => quantity >= bp.minQuantity);

    return applicableBulkPrice ? parseFloat(applicableBulkPrice.price) : parseFloat(displayPrice);
  };

  const currentPrice = getCurrentPrice();
  const totalPrice = currentPrice * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= (product.minOrderQuantity || 1) && newQty <= product.maxOrderQuantity) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    setIsAdding(true);
    try {
      if (cartItem) {
        await updateQuantity(cartItem.id, cartItem.quantity + quantity);
        toast.success('Cart updated successfully');
      } else {
        await addToCart(product.id, quantity);
        toast.success(`${product.name} added to cart`);
      }
      onOpenChange(false);
    } catch {
      toast.error('Failed to update cart');
    } finally {
      setIsAdding(false);
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick View - {product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden group">
              {images[selectedImageIndex] ? (
                <Image
                  src={getImageUrl(images[selectedImageIndex]!)}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Pill className="w-24 h-24 text-slate-300" />
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                {isOutOfStock && (
                  <Badge variant="destructive" className="shadow-md">Out of Stock</Badge>
                )}
                {discount > 0 && !isOutOfStock && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md">
                    {discount}% OFF
                  </Badge>
                )}
                {product.requiresPrescription && (
                  <Badge variant="outline" className="bg-white/90 backdrop-blur shadow-md">
                    Rx Required
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {img ? (
                      <Image
                        src={getImageUrl(img)}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-slate-100">
                        <Pill className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-slate-900 pr-4">{product.name}</h2>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="h-9 w-9">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-9 w-9">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {product.genericName && (
                <p className="text-sm text-slate-600 mb-2">
                  Generic: <span className="font-medium">{product.genericName}</span>
                </p>
              )}

              {product.brand && (
                <p className="text-sm text-slate-600">
                  Brand: <span className="font-medium">{product.brand}</span>
                </p>
              )}
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(currentPrice)}
                </span>
                {discount > 0 && (
                  <span className="text-xl text-slate-400 line-through">
                    {formatCurrency(product.mrp)}
                  </span>
                )}
              </div>

              {product.bulkPrices && product.bulkPrices.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Bulk Pricing:</p>
                  <div className="space-y-1">
                    {product.bulkPrices.map((bp, idx) => (
                      <div key={idx} className="text-sm text-blue-800">
                        {bp.minQuantity}+ units: {formatCurrency(bp.price)} each
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.dosageForm && (
                <div>
                  <span className="text-slate-600">Dosage Form:</span>
                  <p className="font-medium text-slate-900">{product.dosageForm}</p>
                </div>
              )}
              {product.strength && (
                <div>
                  <span className="text-slate-600">Strength:</span>
                  <p className="font-medium text-slate-900">{product.strength}</p>
                </div>
              )}
              {product.packSize && (
                <div>
                  <span className="text-slate-600">Pack Size:</span>
                  <p className="font-medium text-slate-900">{product.packSize}</p>
                </div>
              )}
              <div>
                <span className="text-slate-600">Stock:</span>
                <p className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} available`}
                </p>
              </div>
            </div>

            {product.shortDescription && (
              <>
                <Separator />
                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.shortDescription}
                </p>
              </>
            )}

            <Separator />

            {/* Quantity Selector & Add to Cart */}
            {!isOutOfStock && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Quantity
                    {product.minOrderQuantity > 1 && (
                      <span className="text-slate-500 font-normal ml-2">
                        (Min: {product.minOrderQuantity})
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-slate-200 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= (product.minOrderQuantity || 1)}
                        className="h-12 px-4 hover:bg-slate-100"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-6 font-semibold text-lg min-w-[4rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.maxOrderQuantity}
                        className="h-12 px-4 hover:bg-slate-100"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Total</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding || !isAuthenticated}
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {isAdding ? (
                    <>Processing...</>
                  ) : cartItem ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Update Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-600">Genuine Products</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600">Fast Delivery</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-slate-600">Secure Packaging</p>
              </div>
            </div>

            <Separator />

            {/* View Full Details */}
            <Link href={`/products/${product.slug}`}>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                View Full Details
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
