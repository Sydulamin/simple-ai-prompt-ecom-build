import { useState, useEffect } from 'react';
import { Plus, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../utils/api.js';

export default function AdminCategories() {
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [subs,        setSubs]        = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Forms
  const [catForm,   setCatForm]   = useState({ name: '', description: '' });
  const [subForm,   setSubForm]   = useState({ name: '', description: '' });
  const [catError,  setCatError]  = useState('');
  const [subError,  setSubError]  = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [subSaving, setSubSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelectCategory = async (cat) => {
    setSelected(cat);
    setLoadingSubs(true);
    api.get(`/categories/${cat.id}/subcategories`)
      .then((res) => setSubs(res.data.subcategories))
      .catch(() => setSubs([]))
      .finally(() => setLoadingSubs(false));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    setCatSaving(true);
    try {
      const res = await api.post('/categories', catForm);
      setCategories((prev) => [...prev, res.data.category]);
      setCatForm({ name: '', description: '' });
    } catch (err) {
      setCatError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubError('');
    setSubSaving(true);
    try {
      const res = await api.post(`/categories/${selected.id}/subcategories`, subForm);
      setSubs((prev) => [...prev, res.data.subcategory]);
      setSubForm({ name: '', description: '' });
    } catch (err) {
      setSubError(err.response?.data?.message || 'Failed to create subcategory');
    } finally {
      setSubSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Categories</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Categories */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Add Category</h2>
            {catError && <p className="text-sm text-red-600 mb-3">{catError}</p>}
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input
                required value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="input" placeholder="Category name" />
              <input
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                className="input" placeholder="Description (optional)" />
              <button type="submit" disabled={catSaving} className="btn-primary w-full justify-center">
                {catSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {catSaving ? 'Adding…' : 'Add Category'}
              </button>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Categories ({categories.length})
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-9 w-full rounded-lg" />)}
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left
                                  transition-colors hover:bg-gray-50
                                  ${selected?.id === cat.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">{cat.name}</span>
                      <ChevronRight size={15} className="text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Subcategories */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="card p-5">
                <h2 className="font-semibold text-gray-800 mb-1">
                  Add Subcategory
                </h2>
                <p className="text-xs text-gray-500 mb-4">under <span className="font-medium">{selected.name}</span></p>
                {subError && <p className="text-sm text-red-600 mb-3">{subError}</p>}
                <form onSubmit={handleAddSubcategory} className="space-y-3">
                  <input required value={subForm.name}
                    onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                    className="input" placeholder="Subcategory name" />
                  <input value={subForm.description}
                    onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                    className="input" placeholder="Description (optional)" />
                  <button type="submit" disabled={subSaving} className="btn-primary w-full justify-center">
                    {subSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    {subSaving ? 'Adding…' : 'Add Subcategory'}
                  </button>
                </form>
              </div>

              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
                  Subcategories of {selected.name}
                </div>
                {loadingSubs ? (
                  <div className="p-4 space-y-2">
                    {[1, 2].map((i) => <div key={i} className="skeleton h-9 w-full rounded-lg" />)}
                  </div>
                ) : subs.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No subcategories yet</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {subs.map((sub) => (
                      <li key={sub.id} className="px-4 py-3 text-sm text-gray-700">
                        {sub.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-sm">Select a category to manage its subcategories</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
