
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [toast, setToast] = useState(null);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      const res = await api.get(`/coupons?${params}`);
      setCoupons(res.data.coupons);
      setMeta({ total: res.data.total, pages: res.data.pages });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSave = async (couponData) => {
    try {
      // Normalize form data before sending
      const normalized = {
        ...couponData,
        value: parseFloat(couponData.value) || 0,
        min_order_value: parseFloat(couponData.min_order_value) || 0,
        max_discount: couponData.max_discount ? parseFloat(couponData.max_discount) : null,
        usage_limit: couponData.usage_limit ? parseInt(couponData.usage_limit) : null,
        usage_limit_per_user: couponData.usage_limit_per_user ? parseInt(couponData.usage_limit_per_user) : null,
        expires_at: couponData.expires_at || null,
        description: couponData.description || null,
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, normalized);
      } else {
        await api.post('/coupons', normalized);
      }
      setShowCreateModal(false);
      setEditingCoupon(null);
      await fetchCoupons();
      showToast(editingCoupon ? 'Coupon updated' : 'Coupon created');
    } catch (e) {
      showToast(e.response?.data?.message || 'Error saving coupon', 'error');
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to deactivate this coupon?')) return;
    try {
      await api.delete(`/coupons/${couponId}`);
      await fetchCoupons();
      showToast('Coupon deactivated');
    } catch (e) {
      showToast(e.response?.data?.message || 'Error deleting coupon', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">{meta.total} total coupons</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary gap-2 flex items-center">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search coupons..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Discount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Usage</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Expires</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-4">
                        <div className="skeleton h-5 w-full rounded" />
                      </td>
                    </tr>
                  ))
                : coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800 font-mono">{c.code}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{c.type}</td>
                      <td className="px-4 py-3">
                        {c.type === 'percentage'
                          ? `${c.value}% off${c.max_discount ? ` (max ${formatPrice(c.max_discount)})` : ''}`
                          : formatPrice(c.value) + ' off'}
                        {c.min_order_value > 0 && (
                          <span className="text-xs text-gray-400 block">Min order: {formatPrice(c.min_order_value)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.usage_count || 0} / {c.usage_limit || '∞'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {c.expires_at ? formatDate(c.expires_at) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingCoupon(c);
                              setShowCreateModal(true);
                            }}
                            className="btn-ghost p-1.5 text-gray-500 hover:text-brand-600"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="btn-ghost p-1.5 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && meta.pages > 1 && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
            {Array.from({ length: meta.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page ? 'bg-brand-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
          }}
          onSave={handleSave}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-brand-600'
            } text-white`}
          >
            {toast.type === 'error' ? <X size={20} /> : <CheckCircle2 size={20} />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function CouponFormModal({ coupon, onClose, onSave }) {
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: 0,
    min_order_value: 0,
    max_discount: '',
    usage_limit: '',
    usage_limit_per_user: '',
    expires_at: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (coupon) {
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_order_value: coupon.min_order_value || 0,
        max_discount: coupon.max_discount || '',
        usage_limit: coupon.usage_limit || '',
        usage_limit_per_user: coupon.usage_limit_per_user || '',
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
        description: coupon.description || '',
        is_active: coupon.is_active
      });
    } else {
      setForm({
        code: '',
        type: 'percentage',
        value: 0,
        min_order_value: 0,
        max_discount: '',
        usage_limit: '',
        usage_limit_per_user: '',
        expires_at: '',
        description: '',
        is_active: true
      });
    }
  }, [coupon]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full input"
                placeholder="e.g. SAVE20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full input"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                className="w-full input"
                placeholder={form.type === 'percentage' ? '20' : '100'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Value</label>
              <input
                type="number"
                value={form.min_order_value}
                onChange={(e) => setForm({ ...form, min_order_value: parseFloat(e.target.value) || 0 })}
                className="w-full input"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (optional)</label>
              <input
                type="number"
                value={form.max_discount}
                onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                className="w-full input"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                className="w-full input"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Per User</label>
              <input
                type="number"
                value={form.usage_limit_per_user}
                onChange={(e) => setForm({ ...form, usage_limit_per_user: e.target.value })}
                className="w-full input"
                placeholder="Unlimited"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full input"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full input"
                placeholder="Description..."
                rows={2}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg">Save</button>
        </div>
      </div>
    </div>
  );
}
