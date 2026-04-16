import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdOutlineHistory, MdEventBusy, MdSend, MdSchedule } from 'react-icons/md';

const FacultyReschedule = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    new_date: '',
    new_start_time: '',
    new_end_time: '',
    new_room: '',
    reason: '',
  });

  const fetchData = async () => {
    try {
      const [clsRes, reqRes] = await Promise.all([
        api.get('schedule/'), // Backend filters for faculty if implementation follow v3 plan
        api.get('reschedule/')
      ]);
      setMyClasses(clsRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('reschedule/', {
        ...formData,
        original_schedule: selectedClass.id
      });
      toast.success('Reschedule request submitted!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Reschedule Center</h1>
        <p className="text-slate-400">Manage your class timings and adjustments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Classes List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><MdSchedule className="text-teal-400" /> My Active Classes</h2>
          <div className="space-y-3">
            {myClasses.map(cls => (
              <div key={cls.id} className="card p-5 flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-lg text-white">{cls.subject}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">{cls.section} | {cls.day_of_week}</p>
                  <p className="text-sm text-teal-500 font-medium mt-1">{cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)} | Room {cls.room}</p>
                </div>
                <button 
                  onClick={() => { setSelectedClass(cls); setShowModal(true); }}
                  className="bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                  Request Reschedule
                </button>
              </div>
            ))}
            {myClasses.length === 0 && <div className="card p-10 text-center text-slate-500">No classes assigned yet.</div>}
          </div>
        </div>

        {/* Requests History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><MdOutlineHistory className="text-teal-400" /> Request History</h2>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="card p-5 border-l-4 border-l-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white">{req.original_schedule_details.subject}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase">{req.created_at.split('T')[0]}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    req.status === 'approved' ? 'bg-green-500 text-white' :
                    req.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-500 font-bold uppercase block mb-1">From</label>
                    <p className="text-slate-300">{req.original_schedule_details.day_of_week}, {req.original_schedule_details.start_time.slice(0, 5)}</p>
                  </div>
                  <div>
                    <label className="text-teal-500 font-bold uppercase block mb-1">To (Requested)</label>
                    <p className="text-teal-400">{req.new_date}, {req.new_start_time.slice(0, 5)}</p>
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && <div className="card p-10 text-center text-slate-500 italic">No history found.</div>}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Request Reschedule</h2>
            <p className="text-slate-400 mb-6 italic">Adjusting timetable for <span className="text-white font-bold">{selectedClass?.subject}</span></p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">New Date</label>
                <input type="date" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.new_date} onChange={(e) => setFormData({...formData, new_date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">Start Time</label>
                  <input type="time" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.new_start_time} onChange={(e) => setFormData({...formData, new_start_time: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">End Time</label>
                  <input type="time" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.new_end_time} onChange={(e) => setFormData({...formData, new_end_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">New Room</label>
                <input required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.new_room} onChange={(e) => setFormData({...formData, new_room: e.target.value})} placeholder="e.g., Room 101" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Reason</label>
                <textarea rows="3" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"><MdSend /> Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyReschedule;
