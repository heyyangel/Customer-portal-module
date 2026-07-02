import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Package, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const STATUS_ICON = {
  Booked:     <Clock    size={14} className="text-warning-500" />,
  Approved:   <CheckCircle size={14} className="text-success-500" />,
  Dispatched: <Package  size={14} className="text-indigo-500" />,
  Delivered:  <CheckCircle size={14} className="text-emerald-500" />,
  Cancelled:  <AlertTriangle size={14} className="text-error-500" />,
};

const STATUS_DOT = {
  Booked:     'bg-warning-400',
  Approved:   'bg-success-400',
  Dispatched: 'bg-indigo-400',
  Delivered:  'bg-emerald-400',
  Cancelled:  'bg-error-400',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
};

export const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setActivities(r.data.data?.recentOrders || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-800">Recent Orders</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live from database</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-300">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            No orders yet
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((order, idx) => (
              <div key={order._id || idx} className="flex gap-3 relative">
                {idx !== activities.length - 1 && (
                  <div className="absolute left-[15px] top-9 w-px h-full bg-slate-100 -z-10" />
                )}
                <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center bg-slate-50 border border-slate-200 mt-0.5">
                  {STATUS_ICON[order.status] ?? <Package size={14} className="text-slate-400" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {order.orderId || order._id}
                    </span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[order.status] || 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-400 flex-shrink-0">{order.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    SKU: <span className="font-semibold text-slate-700">{order.skuCode}</span>
                    {order.brand ? ` · ${order.brand}` : ''}
                    {order.requestedQty ? ` · Qty: ${order.requestedQty}` : ''}
                  </p>
                  {order.company && (
                    <p className="text-xs text-slate-400 truncate">{order.company}</p>
                  )}
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {(() => {
                      const trueDate = order.orderTimestamp || order.date || order.createdAt;
                      return (
                        <>
                          {new Date(trueDate).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })} • {timeAgo(trueDate)}
                        </>
                      );
                    })()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
