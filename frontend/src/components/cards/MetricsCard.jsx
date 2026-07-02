import { useOrderHistoryStore } from "../../store/orderHistoryStore";
import { Card, CardContent } from "../ui/Card";
import {
  FileText,
  Clock,
  CheckCircle,
  Package,
  Truck,
  AlertTriangle,
  XCircle,
  Calendar,
  CalendarDays,
} from "lucide-react";

export const MetricsCard = () => {
  const { metrics } = useOrderHistoryStore();

  const items = [
    {
      label: "Total Orders",
      value: metrics.total,
      icon: <FileText size={20} className="text-primary-600" />,
      bg: "bg-primary-50",
    },
    {
      label: "Pending Approval",
      value: metrics.pending,
      icon: <Clock size={20} className="text-warning-600" />,
      bg: "bg-warning-50",
    },
    {
      label: "Approved",
      value: metrics.approved,
      icon: <CheckCircle size={20} className="text-info-600" />,
      bg: "bg-info-50",
    },
    {
      label: "Ready for Dispatch",
      value: metrics.ready,
      icon: <Package size={20} className="text-indigo-600" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Dispatched",
      value: metrics.dispatched,
      icon: <Truck size={20} className="text-teal-600" />,
      bg: "bg-teal-50",
    },
    {
      label: "Completed",
      value: metrics.completed,
      icon: <CheckCircle size={20} className="text-success-600" />,
      bg: "bg-success-50",
    },
    {
      label: "Rejected",
      value: metrics.rejected,
      icon: <AlertTriangle size={20} className="text-error-600" />,
      bg: "bg-error-50",
    },
    {
      label: "Cancelled",
      value: metrics.cancelled,
      icon: <XCircle size={20} className="text-slate-600" />,
      bg: "bg-slate-100",
    },
    {
      label: "Today",
      value: metrics.today,
      icon: <Calendar size={20} className="text-blue-600" />,
      bg: "bg-blue-50",
    },
    {
      label: "This Month",
      value: metrics.thisMonth,
      icon: <CalendarDays size={20} className="text-violet-600" />,
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg}`}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {item.label}
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {item.value.toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
