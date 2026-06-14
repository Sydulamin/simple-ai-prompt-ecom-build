import { Link } from 'react-router-dom';
import { Package, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg">ShopWave</span>
            </div>
            <p className="text-sm leading-relaxed">
              Bangladesh's cleanest online store. Fresh finds, fast delivery, and genuine products only.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/products', label: 'All Products' },
                { to: '/products?category=electronics', label: 'Electronics' },
                { to: '/products?category=fashion', label: 'Fashion' },
                { to: '/products?category=home-living', label: 'Home & Living' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              {['Track Order', 'Returns', 'FAQ', 'Contact Us'].map((item) => (
                <li key={item}>
                  <span className="hover:text-white cursor-pointer transition-colors">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-brand-400 flex-shrink-0" />
                <span>01700-000000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-brand-400 flex-shrink-0" />
                <span>support@shopwave.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row
                        items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} ShopWave. All rights reserved.</p>
          <p>Payments: COD · bKash · SSLCommerz</p>
        </div>
      </div>
    </footer>
  );
}
