import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdLocationOn, MdEvent, MdCategory, MdCheckCircle, MdImage } from 'react-icons/md';

const LostFoundPage = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('lost');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    item_type: 'lost',
    title: '',
    description: '',
    category: 'electronics',
    location_found_or_lost: '',
    date_lost_or_found: new Date().toISOString().split('T')[0],
    image: null
  });

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams({
        type: activeTab,
        status: 'open'
      });
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const res = await api.get(`lost-found/?${params.toString()}`);
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to fetch items');
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, category, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      await api.post('lost-found/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Reported successfully! Checking for matches...');
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error('Failed to report item');
    }
  };

  const handleClaim = async (id) => {
    try {
      await api.patch(`lost-found/${id}/claim/`);
      toast.success('Item marked as claimed');
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      toast.error('Failed to claim item');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Lost & Found</h1>
          <p className="text-slate-400">Help the campus community recover missing belongings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-6 py-3">
          <MdAdd size={24} /> Report Item
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 space-y-6">
          <div className="card p-4 space-y-4">
             <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Search</label>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm" 
                  placeholder="Key words..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="documents">Documents</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="books">Books</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('lost')}
              className={`px-8 py-2 rounded-lg font-bold transition ${activeTab === 'lost' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Lost Items
            </button>
            <button 
              onClick={() => setActiveTab('found')}
              className={`px-8 py-2 rounded-lg font-bold transition ${activeTab === 'found' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Found Items
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="card group cursor-pointer hover:border-teal-500/50 transition-all overflow-hidden"
              >
                <div className="h-48 bg-slate-900 relative">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                      <MdImage size={48} />
                      <p className="text-[10px] font-bold uppercase mt-2">No Image Provided</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-teal-400 uppercase tracking-widest border border-slate-700">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-3 truncate group-hover:text-teal-400 transition-colors uppercase italic tracking-tight">{item.title}</h3>
                  <div className="space-y-2 text-xs text-slate-400">
                    <p className="flex items-center gap-2"><MdLocationOn className="text-teal-500" /> {item.location_found_or_lost}</p>
                    <p className="flex items-center gap-2"><MdEvent className="text-teal-500" /> {item.date_lost_or_found}</p>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full py-20 text-center card bg-transparent border-dashed border-2 border-slate-700">
                <p className="text-slate-500 italic">No {activeTab} items reported matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col md:flex-row h-full">
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-900">
                {selectedItem.image ? (
                  <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700"><MdImage size={80} /></div>
                )}
              </div>
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {selectedItem.category}
                    </span>
                    <h2 className="text-2xl font-black text-white mt-4 uppercase italic leading-none">{selectedItem.title}</h2>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white transition"><MdSearch size={24} className="rotate-45" /></button>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location Details</p>
                    <p className="text-sm">{selectedItem.location_found_or_lost}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{selectedItem.description}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-700 flex gap-4">
                  <button 
                    onClick={() => handleClaim(selectedItem.id)}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <MdCheckCircle size={20} /> Mark as Resolved
                  </button>
                  <button onClick={() => setSelectedItem(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 font-bold py-3 rounded-xl">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 italic">Report an Item</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex bg-slate-900 p-1 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, item_type: 'lost'})}
                  className={`flex-1 py-2 rounded-md font-bold text-sm ${formData.item_type === 'lost' ? 'bg-red-500 text-white' : 'text-slate-500'}`}
                >
                  LOST
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, item_type: 'found'})}
                  className={`flex-1 py-2 rounded-md font-bold text-sm ${formData.item_type === 'found' ? 'bg-green-500 text-white' : 'text-slate-500'}`}
                >
                  FOUND
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Item Title</label>
                  <input required maxLength="200" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" placeholder="e.g., Blue Samsung earbuds" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="electronics">Electronics</option>
                    <option value="documents">Documents</option>
                    <option value="clothing">Clothing</option>
                    <option value="accessories">Accessories</option>
                    <option value="books">Books</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Date</label>
                  <input type="date" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.date_lost_or_found} onChange={(e) => setFormData({...formData, date_lost_or_found: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Location</label>
                   <input required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" placeholder="Where was it lost/found?" value={formData.location_found_or_lost} onChange={(e) => setFormData({...formData, location_found_or_lost: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                  <textarea required rows="3" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" placeholder="Provide extra details (color, serial #, contents...)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Add Photo (Optional)</label>
                  <input type="file" accept="image/*" className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold transition">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFoundPage;
