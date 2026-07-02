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
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-slate-800">Orders Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly bookings — live from database</p>
          </div>
          <span className="text-xs bg-primary-50 text-primary-700 font-bold px-2 py-1 rounded-md">
            Last 6 Months
          </span>
        </div>

        {loading ? (
          <div className="flex-1 min-h-65 flex items-center justify-center text-slate-300">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : trend.length === 0 ? (
          <div className="flex-1 min-h-65 flex items-center justify-center text-slate-400 text-sm">
            No order data available yet
          </div>
        ) : (
          <div className="flex-1 min-h-65 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trend}
                margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                barCategoryGap="35%"
              >
                <defs>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.85}/>
                  </linearGradient>
                  <linearGradient id="colorFaded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#dbeafe" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                  itemStyle={{ color: '#1e3a8a', fontWeight: 'bold' }}
                  cursor={{ fill: '#f1f5f9', radius: 8 }}
                  formatter={(value, name) => [value, name === 'orders' ? 'Orders' : 'Total Qty']}
                />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]} maxBarSize={64} animationDuration={1200}>
                  {trend.map((_, i) => (
                    <Cell key={i} fill={i === trend.length - 1 ? 'url(#colorBlue)' : 'url(#colorFaded)'} />
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
