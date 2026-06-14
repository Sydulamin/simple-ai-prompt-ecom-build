import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ArrowLeft, Loader2, FileText } from 'lucide-react';
import api from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { toast } from '../../hooks/useToast.js';

const ORDER_STATUSES   = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100  text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100   text-red-700',
  refunded:   'bg-gray-100  text-gray-600',
  paid:       'bg-green-100 text-green-700',
  failed:     'bg-red-100   text-red-700',
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

export default function AdminOrderDetail() {
  const { id }       = useParams();
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data.order))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (field, value) => {
    setUpdating(true);
    try {
      const res = await api.put(`/orders/admin/${id}/status`, { [field]: value });
      setOrder((prev) => ({ ...prev, ...res.data.order }));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Order not found.</p>
        <Link to="/admin/orders" className="btn-outline">← Back to Orders</Link>
      </div>
    );
  }

  const shipping = parseFloat(order.shipping_charge) || 0;
  const discount = parseFloat(order.discount) || 0;

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/orders" className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={() => downloadInvoice(order.id, order.order_number)} className="btn-outline gap-2">
            <FileText size={15} /> Download Invoice
          </button>
        </div>
      </div>

      {/* Status controls */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Order Status</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Order Status</label>
            <div className="relative">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange('status', e.target.value)}
                disabled={updating}
                className={`appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-xl border-0
                            cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500
                            disabled:opacity-60 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Status</label>
            <div className="relative">
              <select
                value={order.payment_status}
                onChange={(e) => handleStatusChange('payment_status', e.target.value)}
                disabled={updating}
                className={`appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-xl border-0
                            cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500
                            disabled:opacity-60 ${STATUS_COLORS[order.payment_status] || 'bg-gray-100 text-gray-600'}`}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
            </div>
          </div>
          <div className="flex items-end">
            <span className="text-sm text-gray-500 py-2">
              Payment: <span className="font-semibold text-gray-700 uppercase">{order.payment_method}</span>
              {order.gateway_trx_id && (
                <span className="ml-2 text-xs text-gray-400">TXN: {order.gateway_trx_id}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Order items */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">
              Items ({(order.items || []).length})
            </h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {(order.items || []).map((item) => (
              <li key={item.id} className="flex gap-4 px-5 py-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.product_name} loading="lazy"
                      className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                  {item.product_sku && <p className="text-xs text-gray-400">SKU: {item.product_sku}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-sm text-gray-900 flex-shrink-0">
                  {formatPrice(item.total_price)}
                </span>
              </li>
            ))}
          </ul>

          {/* Price breakdown */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>− {formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer + shipping */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Customer</h2>
            <p className="text-sm font-medium text-gray-800">{order.shipping_name}</p>
            <p className="text-sm text-gray-500">{order.shipping_phone}</p>
            {order.customer_email && (
              <p className="text-xs text-gray-400 mt-1 truncate">{order.customer_email}</p>
            )}
          </div>
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}{order.shipping_zip ? `, ${order.shipping_zip}` : ''}</p>
            </div>
          </div>
          {order.notes && (
            <div className="card p-4">
              <h2 className="font-semibold text-gray-800 text-sm mb-2">Notes</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
