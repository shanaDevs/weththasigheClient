'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Pill,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProductDetailSkeleton } from '@/components/products';
import { addToRecentlyViewed } from '@/components/products';
import { productService } from '@/lib/api';
import { useCartStore, useAuthStore } from '@/store';
import { formatCurrency, calculateDiscount, getImageUrl } from '@/lib/utils';
import { getProductPrice } from '@/lib/product-utils';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart, getItemByProductId, updateQuantity, isLoading: cartLoading } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showOrderRequestDialog, setShowOrderRequestDialog] = useState(false);
  const [reqQty, setReqQty] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  const slug = params.slug as string;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
        setQuantity(data.minOrderQuantity || 1);
        
        // Add to recently viewed
        addToRecentlyViewed(data.id);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Product Not Found</h1>
        <p className="text-slate-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

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

    return applicableBulkPrice
      ? parseFloat(applicableBulkPrice.price)
      : parseFloat(displayPrice);
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
        await updateQuantity(cartItem.id, quantity);
        toast.success('Cart updated successfully');
      } else {
        await addToCart(product.id, quantity);
        toast.success(`${product.name} added to cart`);
      }
    } catch {
      toast.error('Failed to update cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-slate-500">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/products" className="hover:text-emerald-600">Products</Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4 mx-2" />
                <Link
                  href={`/products?categorySlug=${product.category.slug}`}
                  className="hover:text-emerald-600"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200"
              layoutId={`product-image-${product.id}`}
            >
              {images[selectedImage] ? (
                <Image
                  src={getImageUrl(images[selectedImage])}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                  <Pill className="w-32 h-32 text-slate-300" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white font-semibold text-sm px-3 py-1">
                    {discount}% OFF
                  </Badge>
                )}
                {product.requiresPrescription && (
                  <Badge variant="outline" className="bg-white text-amber-600 border-amber-300">
                    Prescription Required
                  </Badge>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg font-semibold px-6 py-2">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${selectedImage === index
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <Image
                      src={getImageUrl(img)}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              {product.category && (
                <Link
                  href={`/products?categorySlug=${product.category.slug}`}
                  className="text-sm text-emerald-600 font-medium hover:underline"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
                {product.name}
              </h1>
              {product.agency ? (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Official {product.agency.name} Product</Badge>
                  <span className="text-xs text-slate-500">by {product.agency.name}</span>
                </div>
              ) : product.manufacturer && (
                <p className="text-slate-500 mt-1">by {product.manufacturer}</p>
              )}
              <p className="text-sm text-slate-400 mt-2">SKU: {product.sku}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-emerald-600">
                {formatCurrency(currentPrice)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-xl text-slate-400 line-through">
                    {formatCurrency(product.mrp)}
                  </span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    Save {discount}%
                  </Badge>
                </>
              )}
            </div>

            {/* Tax Info */}
            {product.taxEnabled && (
              <p className="text-sm text-slate-500">
                +{product.taxPercentage}% GST (Rs.{((currentPrice * parseFloat(product.taxPercentage)) / 100).toFixed(2)} per unit)
              </p>
            )}

            {/* Pack Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              {product.packSize && (
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                  <span className="text-slate-500">Pack Size:</span>
                  <span className="font-medium text-slate-900">{product.packSize}</span>
                </div>
              )}
              {product.strength && (
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                  <span className="text-slate-500">Strength:</span>
                  <span className="font-medium text-slate-900">{product.strength}</span>
                </div>
              )}
              {product.dosageForm && (
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                  <span className="text-slate-500">Form:</span>
                  <span className="font-medium text-slate-900">{product.dosageForm}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Bulk Pricing */}
            {product.bulkPrices && product.bulkPrices.length > 0 && (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-600" />
                    Bulk Pricing Available
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    {product.bulkPrices.map((bp, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-center transition-all ${quantity >= bp.minQuantity &&
                          (!product.bulkPrices?.[index + 1] || quantity < product.bulkPrices?.[index + 1]?.minQuantity)
                          ? 'border-emerald-500 bg-emerald-100'
                          : 'border-slate-200 bg-white'
                          }`}
                      >
                        <div className="text-lg font-bold text-emerald-600">
                          {formatCurrency(bp.price)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {bp.minQuantity}+ units
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">Quantity:</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= (product.minOrderQuantity || 1)}
                    className="h-9 w-9 hover:bg-slate-200"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= (product.minOrderQuantity || 1) && val <= product.maxOrderQuantity) {
                        setQuantity(val);
                      }
                    }}
                    className="w-16 text-center font-semibold bg-transparent border-none focus:outline-none"
                    min={product.minOrderQuantity || 1}
                    max={product.maxOrderQuantity}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.maxOrderQuantity}
                    className="h-9 w-9 hover:bg-slate-200"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-slate-500">
                  (Min: {product.minOrderQuantity}, Max: {product.maxOrderQuantity})
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-100 rounded-xl">
                <span className="text-slate-600">Total:</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold"
                  disabled={isOutOfStock || isAdding || cartLoading}
                  onClick={handleAddToCart}
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {cartItem ? 'Update Cart' : 'Add to Cart'}
                    </>
                  )}
                </Button>
                {product.isMaxOrderRestricted && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => setShowOrderRequestDialog(true)}
                  >
                    Request More
                  </Button>
                )}
                <Button variant="outline" size="lg" className="h-14 px-4 hover:text-red-600">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Order Request Message */}
              {product.isMaxOrderRestricted && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    This product has a maximum order limit of {product.maxOrderQuantity} units.
                    If you need more, click "Request More".
                  </p>
                </div>
              )}
            </div>

            {/* Order Request Dialog */}
            <Dialog open={showOrderRequestDialog} onOpenChange={setShowOrderRequestDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Request for Bulk Order
                  </DialogTitle>
                  <DialogDescription>
                    Submit a request to order more than the maximum limit for {product.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="req-qty">Requested Quantity</Label>
                    <Input
                      id="req-qty"
                      type="number"
                      min={product.maxOrderQuantity + 1}
                      value={reqQty}
                      onChange={(e) => setReqQty(e.target.value)}
                      placeholder={`Greater than ${product.maxOrderQuantity}`}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="req-note">Note (Optional)</Label>
                    <textarea
                      id="req-note"
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      placeholder="Explain why you need this quantity..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowOrderRequestDialog(false)}>Cancel</Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={reqLoading || !reqQty || parseInt(reqQty) <= product.maxOrderQuantity}
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast.error('Please login to submit requests');
                        return;
                      }
                      setReqLoading(true);
                      try {
                        await productService.submitOrderMoreRequest({
                          productId: product.id,
                          requestedQuantity: parseInt(reqQty),
                          note: reqNote
                        });
                        toast.success('Your request has been submitted successfully!');
                        setShowOrderRequestDialog(false);
                        setReqQty('');
                        setReqNote('');
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Failed to submit request');
                      } finally {
                        setReqLoading(false);
                      }
                    }}
                  >
                    {reqLoading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-200">
                <Shield className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs text-slate-600">100% Genuine</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-200">
                <Truck className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs text-slate-600">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg border border-slate-200">
                <RotateCcw className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs text-slate-600">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-8">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Product Details
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Shipping Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {product.description ? (
                    <div className="prose prose-slate max-w-none">
                      <p>{product.description}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500">No description available for this product.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableBody>
                      {product.genericName && (
                        <TableRow>
                          <TableCell className="font-medium text-slate-500">Generic Name</TableCell>
                          <TableCell>{product.genericName}</TableCell>
                        </TableRow>
                      )}
                      {product.agency && (
                        <TableRow>
                          <TableCell className="font-medium text-slate-500">Agency</TableCell>
                          <TableCell>{product.agency.name} ({product.agency.code})</TableCell>
                        </TableRow>
                      )}
                      {product.manufacturer && (
                        <TableRow>
                          <TableCell className="font-medium text-slate-500">Manufacturer</TableCell>
                          <TableCell>{product.manufacturer}</TableCell>
                        </TableRow>
                      )}
                      {product.dosageForm && (
                        <TableRow>
                          <TableCell className="font-medium text-slate-500">Dosage Form</TableCell>
                          <TableCell>{product.dosageForm}</TableCell>
                        </TableRow>
                      )}
                      {product.strength && (
                        <TableRow>
                          <TableCell className="font-medium text-slate-500">Strength</TableCell>
                          <TableCell>{product.strength}</TableCell>
                        </TableRow>
                      )}
                      {product.packSize && (
                        <TableRow>
                          <TableCell className="font-medium text-slate-500">Pack Size</TableCell>
                          <TableCell>{product.packSize}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium text-slate-500">SKU</TableCell>
                        <TableCell>{product.sku}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-slate-500">Prescription Required</TableCell>
                        <TableCell>
                          {product.requiresPrescription ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Free Shipping</h4>
                      <p className="text-sm text-slate-500">On orders above Rs.5,000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Express Delivery</h4>
                      <p className="text-sm text-slate-500">2-4 business days in metro cities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Standard Delivery</h4>
                      <p className="text-sm text-slate-500">5-7 business days for other locations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900">Temperature Controlled</h4>
                      <p className="text-sm text-slate-500">All medicines shipped with proper temperature controls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
