import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Star } from 'lucide-react';
import { addToCart } from '../../store/cartSlice.js';
import { formatPrice, discountPercent } from '../../utils/formatters.js';
import { toast } from '../../hooks/useToast.js';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const pct      = discountPercent(product.price, product.compare_price);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name.slice(0, 40)}… added to cart`);
  };

  return (
    <article className="card group relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              loading="lazy"
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ShoppingCart size={36} className="text-gray-200" />
            </div>
          )}

          {pct > 0 && (
            <span className="absolute top-2 left-2 badge bg-red-500 text-white font-bold text-[11px]">
              -{pct}%
            </span>
          )}
          {product.is_featured && (
            <span className="absolute top-2 right-2 badge bg-amber-400 text-amber-900 text-[10px]">
              <Star size={9} className="mr-0.5" fill="currentColor" /> Featured
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="badge bg-gray-700 text-white text-xs">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {product.category_name && (
            <p className="text-[11px] text-brand-600 font-medium mb-0.5 uppercase tracking-wide truncate">
              {product.category_name}
            </p>
          )}
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="btn-primary w-full justify-center py-2 text-xs"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart size={13} />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
