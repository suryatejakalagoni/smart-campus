import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useTimetable = ({ section, semester, role } = {}) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      let url = 'schedule/';
      if ((role === 'admin' || role === 'student') && section && semester) {
        url += `?section=${section}&semester=${semester}`;
      }
      const res = await api.get(url);
      setSchedules(res.data);
      setError(null);
    } catch {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [section, semester, role]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (data) => {
    const res = await api.post('schedule/', data);
    setSchedules(prev =>
      [...prev, res.data].sort(
        (a, b) => a.day_of_week.localeCompare(b.day_of_week) || a.start_time.localeCompare(b.start_time)
      )
    );
    return res.data;
  };

  const updateSchedule = async (id, data) => {
    const res = await api.patch(`schedule/${id}/`, data);
    setSchedules(prev => prev.map(s => (s.id === id ? res.data : s)));
    return res.data;
  };

  const deleteSchedule = async (id) => {
    await api.delete(`schedule/${id}/`);
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return { schedules, loading, error, fetchSchedules, addSchedule, updateSchedule, deleteSchedule };
};
