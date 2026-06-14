import { createSlice } from '@reduxjs/toolkit';

const CART_KEY = 'shopwave_cart';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    isOpen: false,
  },
  reducers: {
    loadCartFromStorage(state) {
      state.items = loadFromStorage();
    },
    addToCart(state, action) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock || 99);
      } else {
        state.items.push({
          id:          product.id,
          name:        product.name,
          slug:        product.slug,
          price:       parseFloat(product.price),
          thumbnail:   product.thumbnail,
          stock:       product.stock,
          quantity,
        });
      }
      saveToStorage(state.items);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      saveToStorage(state.items);
    },
    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== id);
        } else {
          item.quantity = Math.min(quantity, item.stock || 99);
        }
        saveToStorage(state.items);
      }
    },
    clearCart(state) {
      state.items = [];
      saveToStorage([]);
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    closeCart(state) {
      state.isOpen = false;
    },
  },
});

export const {
  loadCartFromStorage, addToCart, removeFromCart,
  updateQuantity, clearCart, toggleCart, closeCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems   = (state) => state.cart.items;
export const selectCartCount   = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartTotal   = (state) => state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartIsOpen  = (state) => state.cart.isOpen;

export default cartSlice.reducer;
