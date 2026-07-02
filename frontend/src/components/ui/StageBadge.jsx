import clsx from 'clsx';
import { Badge } from './Badge';

export const StageBadge = ({ stage, className }) => {
  const getBadgeConfig = (s) => {
    switch (s) {
      case 'Pending Approval':
        return 'warning';
      case 'Approved':
      case 'Ready For Dispatch':
      case 'Production Started':
      case 'Production Planning':
      case 'Quality Check':
      case 'Inventory Verification':
      case 'Dispatched':
        return 'primary';
      case 'Delivered':
      case 'Completed':
        return 'success';
      case 'Rejected':
      case 'Modification Required':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const variant = getBadgeConfig(stage);

  return (
    <Badge variant={variant} className={clsx(className)}>
      {stage}
    </Badge>
  );
};
