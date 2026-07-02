import { Card, CardContent } from '../../components/ui/Card';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';

export const Reports = () => {
  // Mock Data
  const monthlyRevenue = [
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 52000 },
    { month: 'Mar', value: 48000 },
    { month: 'Apr', value: 61000 },
    { month: 'May', value: 59000 },
    { month: 'Jun', value: 75000 },
  ];
  
  const maxRevenue = Math.max(...monthlyRevenue.map(d => d.value));

  const topProducts = [
    { name: 'Precision Digital Caliper', sales: 1245 },
    { name: 'Heavy Duty Impact Wrench', sales: 980 },
    { name: 'Industrial Multimeter Pro', sales: 850 },
    { name: 'Laser Distance Meter', sales: 720 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Analytics and performance metrics for the current fiscal year.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                <DollarSign size={20} />
              </div>
              <span className="text-xs font-bold text-success-600 bg-success-50 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> +12.5%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-900">$340,000</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Package size={20} />
              </div>
              <span className="text-xs font-bold text-success-600 bg-success-50 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> +8.2%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orders Processed</p>
              <h3 className="text-2xl font-black text-slate-900">1,284</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <BarChart3 size={20} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</p>
              <h3 className="text-2xl font-black text-slate-900">$264.80</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 border-none">
          <CardContent className="p-5 flex flex-col gap-2 justify-center h-full">
            <div className="text-slate-300 text-sm font-medium mb-1">Download Full Report</div>
            <button 
              onClick={() => {
                import('../../utils/exportUtils').then(({ exportToExcel }) => {
                  const cols = [{ key: 'month', label: 'Month' }, { key: 'value', label: 'Revenue' }];
                  exportToExcel(monthlyRevenue, cols, 'Revenue_Report');
                });
              }}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border border-white/10 flex items-center justify-center gap-2"
            >
              Export Excel
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  import('../../utils/exportUtils').then(({ exportToPDF }) => {
                    const cols = [{ key: 'month', label: 'Month' }, { key: 'value', label: 'Revenue ($)' }];
                    exportToPDF(monthlyRevenue, cols, 'Monthly Revenue Report', 'Revenue_Report');
                  });
                }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition-colors border border-white/5 flex items-center justify-center gap-2"
              >
                PDF
              </button>
              <button 
                onClick={() => {
                  import('../../utils/exportUtils').then(({ printData }) => {
                    const cols = [{ key: 'month', label: 'Month' }, { key: 'value', label: 'Revenue ($)' }];
                    printData(monthlyRevenue, cols, 'Monthly Revenue Report');
                  });
                }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition-colors border border-white/5 flex items-center justify-center gap-2"
              >
                Print
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart (CSS Based) */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Revenue Over Time (6 Months)</h3>
            <div className="h-64 flex items-end justify-between gap-2 pt-4">
              {monthlyRevenue.map((data, index) => {
                const heightPercent = (data.value / maxRevenue) * 100;
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full flex justify-center h-full items-end relative">
                      <div 
                        className="w-full max-w-[40px] bg-primary-100 group-hover:bg-primary-200 rounded-t-sm transition-all relative overflow-hidden"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute bottom-0 w-full bg-primary-500" style={{ height: '4px' }} />
                      </div>
                      {/* Tooltip placeholder */}
                      <div className="absolute -top-8 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        ${data.value.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Top Selling Products</h3>
            <div className="flex flex-col gap-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700">{product.name}</span>
                    <span className="font-bold text-slate-900">{product.sales} units</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${(product.sales / topProducts[0].sales) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
