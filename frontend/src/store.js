import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from './api';

// Initialize fingerprint
const fpPromise = FingerprintJS.load();

export const getFingerprint = async () => {
  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId;
};





export const useStore = create(
  persist(
    (set, get) => ({
      // Cart state
      userFingerprint: null,
      setUserFingerprint: (fp) => set({ userFingerprint: fp }),
      cart: [],
      
      // Products and Categories state
      products: [],
      categories: [],
      selectedCategory: null,
      
      // Admin authentication
      isAdmin: false,
      adminToken: null,
      adminUser: null,
      
      // Set products
      setProducts: (products) => set({ products }),
      
      // Set categories
      setCategories: (categories) => set({ categories }),
      
      // Set selected category
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      // User info
      userInfo: {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
      },

      // Set user info
      setUserInfo: (info) => set({ userInfo: info }),

      // Admin login (NEW - API-based)
      login: async (credentials) => {
        try {
          const response = await api.post('/admin/login/', credentials);
          
          if (response.data.success) {
            set({ 
              isAdmin: true,
              adminToken: response.data.token,
              adminUser: response.data.user
            });
            
            // Store token in localStorage for API calls
            localStorage.setItem('adminToken', response.data.token);
            
            return { success: true };
          }
          
          return { success: false, error: 'Login failed' };
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            error: error.response?.data?.error || 'Login failed' 
          };
        }
      },

      // Admin logout
      logout: () => {
        localStorage.removeItem('adminToken');
        set({ 
          isAdmin: false,
          adminToken: null,
          adminUser: null
        });
      },

      // Check if admin is authenticated
      isAdminAuthenticated: () => get().isAdmin,

      // Verify admin token (on app load)
      verifyAdmin: async () => {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          set({ isAdmin: false, adminToken: null, adminUser: null });
          return false;
        }
        
        try {
          const response = await api.get('/admin/verify/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            set({ 
              isAdmin: true,
              adminToken: token,
              adminUser: response.data.user
            });
            return true;
          }
          
          get().logout();
          return false;
        } catch (error) {
          console.error('Token verification failed:', error);
          get().logout();
          return false;
        }
      },

      // Change admin password (NEW - API-based)
      changePassword: async (currentPassword, newPassword) => {
        const adminUser = get().adminUser;
        
        if (!adminUser) {
          return { success: false, error: 'Not authenticated' };
        }
        
        try {
          const response = await api.post('/admin/change-password/', {
            username: adminUser.username,
            current_password: currentPassword,
            new_password: newPassword
          });
          
          if (response.data.success) {
            return { success: true, message: response.data.message };
          }
          
          return { success: false, error: 'Password change failed' };
        } catch (error) {
          console.error('Password change error:', error);
          return { 
            success: false, 
            error: error.response?.data?.error || error.response?.data?.errors || 'Password change failed' 
          };
        }
      },

      // Add to cart
      addToCart: (product, size, quantity = 1) => {
        const cart = get().cart;
        const existingItemIndex = cart.findIndex(
          (item) => item.product.id === product.id && item.size === size
        );

        if (existingItemIndex > -1) {
          const newCart = [...cart];
          newCart[existingItemIndex].quantity += quantity;
          set({ cart: newCart });
        } else {
          set({ cart: [...cart, { product, size, quantity }] });
        }
      },

      // Remove from cart
      removeFromCart: (productId, size) => {
        set({
          cart: get().cart.filter(
            (item) => !(item.product.id === productId && item.size === size)
          ),
        });
      },

      // Update quantity
      updateQuantity: (productId, size, quantity) => {
        const cart = get().cart;
        const itemIndex = cart.findIndex(
          (item) => item.product.id === productId && item.size === size
        );

        if (itemIndex > -1) {
          const newCart = [...cart];
          newCart[itemIndex].quantity = quantity;
          set({ cart: newCart });
        }
      },

      // Clear cart
      clearCart: () => set({ cart: [] }),

      // Cart total
      cartTotal: () => {
        return get()
          .cart.reduce(
            (total, item) => total + item.product.price * item.quantity,
            0
          )
          .toFixed(2);
      },

    // Cart count
    cartCount: () => {
      return get().cart.reduce((count, item) => count + item.quantity, 0);
    },

  // Request password change (sends email)
requestPasswordChange: async (currentPassword) => {
  const adminUser = get().adminUser;
  
  console.log('='.repeat(50));
  console.log('REQUEST PASSWORD CHANGE');
  console.log('adminUser:', adminUser);
  console.log('currentPassword:', currentPassword ? '***' : 'MISSING');
  
  if (!adminUser) {
    console.log(' Not authenticated - no adminUser');
    return { success: false, error: 'Not authenticated' };
  }
  
  const requestData = {
    username: adminUser.username,
    current_password: currentPassword
  };
  
  console.log('Request data:', requestData);
  
  try {
    console.log('Sending POST to /admin/request-password-change/');
    const response = await api.post('/admin/request-password-change/', requestData);
    
    console.log(' Response:', response.data);
    
    if (response.data.success) {
      return { 
        success: true, 
        message: response.data.message,
        email: response.data.email
      };
    }
    
    return { success: false, error: 'Request failed' };
  } catch (error) {
    console.error(' Password change request error:', error);
    console.error('Error response:', error.response?.data);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Request failed' 
    };
  }
},
    // Verify code and change password
    verifyAndChangePassword: async (currentPassword, newPassword, verificationCode) => {
      const adminUser = get().adminUser;

      if (!adminUser) {
        return { success: false, error: "Not authenticated" };
      }

      try {
        const response = await api.post('/admin/verify-change-password/', {
          username: adminUser.username,
          current_password: currentPassword,
          new_password: newPassword,
          verification_code: verificationCode
        });

        if (response.data.success) {
          return { success: true, message: response.data.message };
        }
        return { success: false, error: "Verification failed" };
      } catch (error) {
        console.error('Verification error:', error);
        return { success: false, error: error.response?.data?.error || error.response?.data?.errors || 'Verification failed' };
      }
    },
  }),
  {
    name: 'femme-store',
    partialize: (state) => ({
      cart: state.cart,
      userInfo: state.userInfo,
      isAdmin: state.isAdmin,
      adminToken: state.adminToken,
      adminUser: state.adminUser,
    }),
  }
));