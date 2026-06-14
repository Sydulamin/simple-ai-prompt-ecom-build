import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingCart, Search, User, LogOut, LayoutDashboard,
  Package, ChevronDown, X, Menu, UserCircle, ShoppingBag,
} from 'lucide-react';

import { toggleCart, selectCartCount } from '../../store/cartSlice.js';
import { selectUser, selectAuthLoading, logoutUser } from '../../store/authSlice.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import api from '../../utils/api.js';
import { formatPrice } from '../../utils/formatters.js';

const MOBILE_LINKS = [
  { to: '/products',              label: 'All Products' },
  { to: '/products?category=electronics', label: 'Electronics' },
  { to: '/products?category=fashion',     label: 'Fashion' },
  { to: '/products?category=home-living', label: 'Home & Living' },
  { to: '/products?category=sports-fitness', label: 'Sports' },
  { to: '/products?category=books',       label: 'Books' },
];

export default function Header() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const cartCount = useSelector(selectCartCount);
  const user      = useSelector(selectUser);
  const isAuthLoading = useSelector(selectAuthLoading);

  const [searchQuery,     setSearchQuery]     = useState('');
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [showUserMenu,    setShowUserMenu]    = useState(false);
  const [mobileOpen,      setMobileOpen]      = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchRef       = useRef(null);
  const userMenuRef     = useRef(null);

  // Typeahead
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    api.get(`/products/search?q=${encodeURIComponent(debouncedSearch)}&limit=6`)
      .then((res) => {
        setSuggestions(res.data.products || []);
        setShowSuggestions(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current  && !searchRef.current.contains(e.target))  setShowSuggestions(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setMobileOpen(false);
    }
  };

  const handleSuggestionClick = (slug) => {
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/products/${slug}`);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setShowUserMenu(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">ShopWave</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length && setShowSuggestions(true)}
                  placeholder="Search products…"
                  className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500
                             focus:bg-white transition-all"
                  aria-label="Search products"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            {/* Typeahead dropdown */}
            {showSuggestions && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100
                           rounded-xl shadow-lg py-1 z-50 animate-slide-up"
                role="listbox"
              >
                {searchLoading && (
                  <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
                )}
                {!searchLoading && suggestions.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                )}
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.slug)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                    role="option"
                  >
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        loading="lazy"
                        className="w-9 h-9 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-xs text-brand-600 font-semibold">{formatPrice(product.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">

            {/* Cart */}
            <button
              onClick={() => dispatch(toggleCart())}
              className="relative btn-ghost"
              aria-label={`Shopping cart, ${cartCount} items`}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-600
                                 text-white text-[10px] font-bold rounded-full flex items-center
                                 justify-center px-1 animate-fade-in">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* User dropdown (desktop) */}
            {isAuthLoading ? (
              <div className="w-8 h-8 hidden sm:flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-1.5 btn-ghost"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-700 text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-gray-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-100
                                 rounded-xl shadow-lg py-1 z-50 animate-slide-up">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <UserCircle size={15} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <ShoppingBag size={15} /> My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50">
                        <LayoutDashboard size={15} /> Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary hidden sm:inline-flex py-2 px-4 text-xs gap-1.5">
                <User size={14} /> Sign In
              </Link>
            )}

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="btn-ghost sm:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile slide-down menu ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

            {/* Nav links */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
              Categories
            </p>
            {MOBILE_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
              {isAuthLoading ? (
                <div className="flex justify-center py-2">
                  <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-700 text-sm font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                    <UserCircle size={16} /> My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                    <ShoppingBag size={16} /> My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-700 hover:bg-brand-50">
                      <LayoutDashboard size={16} /> Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link to="/login"    onClick={() => setMobileOpen(false)} className="btn-primary flex-1 justify-center">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 justify-center">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
