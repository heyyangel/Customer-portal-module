import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/Card';
import { Clock, CheckCircle, XCircle, Users, Activity, Package } from 'lucide-react';
import { useApprovalStore } from '../../store/approvalStore';

export const ApprovalMetricsCard = () => {
  const { allApprovals } = useApprovalStore();

  const metrics = [
    {
      title: 'Pending Approvals',
      value: allApprovals.filter((a) => a.workflowStage === 'Booked').length,
      icon: Clock,
      color: 'warning',
    },
    {
      title: 'Approved Today',
      value: allApprovals.filter((a) => a.workflowStage === 'Approved').length,
      icon: CheckCircle,
      color: 'success',
    },
    {
      title: 'Dispatched',
      value: allApprovals.filter((a) => a.workflowStage === 'Dispatched').length,
      icon: Package,
      color: 'primary',
    },
    {
      title: 'Cancelled',
      value: allApprovals.filter((a) => a.workflowStage === 'Cancelled').length,
      icon: XCircle,
      color: 'error',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        const colorStyles = {
          warning: 'bg-warning-50 text-warning-500 border-warning-100 hover:border-warning-400',
          success: 'bg-success-50 text-success-500 border-success-100 hover:border-success-400',
          primary: 'bg-primary-50 text-primary-500 border-primary-100 hover:border-primary-400',
          error: 'bg-error-50 text-error-500 border-error-100 hover:border-error-400',
        }[metric.color];

        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`transition-colors select-none ${colorStyles.split(' ').pop()}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {metric.title}
                  </span>
                  <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm ${
                    colorStyles.split(' hover:')[0]
                  }`}
                >
                  <Icon size={20} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
