import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import api from '../../utils/api.js';

export default function CategoryNav() {
  const [categories,   setCategories]   = useState([]);
  const [openMenu,     setOpenMenu]     = useState(null);
  const [searchParams] = useSearchParams();
  const activeSlug     = searchParams.get('category') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);

  if (!categories.length) return null;

  return (
    <nav
      className="hidden md:block bg-white border-b border-gray-100"
      aria-label="Category navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ul className="flex items-center gap-0.5 h-10 overflow-x-auto scrollbar-none">

          <li>
            <Link
              to="/products"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                          ${!activeSlug ? 'text-brand-700 bg-brand-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              All
            </Link>
          </li>

          {categories.map((cat) => (
            <li
              key={cat.id}
              className="relative"
              onMouseEnter={() => setOpenMenu(cat.id)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg
                            transition-colors whitespace-nowrap
                            ${activeSlug === cat.slug
                              ? 'text-brand-700 bg-brand-50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {cat.name}
                {cat.subcategories?.length > 0 && (
                  <ChevronDown size={12} className="opacity-50" />
                )}
              </Link>

              {/* Dropdown */}
              {cat.subcategories?.length > 0 && openMenu === cat.id && (
                <div className="absolute left-0 top-full mt-0.5 bg-white border border-gray-100
                                rounded-xl shadow-lg py-1.5 min-w-[160px] z-40 animate-fade-in">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50
                                 hover:text-gray-900 transition-colors whitespace-nowrap"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
