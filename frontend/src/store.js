import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from './api';

// Initialize fingerprint
let fingerprint = null;
const fpPromise = FingerprintJS.load();
fpPromise.then(fp => fp.get()).then(result => {
  fingerprint = result.visitorId;
});

export const getFingerprint = async () => {
  if (fingerprint) return fingerprint;
  const fp = await fpPromise;
  const result = await fp.get();
  fingerprint = result.visitorId;
  return fingerprint;
};

export const useStore = create(
  persist(
    (set, get) => ({
      // User tracking
      userFingerprint: null,
      userInfo: {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
      },

      // Admin authentication
      isAdmin: false,
      adminToken: null,

      // Cart
      cart: [],
      
      // Products
      products: [],
      categories: [],
      featuredProducts: [],
      
      // Filters
      selectedCategory: null,
      searchQuery: '',
      sortBy: 'newest',

      // UI State
      isCartOpen: false,
      isLoading: false,

      // Actions
      setUserFingerprint: (fp) => set({ userFingerprint: fp }),
      
      // Admin actions
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      setAdminToken: (token) => set({ adminToken: token }),
      logout: () => set({ isAdmin: false, adminToken: null }),
      
      setUserInfo: (info) => set({ userInfo: { ...get().userInfo, ...info } }),

      addToCart: async (product, size, quantity = 1) => {
        const cart = get().cart;
        const existingItem = cart.find(
          item => item.product.id === product.id && item.size === size
        );

        let newCart;
        if (existingItem) {
          newCart = cart.map(item =>
            item.product.id === product.id && item.size === size
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...cart, { product, size, quantity }];
        }

        set({ cart: newCart });

        // Sync with backend
        try {
          const fp = await getFingerprint();
          await api.post('/cart/', {
            fingerprint: fp,
            product_id: product.id,
            size,
            quantity,
          });
        } catch (error) {
          console.error('Failed to sync cart with backend:', error);
        }
      },

      removeFromCart: (productId, size) => {
        set({ cart: get().cart.filter(
          item => !(item.product.id === productId && item.size === size)
        )});
      },

      updateCartItemQuantity: (productId, size, quantity) => {
        set({
          cart: get().cart.map(item =>
            item.product.id === productId && item.size === size
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: async () => {
        set({ cart: [] });
        try {
          const fp = await getFingerprint();
          await api.post('/cart/clear/', { fingerprint: fp });
        } catch (error) {
          console.error('Failed to clear cart:', error);
        }
      },

      toggleCart: () => set({ isCartOpen: !get().isCartOpen }),

      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      setFeaturedProducts: (products) => set({ featuredProducts: products }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Computed
      cartTotal: () => {
        return get().cart.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      cartItemCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'womens-wear-storage',
      partialize: (state) => ({
        cart: state.cart,
        userInfo: state.userInfo,
        userFingerprint: state.userFingerprint,
        isAdmin: state.isAdmin,
        adminToken: state.adminToken,
      }),
    }
  )
);
