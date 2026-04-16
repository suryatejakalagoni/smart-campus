import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdToday, MdCheckCircle, MdPendingActions, MdGroup } from 'react-icons/md';

const AdminQueue = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  const fetchBookings = async () => {
    try {
      const res = await api.get(`queue/?date=${date}`);
      setBookings(res.data);
      
      const total = res.data.length;
      const completed = res.data.filter(b => b.status === 'completed').length;
      const pending = res.data.filter(b => b.status === 'booked' || b.status === 'in_progress').length;
      setStats({ total, completed, pending });
    } catch (err) {
      toast.error('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [date]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`queue/${id}/`, { status });
      toast.success(`Booking marked as ${status}`);
      fetchBookings();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const groupedBySlot = bookings.reduce((acc, booking) => {
    if (!acc[booking.time_slot]) acc[booking.time_slot] = [];
    acc[booking.time_slot].push(booking);
    return acc;
  }, {});

  const slots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', 
    '12:00-13:00', '14:00-15:00', '15:00-16:00'
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-slate-400">Monitoring and processing today's tokens</p>
        </div>
        <div className="flex items-center space-x-4 bg-slate-800 p-2 rounded-xl">
          <MdToday className="text-teal-500 ml-2" size={24} />
          <input 
            type="date" 
            className="bg-transparent border-none text-white focus:ring-0 cursor-pointer" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total Bookings</span>
            <MdGroup className="text-blue-500" size={24} />
          </div>
          <p className="text-4xl font-black mt-2">{stats.total}</p>
        </div>
        <div className="card p-6 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Completed</span>
            <MdCheckCircle className="text-teal-500" size={24} />
          </div>
          <p className="text-4xl font-black mt-2">{stats.completed}</p>
        </div>
        <div className="card p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Pending</span>
            <MdPendingActions className="text-yellow-500" size={24} />
          </div>
          <p className="text-4xl font-black mt-2">{stats.pending}</p>
        </div>
      </div>

      {/* Grouped View */}
      <div className="space-y-6">
        {slots.map(slot => (
          <div key={slot} className="space-y-3">
            <h3 className="text-lg font-bold text-slate-300 flex items-center">
              <span className="bg-slate-700 px-3 py-1 rounded-lg mr-3 text-teal-400">{slot}</span>
              <span className="text-sm font-medium text-slate-500">
                {groupedBySlot[slot]?.length || 0} Bookings
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedBySlot[slot]?.map(booking => (
                <div key={booking.id} className={`card p-5 border-2 transition-all ${
                  booking.status === 'in_progress' ? 'border-teal-500 shadow-teal-500/10' : 'border-transparent'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Token Number</p>
                      <p className="text-xl font-black text-teal-400">{booking.token_number}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'in_progress' ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <p className="text-white font-bold">{booking.student.username}</p>
                    <p className="text-slate-400 text-xs truncate capitalize">{booking.purpose.replace('_', ' ')}</p>
                  </div>

                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="flex space-x-2">
                      {booking.status === 'booked' && (
                        <button 
                          onClick={() => updateStatus(booking.id, 'in_progress')}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition"
                        >
                          Start
                        </button>
                      )}
                      <button 
                        onClick={() => updateStatus(booking.id, 'completed')}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-teal-400 text-xs font-bold py-2 rounded-lg transition"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(!groupedBySlot[slot] || groupedBySlot[slot].length === 0) && (
                <div className="col-span-full py-4 text-center text-slate-600 text-sm italic">
                  No bookings scheduled for this slot.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQueue;
