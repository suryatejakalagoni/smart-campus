import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiFilter, FiCalendar, FiMapPin, FiUser, FiInfo } from 'react-icons/fi';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const TimetableView = () => {
  const [schedules, setSchedules] = useState([]);
  const [section, setSection] = useState('CSE-A');
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(true);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const times = [
    '09:00:00', '10:00:00', '11:00:00', '12:00:00', 
    '13:00:00', '14:00:00', '15:00:00', '16:00:00'
  ];

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get(`schedule/?section=${section}&semester=${semester}`);
      setSchedules(res.data);
    } catch (err) {
      toast.error('Failed to resolve academic calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [section, semester]);

  const getDaySchedules = (day) => schedules.filter(s => s.day_of_week === day);

  const getSubjectColor = (subject) => {
    const colors = [
      'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'bg-teal-500/10 text-teal-400 border-teal-500/20',
      'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'bg-rose-500/10 text-rose-400 border-rose-500/20',
    ];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Academic Timetable</h1>
          <p className="text-slate-400">Weekly distribution of theory and lab sessions</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            {['CSE-A', 'CSE-B', 'ECE-A', 'ME-A'].map(sec => (
              <button 
                key={sec}
                onClick={() => setSection(sec)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  section === sec ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
          <select 
            className="bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-widest text-teal-400 outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : schedules.length === 0 ? (
        <EmptyState 
           message="No classes scheduled"
           description="The timetable for this section and semester has not been updated yet."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <div className="min-w-[1200px] pb-10">
              {/* Header */}
              <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-slate-800/50 border-b border-slate-700">
                <div className="p-4"></div>
                {days.map(day => (
                  <div key={day} className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-l border-slate-700/50">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[100px_repeat(6,1fr)] relative">
                {/* Time Indicators */}
                <div className="flex flex-col bg-slate-900/50">
                  {times.map(time => (
                    <div key={time} className="h-32 border-r border-slate-800 p-4 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest flex flex-col justify-start">
                      {time.slice(0, 5)}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {days.map(day => (
                  <div key={day} className="relative h-full border-r border-slate-800/100">
                    {getDaySchedules(day).map(cls => {
                      const startHour = parseInt(cls.start_time.split(':')[0]);
                      const startMin = parseInt(cls.start_time.split(':')[1]);
                      const duration = (parseInt(cls.end_time.split(':')[0]) - startHour) + (parseInt(cls.end_time.split(':')[1]) - startMin) / 60;
                      
                      const top = (startHour - 9 + startMin/60) * 128;
                      const height = duration * 128;

                      return (
                        <div 
                          key={cls.id}
                          className={`absolute left-2 right-2 p-4 border rounded-2xl transition-all hover:scale-[1.02] hover:z-20 cursor-pointer shadow-xl ${getSubjectColor(cls.subject)}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-black text-xs uppercase italic tracking-tighter leading-none">{cls.subject}</p>
                            <span className="text-[8px] font-black uppercase opacity-60">{cls.start_time.slice(0, 5)}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
                              <FiUser className="shrink-0" /> {cls.faculty_details.username}
                            </p>
                            <p className="text-[9px] font-bold flex items-center gap-1.5 opacity-80 uppercase tracking-widest">
                              <FiMapPin className="shrink-0" /> {cls.room}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                
                {/* Horizontal Guide Lines */}
                {times.map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute left-[100px] right-0 border-b border-slate-800/50 pointer-events-none" 
                    style={{ top: `${(i + 1) * 128}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
