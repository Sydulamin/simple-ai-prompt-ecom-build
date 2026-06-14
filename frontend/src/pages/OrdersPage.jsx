import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, FileText } from 'lucide-react';
import api from '../utils/api.js';
import { formatPrice, formatDate } from '../utils/formatters.js';

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-600',
};

const downloadInvoice = async (orderId, e) => {
  e.stopPropagation(); // Prevent link click
  try {
    const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
  }
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then((res) => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-32 rounded mb-3" />
              <div className="skeleton h-5 w-48 rounded mb-2" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-1">No orders yet</p>
          <p className="text-sm text-gray-400 mb-6">When you place orders, they'll appear here.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card p-5 block hover:shadow-md transition-all hover:-translate-y-px"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                    <span className={`badge text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                    <span className="mx-2 text-gray-300">·</span>
                    <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span>
                    <span className="mx-2 text-gray-300">·</span>
                    <span className="capitalize text-gray-500">{order.payment_method}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={(e) => downloadInvoice(order.id, e)}
                    className="btn-outline btn-sm"
                    style={{ padding: '0.375rem 0.75rem' }}
                  >
                    <FileText size={14} />
                  </button>
                  <span className={`badge text-xs ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : order.payment_status === 'failed'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
