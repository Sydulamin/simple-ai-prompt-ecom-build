
import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    lowStock: false,
    page: 1,
    sort: 'stock',
    order: 'ASC',
    limit: 20,
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState([]);
  const [adjustForm, setAdjustForm] = useState({
    quantity: 1,
    reason: '',
  });
  const [toast, setToast] = useState(null);

  // Get inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== false) {
          params.set(key, String(value));
        }
      });
      
      const res = await api.get('/admin/inventory?' + params.toString());
      setProducts(res.data.products);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filters]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustForm.reason) {
      showToast('Please fill in a reason', 'error');
      return;
    }

    try {
      await api.post('/admin/inventory/adjust', {
        productId: selectedProduct.id,
        quantity: adjustForm.quantity,
        reason: adjustForm.reason,
      });

      showToast('Stock adjusted successfully');
      setAdjustModalOpen(false);
      setAdjustForm({ quantity: 1, reason: '' });
      setSelectedProduct(null);
      await fetchInventory();
    } catch (err) {
      showToast('Failed to adjust stock', 'error');
    }
  };

  const fetchMovements = async (productId) => {
    try {
      const res = await api.get(`/admin/inventory/${productId}/movements`);
      setStockMovements(res.data.movements);
    } catch (e) {
      showToast('Failed to load movements', 'error');
    }
  };

  const getStockStatus = (stock, threshold) => {
    if (stock === 0) return 'out';
    if (stock <= threshold) return 'low';
    return 'good';
  };

  const renderStatusBadge = (product) => {
    const status = getStockStatus(product.stock, product.low_stock_threshold);
    if (status === 'out') {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-semibold">Out of Stock</span>;
    }
    if (status === 'low') {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-semibold">Low Stock</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-semibold">In Stock</span>;
  };

  const getStockColor = (product) => {
    const status = getStockStatus(product.stock, product.low_stock_threshold);
    if (status === 'out') return 'text-red-600';
    if (status === 'low') return 'text-amber-600';
    return 'text-gray-800';
  };

  const getLowStockBtnClass = () => {
    if (filters.lowStock) {
      return 'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-amber-100 text-amber-700';
    }
    return 'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} />
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage stock levels and track inventory movements
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock, page: 1 })}
              className={getLowStockBtnClass()}
            >
              <Filter size={16} />
              Low Stock Only
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => setFilters({
                    ...filters,
                    sort: 'name',
                    order: filters.sort === 'name' && filters.order === 'ASC' ? 'DESC' : 'ASC',
                  })}
                >
                  <div className="flex items-center gap-2">
                    Product
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  SKU
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => setFilters({
                    ...filters,
                    sort: 'stock',
                    order: filters.sort === 'stock' && filters.order === 'ASC' ? 'DESC' : 'ASC',
                  })}
                >
                  <div className="flex items-center gap-2">
                    Stock
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 rounded skeleton" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.thumbnail || 'https://picsum.photos/seed/empty/48/48'}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.category_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                      {product.sku || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-bold ${getStockColor(product)}`}>
                        {product.stock}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        (Threshold: {product.low_stock_threshold})
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-800">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-4">
                      {renderStatusBadge(product)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustForm({ quantity: 1, reason: '' });
                            setAdjustModalOpen(true);
                          }}
                          className="p-1.5 rounded text-brand-600 hover:bg-brand-50"
                          title="Adjust Stock"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            fetchMovements(product.id);
                            setMovementModalOpen(true);
                          }}
                          className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
                          title="View Movements"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Showing {((filters.page - 1) * filters.limit + 1)} - {Math.min(filters.page * filters.limit, total)} of {total}
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm">
                Page {filters.page} of {pages}
              </span>
              <button
                disabled={filters.page >= pages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Adjust Stock</h3>
                <button
                  onClick={() => setAdjustModalOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProduct.name}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="text-2xl font-bold text-gray-900 ml-auto">
                    {selectedProduct.stock}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Adjustment</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdjustForm({
                        ...adjustForm,
                        quantity: adjustForm.quantity - 1,
                      })}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={adjustForm.quantity}
                      onChange={(e) => setAdjustForm({
                        ...adjustForm,
                        quantity: parseInt(e.target.value) || 0,
                      })}
                      className="w-20 text-center py-2 border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => setAdjustForm({
                        ...adjustForm,
                        quantity: adjustForm.quantity + 1,
                      })}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    New stock: {selectedProduct.stock + adjustForm.quantity}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg mt-1"
                  placeholder="e.g., Restocked from supplier"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {movementModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Stock Movements</h3>
                <button
                  onClick={() => setMovementModalOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProduct.name}
              </p>
            </div>

            <div className="p-5">
              {stockMovements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No stock movements recorded
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stockMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="p-3 rounded-lg border border-gray-100 flex items-start gap-3"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          movement.type === 'in'
                            ? 'bg-green-100 text-green-700'
                            : movement.type === 'out'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {movement.type === 'in' ? (
                          <Plus size={16} />
                        ) : movement.type === 'out' ? (
                          <Minus size={16} />
                        ) : (
                          <ArrowUpDown size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {movement.type === 'in'
                              ? 'Stock In'
                              : movement.type === 'out'
                              ? 'Stock Out'
                              : 'Adjustment'}
                            {' '}
                            <span
                              className={
                                movement.type === 'in'
                                  ? 'text-green-700'
                                  : movement.type === 'out'
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }
                            >
                              +{movement.quantity}
                            </span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(movement.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {movement.reason}
                        </p>
                        <p className="text-xs text-gray-400">
                          {movement.previous_stock} → {movement.new_stock}
                          {movement.created_by_name
                            ? ` • By ${movement.created_by_name}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-brand-600'
            } text-white`}
          >
            {toast.type === 'error' ? (
              <XCircle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
