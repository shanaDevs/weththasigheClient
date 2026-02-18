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
        if (!quantity || parseInt(quantity) <= product.maxOrderQuantity) {
            toast.error(`Quantity must be greater than ${product.maxOrderQuantity}`);
            return;
        }

        setSubmitting(true);
        try {
            // Assuming we have a public or user-facing route for this
            // For now using a placeholder route logic in adminApi if needed, 
            // but ideally it should be in products.ts or orders.ts
            await productService.submitOrderMoreRequest({
                productId: product.id,
                requestedQuantity: parseInt(quantity),
                note
            });

            toast.success('Request submitted successfully. Admin will review it.');
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Order More - {product.name}</DialogTitle>
                    <DialogDescription>
                        Request a quantity exceeding the maximum limit of {product.maxOrderQuantity}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="requested-qty">Requested Quantity</Label>
                        <Input
                            id="requested-qty"
                            type="number"
                            placeholder={`Enter quantity ( > ${product.maxOrderQuantity})`}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="request-note">Note / Purpose (Optional)</Label>
                        <Textarea
                            id="request-note"
                            placeholder="Tell us why you need more..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
