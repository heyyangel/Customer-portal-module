import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/Card';
import { TrendingUp, Package, Clock, CheckCircle, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useUserStore } from '../../store/userStore';

export const KPIStats = () => {
  const { user } = useUserStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    const skeletonCount = user?.role === 'Admin' ? 6 : 5;
    const gridCols = user?.role === 'Admin' ? 'xl:grid-cols-6' : 'xl:grid-cols-5';
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridCols} gap-4`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-24 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const tiles = [
    {
      id: 1, title: 'Total Products',
      value: stats?.totalProducts?.toLocaleString() ?? '—',
      sub: 'Across all brands',
      icon: Package, color: 'primary'
    },
    {
      id: 2, title: 'Active Orders',
      value: stats?.bookedOrders?.toLocaleString() ?? '—',
      sub: `${stats?.totalOrders ?? 0} total orders`,
      icon: Clock, color: 'warning'
    },
    {
      id: 3, title: 'Approved Orders',
      value: stats?.approvedOrders?.toLocaleString() ?? '—',
      sub: 'Awaiting dispatch',
      icon: TrendingUp, color: 'indigo'
    },
    {
      id: 4, title: 'Delivered',
      value: stats?.deliveredOrders?.toLocaleString() ?? '—',
      sub: 'Completed deliveries',
      icon: CheckCircle, color: 'success'
    },
    {
      id: 5, title: 'Low Stock SKUs',
      value: stats?.lowStockAlerts?.toLocaleString() ?? '—',
      sub: 'Available for sale ≤ 0',
      icon: AlertTriangle, color: 'error'
    },
    ...(user?.role === 'Admin' ? [{
      id: 6, title: 'Active Users',
      value: stats?.activeUsers?.toLocaleString() ?? '—',
      sub: 'Registered customers',
      icon: Users, color: 'emerald'
    }] : []),
  ];

  const colorMap = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    warning:  'bg-warning-50  text-warning-600  border-warning-200',
    indigo:   'bg-indigo-50   text-indigo-600   border-indigo-200',
    success:  'bg-success-50  text-success-600  border-success-200',
    error:    'bg-error-50    text-error-600    border-error-200',
    emerald:  'bg-emerald-50  text-emerald-600  border-emerald-200',
  };

  const gridCols = user?.role === 'Admin' ? 'xl:grid-cols-6' : 'xl:grid-cols-5';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gridCols} gap-4`}>
      {tiles.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className={`p-2 rounded-lg border w-fit ${colorMap[stat.color]}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5 tracking-wide">{stat.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
