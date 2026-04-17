import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdCheckCircle, MdCancel, MdAccessTime, MdSave } from 'react-icons/md';

const FacultyAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('schedule/'); // Already filtered for own schedule in logic
        setClasses(res.data);
      } catch (err) {
        toast.error('Failed to fetch classes');
      }
    };
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const cls = classes.find(c => c.id === parseInt(selectedClass));
      const res = await api.get(`users/?role=student&section=${cls?.section || ''}`);
      const studentList = res.data;
      setStudents(studentList);

      const initial = {};
      studentList.forEach(s => initial[s.id] = 'present');
      setAttendanceData(initial);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  const handleSubmit = async () => {
    try {
      const payload = students.map(s => ({
        student_id: s.id,
        status: attendanceData[s.id],
        schedule_id: selectedClass,
        date: date
      }));
      await api.post('attendance/mark-bulk/', payload);
      toast.success('Attendance submitted successfully!');
      
      const counts = payload.reduce((acc, curr) => {
        acc[curr.status]++;
        return acc;
      }, { present: 0, absent: 0, late: 0 });
      
      toast(`Summary: ${counts.present} Present, ${counts.absent} Absent, ${counts.late} Late`, { icon: '📊' });
    } catch (err) {
      toast.error('Failed to submit attendance');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Mark Attendance</h1>
          <p className="text-slate-400">Log student presence for your scheduled sessions</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="date" 
            className="bg-slate-800 border-none rounded-xl px-4 py-3" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <select 
            className="bg-slate-800 border-none rounded-xl px-6 py-3 font-bold text-teal-400"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select a Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.subject} - {c.section} ({c.day_of_week})</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClass ? (
        <div className="card p-20 text-center border-dashed border-2 border-slate-700">
           <p className="text-slate-500 italic text-xl">Please select a class to start marking attendance.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="px-8 py-4 font-bold text-slate-300">Roll Number</th>
                <th className="px-8 py-4 font-bold text-slate-300">Student Name</th>
                <th className="px-8 py-4 font-bold text-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-slate-700/20 transition-all">
                  <td className="px-8 py-5 font-mono text-teal-500 font-bold">{student.roll_number}</td>
                  <td className="px-8 py-5 font-bold uppercase">{student.username}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center space-x-2">
                       {['present', 'absent', 'late'].map(status => (
                         <button
                           key={status}
                           onClick={() => setAttendanceData({...attendanceData, [student.id]: status})}
                           className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                             attendanceData[student.id] === status
                             ? status === 'present' ? 'bg-emerald-500 text-white' : status === 'absent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                             : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                           }`}
                         >
                           {status === 'present' && <MdCheckCircle />}
                           {status === 'absent' && <MdCancel />}
                           {status === 'late' && <MdAccessTime />}
                           {status.toUpperCase()}
                         </button>
                       ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-8 bg-slate-800/30 flex justify-end">
            <button 
              onClick={handleSubmit}
              className="btn-primary px-10 py-4 flex items-center gap-2 shadow-xl shadow-teal-500/10"
            >
              <MdSave size={24} /> Submit Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAttendance;
