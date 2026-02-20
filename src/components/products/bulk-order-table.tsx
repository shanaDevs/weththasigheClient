'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Minus,
    ShoppingCart,
    Package,
    Trash2,
    ClipboardCheck,
    AlertCircle,
    TrendingUp,
    Boxes,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { useCartStore, useAuthStore } from '@/store';
import { getProductPrice } from '@/lib/product-utils';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import type { Product, Brand } from '@/types';
import { OrderRequestDialog } from './order-request-dialog';

interface BulkOrderTableProps {
    products: Product[];
    brands?: Brand[];
    isLoading?: boolean;
}

export function BulkOrderTable({ products, brands = [], isLoading }: BulkOrderTableProps) {
    const { user, isAuthenticated } = useAuthStore();
    const { settings, formatPrice } = useSettings();
    const { addToCart, updateQuantity } = useCartStore();
    const cart = useCartStore(state => state.cart);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedProductForRequest, setSelectedProductForRequest] = useState<Product | null>(null);

    const handleQuantityChange = (productId: number, value: string, min: number, max: number) => {
        let qty = parseInt(value) || 0;

        if (qty > max && max > 0) {
            qty = max;
            toast.info(`Capped at maximum limit: ${max}`, {
                description: "Request a higher quantity from the specialized bulk order button below."
            });
        }

        setQuantities(prev => ({
            ...prev,
            [productId]: qty
        }));
    };

    const adjustQuantity = (productId: number, delta: number, effectiveLimit: number) => {
        const currentQty = quantities[productId] || 0;
        const newQty = Math.max(0, Math.min(effectiveLimit, currentQty + delta));
        setQuantities(prev => ({
            ...prev,
            [productId]: newQty
        }));
    };

    const handleBatchAddToCart = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to place bulk orders');
            return;
        }

        const itemsToAdd = Object.entries(quantities)
            .filter(([id, qty]) => {
                const product = products.find(p => p.id === parseInt(id));
                return qty > 0 && qty >= (product?.minOrderQuantity || 1);
            })
            .map(([id, qty]) => ({ productId: parseInt(id), quantity: qty }));

        const invalidItems = Object.entries(quantities)
            .filter(([id, qty]) => {
                const product = products.find(p => p.id === parseInt(id));
                return qty > 0 && qty < (product?.minOrderQuantity || 1);
            });

        if (invalidItems.length > 0) {
            toast.error('Some items do not meet the Minimum Order Quantity (MOQ)');
            return;
        }

        if (itemsToAdd.length === 0) {
            toast.error('Please enter quantities for at least one item');
            return;
        }

        setIsProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const item of itemsToAdd) {
            try {
                const product = products.find(p => p.id === item.productId);
                if (product && item.quantity < (product.minOrderQuantity || 1)) {
                    // Skip or alert? For bulk, maybe we should just set it to min?
                    // Let's just try to add and catch error from store
                }
                await addToCart(item.productId, item.quantity);
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully added ${successCount} products to cart`);
            setQuantities({});
        }
        if (failCount > 0) {
            toast.error(`Failed to add ${failCount} products. Please check stock and MOQ.`);
        }
        setIsProcessing(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    const selectedCount = Object.values(quantities).filter(q => q > 0).length;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100 h-16">
                            <TableHead className="pl-8 font-black text-slate-900 uppercase tracking-wider text-xs">Product Details</TableHead>
                            <TableHead className="font-black text-slate-900 uppercase tracking-wider text-xs">Pack Size</TableHead>
                            <TableHead className="font-black text-slate-900 uppercase tracking-wider text-xs">Pricing</TableHead>
                            <TableHead className="font-black text-slate-900 uppercase tracking-wider text-xs text-center w-[200px]">Order Quantity</TableHead>
                            <TableHead className="pr-8 text-right font-black text-slate-900 uppercase tracking-wider text-xs">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.filter(p => (p.stockQuantity || 0) > 0).map((product) => {
                            const cartItem = cart?.items.find(item => item.productId === product.id);
                            const qty = quantities[product.id] || 0;
                            const displayPrice = getProductPrice(product, user);
                            const minQty = product.minOrderQuantity || 1;

                            return (
                                <TableRow key={product.id} className="group hover:bg-emerald-50/30 border-slate-50 transition-colors">
                                    <TableCell className="pl-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{product.name}</span>
                                            <span className="text-xs text-slate-500 font-medium mt-1">{product.genericName || product.sku}</span>
                                            {(() => {
                                                const brandName = product.brand || product.manufacturer || brands.find(b => b.id === product.brandId)?.name;
                                                return brandName && (
                                                    <Badge variant="secondary" className="w-fit mt-2 bg-blue-50 text-blue-600 border-blue-100 text-[10px] py-0 px-2 rounded-md">
                                                        {brandName}
                                                    </Badge>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <BoxIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium">{product.packSize || 'Single Item'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-emerald-600">{formatPrice(displayPrice)}</span>
                                                {product.mrp && parseFloat(product.mrp) > parseFloat(displayPrice) && (
                                                    <span className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</span>
                                                )}
                                            </div>
                                            {product.wholesalePrice && (
                                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> Wholesale Ready
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={cn(
                                                "flex items-center gap-1 bg-white border-2 rounded-2xl p-1 shadow-sm transition-all duration-300 group-hover:shadow-md h-12 w-36",
                                                qty > 0 ? "border-emerald-500/30 bg-emerald-50/5" : "border-slate-100 bg-slate-50/30"
                                            )}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-xl text-slate-400 transition-colors"
                                                    onClick={() => adjustQuantity(product.id, -minQty, product.isMaxOrderRestricted ? product.maxOrderQuantity : product.stockQuantity)}
                                                    disabled={qty === 0}
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    className="w-full h-8 border-0 focus-visible:ring-0 text-center font-black text-slate-900 bg-transparent text-base"
                                                    value={qty || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleQuantityChange(product.id, e.target.value, minQty, product.maxOrderQuantity)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl text-slate-400 transition-colors"
                                                    onClick={() => {
                                                        const limit = product.isMaxOrderRestricted ? product.maxOrderQuantity : product.stockQuantity;
                                                        if (qty < (limit || 0)) {
                                                            adjustQuantity(product.id, minQty, limit);
                                                        } else if (product.isMaxOrderRestricted) {
                                                            toast.info(`Max limit ${product.maxOrderQuantity} reached.`, {
                                                                description: "Request a higher quantity from admin.",
                                                                action: {
                                                                    label: "Request",
                                                                    onClick: () => setSelectedProductForRequest(product)
                                                                }
                                                            });
                                                        } else {
                                                            toast.error("Stock limit reached");
                                                        }
                                                    }}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-col items-center gap-1 pt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">MOQ: {minQty}</span>
                                                    {product.isMaxOrderRestricted && (
                                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">Max: {product.maxOrderQuantity}</span>
                                                    )}
                                                </div>
                                                {product.isMaxOrderRestricted && (
                                                    <button
                                                        onClick={() => setSelectedProductForRequest(product)}
                                                        className="text-[10px] text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700 flex items-center gap-1 mt-1 group/req"
                                                    >
                                                        <AlertCircle className="w-3 h-3 group-hover/req:scale-110 transition-transform" />
                                                        <span className="underline underline-offset-2">Request Bulk Order</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                        <Button
                                            size="sm"
                                            variant={cartItem ? "outline" : "default"}
                                            className={cn(
                                                "font-bold rounded-xl h-10 px-4 transition-all border-0",
                                                cartItem
                                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                    : "bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white"
                                            )}
                                            disabled={isProcessing}
                                            onClick={async () => {
                                                if (qty > 0) {
                                                    try {
                                                        await addToCart(product.id, qty);
                                                        setQuantities(prev => {
                                                            const next = { ...prev };
                                                            delete next[product.id];
                                                            return next;
                                                        });
                                                        toast.success(`${product.name} quantity updated`);
                                                    } catch (error: any) {
                                                        const message = error.response?.data?.message || error.message || 'Failed to add to cart';
                                                        toast.error(message);
                                                    }
                                                } else {
                                                    toast.error('Set quantity first');
                                                }
                                            }}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            {cartItem ? `Add More (${cartItem.quantity})` : 'Quick Add'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Bulk Action Floating Bar */}
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl shadow-slate-950/50 flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4 pl-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                    <Boxes className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-black text-lg leading-tight">{selectedCount} Products Selected</p>
                                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-0.5">Ready for Batch Order</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    className="text-white/60 hover:text-white hover:bg-white/5 font-bold rounded-2xl h-14"
                                    onClick={() => setQuantities({})}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl h-14 px-10 shadow-lg shadow-emerald-500/25 transition-all text-lg"
                                    onClick={handleBatchAddToCart}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing Bulk Order...' : 'Batch Add to Cart'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Request Dialog */}
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

function BoxIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    );
}
