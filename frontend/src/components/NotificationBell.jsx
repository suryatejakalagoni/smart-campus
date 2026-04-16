import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdNotifications, MdNotificationsNone, MdOutlineClose, MdCheck } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('notifications/'),
        api.get('notifications/unread-count/')
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRead = async (id, link) => {
    try {
      await api.patch(`notifications/${id}/read/`);
      fetchNotifications();
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('notifications/mark-all-read/');
      toast.success('All marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all relative"
      >
        {unreadCount > 0 ? <MdNotifications size={24} className="text-teal-400" /> : <MdNotificationsNone size={24} />}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900 leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-bold text-white">Notifications</h3>
            <button onClick={markAllAsRead} className="text-[10px] font-bold text-teal-400 hover:underline uppercase tracking-wider">
              Mark all read
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-700">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleRead(notif.id, notif.link)}
                  className={`p-4 hover:bg-slate-700/30 cursor-pointer transition-all flex gap-3 ${!notif.is_read ? 'bg-teal-500/5' : ''}`}
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-teal-400' : 'bg-transparent'}`} />
                  <div className="space-y-1">
                    <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-white font-medium' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-slate-900/50 text-center border-t border-slate-700">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Campus Link Pro Notifications</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
