import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ShoppingCart, Minus, Plus, ChevronRight, Star,
  Truck, Shield, RefreshCw, Tag,
} from 'lucide-react';
import { useGetProductBySlugQuery } from '../store/apiSlice.js';
import { addToCart } from '../store/cartSlice.js';
import { formatPrice, discountPercent } from '../utils/formatters.js';
import { toast } from '../hooks/useToast.js';
import RelatedProducts from '../components/product/RelatedProducts.jsx';

export default function ProductDetailPage() {
  const { slug }     = useParams();
  const dispatch     = useDispatch();

  const { data, isLoading: loading } = useGetProductBySlugQuery(slug);
  const product = data?.product;

  const [quantity,  setQuantity]  = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added,     setAdded]     = useState(false);

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity }));
    toast.success(`${product.name.slice(0, 40)} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl" aria-hidden="true" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3 rounded" />
            <div className="skeleton h-8 w-full rounded" />
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-20 w-full rounded" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Product not found.</p>
        <Link to="/products" className="btn-primary">Back to Products</Link>
      </div>
    );
  }

  const pct    = discountPercent(product.price, product.compare_price);
  const images = product.images?.length ? product.images : [product.thumbnail].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-brand-600">Products</Link>
        {product.category_name && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${product.category_slug}`} className="hover:text-brand-600">
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium truncate max-w-[160px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

        {/* ── Images ──────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            <img
              src={images[activeImg] || '/placeholder.webp'}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors
                              ${activeImg === i ? 'border-brand-500' : 'border-transparent'}`}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={activeImg === i}
                >
                  <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ─────────────────────────────────────── */}
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="badge bg-brand-50 text-brand-700">
              {product.category_name}
            </span>
            {product.subcategory_name && (
              <span className="badge bg-gray-100 text-gray-600">
                {product.subcategory_name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
            )}
            {pct > 0 && (
              <span className="badge bg-red-100 text-red-700 font-bold">
                <Tag size={10} className="mr-0.5" /> {pct}% OFF
              </span>
            )}
          </div>

          {product.short_description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              {product.short_description}
            </p>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50
                               text-gray-600 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50
                               text-gray-600 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className={`btn-primary w-full justify-center py-3 text-base transition-all
                            ${added ? 'bg-green-600 hover:bg-green-600' : ''}`}
                aria-label={`Add ${quantity} of ${product.name} to cart`}
              >
                <ShoppingCart size={18} />
                {added ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
            {[
              { icon: Truck,     text: 'Fast Delivery' },
              { icon: Shield,    text: 'Secure Payment' },
              { icon: RefreshCw, text: '7-Day Returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 text-center">
                <Icon size={18} className="text-brand-500" />
                <span className="text-xs text-gray-500">{text}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/products?search=${tag}`}
                  className="badge bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors text-xs"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Full Description ──────────────────────────────── */}
      {product.description && (
        <div className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}

      {/* ── Related Products ──────────────────────────────── */}
      <RelatedProducts categorySlug={product.category_slug} currentProductId={product.id} />
    </div>
  );
}
