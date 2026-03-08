import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, X, Save, Loader2, Eye, EyeOff, Star, Smartphone, Monitor } from "lucide-react";
import { fetchAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "../lib/api";

const CATEGORIES = ["Starters", "Main Course", "Desserts", "Beverages", "Sides"];

const emptyForm = {
  name: "", description: "", category: "Starters", price: "",
  poster_url: "", model_url_android: "", model_url_ios: "",
  is_recommended: false, is_active: true, sort_order: 0,
};

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllMenuItems();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCat === "All" || item.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const openCreate = () => { setEditingItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name, description: item.description || "", category: item.category,
      price: item.price, poster_url: item.poster_url || "",
      model_url_android: item.model_url_android || "", model_url_ios: item.model_url_ios || "",
      is_recommended: !!item.is_recommended, is_active: !!item.is_active, sort_order: item.sort_order || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.price) return;
    setSaving(true);
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, { ...form, price: parseInt(form.price) });
      } else {
        await createMenuItem({ ...form, price: parseInt(form.price) });
      }
      setShowModal(false);
      await loadItems();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMenuItem(id);
      setDeleteConfirm(null);
      await loadItems();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await updateMenuItem(item.id, { ...item, is_active: !item.is_active });
      await loadItems();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage items, prices, and 3D model links</p>
        </div>
        <button onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 flex items-center gap-2 rounded-xl shadow-lg shadow-indigo-200 transition-all font-semibold text-sm w-full sm:w-auto justify-center">
          <Plus size={18} /> Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex justify-between items-center">
          {error} <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="p-3 md:p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["All", ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterCat === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {item.poster_url && (
                  <img src={item.poster_url} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base flex items-center gap-2 flex-wrap">
                        {item.name}
                        {item.is_recommended ? <Star size={14} className="text-amber-500 fill-amber-500" /> : null}
                        {!item.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">HIDDEN</span>}
                      </h3>
                      <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px] md:max-w-sm">{item.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900">₹{item.price}</div>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
                    </div>
                  </div>
                  {/* Model links indicators */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {item.model_url_android && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        <Monitor size={10} /> Android 3D
                      </span>
                    )}
                    {item.model_url_ios && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        <Smartphone size={10} /> iOS AR
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => handleToggleActive(item)}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${item.is_active ? "text-gray-500 hover:bg-gray-100" : "text-green-600 hover:bg-green-50"}`}>
                  {item.is_active ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                </button>
                <button onClick={() => openEdit(item)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => setDeleteConfirm(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">No items found</div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Grilled Salmon" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Fresh salmon fillet with lemon butter sauce" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="1899" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Poster Image URL</label>
                <input type="url" value={form.poster_url} onChange={e => setForm({ ...form, poster_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="https://..." />
              </div>
              {/* 3D Model Links */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                <div className="text-xs font-bold text-gray-600 flex items-center gap-1.5">🧊 3D Model Links</div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Monitor size={12} /> Android (.glb)</label>
                  <input type="url" value={form.model_url_android} onChange={e => setForm({ ...form, model_url_android: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white" placeholder="https://...model.glb" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Smartphone size={12} /> iOS AR (.usdz)</label>
                  <input type="url" value={form.model_url_ios} onChange={e => setForm({ ...form, model_url_ios: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white" placeholder="https://...model.usdz" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_recommended} onChange={e => setForm({ ...form, is_recommended: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Recommended</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove this item from the database. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
