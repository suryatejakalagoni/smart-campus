import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdCheck, MdClose, MdEventNote, MdHistory, MdDeleteOutline } from 'react-icons/md';
import { useTimetable } from '../../hooks/useTimetable';

const AdminSchedule = () => {
  const [activeTab, setActiveTab] = useState('manage');
  const [facultyList, setFacultyList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    faculty: '',
    room: '',
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '10:00',
    section: 'CSE-A',
    semester: 1,
  });

  const { schedules, fetchSchedules, addSchedule, deleteSchedule } = useTimetable({ role: 'admin' });

  const fetchSideData = async () => {
    try {
      const [facRes, reqRes] = await Promise.all([
        api.get('users/?role=faculty'),
        api.get('reschedule/')
      ]);
      setFacultyList(facRes.data);
      setRequests(reqRes.data);
    } catch {
      toast.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchSideData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addSchedule(formData);
      toast.success('Class scheduled successfully!');
      setShowModal(false);
    } catch (err) {
      const errorMsg = err.response?.data?.conflict || err.response?.data?.[0] || 'Conflict detected or invalid data';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id, subject) => {
    if (!window.confirm(`PERMANENTLY remove "${subject}" from the schedule? This action cannot be undone.`)) return;
    try {
      await deleteSchedule(id);
      toast.success('Class removed from schedule');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove class');
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.patch(`reschedule/${id}/review/`, { status });
      toast.success(`Request ${status}`);
      fetchSchedules(); // refresh timetable after approval changes slots
      fetchSideData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Review failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-slate-400">Control class timings and approve reschedules</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2 px-6 py-3">
          <MdAdd size={24} />
          <span>Add New Class</span>
        </button>
      </div>

      <div className="flex space-x-8 border-b border-slate-700">
        <button 
          onClick={() => setActiveTab('manage')}
          className={`pb-4 px-2 relative transition-all font-bold ${activeTab === 'manage' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <span className="flex items-center gap-2"><MdEventNote /> Active Schedules</span>
          {activeTab === 'manage' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-400 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`pb-4 px-2 relative transition-all font-bold ${activeTab === 'requests' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <span className="flex items-center gap-2">
            <MdHistory /> Reschedule Requests
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </span>
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'manage' ? (
        <div className="card w-full overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="px-6 py-4 font-semibold text-slate-300">Subject</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Section</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Faculty</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Room</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Time</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {schedules.map(s => (
                <tr key={s.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4 font-bold text-white">{s.subject}</td>
                  <td className="px-6 py-4 font-mono">{s.section} (S{s.semester})</td>
                  <td className="px-6 py-4 capitalize">{s.faculty_details.username}</td>
                  <td className="px-6 py-4">Room {s.room}</td>
                  <td className="px-6 py-4 capitalize">{s.day_of_week}, {s.start_time.slice(0, 5)}-{s.end_time.slice(0, 5)}</td>
                  <td className="px-6 py-4">
                    <button
                      className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                      onClick={() => handleDelete(s.id, s.subject)}
                    >
                      <MdDeleteOutline size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map(req => (
            <div key={req.id} className="card p-6 border-l-4 border-l-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic">{req.original_schedule_details.subject}</h3>
                  <p className="text-slate-400 text-sm">Requested by: <span className="text-white capitalize">{req.requested_by.username}</span></p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-black border ${
                  req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                  req.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                  'bg-red-500/10 text-red-500 border-red-500/30'
                }`}>
                  {req.status.toUpperCase()}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Original Slot</p>
                  <p className="text-sm">{req.original_schedule_details.day_of_week}, {req.original_schedule_details.start_time.slice(0, 5)}-{req.original_schedule_details.end_time.slice(0, 5)}</p>
                  <p className="text-xs text-slate-400 mt-1">Room {req.original_schedule_details.room}</p>
                </div>
                <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/20">
                  <p className="text-[10px] text-teal-500 font-black uppercase mb-2">Requested Slot</p>
                  <p className="text-sm text-teal-400 font-bold">{req.new_date} | {req.new_start_time.slice(0, 5)}-{req.new_end_time.slice(0, 5)}</p>
                  <p className="text-xs text-teal-400/70 mt-1">Room {req.new_room}</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-800/30 rounded-lg italic text-slate-400 text-sm">
                "{req.reason}"
              </div>

              {req.status === 'pending' && (
                <div className="mt-6 flex space-x-4">
                  <button onClick={() => handleReview(req.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><MdCheck /> Approve</button>
                  <button onClick={() => handleReview(req.id, 'rejected')} className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 font-bold py-3 rounded-lg flex items-center justify-center gap-2"><MdClose /> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Schedule New Class</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-300 block mb-2">Subject</label>
                <input required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Faculty</label>
                <select required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.faculty} onChange={(e) => setFormData({...formData, faculty: e.target.value})}>
                  <option value="">Select Faculty</option>
                  {facultyList.map(f => <option key={f.id} value={f.id}>{f.username} — {f.department}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Room Number</label>
                <input required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Day</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 capitalize" value={formData.day_of_week} onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                 <label className="text-sm font-medium text-slate-300 block mb-2">Section</label>
                 <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} />
              </div>
              <div>
                 <label className="text-sm font-medium text-slate-300 block mb-2">Semester</label>
                 <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.semester} onChange={(e) => setFormData({...formData, semester: Number(e.target.value)})}>
                   {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                 </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Start Time</label>
                <input type="time" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">End Time</label>
                <input type="time" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
              </div>
              <div className="col-span-2 flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-3">Publish Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
