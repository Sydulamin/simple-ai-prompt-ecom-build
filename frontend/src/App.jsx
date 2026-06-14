import { Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';

import { loadCartFromStorage } from './store/cartSlice.js';
import { fetchMe } from './store/authSlice.js';

// Always-loaded layout/auth components (tiny, needed immediately)
import Layout       from './components/layout/Layout.jsx';
import AdminLayout  from './components/layout/AdminLayout.jsx';
import RequireAdmin from './components/auth/RequireAdmin.jsx';
import RequireAuth  from './components/auth/RequireAuth.jsx';

// ── Lazy-load all pages ───────────────────────────────────────────────────────
// Public pages
const HomePage           = lazy(() => import('./pages/HomePage.jsx'));
const ProductsPage       = lazy(() => import('./pages/ProductsPage.jsx'));
const ProductDetailPage  = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage           = lazy(() => import('./pages/CartPage.jsx'));
const LoginPage          = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage.jsx'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage.jsx'));
const PaymentFailedPage  = lazy(() => import('./pages/PaymentFailedPage.jsx'));
const PaymentPortalPage  = lazy(() => import('./pages/PaymentPortalPage.jsx'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage.jsx'));

// Protected user pages
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrdersPage      = lazy(() => import('./pages/OrdersPage.jsx'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage.jsx'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage.jsx'));

// Admin pages (large — only loaded when user navigates to /admin/*)
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminInventory   = lazy(() => import('./pages/admin/AdminInventory.jsx'));
const AdminCoupons     = lazy(() => import('./pages/admin/AdminCoupons.jsx'));
const AdminProducts    = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminAddProduct  = lazy(() => import('./pages/admin/AdminAddProduct.jsx'));
const AdminEditProduct = lazy(() => import('./pages/admin/AdminEditProduct.jsx'));
const AdminOrders      = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail.jsx'));
const AdminCategories  = lazy(() => import('./pages/admin/AdminCategories.jsx'));

// ── Minimal fallback shown while a lazy chunk loads ───────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" aria-label="Loading page">
      <div className="w-8 h-8 border-[3px] border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadCartFromStorage());
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public store layout ─────────────────────────────────── */}
        <Route element={<Layout />}>
          <Route path="/"               element={<HomePage />} />
          <Route path="/products"       element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/cart"           element={<CartPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed"  element={<PaymentFailedPage />} />
          <Route path="/payment/portal"  element={<PaymentPortalPage />} />

          {/* Protected user routes */}
          <Route element={<RequireAuth />}>
            <Route path="/checkout"      element={<CheckoutPage />} />
            <Route path="/orders"        element={<OrdersPage />} />
            <Route path="/orders/:id"    element={<OrderDetailPage />} />
            <Route path="/profile"       element={<ProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Layout */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"               element={<AdminDashboard />} />
              <Route path="/admin/inventory"     element={<AdminInventory />} />
              <Route path="/admin/coupons"       element={<AdminCoupons />} />
              <Route path="/admin/products"      element={<AdminProducts />} />
              <Route path="/admin/products/new"  element={<AdminAddProduct />} />
              <Route path="/admin/products/:id/edit" element={<AdminEditProduct />} />
              <Route path="/admin/orders"        element={<AdminOrders />} />
              <Route path="/admin/orders/:id"    element={<AdminOrderDetail />} />
              <Route path="/admin/categories"    element={<AdminCategories />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
