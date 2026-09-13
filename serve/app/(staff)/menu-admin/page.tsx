"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, EyeOff, Eye } from "lucide-react";

export default function MenuAdminPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true
  });

  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: staffData } = await supabase
          .from("staff")
          .select("restaurant_id")
          .eq("id", user.id)
          .single();
        if (staffData) {
          setRestaurantId(staffData.restaurant_id);
          return;
        }
      }
      setRestaurantId("20000000-0000-0000-0000-000000000002");
    };
    initAuth();
  }, [supabase]);

  const fetchData = async () => {
    if (!restaurantId) return;
    setLoading(true);

    // Get active menu
    const { data: menuData } = await supabase
      .from("menus")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!menuData) {
      setLoading(false);
      return;
    }
    
    setMenuId(menuData.id);

    // Get categories
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("menu_id", menuData.id)
      .order("display_order", { ascending: true });
    
    if (catData) setCategories(catData);

    // Get items
    if (catData && catData.length > 0) {
      const catIds = catData.map(c => c.id);
      const { data: itemData } = await supabase
        .from("menu_items")
        .select("*")
        .in("category_id", catIds)
        .order("display_order", { ascending: true });
      
      if (itemData) setItems(itemData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId, supabase]);

  // --- Category Handlers ---
  const handleSaveCategory = async () => {
    if (!categoryName.trim() || !menuId) return;

    if (editingCategory) {
      await supabase.from("categories").update({ name: categoryName }).eq("id", editingCategory.id);
    } else {
      const newOrder = categories.length;
      await supabase.from("categories").insert({
        menu_id: menuId,
        name: categoryName,
        display_order: newOrder
      });
    }
    
    setIsCategoryModalOpen(false);
    fetchData();
  };

  const handleDeleteCategory = async (id: string) => {
    const categoryItems = items.filter(i => i.category_id === id);
    if (categoryItems.length > 0) {
      alert("Cannot delete category because it contains items. Delete or move the items first.");
      return;
    }
    if (confirm("Are you sure you want to delete this category?")) {
      await supabase.from("categories").delete().eq("id", id);
      fetchData();
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newCategories[index];
    newCategories[index] = newCategories[swapIndex];
    newCategories[swapIndex] = temp;

    // Update display_orders in DB
    await Promise.all([
      supabase.from("categories").update({ display_order: index }).eq("id", newCategories[index].id),
      supabase.from("categories").update({ display_order: swapIndex }).eq("id", newCategories[swapIndex].id)
    ]);

    fetchData();
  };

  // --- Item Handlers ---
  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.price || !itemForm.category_id) {
      alert("Name, Price, and Category are required.");
      return;
    }

    const payload = {
      name: itemForm.name,
      description: itemForm.description,
      price: parseFloat(itemForm.price),
      category_id: itemForm.category_id,
      image_url: itemForm.image_url,
      is_available: itemForm.is_available
    };

    if (editingItem) {
      await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
    } else {
      const catItems = items.filter(i => i.category_id === itemForm.category_id);
      await supabase.from("menu_items").insert({
        ...payload,
        display_order: catItems.length
      });
    }

    setIsItemModalOpen(false);
    fetchData();
  };

  const toggleItemAvailability = async (item: any) => {
    const newStatus = !item.is_available;
    
    // Optimistic UI update
    setItems(items.map(i => i.id === item.id ? { ...i, is_available: newStatus } : i));
    
    await supabase.from("menu_items").update({ is_available: newStatus }).eq("id", item.id);
  };

  const handleDeleteItem = async (item: any) => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
      
      if (error) {
        console.error("Failed to delete item", error);
        alert(`Could not permanently delete ${item.name}. It may be referenced by historical orders. It has been hidden instead.`);
        // Fallback: Archive by setting available = false
        setItems(items.map(i => i.id === item.id ? { ...i, is_available: false } : i));
        await supabase.from("menu_items").update({ is_available: false }).eq("id", item.id);
      } else {
        // Success
        setItems(items.filter(i => i.id !== item.id));
      }
    }
  };

  const openItemModal = (item?: any, categoryId?: string) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category_id: item.category_id,
        image_url: item.image_url || "",
        is_available: item.is_available
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: "",
        description: "",
        price: "",
        category_id: categoryId || (categories.length > 0 ? categories[0].id : ""),
        image_url: "",
        is_available: true
      });
    }
    setIsItemModalOpen(true);
  };

  if (loading) {
    return <div className="p-10 text-[var(--color-brand-grey)]">Loading menu...</div>;
  }

  if (!menuId) {
    return <div className="p-10 text-[var(--color-status-red)]">No active menu found for this restaurant.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans overflow-hidden">
      <div className="p-8 border-b border-white/5 shrink-0 flex justify-between items-center bg-[var(--color-brand-bg-dark)]">
        <div>
          <h1 className="text-3xl font-serif">Menu Management</h1>
          <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase mt-2">Configure categories and items</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setEditingCategory(null); setCategoryName(""); setIsCategoryModalOpen(true); }}
            className="px-4 py-2 border border-[var(--color-brand-gold)]/50 text-[var(--color-brand-gold)] rounded text-sm uppercase tracking-wider font-medium hover:bg-[var(--color-brand-gold)]/10 transition-colors"
          >
            + Add Category
          </button>
          <button 
            onClick={() => openItemModal()}
            className="px-4 py-2 bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] rounded text-sm uppercase tracking-wider font-bold hover:brightness-110 transition-all shadow-lg"
          >
            + Add Item
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-12 pb-24">
          {categories.map((category, catIdx) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <button onClick={() => moveCategory(catIdx, 'up')} className="text-white/20 hover:text-white/80 p-0.5">▲</button>
                    <button onClick={() => moveCategory(catIdx, 'down')} className="text-white/20 hover:text-white/80 p-0.5">▼</button>
                  </div>
                  <h2 className="text-xl font-serif text-[var(--color-brand-gold)] uppercase tracking-wider">{category.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openItemModal(undefined, category.id)} className="text-xs text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] uppercase tracking-wider px-3 py-1 bg-white/5 rounded">
                    + Add Item Here
                  </button>
                  <button onClick={() => { setEditingCategory(category); setCategoryName(category.name); setIsCategoryModalOpen(true); }} className="p-2 text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-red-400/50 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.filter(i => i.category_id === category.id).map(item => (
                  <div key={item.id} className={`bg-[var(--color-brand-bg-dark)] border ${item.is_available ? 'border-white/5' : 'border-red-500/20 opacity-60'} rounded-lg p-5 flex gap-4 transition-all hover:border-white/10`}>
                    {item.image_url ? (
                      <div className="w-20 h-20 rounded bg-black/50 shrink-0 overflow-hidden relative border border-white/5">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded bg-white/5 shrink-0 flex items-center justify-center border border-white/5">
                        <ImageIcon className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif text-lg truncate pr-2" title={item.name}>{item.name}</h3>
                        <span className="font-medium text-[var(--color-brand-gold)]">£{Number(item.price).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-[var(--color-brand-grey)] line-clamp-2 mb-3 h-8">{item.description}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${item.is_available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {item.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => toggleItemAvailability(item)}
                            className="text-xs text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] px-2 py-1 bg-white/5 rounded border border-white/10 flex items-center gap-1"
                            title={item.is_available ? "Make Unavailable" : "Make Available"}
                          >
                            {item.is_available ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {item.is_available ? 'HIDE' : 'SHOW'}
                          </button>
                          <button 
                            onClick={() => openItemModal(item)}
                            className="text-xs text-[var(--color-brand-ivory)] hover:text-white px-3 py-1 bg-[var(--color-brand-bg-elevated)] rounded border border-white/10"
                          >
                            EDIT
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item)}
                            className="p-1 text-red-500/50 hover:text-red-500 rounded hover:bg-red-500/10 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {items.filter(i => i.category_id === category.id).length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-8 text-sm text-[var(--color-brand-grey)] bg-white/5 rounded-lg border border-dashed border-white/10">
                    No items in this category yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-brand-bg-dark)] border border-white/10 rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-serif mb-6">{editingCategory ? "Edit Category" : "Add Category"}</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] mb-2">Category Name</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-[var(--color-brand-bg-surface)] border border-white/10 text-white rounded p-3 focus:outline-none focus:border-[var(--color-brand-gold)]"
                  placeholder="e.g. STARTERS"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 text-sm text-[var(--color-brand-grey)] hover:text-white">Cancel</button>
              <button onClick={handleSaveCategory} className="px-6 py-2 bg-[var(--color-brand-gold)] text-black font-medium rounded hover:brightness-110">Save Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--color-brand-bg-dark)] border border-white/10 rounded-xl p-8 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-2xl font-serif mb-6">{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] mb-2">Item Name *</label>
                  <input 
                    type="text" 
                    value={itemForm.name}
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    className="w-full bg-[var(--color-brand-bg-surface)] border border-white/10 text-white rounded p-3 focus:outline-none focus:border-[var(--color-brand-gold)]"
                    placeholder="e.g. Chicken 65"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] mb-2">Price (£) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                    className="w-full bg-[var(--color-brand-bg-surface)] border border-white/10 text-white rounded p-3 focus:outline-none focus:border-[var(--color-brand-gold)]"
                    placeholder="8.95"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] mb-2">Category *</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({...itemForm, category_id: e.target.value})}
                    className="w-full bg-[var(--color-brand-bg-surface)] border border-white/10 text-white rounded p-3 focus:outline-none focus:border-[var(--color-brand-gold)]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] mb-2">Description</label>
                  <textarea 
                    value={itemForm.description}
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    className="w-full h-32 bg-[var(--color-brand-bg-surface)] border border-white/10 text-white rounded p-3 focus:outline-none focus:border-[var(--color-brand-gold)] resize-none"
                    placeholder="Appetizing description of the dish..."
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] mb-2">Image URL</label>
                  <input 
                    type="text" 
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm({...itemForm, image_url: e.target.value})}
                    className="w-full bg-[var(--color-brand-bg-surface)] border border-white/10 text-white rounded p-3 focus:outline-none focus:border-[var(--color-brand-gold)]"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="is_available"
                    checked={itemForm.is_available}
                    onChange={(e) => setItemForm({...itemForm, is_available: e.target.checked})}
                    className="w-5 h-5 accent-[var(--color-brand-gold)]"
                  />
                  <label htmlFor="is_available" className="text-sm">Item is available for ordering</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 border-t border-white/10 pt-6">
              <button onClick={() => setIsItemModalOpen(false)} className="px-6 py-2 text-sm text-[var(--color-brand-grey)] hover:text-white">Cancel</button>
              <button onClick={handleSaveItem} className="px-6 py-2 bg-[var(--color-brand-gold)] text-black font-medium rounded hover:brightness-110">Save Menu Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
