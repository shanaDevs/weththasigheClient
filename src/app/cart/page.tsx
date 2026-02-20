'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart as CartIcon,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  ShoppingBag,
  Pill,
  X,
  Truck,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore, useAuthStore } from '@/store';
import { getImageUrl } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { toast } from 'sonner';
import { OrderRequestDialog } from '@/components/products/order-request-dialog';
import type { Product } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    cart,
    isLoading,
    fetchCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedProductForRequest, setSelectedProductForRequest] = useState<Product | null>(null);
  const { settings, formatPrice, isLoading: isLoadingSettings } = useSettings();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const message = await applyCoupon(couponCode);
      toast.success(message);
      setCouponCode('');
    } catch {
      toast.error('Invalid or expired coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success('Coupon removed');
    } catch {
      toast.error('Failed to remove coupon');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
            <CartIcon className="w-12 h-12 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h1>
          <p className="text-slate-600 mb-6">Please login to view your cart</p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              Sign In
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isLoading && !cart) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;
  const freeShippingThreshold = settings?.free_shipping_threshold || 5000;
  const minOrderValue = settings?.min_order_value || 0;
  const amountForFreeShipping = freeShippingThreshold - parseFloat(cart?.subtotal || '0');
  const belowMinOrder = !!(cart && parseFloat(cart.subtotal) < minOrderValue);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Shopping Cart
            {cart && cart.itemCount > 0 && (
              <span className="text-slate-400 font-normal ml-2">
                ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
          {!isEmpty && (
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Looks like you haven&apos;t added any items to your cart yet.
              Browse our products and find what you need.
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                Browse Products
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free Shipping Progress */}
              {amountForFreeShipping > 0 ? (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-emerald-700">
                        Add <span className="font-bold">{formatPrice(amountForFreeShipping)}</span> more for FREE shipping!
                      </p>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((parseFloat(cart.subtotal) / freeShippingThreshold) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-sm text-emerald-700 font-medium">
                      You&apos;ve unlocked <span className="font-bold">FREE SHIPPING</span> for this order!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Minimum Order Warning */}
              {belowMinOrder && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium">
                        Minimum order value is <span className="font-bold">{formatPrice(minOrderValue)}</span>
                      </p>
                      <p className="text-xs text-amber-700">
                        Please add <span className="font-bold">{formatPrice(minOrderValue - parseFloat(cart.subtotal))}</span> more to proceed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <AnimatePresence mode="popLayout">
                {cart.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 relative">
                              {item.productImage ? (
                                <Image
                                  src={getImageUrl(item.productImage)}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Pill className="w-8 h-8 text-slate-300" />
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-4">
                              <div>
                                <Link href={`/products/${item.productId}`}>
                                  <h3 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2">
                                    {item.productName}
                                  </h3>
                                </Link>
                                <p className="text-sm text-slate-500 mt-1">SKU: {item.productSku}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="flex-shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>

                            <div className="flex items-end justify-between mt-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-slate-200"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={isLoading}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-slate-200"
                                  onClick={() => {
                                    const limit = item.product.isMaxOrderRestricted ? item.product.maxOrderQuantity : item.product.stockQuantity;
                                    if (item.quantity < limit) {
                                      handleUpdateQuantity(item.id, item.quantity + 1);
                                    } else if (item.product.isMaxOrderRestricted) {
                                      toast.info(`Max limit ${item.product.maxOrderQuantity} reached`, {
                                        description: "Request a higher quantity from admin."
                                      });
                                    }
                                  }}
                                  disabled={isLoading || item.quantity >= (item.product.isMaxOrderRestricted ? item.product.maxOrderQuantity : item.product.stockQuantity)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <div className="text-lg font-bold text-slate-900">
                                  {formatPrice(item.subtotal)}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {formatPrice(item.unitPrice)} × {item.quantity}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.product.isMaxOrderRestricted && item.quantity >= item.product.maxOrderQuantity && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                              <AlertCircle className="w-4 h-4 text-emerald-600" />
                              Maximum Limit Reached
                            </div>
                            <Button
                              variant="link"
                              className="text-[11px] text-emerald-600 font-extrabold underline underline-offset-4 hover:text-emerald-700 decoration-emerald-200 h-auto p-0"
                              onClick={() => setSelectedProductForRequest(item.product as any)}
                            >
                              Request More?
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon */}
                  {cart.couponCode ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-700">{cart.couponCode}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span>{formatPrice(cart.taxAmount)}</span>
                    </div>
                    {parseFloat(cart.discountAmount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-{formatPrice(cart.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span className={cart.shippingAmount && Number(cart.shippingAmount) === 0 ? "text-emerald-600" : ""}>
                        {cart.shippingAmount
                          ? (Number(cart.shippingAmount) === 0 ? 'FREE' : formatPrice(cart.shippingAmount))
                          : 'Calculated at checkout'}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {formatPrice(cart.total)}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-semibold shadow-lg shadow-emerald-500/25"
                    onClick={() => router.push('/checkout')}
                    disabled={belowMinOrder}
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>

                  <Link href="/products" className="block">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )
        }
      </div>

      {selectedProductForRequest && (
        <OrderRequestDialog
          product={selectedProductForRequest}
          open={!!selectedProductForRequest}
          onOpenChange={(open) => !open && setSelectedProductForRequest(null)}
        />
      )}
    </div>
  );
}
