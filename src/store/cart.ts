import { create } from 'zustand';
import { cartService } from '@/lib/api';
import type { Cart, CartItem } from '@/types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<string>;
  removeCoupon: () => Promise<void>;
  setAddresses: (shippingId: number, billingId?: number) => Promise<void>;

  // Getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemByProductId: (productId: number) => CartItem | undefined;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.getCart();
      set({ cart, isLoading: false });
    } catch (error) {
      // Cart might not exist for unauthenticated users
      set({ cart: null, isLoading: false });
      console.error('Failed to fetch cart:', error);
    }
  },

  addToCart: async (productId, quantity) => {
    console.log('[Cart Store] Adding to cart:', { productId, quantity });
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.addToCart(productId, quantity);
      console.log('[Cart Store] Successfully added to cart:', cart);
      set({ cart, isLoading: false });
    } catch (error: unknown) {
      console.error('[Cart Store] Failed to add to cart:', error);

      // Extract error message from API response
      let message = 'Failed to add item';
      if (error instanceof Error) {
        message = error.message;
      }

      // Check if it's an axios error with response data
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        }
      }

      console.error('[Cart Store] Error message:', message);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.updateCartItem(itemId, quantity);
      set({ cart, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update quantity';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.removeFromCart(itemId);
      set({ cart, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove item';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      await cartService.clearCart();
    } catch (error: unknown) {
      console.warn('Failed to clear cart on server, it may have already been converted/cleared:', error);
    } finally {
      // Always clear local state even if server request fails
      set({ cart: null, isLoading: false });
    }
  },

  applyCoupon: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const result = await cartService.applyCoupon(code);
      // Refresh cart to get updated totals
      const cart = await cartService.getCart();
      set({ cart, isLoading: false });
      return result.message;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid coupon code';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeCoupon: async () => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.removeCoupon();
      set({ cart, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove coupon';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setAddresses: async (shippingId, billingId) => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.setAddresses(shippingId, billingId);
      set({ cart, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to set addresses';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getItemCount: () => {
    const { cart } = get();
    return cart?.itemCount || 0;
  },

  getSubtotal: () => {
    const { cart } = get();
    return cart ? parseFloat(cart.subtotal) : 0;
  },

  getTotal: () => {
    const { cart } = get();
    return cart ? parseFloat(cart.total) : 0;
  },

  getItemByProductId: (productId) => {
    const { cart } = get();
    return cart?.items.find(item => item.productId === productId);
  },
}));
