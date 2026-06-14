import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, AlertTriangle, Activity } from 'lucide-react';
import api from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import RevenueChart from '../../components/admin/RevenueChart.jsx';

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics;

  const METRIC_CARDS = metrics ? [
    {
      label:  'Total Revenue',
      value:  formatPrice(metrics.total_revenue),
      icon:   TrendingUp,
      color:  'text-green-600',
      bg:     'bg-green-50',
    },
    {
      label:  'Total Orders',
      value:  metrics.total_orders.toLocaleString(),
      icon:   ShoppingBag,
      color:  'text-blue-600',
      bg:     'bg-blue-50',
    },
    {
      label:  'Active Orders',
      value:  metrics.active_orders.toLocaleString(),
      icon:   Activity,
      color:  'text-brand-600',
      bg:     'bg-brand-50',
    },
    {
      label:  'Low Stock Items',
      value:  metrics.low_stock_count.toLocaleString(),
      icon:   AlertTriangle,
      color:  metrics.low_stock_count > 0 ? 'text-amber-600' : 'text-gray-400',
      bg:     metrics.low_stock_count > 0 ? 'bg-amber-50' : 'bg-gray-50',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your store</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-10 w-10 rounded-xl mb-3" />
                <div className="skeleton h-6 w-20 rounded mb-1" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))
          : METRIC_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card p-5">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
              </div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3">
                    <div className="skeleton h-4 flex-1 rounded" />
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))
              : (data?.recent_orders || []).map((order) => (
                  <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-800">{order.order_number}</span>
                      <span className="text-gray-400 text-xs ml-2">{order.shipping_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                      <span className="font-medium text-gray-900 text-xs">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Low Stock Alert</h2>
            <Link to="/admin/products" className="text-xs text-brand-600 hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3">
                    <div className="skeleton h-4 flex-1 rounded" />
                    <div className="skeleton h-4 w-10 rounded" />
                  </div>
                ))
              : (data?.low_stock_products || []).length === 0
              ? (
                  <div className="px-5 py-6 text-center text-sm text-gray-400">
                    All products are well-stocked
                  </div>
                )
              : (data?.low_stock_products || []).map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700 font-medium truncate">{p.name}</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full
                                      ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.stock === 0 ? 'SOLD OUT' : `${p.stock} left`}
                    </span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
