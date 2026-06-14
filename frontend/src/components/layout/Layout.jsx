import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import CartDrawer from '../cart/CartDrawer.jsx';
import CategoryNav from '../ui/CategoryNav.jsx';
import ToastContainer from '../ui/ToastContainer.jsx';

// Show the category nav only on store-facing pages, not auth pages
const NO_CATNAV_PATHS = ['/login', '/register', '/checkout', '/payment'];

export default function Layout() {
  const { pathname } = useLocation();
  const showCatNav   = !NO_CATNAV_PATHS.some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showCatNav && <CategoryNav />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
}
