import { useEffect } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { KPIStats } from "../../components/dashboard/KPIStats";
import { RevenueChart } from "../../components/dashboard/RevenueChart";
import { ConversionSummary } from "../../components/dashboard/ConversionSummary";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { BackordersTable } from "../../components/backorders/BackordersTable";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PlusCircle, UploadCloud, Users, Package, PackageX } from "lucide-react";

import { useUserStore } from "../../store/userStore";
import { useCartStore } from "../../store/cartStore";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isAdmin = user?.role === "Admin";
  const { pendingItems, fetchPendingReservations } = useCartStore();

  useEffect(() => {
    fetchPendingReservations();
  }, [fetchPendingReservations]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <PageHeader 
          title="Enterprise Dashboard" 
          actions={
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
              <Button size="sm" variant="outline" onClick={() => navigate('/orders/new')}>
                <PlusCircle size={16} className="mr-2" />
                New Order
              </Button>
            </div>
          }
        />
        <p className="text-slate-500 text-sm font-medium">
          Welcome back. Here is the overview of your ERP modules today.
        </p>
      </div>

      <KPIStats />

      <ConversionSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Pending Backorders — admin view of unfulfilled quantities across customers */}
      {isAdmin && (
        <div className="bg-white p-6 border border-amber-200/70 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-400 to-orange-500" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PackageX size={18} className="text-amber-500" /> Pending Backorders
            </h2>
            {pendingItems.length > 0 && (
              <button
                onClick={() => navigate("/orders/backorders")}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full uppercase tracking-widest transition-all"
              >
                View all ({pendingItems.length})
              </button>
            )}
          </div>
          <BackordersTable items={pendingItems.slice(0, 5)} showCustomer compact />
        </div>
      )}


      {/* Quick Actions Bar */}
      <div className={`grid gap-5 mt-4 ${user?.role === 'Admin' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl cursor-pointer hover:border-primary-400 hover:shadow-xl hover:shadow-primary-100 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden" onClick={() => navigate('/orders/new')}>
          <div className="absolute inset-0 bg-linear-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all transform group-hover:-translate-y-1 shadow-sm relative z-10">
            <PlusCircle size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 relative z-10 group-hover:text-primary-700 transition-colors">Create Order</span>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden" onClick={() => navigate('/orders/history')}>
          <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:-translate-y-1 shadow-sm relative z-10">
            <Package size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 relative z-10 group-hover:text-indigo-700 transition-colors">Inventory</span>
        </div>
        {user?.role === 'Admin' && (
          <div className="bg-white p-6 border border-slate-200 rounded-2xl cursor-pointer hover:border-success-400 hover:shadow-xl hover:shadow-success-100 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden" onClick={() => navigate('/admin/approvals')}>
            <div className="absolute inset-0 bg-linear-to-br from-success-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center group-hover:bg-success-600 group-hover:text-white transition-all transform group-hover:-translate-y-1 shadow-sm relative z-10">
              <Users size={24} />
            </div>
            <span className="text-sm font-bold text-slate-700 relative z-10 group-hover:text-success-700 transition-colors">Approve Orders</span>
          </div>
        )}
        <div className="bg-white p-6 border border-slate-200 rounded-2xl cursor-pointer hover:border-warning-400 hover:shadow-xl hover:shadow-warning-100 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden" onClick={() => navigate('/orders/bulk-upload')}>
          <div className="absolute inset-0 bg-linear-to-br from-warning-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center group-hover:bg-warning-600 group-hover:text-white transition-all transform group-hover:-translate-y-1 shadow-sm relative z-10">
            <UploadCloud size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700 relative z-10 group-hover:text-warning-700 transition-colors">Excel Import</span>
        </div>
      </div>
    </div>
  );
};
