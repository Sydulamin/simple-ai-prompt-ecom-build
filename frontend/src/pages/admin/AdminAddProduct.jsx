import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, ChevronDown } from 'lucide-react';
import api from '../../utils/api.js';

export default function AdminAddProduct() {
  const navigate = useNavigate();

  const [categories,    setCategories]    = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubs,   setLoadingSubs]   = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [dragOver,      setDragOver]      = useState(false);
  const [imageFiles,    setImageFiles]    = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [form, setForm] = useState({
    name: '', description: '', short_description: '',
    price: '', compare_price: '', cost_price: '',
    sku: '', stock: '', low_stock_threshold: '5',
    category_id: '', subcategory_id: '',
    tags: '', is_featured: false, weight_gram: '', meta_title: '', meta_description: '',
  });

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  // Dependent dropdown — fetch subcategories when category changes
  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([]);
      return;
    }
    setLoadingSubs(true);
    api.get(`/categories/${form.category_id}/subcategories`)
      .then((res) => setSubcategories(res.data.subcategories))
      .catch(() => setSubcategories([]))
      .finally(() => setLoadingSubs(false));
  }, [form.category_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = useCallback((files) => {
    const arr = Array.from(files).slice(0, 10);
    setImageFiles(arr);
    setImagePreviews(arr.map((f) => URL.createObjectURL(f)));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImages(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) fd.append(key, val);
      });
      imageFiles.forEach((file) => fd.append('images', file));

      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Add Product</h1>
        <p className="text-sm text-gray-500">Fill in the details below to add a new product</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input name="name" required value={form.name} onChange={handleChange} className="input" placeholder="e.g. Samsung Galaxy S24 Ultra" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input name="short_description" value={form.short_description} onChange={handleChange} className="input" placeholder="One-line highlight" maxLength={500} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <textarea name="description" rows={5} value={form.description} onChange={handleChange} className="input resize-none" placeholder="Detailed product description…" />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Pricing & Inventory</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (৳) *</label>
              <input name="price" type="number" required min="0" step="0.01" value={form.price} onChange={handleChange} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (৳)</label>
              <input name="compare_price" type="number" min="0" step="0.01" value={form.compare_price} onChange={handleChange} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (৳)</label>
              <input name="cost_price" type="number" min="0" step="0.01" value={form.cost_price} onChange={handleChange} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} className="input" placeholder="SKU-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input name="stock" type="number" required min="0" value={form.stock} onChange={handleChange} className="input" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
              <input name="low_stock_threshold" type="number" min="1" value={form.low_stock_threshold} onChange={handleChange} className="input" placeholder="5" />
            </div>
          </div>
        </div>

        {/* Category — dependent dropdowns */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <div className="relative">
                <select
                  name="category_id"
                  required
                  value={form.category_id}
                  onChange={(e) => { handleChange(e); setForm((prev) => ({ ...prev, subcategory_id: '' })); }}
                  className="input appearance-none pr-8"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory {loadingSubs && <span className="text-xs text-gray-400">(loading…)</span>}
              </label>
              <div className="relative">
                <select
                  name="subcategory_id"
                  value={form.subcategory_id}
                  onChange={handleChange}
                  disabled={!form.category_id || loadingSubs}
                  className="input appearance-none pr-8 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">None</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Images — drag & drop zone → Sharp WebP pipeline */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Images</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                        ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => document.getElementById('image-upload').click()}
            role="button"
            tabIndex={0}
            aria-label="Upload images"
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('image-upload').click()}
          >
            <Upload size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Drag & drop images here, or <span className="text-brand-600 font-medium">browse</span></p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 10MB per file · Converted to WebP automatically</p>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImages(e.target.files)}
            />
          </div>

          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full
                               flex items-center justify-center hover:bg-red-600"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags & Meta */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Tags & SEO</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="input" placeholder="smartphone, samsung, 5g (comma separated)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input name="meta_title" value={form.meta_title} onChange={handleChange} className="input" placeholder="SEO page title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea name="meta_description" rows={2} value={form.meta_description} onChange={handleChange} className="input resize-none" placeholder="SEO meta description" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              name="is_featured"
              checked={form.is_featured}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-600 cursor-pointer"
            />
            <label htmlFor="is_featured" className="text-sm text-gray-700 cursor-pointer select-none">
              Mark as Featured Product
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
