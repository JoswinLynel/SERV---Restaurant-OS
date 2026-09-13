"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings2, Store, Table2, Banknote, Laptop, Save, QrCode, Copy, Download, Plus, Edit2 } from "lucide-react";

export default function SettingsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });
  const [saving, setSaving] = useState(false);
  
  // Table Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [tableForm, setTableForm] = useState({
    table_number: "",
    code: ""
  });
  const [tableSaving, setTableSaving] = useState(false);
  const [tableError, setTableError] = useState("");

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

    // Get Restaurant
    const { data: restData } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (restData) {
      setRestaurant(restData);
      setFormData({
        name: restData.name || "",
        address: restData.address || "",
        phone: restData.phone || "",
        email: restData.email || ""
      });
    }

    // Get Tables
    const { data: tableData } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });

    if (tableData) {
      setTables(tableData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId, supabase]);

  const handleSaveRestaurant = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email
      })
      .eq("id", restaurantId);
    
    if (!error) {
      setEditMode(false);
      await fetchData();
    } else {
      console.error(error);
      alert("Error saving restaurant: " + error.message);
    }
    setSaving(false);
  };

  const handleSaveTable = async () => {
    if (!restaurantId) return;
    setTableSaving(true);
    setTableError("");

    if (!tableForm.table_number || !tableForm.code) {
      setTableError("Table number and Public Code are required.");
      setTableSaving(false);
      return;
    }

    if (editingTable) {
      // Update
      const { error } = await supabase
        .from("tables")
        .update({
          table_number: tableForm.table_number,
          code: tableForm.code
        })
        .eq("id", editingTable.id);
      
      if (error) {
        setTableError(error.message);
      } else {
        setIsTableModalOpen(false);
        await fetchData();
      }
    } else {
      // Insert
      const { error } = await supabase
        .from("tables")
        .insert({
          restaurant_id: restaurantId,
          table_number: tableForm.table_number,
          code: tableForm.code
        });
      
      if (error) {
        setTableError(error.message);
      } else {
        setIsTableModalOpen(false);
        await fetchData();
      }
    }
    setTableSaving(false);
  };

  const openEditTable = (table: any) => {
    setEditingTable(table);
    setTableForm({ table_number: table.table_number, code: table.code || "" });
    setTableError("");
    setIsTableModalOpen(true);
  };

  const openAddTable = () => {
    setEditingTable(null);
    setTableForm({ table_number: "", code: "" });
    setTableError("");
    setIsTableModalOpen(true);
  };

  const getQRUrl = (code: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "");
    return `${baseUrl}/t/${code}`;
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(getQRUrl(code));
    alert("URL Copied!");
  };

  if (loading) {
    return <div className="p-10 text-[var(--color-brand-grey)]">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans overflow-y-auto">
      <div className="p-8 border-b border-white/5 shrink-0 bg-[var(--color-brand-bg-dark)]">
        <h1 className="text-3xl font-serif">Settings</h1>
        <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase mt-2">Manage restaurant configuration</p>
      </div>

      <div className="p-8 max-w-4xl space-y-8">
        {/* RESTAURANT SECTION */}
        <section className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Store className="w-5 h-5 text-[var(--color-brand-accent)]" />
              Restaurant
            </h2>
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                className="text-xs text-[var(--color-brand-grey)] hover:text-white transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <button 
                onClick={handleSaveRestaurant}
                disabled={saving}
                className="text-xs bg-[var(--color-brand-accent)] text-black px-3 py-1.5 rounded-sm font-medium hover:bg-opacity-90 transition flex items-center gap-1"
              >
                {saving ? "Saving..." : <><Save className="w-3 h-3" /> Save Changes</>}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Restaurant Name</label>
              {editMode ? (
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded-sm text-sm focus:border-[var(--color-brand-accent)] outline-none"
                />
              ) : (
                <p className="text-sm">{restaurant?.name}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Email</label>
              {editMode ? (
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded-sm text-sm focus:border-[var(--color-brand-accent)] outline-none"
                />
              ) : (
                <p className="text-sm">{restaurant?.email || "Not set"}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Address</label>
              {editMode ? (
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded-sm text-sm focus:border-[var(--color-brand-accent)] outline-none"
                />
              ) : (
                <p className="text-sm">{restaurant?.address}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Phone</label>
              {editMode ? (
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded-sm text-sm focus:border-[var(--color-brand-accent)] outline-none"
                />
              ) : (
                <p className="text-sm">{restaurant?.phone || "Not set"}</p>
              )}
            </div>
          </div>
        </section>

        {/* TABLES & QR SECTION */}
        <section className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Table2 className="w-5 h-5 text-[var(--color-brand-accent)]" />
              Tables & QR
            </h2>
            <button 
              onClick={openAddTable}
              className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-sm transition flex items-center gap-1 border border-white/10"
            >
              <Plus className="w-3 h-3" /> Add Table
            </button>
          </div>

          <div className="space-y-2">
            {tables.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-sm hover:border-white/10 transition">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium w-20">Table {t.table_number}</div>
                  <div className="text-xs text-[var(--color-brand-accent)] bg-[var(--color-brand-accent)]/10 px-2 py-0.5 rounded-sm font-mono tracking-wider border border-[var(--color-brand-accent)]/20">
                    {t.code || "NO CODE"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleCopy(t.code)} className="text-[var(--color-brand-grey)] hover:text-white transition p-1" title="Copy URL">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="text-[var(--color-brand-grey)] hover:text-white transition p-1" title="Download QR (Not implemented)">
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button onClick={() => openEditTable(t)} className="text-[var(--color-brand-grey)] hover:text-[var(--color-brand-accent)] transition text-xs font-medium uppercase tracking-wider">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CURRENCY SECTION */}
        <section className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg">
          <div className="flex items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[var(--color-brand-accent)]" />
              Currency
            </h2>
          </div>
          <div>
            <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Current Currency</label>
            <p className="text-sm font-medium">{restaurant?.currency === 'GBP' ? 'GBP (£)' : restaurant?.currency === 'USD' ? 'USD ($)' : restaurant?.currency}</p>
            <p className="text-xs text-white/40 mt-1">Read-only for current configuration.</p>
          </div>
        </section>

        {/* SYSTEM INFORMATION SECTION */}
        <section className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg">
          <div className="flex items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[var(--color-brand-accent)]" />
              System Information
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Restaurant ID</label>
              <p className="text-xs font-mono text-white/70">{restaurant?.id}</p>
            </div>
            <div>
              <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">SERVÉ Version</label>
              <p className="text-xs text-white/70">v1.0.0-beta</p>
            </div>
          </div>
        </section>

      </div>

      {/* TABLE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-brand-bg-dark)] border border-white/10 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-serif mb-6">{editingTable ? "Edit Table" : "Add Table"}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Table Number</label>
                <input 
                  type="text" 
                  value={tableForm.table_number}
                  onChange={e => setTableForm({...tableForm, table_number: e.target.value})}
                  placeholder="e.g. 1, 2, Balcony-1"
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-sm text-sm focus:border-[var(--color-brand-accent)] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--color-brand-grey)] tracking-wider uppercase mb-1">Public Code (for QR URL)</label>
                <input 
                  type="text" 
                  value={tableForm.code}
                  onChange={e => setTableForm({...tableForm, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. MT1"
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-sm text-sm focus:border-[var(--color-brand-accent)] outline-none font-mono"
                />
                <p className="text-xs text-[var(--color-brand-grey)] mt-2">
                  This code must be unique across all tables (e.g. <strong>MT1</strong> generates <strong>/t/MT1</strong>).
                </p>
              </div>

              {tableError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-sm">
                  {tableError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsTableModalOpen(false)}
                className="flex-1 py-3 text-sm font-medium border border-white/10 hover:bg-white/5 rounded-sm transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTable}
                disabled={tableSaving}
                className="flex-1 py-3 text-sm font-medium bg-[var(--color-brand-accent)] text-black hover:bg-opacity-90 rounded-sm transition disabled:opacity-50"
              >
                {tableSaving ? "Saving..." : "Save Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
