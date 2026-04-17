import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Tag, Plus, X, CheckCircle,
  Laptop, FileText, Key, BookOpen, Watch, Package, Image,
} from 'lucide-react';
import { useLostFound } from '../../hooks/useLostFound';

// ── Category Icons Map ────────────────────────────
const CATEGORY_ICONS = {
  electronics: Laptop, documents: FileText, clothing: Package,
  accessories: Watch, books: BookOpen, other: Package,
};

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: Laptop },
  { value: 'documents',   label: 'Documents',   icon: FileText },
  { value: 'clothing',    label: 'Clothing',     icon: Package },
  { value: 'accessories', label: 'Accessories',  icon: Watch },
  { value: 'books',       label: 'Books',        icon: BookOpen },
  { value: 'other',       label: 'Other',        icon: Key },
];

// ── Item Card ─────────────────────────────────────
const ItemCard = ({ item, onClick }) => {
  const CatIcon = CATEGORY_ICONS[item.category] || Package;
  const isMatched = item.status === 'matched';
  const isResolved = item.status === 'resolved';
  const borderColor = isResolved
    ? 'rgba(16,185,129,0.4)'
    : isMatched
      ? 'rgba(16,185,129,0.3)'
      : 'var(--border-subtle)';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: (isMatched || isResolved) ? '0 18px 40px rgba(16,185,129,0.15)' : '0 18px 40px rgba(0,0,0,0.2)' }}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        transition: 'all 0.25s',
        opacity: isResolved ? 0.85 : 1,
      }}
    >
      {/* Image placeholder / matched overlay */}
      <div style={{ height: 140, background: 'var(--bg-tertiary)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.image ? (
          <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <CatIcon size={40} style={{ opacity: 0.15 }} />
        )}
        {isResolved && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(16,185,129,0.95)', color: 'white',
              padding: '6px 14px', borderRadius: 99,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6,
              backdropFilter: 'blur(10px)',
            }}>
              <CheckCircle size={13} /> RESOLVED
            </div>
          </div>
        )}
        {!isResolved && isMatched && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(16,185,129,0.9)', color: 'white',
              padding: '6px 14px', borderRadius: 99,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6,
              backdropFilter: 'blur(10px)',
            }}>
              <CheckCircle size={13} /> MATCHED
            </div>
          </div>
        )}
        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          padding: '4px 10px', borderRadius: 99,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: item.item_type === 'lost' ? '#f59e0b' : '#10b981',
          border: `1px solid ${item.item_type === 'lost' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
        }}>
          {item.item_type}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 14, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={11} /> {item.location_found_or_lost}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={11} /> {item.date_lost_or_found}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const LostFoundPage = () => {
  const [activeTab, setActiveTab]     = useState('lost');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [resolving, setResolving]     = useState(false);
  const [formData, setFormData]       = useState({
    item_type: 'lost', title: '', description: '',
    category: 'electronics', location_found_or_lost: '',
    date_lost_or_found: new Date().toISOString().split('T')[0], image: null,
  });

  const { items, reportItem, resolveItem } = useLostFound({
    type: activeTab,
    category,
    search,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const matchedItems = items.filter(i => i.status === 'matched');

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportItem(formData);
      toast.success('Item reported successfully. We\'ll notify you if a match is found.');
      setShowModal(false);
      setFormData({
        item_type: 'lost', title: '', description: '',
        category: 'electronics', location_found_or_lost: '',
        date_lost_or_found: new Date().toISOString().split('T')[0], image: null,
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to report item. Please try again.');
      console.error(err.response?.data);
    } finally { setSubmitting(false); }
  };

  const handleResolve = async (id) => {
    setResolving(true);
    try {
      await resolveItem(id);
      toast.success('Item marked as resolved');
      setSelectedItem(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resolve item');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Modules</span>
          </div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 26 }}>Lost & Found</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Help the campus community recover missing belongings</p>
        </div>
        <motion.button
          onClick={() => setShowModal(true)}
          className="oc-btn oc-btn-primary"
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Report Item
        </motion.button>
      </div>

      {/* Match Alert Banner */}
      <AnimatePresence>
        {matchedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
              borderLeft: '4px solid #10b981', borderRadius: 'var(--radius-lg)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>Match Found!</p>
              <p style={{ fontSize: 13, color: 'rgba(16,185,129,0.8)' }}>
                {matchedItems.length} item{matchedItems.length > 1 ? 's have' : ' has'} been matched. Click on matched items to view details and contact the reporter.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Category Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text" placeholder="Search items..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="oc-input" style={{ paddingLeft: 36 }}
          />
        </div>
        {/* Category chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategory('')}
            style={{
              padding: '7px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: '1px solid', transition: 'all 0.2s',
              borderColor: !category ? 'var(--accent-primary)' : 'var(--border-subtle)',
              background: !category ? 'var(--accent-primary-glow)' : 'transparent',
              color: !category ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >All</button>
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value === category ? '' : cat.value)}
                style={{
                  padding: '7px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: '1px solid', transition: 'all 0.2s',
                  borderColor: category === cat.value ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: category === cat.value ? 'var(--accent-primary-glow)' : 'transparent',
                  color: category === cat.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <CatIcon size={11} /> {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lost / Found Toggle + Status Filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
          {[
            { key: 'lost', label: 'I Lost Something', color: '#f59e0b' },
            { key: 'found', label: 'I Found Something', color: '#10b981' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 22px', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: activeTab === tab.key ? tab.color : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.key ? `0 4px 14px ${tab.color}40` : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 4, borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'resolved', label: 'Resolved' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '10px 18px', borderRadius: 'var(--radius-md)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: statusFilter === tab.key ? 'var(--accent-primary)' : 'transparent',
                color: statusFilter === tab.key ? 'white' : 'var(--text-secondary)',
                boxShadow: statusFilter === tab.key ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', textAlign: 'center',
          background: 'var(--bg-secondary)', border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Search size={28} style={{ color: 'var(--accent-primary)', opacity: 0.7 }} />
          </div>
          <p style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No {activeTab} items reported</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            {search || category ? 'Try adjusting your search or filters.' : `No ${activeTab} items matching your search.`}
          </p>
        </div>
      ) : (
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ItemCard item={item} onClick={() => setSelectedItem(item)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 640,
                overflow: 'hidden', boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ height: 200, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {selectedItem.image
                  ? <img src={selectedItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={60} style={{ opacity: 0.1 }} />}
                <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
                <div style={{ position: 'absolute', top: 14, left: 14 }}>
                  <span style={{
                    background: selectedItem.item_type === 'lost' ? 'rgba(245,158,11,0.8)' : 'rgba(16,185,129,0.8)',
                    color: 'white', padding: '4px 12px', borderRadius: 99,
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                    backdropFilter: 'blur(10px)',
                  }}>
                    {selectedItem.item_type}
                  </span>
                </div>
              </div>
              <div style={{ padding: 28 }}>
                <h2 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{selectedItem.title}</h2>
                <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} /> {selectedItem.location_found_or_lost}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={12} /> {selectedItem.date_lost_or_found}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Tag size={12} /> {selectedItem.category}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                  {selectedItem.description}
                </p>
                {selectedItem.status === 'matched' && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                    This item has been matched! Contact the reporter to arrange collection.
                  </div>
                )}
                {selectedItem.status === 'resolved' && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} />
                    This item has been resolved{selectedItem.resolved_at ? ` on ${new Date(selectedItem.resolved_at).toLocaleDateString()}` : ''}.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  {selectedItem.status !== 'resolved' ? (
                    <motion.button
                      onClick={() => handleResolve(selectedItem.id)}
                      disabled={resolving}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        flex: 1, padding: '12px 20px', borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-hero)', color: 'white',
                        border: 'none', fontSize: 14, fontWeight: 700, cursor: resolving ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: resolving ? 0.7 : 1,
                      }}
                    >
                      <CheckCircle size={16} /> {resolving ? 'Resolving...' : 'Mark as Resolved'}
                    </motion.button>
                  ) : (
                    <div style={{
                      flex: 1, padding: '12px 20px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(16,185,129,0.15)', color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)', fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      <CheckCircle size={16} /> Resolved
                    </div>
                  )}
                  <button onClick={() => setSelectedItem(null)} className="oc-btn oc-btn-secondary">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 560,
                padding: 32, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 20 }}>Report an Item</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={18} /></button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Lost / Found Segmented Control */}
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  {[
                    { key: 'lost', label: 'I Lost Something', color: '#f59e0b' },
                    { key: 'found', label: 'I Found Something', color: '#10b981' },
                  ].map(tab => (
                    <button key={tab.key} type="button" onClick={() => setFormData({ ...formData, item_type: tab.key })}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                        background: formData.item_type === tab.key ? tab.color : 'transparent',
                        color: formData.item_type === tab.key ? 'white' : 'var(--text-secondary)',
                      }}
                    >{tab.label}</button>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Item Title *</label>
                  <input required maxLength={200} className="oc-input" placeholder="e.g., Black HP laptop bag" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>

                {/* Category Icon Grid */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>Category *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {CATEGORIES.map(cat => {
                      const CatIcon = cat.icon;
                      const isSelected = formData.category === cat.value;
                      return (
                        <button key={cat.value} type="button" onClick={() => setFormData({ ...formData, category: cat.value })}
                          style={{
                            padding: '10px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            background: isSelected ? 'var(--accent-primary-glow)' : 'transparent',
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                          }}
                        >
                          <CatIcon size={18} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Location *</label>
                    <input required className="oc-input" placeholder="Where was it lost/found?" value={formData.location_found_or_lost} onChange={e => setFormData({ ...formData, location_found_or_lost: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Date *</label>
                    <input type="date" required className="oc-input" value={formData.date_lost_or_found} onChange={e => setFormData({ ...formData, date_lost_or_found: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Description *</label>
                  <textarea required rows={3} className="oc-input" placeholder="Provide extra details (color, size, contents...)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ resize: 'none' }} />
                </div>

                {/* Drag-drop image upload */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Add Photo (Optional)</label>
                  <label htmlFor="lf-image-upload" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '24px', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'all 0.2s', gap: 8,
                  }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFormData({ ...formData, image: f }); }}
                  >
                    <Image size={24} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {formData.image ? formData.image.name : 'Drop image here or click to browse'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', opacity: 0.6 }}>Helps with faster matching</span>
                  </label>
                  <input id="lf-image-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
                </div>

                <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="oc-btn oc-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <motion.button type="submit" disabled={submitting} whileTap={{ scale: 0.97 }} className="oc-btn oc-btn-primary" style={{ flex: 1 }}>
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        Submitting...
                      </span>
                    ) : 'Submit Report'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LostFoundPage;
