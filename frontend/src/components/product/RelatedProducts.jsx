import { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import ProductCard from './ProductCard.jsx';
import ProductCardSkeleton from './ProductCardSkeleton.jsx';

export default function RelatedProducts({ categorySlug, currentProductId }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!categorySlug) return;
    api.get(`/products?category=${categorySlug}&limit=4`)
      .then((res) => {
        // Exclude current product
        const filtered = (res.data.products || []).filter((p) => p.id !== currentProductId);
        setProducts(filtered.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug, currentProductId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-14 border-t border-gray-100 pt-10" aria-label="Related products">
      <h2 className="text-xl font-bold text-gray-900 mb-5">You May Also Like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </section>
  );
}
