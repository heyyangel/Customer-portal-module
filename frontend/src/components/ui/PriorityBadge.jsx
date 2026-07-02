import clsx from 'clsx';
import { AlertCircle, ArrowUp, Clock, Zap } from 'lucide-react';

export const PriorityBadge = ({ priority, className }) => {
  const getBadgeConfig = (p) => {
    switch (p) {
      case 'Low':
        return {
          icon: Clock,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 'Medium':
        return {
          icon: ArrowUp,
          color: 'bg-primary-50 text-primary-700 border-primary-200',
        };
      case 'High':
        return {
          icon: AlertCircle,
          color: 'bg-warning-50 text-warning-700 border-warning-200',
        };
      case 'Urgent':
        return {
          icon: Zap,
          color: 'bg-error-50 text-error-700 border-error-200',
        };
      default:
        return {
          icon: Clock,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getBadgeConfig(priority);
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        config.color,
        className
      )}
    >
      <Icon size={14} />
      {priority}
    </span>
  );
};
