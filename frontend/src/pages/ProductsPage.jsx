import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard.jsx';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton.jsx';
import { useGetProductsQuery, useGetCategoriesQuery } from '../store/apiSlice.js';

const SORT_OPTIONS = [
  { label: 'Newest',        value: 'created_at-DESC' },
  { label: 'Price: Low-High', value: 'price-ASC' },
  { label: 'Price: High-Low', value: 'price-DESC' },
  { label: 'Name A–Z',      value: 'name-ASC' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const category    = searchParams.get('category')    || '';
  const subcategory = searchParams.get('subcategory') || '';
  const search      = searchParams.get('search')      || '';
  const featured    = searchParams.get('featured')    || '';
  const sort        = searchParams.get('sort')        || 'created_at';
  const order       = searchParams.get('order')       || 'DESC';
  const page        = parseInt(searchParams.get('page')) || 1;

  const { data: productsRes, isLoading: loading } = useGetProductsQuery({
    page, limit: 20, sort, order,
    ...(category && { category }),
    ...(subcategory && { subcategory }),
    ...(search && { search }),
    ...(featured && { featured }),
  });

  const { data: categoriesRes } = useGetCategoriesQuery();

  const products = productsRes?.products || [];
  const meta = {
    total: productsRes?.total || 0,
    page: productsRes?.page || 1,
    pages: productsRes?.pages || 1,
  };
  const categories = categoriesRes?.categories || [];

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = !!(category || subcategory || search || featured);

  const currentSortValue = `${sort}-${order}`;
  const handleSortChange = (e) => {
    const [s, o] = e.target.value.split('-');
    const next = new URLSearchParams(searchParams);
    next.set('sort', s);
    next.set('order', o);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : category ? `Category: ${category}` : 'All Products'}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">{meta.total} products found</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-red-500 text-xs gap-1">
              <X size={14} /> Clear filters
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="btn-outline gap-2 sm:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-gray-500 hidden sm:block">Sort:</label>
            <div className="relative">
              <select
                id="sort-select"
                value={currentSortValue}
                onChange={handleSortChange}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg
                           bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar filters ───────────────────────────── */}
        <aside
          className={`w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} sm:block`}
          aria-label="Product filters"
        >
          <div className="card p-4 sticky top-20">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Categories</h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setParam('category', '')}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
                              ${!category ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Products
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setParam('category', cat.slug)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
                                ${category === cat.slug ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                  {/* Subcategories */}
                  {category === cat.slug && cat.subcategories?.length > 0 && (
                    <ul className="pl-3 mt-1 space-y-0.5">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <button
                            onClick={() => setParam('subcategory', sub.slug)}
                            className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors
                                        ${subcategory === sub.slug ? 'text-brand-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {sub.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Product Grid ──────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.length === 0
              ? (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-400 text-lg">No products found.</p>
                  <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
                </div>
              )
              : products.map((p) => <ProductCard key={p.id} product={p} />)
            }
          </div>

          {/* Pagination */}
          {!loading && meta.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: meta.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', p);
                    setSearchParams(next);
                  }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                              ${p === meta.page
                                ? 'bg-brand-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === meta.page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
