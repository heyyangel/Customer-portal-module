import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Clock, Box, ShieldAlert } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'New Order Received', message: 'SO-2026-00124 was placed by Acme Corp.', time: '5m ago', unread: true },
  { id: 2, type: 'approval', title: 'Order Approved', message: 'SO-2026-00120 has been approved.', time: '1h ago', unread: true },
  { id: 3, type: 'inventory', title: 'Low Stock Alert', message: 'Product MSIL-8902 is below minimum stock.', time: '2h ago', unread: false },
  { id: 4, type: 'system', title: 'System Update', message: 'ERP portal maintenance scheduled for midnight.', time: '1d ago', unread: false },
];

export const Notifications = () => {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'order': return <Box size={16} className="text-primary-500" />;
      case 'approval': return <Check size={16} className="text-success-500" />;
      case 'inventory': return <ShieldAlert size={16} className="text-warning-500" />;
      default: return <Bell size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      <AnimatePresence>
        {notificationsOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setNotificationsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                    <Bell size={24} className="text-slate-300" />
                    <span className="text-sm font-medium">All caught up!</span>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${notification.unread ? 'bg-primary-50/30' : ''}`}
                      >
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notification.type === 'order' ? 'bg-primary-50' : 
                          notification.type === 'approval' ? 'bg-success-50' :
                          notification.type === 'inventory' ? 'bg-warning-50' : 'bg-slate-100'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-slate-800">{notification.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                              <Clock size={10} /> {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                  View All Activity
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
