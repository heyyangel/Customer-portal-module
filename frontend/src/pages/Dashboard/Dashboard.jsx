import { PageHeader } from "../../components/common/PageHeader";
import { KPIStats } from "../../components/dashboard/KPIStats";
import { RevenueChart } from "../../components/dashboard/RevenueChart";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PlusCircle, UploadCloud, Users, Package } from "lucide-react";

import { useUserStore } from "../../store/userStore";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <PageHeader title="Enterprise Dashboard" />
          <p className="text-slate-500 text-sm -mt-1">
            Welcome back. Here is the overview of your ERP modules today.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'Admin' && (
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/approvals')}>
              <Users size={16} className="mr-2" />
              Approvals
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate('/orders/bulk-upload')}>
            <UploadCloud size={16} className="mr-2" />
            Bulk Import
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/orders/new')}>
            <PlusCircle size={16} className="mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <KPIStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
      
      {/* Quick Actions Bar */}
      <div className={`grid gap-4 mt-2 ${user?.role === 'Admin' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div className="bg-white p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group" onClick={() => navigate('/orders/new')}>
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <PlusCircle size={20} />
          </div>
          <span className="text-sm font-bold text-slate-700">Create Order</span>
        </div>
        <div className="bg-white p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group" onClick={() => navigate('/orders/history')}>
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Package size={20} />
          </div>
          <span className="text-sm font-bold text-slate-700">Inventory</span>
        </div>
        {user?.role === 'Admin' && (
          <div className="bg-white p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-success-300 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group" onClick={() => navigate('/admin/approvals')}>
            <div className="w-10 h-10 rounded-full bg-success-50 text-success-600 flex items-center justify-center group-hover:bg-success-600 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <span className="text-sm font-bold text-slate-700">Approve Orders</span>
          </div>
        )}
        <div className="bg-white p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-warning-300 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group" onClick={() => navigate('/orders/bulk-upload')}>
          <div className="w-10 h-10 rounded-full bg-warning-50 text-warning-600 flex items-center justify-center group-hover:bg-warning-600 group-hover:text-white transition-colors">
            <UploadCloud size={20} />
          </div>
          <span className="text-sm font-bold text-slate-700">Excel Import</span>
        </div>
      </div>
    </div>
  );
};
