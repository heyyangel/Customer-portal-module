import { useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ApprovalMetricsCard } from '../../components/admin/ApprovalMetricsCard';
import { ApprovalToolbar } from '../../components/admin/ApprovalToolbar';
import { ApprovalTable } from '../../components/admin/ApprovalTable';
import { ApprovalDrawer } from '../../components/admin/ApprovalDrawer';
import { useApprovalStore } from '../../store/approvalStore';
import { Bell } from 'lucide-react';

export const ApprovalDashboard = () => {
  const { fetchApprovals, notifications } = useApprovalStore();

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  return (
    <div className="flex flex-col gap-6 relative h-full">
      <div className="flex items-start justify-between">
        <div>
          <PageHeader title="Admin Approval Dashboard" />
          <p className="text-slate-600 -mt-2 text-sm">
            Review, approve, and manage the lifecycle of customer orders.
          </p>
        </div>
        <div className="relative cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
          <Bell className="text-slate-600" size={24} />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-error-500 rounded-full border-2 border-white"></span>
          )}
        </div>
      </div>

      <ApprovalMetricsCard />

      <ApprovalToolbar />

      <ApprovalTable />

      <ApprovalDrawer />
    </div>
  );
};
