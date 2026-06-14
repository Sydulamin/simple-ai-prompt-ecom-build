import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice.js';
import authReducer from './authSlice.js';
import { apiSlice } from './apiSlice.js';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
