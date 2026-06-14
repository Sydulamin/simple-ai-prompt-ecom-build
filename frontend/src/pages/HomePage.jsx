import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, RefreshCw } from 'lucide-react';
import api from '../utils/api.js';
import ProductCard from '../components/product/ProductCard.jsx';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton.jsx';

const FEATURES = [
  { icon: Truck,     title: 'Free Delivery',    desc: 'On orders over ৳3,000' },
  { icon: Shield,    title: 'Secure Payment',   desc: 'bKash · SSLCommerz · COD' },
  { icon: RefreshCw, title: 'Easy Returns',     desc: '7-day hassle-free returns' },
  { icon: Zap,       title: 'Fast Delivery',    desc: 'Same-day Dhaka delivery' },
];

const HERO_CATEGORIES = [
  { name: 'Electronics',   slug: 'electronics',    emoji: '📱', color: 'from-blue-50 to-blue-100',   border: 'border-blue-200' },
  { name: 'Fashion',       slug: 'fashion',         emoji: '👕', color: 'from-pink-50 to-pink-100',   border: 'border-pink-200' },
  { name: 'Home & Living', slug: 'home-living',     emoji: '🏠', color: 'from-green-50 to-green-100', border: 'border-green-200' },
  { name: 'Sports',        slug: 'sports-fitness',  emoji: '🏋️', color: 'from-orange-50 to-orange-100', border: 'border-orange-200' },
  { name: 'Books',         slug: 'books',           emoji: '📚', color: 'from-purple-50 to-purple-100', border: 'border-purple-200' },
];

export default function HomePage() {
  const [featured,        setFeatured]        = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [newArrivals,     setNewArrivals]     = useState([]);
  const [loadingNew,      setLoadingNew]      = useState(true);

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then((res) => setFeatured(res.data.products))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));

    api.get('/products?limit=8&sort=created_at&order=DESC')
      .then((res) => setNewArrivals(res.data.products))
      .catch(() => {})
      .finally(() => setLoadingNew(false));
  }, []);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-brand-200 text-sm font-medium mb-4">
              <Zap size={14} fill="currentColor" /> New arrivals every week
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Fresh Finds,<br />
              <span className="text-brand-200">Fast Delivery.</span>
            </h1>
            <p className="text-brand-100 text-lg mb-8 max-w-lg">
              Bangladesh's cleanest online store. Genuine products, verified sellers, and same-day delivery in Dhaka.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 bg-white text-brand-700
                                              font-semibold px-6 py-3 rounded-xl hover:bg-brand-50
                                              transition-colors shadow-sm">
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link to="/products?featured=true" className="inline-flex items-center gap-2 bg-white/10
                                                            text-white font-semibold px-6 py-3 rounded-xl
                                                            hover:bg-white/20 transition-colors border border-white/20">
                Featured Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white" aria-label="Store features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── Category Grid ─────────────────────────────────────────────── */}
        <section aria-label="Shop by category">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-sm text-brand-600 hover:underline font-medium flex items-center gap-1">
              All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {HERO_CATEGORIES.map(({ name, slug, emoji, color, border }) => (
              <Link
                key={slug}
                to={`/products?category=${slug}`}
                className={`bg-gradient-to-br ${color} ${border} border rounded-2xl p-4 text-center
                            hover:shadow-md transition-shadow group`}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{emoji}</div>
                <p className="text-sm font-semibold text-gray-800">{name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Products ─────────────────────────────────────────── */}
        <section aria-label="Featured products">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products?featured=true" className="text-sm text-brand-600 hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loadingFeatured
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p) => <ProductCard key={p.id} product={p} />)
            }
          </div>
        </section>

        {/* ── New Arrivals ──────────────────────────────────────────────── */}
        <section aria-label="New arrivals">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">New Arrivals</h2>
            <Link to="/products?sort=created_at&order=DESC" className="text-sm text-brand-600 hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loadingNew
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : newArrivals.map((p) => <ProductCard key={p.id} product={p} />)
            }
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12
                            text-white text-center" aria-label="Promotional banner">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Get 10% Off Your First Order
          </h2>
          <p className="text-gray-300 mb-6">Sign up today and unlock exclusive deals</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600
                                          text-white font-semibold px-7 py-3 rounded-xl transition-colors">
            Create Account <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
