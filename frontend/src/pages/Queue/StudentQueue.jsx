import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiClock, FiCheckCircle, FiShield, FiXCircle } from 'react-icons/fi';
import Badge from '../../components/common/Badge';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const StudentQueue = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    purpose: 'certificate_collection',
    description: '',
    time_slot: '',
  });
  const [lastBooking, setLastBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('queue/');
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await api.get(`queue/slots/?date=${date}`);
      setSlots(res.data);
    } catch (err) {
      toast.error('Failed to fetch available slots');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (date) fetchSlots();
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('queue/', { ...formData, preferred_date: date });
      toast.success('Appointment booked successfully!');
      setLastBooking(res.data);
      setShowModal(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Queue Booking</h1>
          <p className="text-slate-400">Schedule document submissions and collections</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center justify-center gap-2 px-8 py-3 shadow-xl shadow-teal-500/10">
          <FiPlus size={20} />
          <span>Book Appointment</span>
        </button>
      </div>

      {lastBooking && (
        <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/5 border border-teal-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-teal-500/10 scale-in-center">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FiShield size={200} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-teal-400" size={32} />
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Booking Confirmed!</h2>
              </div>
              <p className="text-slate-400 max-w-md">Your appointment has been registered in the system. Please present this token and OTP at the office.</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Token Number</p>
                <p className="text-2xl font-black text-teal-400 italic">{lastBooking.token_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security OTP</p>
                <p className="text-2xl font-black text-white tracking-widest">{lastBooking.otp}</p>
              </div>
              <div className="space-y-1 col-span-2 lg:col-span-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Slot</p>
                <p className="text-sm font-bold text-slate-300 capitalize">{lastBooking.preferred_date} @ {lastBooking.time_slot}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setLastBooking(null)}
              className="px-4 py-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest self-start lg:self-center"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : bookings.length === 0 ? (
        <EmptyState 
           message="No bookings found"
           description="Avoid the rush by scheduling your visit in advance."
        />
      ) : (
        <div className="card overflow-hidden transition-all">
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/100 border-b border-slate-700">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Token</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Purpose</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timing</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-700/20 group transition-all">
                    <td className="px-8 py-5 font-black text-teal-400 italic">{booking.token_number}</td>
                    <td className="px-8 py-5 font-bold uppercase text-sm tracking-tight">{booking.purpose.replace(/_/g, ' ')}</td>
                    <td className="px-8 py-5 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-teal-500/50" />
                        {booking.preferred_date} • {booking.time_slot}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge status={booking.status} />
                    </td>
                    <td className="px-8 py-5">
                      {(booking.status === 'booked' || booking.status === 'in_progress') ? (
                        <div className="flex items-center gap-2">
                          <FiShield className="text-slate-600" />
                          <span className="font-black tracking-widest text-white">{booking.otp}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">---</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">New Appointment</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
              >
                <FiPlus className="rotate-45" size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Purpose of Visit</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  >
                    <option value="certificate_collection">Certificate Collection</option>
                    <option value="document_submission">Document Submission</option>
                    <option value="fee_related">Fee Related</option>
                    <option value="transcript_request">Transcript Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Select Date</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Additional Description</label>
                <textarea 
                  rows="2" 
                  required 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 placeholder:text-slate-600" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What specifically do you need help with?"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Select Availability (Max 10 per slot)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.map((s) => (
                    <button
                      key={s.slot}
                      type="button"
                      disabled={s.remaining === 0}
                      onClick={() => setFormData({...formData, time_slot: s.slot})}
                      className={`p-4 rounded-2xl border transition-all text-left group ${
                        formData.time_slot === s.slot 
                        ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' 
                        : s.remaining > 0 
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed hidden'
                      }`}
                    >
                      <span className="block font-black text-sm italic uppercase">{s.slot}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${formData.time_slot === s.slot ? 'text-teal-200' : 'text-slate-500'}`}>
                        {s.remaining} SLOTS LEFT
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!formData.time_slot || submitting} 
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {submitting ? <Spinner /> : 'Register for Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQueue;
