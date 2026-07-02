import { Badge } from "./Badge";

export const StatusBadge = ({ status, className }) => {
  const getBadgeConfig = (s) => {
    const normalizedStatus = (s || "").toLowerCase();
    switch (normalizedStatus) {
      case "draft":
        return { label: "Draft", variant: "neutral" };
      case "pending_approval":
      case "pending":
      case "booked":
        return { label: "Pending Approval", variant: "warning" };
      case "approved":
        return { label: "Approved", variant: "primary" };
      case "ready":
        return { label: "Ready", variant: "primary" };
      case "production":
        return { label: "In Production", variant: "primary" };
      case "dispatched":
        return { label: "Dispatched", variant: "primary" };
      case "delivered":
        return { label: "Delivered", variant: "success" };
      case "completed":
        return { label: "Completed", variant: "success" };
      case "rejected":
        return { label: "Rejected", variant: "danger" };
      case "cancelled":
        return { label: "Cancelled", variant: "neutral" };
      default:
        return { label: s || "Unknown", variant: "neutral" };
    }
  };

  const { label, variant } = getBadgeConfig(status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};
