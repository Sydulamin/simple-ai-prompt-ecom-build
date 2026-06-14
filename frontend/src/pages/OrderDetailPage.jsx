import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Package, FileText } from 'lucide-react';
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

const PAY_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  paid:     'bg-green-100 text-green-700',
  failed:   'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const downloadInvoice = async (orderId, orderNumber) => {
  try {
    const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ShopWave-Invoice-${orderNumber || orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
  }
};

export default function OrderDetailPage() {
  const { id }     = useParams();
  const [order,    setOrder]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data.order))
      .catch((err) => setError(err.response?.data?.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="card p-5 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-5 w-full rounded" />)}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">{error || 'Order not found'}</p>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  const shipping = parseFloat(order.shipping_charge) || 0;
  const subtotal = parseFloat(order.subtotal) || 0;
  const discount = parseFloat(order.discount) || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
        <Link to="/orders" className="hover:text-brand-600">My Orders</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">{order.order_number}</span>
      </nav>

      <div className="space-y-5">
        {/* Order header */}
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{order.order_number}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Placed on {formatDate(order.created_at)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span className={`badge ${PAY_COLORS[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                Payment: {order.payment_status}
              </span>
              <span className="badge bg-gray-100 text-gray-600">
                {order.payment_method.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Items Ordered</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {(order.items || []).map((item) => (
              <li key={item.id} className="flex gap-4 px-5 py-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.product_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                  {item.product_sku && (
                    <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatPrice(item.total_price)}</p>
                  <p className="text-xs text-gray-400">{formatPrice(item.unit_price)} each</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Shipping address */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">{order.shipping_name}</p>
              <p>{order.shipping_phone}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}{order.shipping_zip ? `, ${order.shipping_zip}` : ''}</p>
            </div>
          </div>

          {/* Price summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Order Summary</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={shipping === 0 ? 'text-green-600' : ''}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => downloadInvoice(order.id, order.order_number)} className="btn-outline gap-2">
            <FileText size={15} /> Download Invoice
          </button>
          <Link to="/orders" className="btn-outline gap-2">
            <Package size={15} /> All Orders
          </Link>
          <Link to="/products" className="btn-primary gap-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
