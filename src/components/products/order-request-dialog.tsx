'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { productService } from '@/lib/api/products';
import type { Product } from '@/types';
import { Info, Send } from 'lucide-react';

interface OrderRequestDialogProps {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrderRequestDialog({ product, open, onOpenChange }: OrderRequestDialogProps) {
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!quantity || parseInt(quantity) <= (product.maxOrderQuantity || 0)) {
            toast.error(`Quantity must be greater than ${product.maxOrderQuantity || 0}`);
            return;
        }

        setSubmitting(true);
        try {
            await productService.submitOrderMoreRequest({
                productId: product.id,
                requestedQuantity: parseInt(quantity),
                note
            });

            toast.success('Request submitted successfully. Our team will review it.');
            onOpenChange(false);
            setQuantity('');
            setNote('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Send className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-1">Bulk Order Request</h2>
                        <p className="text-emerald-50/80 font-medium text-sm">
                            {product.name}
                        </p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-[11px] text-amber-900 leading-relaxed font-bold uppercase tracking-wide">
                            Your requesting more than our standard limit of <span className="text-amber-600 underline decoration-2">{product.maxOrderQuantity} units</span>. Our wholesale team will process your request within 24 hours.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="requested-qty" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Requested Quantity</Label>
                            <Input
                                id="requested-qty"
                                type="number"
                                placeholder={`Enter amount > ${product.maxOrderQuantity}`}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-lg px-6"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="request-note" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Note / Purpose (Optional)</Label>
                            <Textarea
                                id="request-note"
                                placeholder="Why do you need more? (e.g. Pharmacy supply, event, etc.)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="min-h-[120px] bg-slate-50 border-slate-100 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 font-medium p-6 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Sending Request...' : 'Submit Bulk Request'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
