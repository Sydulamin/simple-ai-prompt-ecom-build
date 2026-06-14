import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FileText } from 'lucide-react';
import api from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { toast } from '../../hooks/useToast.js';

const ORDER_STATUSES   = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-600',
  paid:       'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
};

const downloadInvoice = async (orderId) => {
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

export default function AdminOrders() {
  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState('');
  const [payFilter,      setPayFilter]      = useState('');
  const [page,           setPage]           = useState(1);
  const [updatingId,     setUpdatingId]     = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 20,
        ...(statusFilter && { status: statusFilter }),
        ...(payFilter    && { payment_status: payFilter }),
      });
      const res = await api.get(`/orders/admin/all?${params}`);
      setOrders(res.data.orders);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, payFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, field, value) => {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/orders/admin/${orderId}/status`, { [field]: value });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, ...res.data.order } : o));
      toast.success('Order updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={payFilter} onChange={(e) => { setPayFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={7}>
                        <div className="skeleton h-5 w-full rounded" />
                      </td>
                    </tr>
                  ))
                : orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${order.id}`}
                          className="font-semibold text-brand-600 hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{order.customer_name || order.shipping_name}</p>
                        {order.customer_email && (
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{order.customer_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={order.payment_status}
                            onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                            disabled={updatingId === order.id}
                            className={`appearance-none text-xs font-medium rounded-full px-2.5 py-1 pr-6 border-0
                                        cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500
                                        ${STATUS_COLORS[order.payment_status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, 'status', e.target.value)}
                            disabled={updatingId === order.id}
                            className={`appearance-none text-xs font-medium rounded-full px-2.5 py-1 pr-6 border-0
                                        cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500
                                        ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => downloadInvoice(order.id)}
                          className="btn-outline btn-sm"
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
              }
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
