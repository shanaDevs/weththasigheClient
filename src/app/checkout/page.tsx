'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  CreditCard,
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  Truck,
  Building2,
  Wallet,
  Banknote,
  Smartphone,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCartStore, useAuthStore } from '@/store';
import { doctorService, orderService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Address, CreateOrderInput } from '@/types';

const paymentMethods = [
  { value: 'payhere', label: 'Online Payment', icon: CreditCard, description: 'Pay securely via PayHere' },
  { value: 'upi', label: 'UPI', icon: Smartphone, description: 'Pay using any UPI app' },
  { value: 'card', label: 'Card (Manual)', icon: CreditCard, description: 'Credit or Debit card' },
  { value: 'net_banking', label: 'Net Banking', icon: Building2, description: 'Pay via bank transfer' },
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote, description: 'Pay when delivered' },
];

declare const payhere: any;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryOrderId = searchParams.get('retry');

  const { isAuthenticated } = useAuthStore();
  const { cart, fetchCart, setAddresses, clearCart } = useCartStore();

  const [addresses, setAddressesState] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<number | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<number | null>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('payhere');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    const loadData = async () => {
      try {
        if (retryOrderId) {
          // If retrying, we might not need the cart, but let's load it just in case
          fetchCart().catch(() => { });
        } else {
          await fetchCart();
        }

        const addressList = await doctorService.getAddresses();
        setAddressesState(addressList);

        // Auto-select default address
        const defaultAddress = addressList.find(a => a.isDefault);
        if (defaultAddress) {
          setSelectedShippingAddress(defaultAddress.id);
          setSelectedBillingAddress(defaultAddress.id);
        }
      } catch (error) {
        console.error('Failed to load checkout data:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadData();
  }, [isAuthenticated, router, fetchCart, retryOrderId]);

  // Special effect for retry logic
  useEffect(() => {
    if (retryOrderId && isAuthenticated) {
      const handleRetry = async () => {
        try {
          const payhereData = await orderService.getPaymentData(retryOrderId);
          if (payhereData) {
            toast.info('Restarting your payment...');

            payhere.onCompleted = function onCompleted() {
              toast.success('Payment successful!');
              router.push(`/checkout/success?order_id=${retryOrderId}`);
            };

            payhere.onDismissed = function onDismissed() {
              toast.info('Payment dismissed.');
            };

            payhere.onError = function onError(error: any) {
              console.error('PayHere Error:', error);
              toast.error('Payment failed. Please try again.');
            };

            const { sandbox, ...paymentData } = payhereData;
            payhere.sandbox = !!sandbox;
            payhere.startPayment(paymentData);
          }
        } catch (error) {
          console.error('Retry payment error:', error);
          toast.error('Could not restart payment. Please contact support.');
        }
      };

      handleRetry();
    }
  }, [retryOrderId, isAuthenticated, router]);

  const handlePlaceOrder = async () => {
    if (!selectedShippingAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Set addresses on cart first
      await setAddresses(selectedShippingAddress, useSameAddress ? selectedShippingAddress : selectedBillingAddress || undefined);

      const orderData: CreateOrderInput = {
        paymentMethod: paymentMethod as CreateOrderInput['paymentMethod'],
        shippingAddressId: selectedShippingAddress,
        billingAddressId: useSameAddress ? selectedShippingAddress : (selectedBillingAddress || selectedShippingAddress),
        customerNotes: customerNotes || undefined,
      };

      const order = await orderService.createOrder(orderData);

      if (paymentMethod === 'payhere' && (order as any).payhereData) {
        // PayHere Payment
        payhere.onCompleted = function onCompleted() {
          toast.success('Payment successful and order placed!');
          clearCart(); // Clear cart after successful payment
          router.push(`/checkout/success?order_id=${order.orderNumber}`);
        };

        payhere.onDismissed = function onDismissed() {
          toast.info('Payment dismissed. You can complete it later.');
          router.push(`/checkout/cancel?order_id=${order.orderNumber}`);
        };

        payhere.onError = function onError(error: any) {
          console.error('PayHere Error:', error);
          toast.error('Something went wrong with PayHere');
          router.push(`/checkout/cancel?order_id=${order.orderNumber}`);
        };

        // Extract sandbox flag — it must NOT be in the payment object
        const { sandbox, ...paymentData } = (order as any).payhereData;
        payhere.sandbox = !!sandbox;

        console.log('[PayHere] Starting payment with data:', paymentData);
        payhere.startPayment(paymentData);
      } else {
        toast.success('Order placed successfully!');
        router.push(`/orders/${order.orderNumber}`);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isAuthenticated || (!cart && !retryOrderId)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!retryOrderId && cart && cart.items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {retryOrderId ? 'Complete Payment' : 'Checkout'}
          </h1>
        </div>

        {retryOrderId ? (
          <Card className="max-w-2xl mx-auto text-center py-12 px-6">
            <CardHeader>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">Restarting Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                We are launching the PayHere secure payment window for order <strong>{retryOrderId}</strong>.
              </p>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Click if window doesn't open
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/orders/${retryOrderId}`)}
                >
                  Back to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[
                { num: 1, label: 'Address' },
                { num: 2, label: 'Payment' },
                { num: 3, label: 'Review' },
              ].map((s, index) => (
                <div key={s.num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s.num
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`ml-2 hidden sm:block ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                  {index < 2 && (
                    <div className={`w-12 lg:w-20 h-1 mx-4 rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: Shipping Address */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle>Shipping Address</CardTitle>
                          <p className="text-sm text-slate-500">Select where to deliver your order</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAddresses ? (
                          <div className="space-y-4">
                            {[1, 2].map((i) => (
                              <Skeleton key={i} className="h-24 rounded-lg" />
                            ))}
                          </div>
                        ) : addresses.length === 0 ? (
                          <div className="text-center py-8">
                            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 mb-4">No addresses found</p>
                            <Button onClick={() => router.push('/addresses/new')}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add New Address
                            </Button>
                          </div>
                        ) : (
                          <RadioGroup
                            value={selectedShippingAddress?.toString()}
                            onValueChange={(value) => setSelectedShippingAddress(parseInt(value))}
                          >
                            <div className="space-y-3">
                              {addresses.filter(a => a.addressType !== 'billing').map((address) => (
                                <div
                                  key={address.id}
                                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${selectedShippingAddress === address.id
                                    ? 'border-emerald-500 bg-emerald-50/50'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                  onClick={() => setSelectedShippingAddress(address.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-900">{address.contactName}</span>
                                        {address.isDefault && (
                                          <Badge variant="secondary" className="text-xs">Default</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-600">
                                        {address.addressLine1}
                                        {address.addressLine2 && `, ${address.addressLine2}`}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        {address.city}, {address.state} - {address.postalCode}
                                      </p>
                                      <p className="text-sm text-slate-500 mt-1">{address.contactPhone}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}

                        <div className="mt-4">
                          <Button variant="outline" onClick={() => router.push('/addresses/new')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Address
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end mt-6">
                      <Button
                        size="lg"
                        onClick={() => setStep(2)}
                        disabled={!selectedShippingAddress}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        Continue to Payment
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment Method */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle>Payment Method</CardTitle>
                          <p className="text-sm text-slate-500">Choose how you want to pay</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <div className="grid gap-3">
                            {paymentMethods.map((method) => (
                              <div
                                key={method.value}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === method.value
                                  ? 'border-emerald-500 bg-emerald-50/50'
                                  : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                onClick={() => setPaymentMethod(method.value)}
                              >
                                <div className="flex items-center gap-4">
                                  <RadioGroupItem value={method.value} id={method.value} />
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <method.icon className="w-6 h-6 text-slate-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{method.label}</p>
                                    <p className="text-sm text-slate-500">{method.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between mt-6">
                      <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => setStep(3)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        Review Order
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle>Review Your Order</CardTitle>
                          <p className="text-sm text-slate-500">Please verify all details before placing</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Shipping Address Summary */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <Truck className="w-4 h-4" /> Shipping Address
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                              Edit
                            </Button>
                          </div>
                          {selectedShippingAddress && (
                            <div className="bg-slate-50 rounded-lg p-3">
                              {(() => {
                                const addr = addresses.find(a => a.id === selectedShippingAddress);
                                if (!addr) return null;
                                return (
                                  <>
                                    <p className="font-medium">{addr.contactName}</p>
                                    <p className="text-sm text-slate-600">
                                      {addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}
                                    </p>
                                    <p className="text-sm text-slate-500">{addr.contactPhone}</p>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Payment Method Summary */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" /> Payment Method
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                              Edit
                            </Button>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium">
                              {paymentMethods.find(m => m.value === paymentMethod)?.label}
                            </p>
                            <p className="text-sm text-slate-500">
                              {paymentMethods.find(m => m.value === paymentMethod)?.description}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Order Notes */}
                        <div>
                          <Label htmlFor="notes" className="mb-2 block">Order Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any special instructions for your order..."
                            value={customerNotes}
                            onChange={(e) => setCustomerNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back
                      </Button>
                      <Button
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
                        {isPlacingOrder ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            Place Order
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items Preview */}
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {cart?.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                            {item.quantity}x
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(item.unitPrice)} each</p>
                          </div>
                          <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                        </div>
                      ))}
                      {cart && cart.items.length > 3 && (
                        <p className="text-sm text-slate-500 text-center">
                          +{cart.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal ({cart?.itemCount} items)</span>
                        <span>{formatCurrency(cart?.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Tax</span>
                        <span>{formatCurrency(cart?.taxAmount || 0)}</span>
                      </div>
                      {cart && parseFloat(cart.discountAmount) > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Discount</span>
                          <span>-{formatCurrency(cart.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Shipping</span>
                        <span className={cart && Number(cart.shippingAmount) === 0 ? "text-emerald-600 font-medium" : "text-slate-900 font-medium"}>
                          {cart && Number(cart.shippingAmount) === 0 ? 'FREE' : formatCurrency(cart?.shippingAmount || 0)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(cart?.total || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
