import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent } from '../ui/Card';
import { api } from '../../services/api';
import { Loader2 } from 'lucide-react';

export const RevenueChart = () => {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setTrend(r.data.data?.monthlyTrend || []))
      .catch(() => setTrend([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800">Orders Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly bookings — live from database</p>
          </div>
          <span className="text-xs bg-primary-50 text-primary-700 font-bold px-2 py-1 rounded-md">
            Last 6 Months
          </span>
        </div>

        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-slate-300">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : trend.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            No order data available yet
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => [value, name === 'orders' ? 'Orders' : 'Total Qty']}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {trend.map((_, i) => (
                    <Cell key={i} fill={i === trend.length - 1 ? '#0ea5e9' : '#bae6fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
