'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Shoe {
  id: string;
  created_at?: string;
  name: string;
  brand: string;
  price_rwf: number;
  category: string;
  description: string;
  status: string;
  available_sizes?: number[];
  image_url: string;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  shoe_id: string;
  shoe_name: string;
  size_selected: number;
  amount_paid_rwf: number;
  status: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders'>('dashboard');
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

  // Form State
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('Sneakers');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('IN STOCK');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Size Options (20 - 60)
  const AVAILABLE_SIZES = Array.from({ length: 41 }, (_, i) => 20 + i);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([39, 40, 41, 42]);

  useEffect(() => {
    fetchShoes();
    fetchOrders();
  }, []);

  const fetchShoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shoes:', error.message);
    } else {
      setShoes((data as Shoe[]) || []);
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error.message);
    } else {
      setOrders((data as Order[]) || []);
    }
  };

  // Dynamic Time-Based Metrics
  const now = new Date();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Weekly Filters
  const weeklyOrders = orders.filter((o) => new Date(o.created_at) >= sevenDaysAgo);
  const weeklyRevenue = weeklyOrders.reduce((acc, curr) => acc + (curr.amount_paid_rwf || 0), 0);

  // Monthly Filters
  const monthlyOrders = orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo);
  const monthlyRevenue = monthlyOrders.reduce((acc, curr) => acc + (curr.amount_paid_rwf || 0), 0);

  // All Time
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.amount_paid_rwf || 0), 0);
  const totalProducts = shoes.length;
  const totalOrders = orders.length;

  // Most Requested Size
  const sizeCounts: { [key: number]: number } = {};
  orders.forEach((o) => {
    if (o.size_selected) {
      sizeCounts[o.size_selected] = (sizeCounts[o.size_selected] || 0) + 1;
    }
  });
  const topDemandedSize = Object.keys(sizeCounts).length > 0
    ? Object.keys(sizeCounts).reduce((a, b) => (sizeCounts[Number(a)] > sizeCounts[Number(b)] ? a : b))
    : 'N/A';

  // Most Popular Shoes Calculation
  const shoeSalesMap: { [key: string]: { name: string; count: number; totalRevenue: number } } = {};
  
  orders.forEach((o) => {
    const key = o.shoe_name || 'Unknown Shoe';
    if (!shoeSalesMap[key]) {
      shoeSalesMap[key] = { name: key, count: 0, totalRevenue: 0 };
    }
    shoeSalesMap[key].count += 1;
    shoeSalesMap[key].totalRevenue += o.amount_paid_rwf || 0;
  });

  const popularShoes = Object.values(shoeSalesMap).sort((a, b) => b.count - a.count);

  const toggleSize = (size: number) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleEdit = (shoe: Shoe) => {
    setEditingId(shoe.id);
    setName(shoe.name || '');
    setBrand(shoe.brand || '');
    setPrice(shoe.price_rwf ? shoe.price_rwf.toString() : '');
    setCategory(shoe.category || 'Sneakers');
    setDescription(shoe.description || '');
    setStatus(shoe.status || 'IN STOCK');
    setSelectedSizes(shoe.available_sizes || []);
    setExistingImageUrl(shoe.image_url || '');
    setImageFile(null);
    setActiveTab('inventory');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setExistingImageUrl('');
    setName('');
    setBrand('');
    setPrice('');
    setCategory('Sneakers');
    setDescription('');
    setStatus('IN STOCK');
    setSelectedSizes([39, 40, 41, 42]);
    setImageFile(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Please fill in the shoe name and price.');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('shoe-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('shoe-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        name,
        brand: brand || 'Generic',
        price_rwf: parseFloat(price),
        category,
        description,
        status,
        available_sizes: selectedSizes,
        image_url: imageUrl,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('shoes')
          .update(payload)
          .eq('id', editingId);

        if (updateError) throw updateError;
        alert('Footwear updated successfully!');
      } else {
        if (!imageFile && !imageUrl) {
          alert('Please select an image file for new products.');
          setUploading(false);
          return;
        }

        const { error: insertError } = await supabase
          .from('shoes')
          .insert([payload]);

        if (insertError) throw insertError;
        alert('Shoe saved to storefront!');
      }

      handleCancelEdit();
      fetchShoes();
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert(`Failed to save product: ${err.message || 'Database error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this footwear listing?')) {
      const { error } = await supabase.from('shoes').delete().eq('id', id);
      if (error) {
        alert('Failed to delete item.');
      } else {
        if (editingId === id) handleCancelEdit();
        fetchShoes();
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Failed to update status.');
    } else {
      fetchOrders();
    }
  };

  // --- DELETE ORDER FUNCTION ---
  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order from the pipeline?')) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        alert('Failed to delete order.');
      } else {
        fetchOrders();
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-black text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="text-yellow-500">⬡</span> Kigali Shoes Hub — Admin Panel
        </div>
        <button className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-700 transition">
          🔒 Logout
        </button>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex gap-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
            activeTab === 'dashboard'
              ? 'bg-black text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Sales Analytics
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
            activeTab === 'orders'
              ? 'bg-black text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📦 Orders Pipeline ({totalOrders})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
            activeTab === 'inventory'
              ? 'bg-black text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          👟 Manage Inventory ({totalProducts})
        </button>
      </div>

      <main className="max-w-7xl mx-auto p-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-xs font-semibold text-emerald-600 uppercase">Last 7 Days Revenue</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-2">
                  RWF {weeklyRevenue.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{weeklyOrders.length} orders this week</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-xs font-semibold text-blue-600 uppercase">Last 30 Days Revenue</p>
                <h3 className="text-2xl font-extrabold text-blue-600 mt-2">
                  RWF {monthlyRevenue.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{monthlyOrders.length} orders this month</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-xs font-semibold text-gray-400 uppercase">All-Time Revenue</p>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-2">
                  RWF {totalRevenue.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{totalOrders} total sales recorded</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-xs font-semibold text-amber-600 uppercase">Top Demanded Size</p>
                <h3 className="text-3xl font-extrabold text-amber-600 mt-2">EU {topDemandedSize}</h3>
                <p className="text-xs text-gray-400 mt-1">Based on checkout activity</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* TOP POPULAR SHOES */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                   Most Popular Shoes
                </h3>
                {popularShoes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No sales data available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {popularShoes.slice(0, 5).map((item, idx) => (
                      <div key={item.name} className="p-3.5 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.count} total unit{item.count > 1 ? 's' : ''} sold</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-emerald-600">
                          RWF {item.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RECENT SALES STREAM */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  ⚡ Recent Transactions
                </h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="p-3.5 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{ord.shoe_name} (Size {ord.size_selected})</p>
                          <p className="text-xs text-gray-500">Customer: {ord.customer_name} • {ord.customer_phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-black">RWF {ord.amount_paid_rwf?.toLocaleString()}</span>
                          <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{ord.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB WITH DELETE FUNCTIONALITY */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Customer Order Pipeline ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">No orders have been submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-gray-900">{ord.shoe_name}</h3>
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-bold">
                          EU Size {ord.size_selected}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Client: <span className="font-semibold">{ord.customer_name}</span> ({ord.customer_phone})
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Amount: RWF {ord.amount_paid_rwf?.toLocaleString()} • Date: {new Date(ord.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>

                      <button
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Order"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-emerald-500 font-bold text-xl">
                    {editingId ? '✏️' : '+'}
                  </span>{' '}
                  {editingId ? 'Edit Footwear' : 'Add New Footwear'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Shoe Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nike Air Force 1 '07"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Brand</label>
                    <input
                      type="text"
                      placeholder="Nike, Adidas, etc."
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (RWF)</label>
                    <input
                      type="number"
                      placeholder="35000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="Sneakers">Sneakers</option>
                      <option value="Formal">Formal</option>
                      <option value="Boots">Boots</option>
                      <option value="Sports">Sports</option>
                      <option value="Deals">Deals</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="IN STOCK">IN STOCK</option>
                      <option value="LIMITED STOCK">LIMITED STOCK</option>
                      <option value="OUT OF STOCK">OUT OF STOCK</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Available EU Sizes</label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-xl">
                    {AVAILABLE_SIZES.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                            isSelected
                              ? 'bg-black text-white border-black'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {editingId ? 'Change Image (Optional)' : 'Shoe Image File'}
                  </label>
                  <label className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-gray-50 transition">
                    <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs text-gray-600 font-medium">
                      {imageFile
                        ? imageFile.name
                        : editingId
                        ? 'Click to replace current image'
                        : 'Click to select image from laptop'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea
                    placeholder="Short item details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {uploading
                    ? 'Saving Changes...'
                    : editingId
                    ? 'Update Product Details'
                    : 'Save to Supabase Storefront'}
                </button>
              </form>
            </section>

            <section className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Active Store Inventory ({shoes.length})
              </h2>

              {loading ? (
                <p className="text-sm text-gray-400 py-12 text-center">Loading inventory...</p>
              ) : shoes.length === 0 ? (
                <p className="text-sm text-gray-400 py-12 text-center">No shoes found in database.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[720px] pr-2">
                  {shoes.map((shoe) => (
                    <div
                      key={shoe.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        editingId === shoe.id
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={shoe.image_url || '/placeholder.png'}
                          alt={shoe.name}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 bg-white"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-gray-900">{shoe.name}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                shoe.status === 'OUT OF STOCK'
                                  ? 'bg-red-100 text-red-700'
                                  : shoe.status === 'LIMITED STOCK'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {shoe.status || 'IN STOCK'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {shoe.category} • RWF {shoe.price_rwf?.toLocaleString()}
                          </p>
                          {shoe.available_sizes && shoe.available_sizes.length > 0 && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              Sizes: {shoe.available_sizes.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(shoe)}
                          className="p-2 text-gray-500 hover:text-black hover:bg-gray-200 transition rounded-lg"
                          title="Edit shoe"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(shoe.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition rounded-lg"
                          title="Delete shoe"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}