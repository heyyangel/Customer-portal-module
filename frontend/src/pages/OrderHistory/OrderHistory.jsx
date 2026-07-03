import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { MetricsCard } from "../../components/cards/MetricsCard";
import { OrderToolbar } from "../../components/layout/OrderToolbar";
import { OrderHistoryTable } from "../../components/tables/OrderHistoryTable";
import { OrderDrawer } from "../../components/drawer/OrderDrawer";
import { useOrderHistoryStore } from "../../store/orderHistoryStore";

// Maps the ?status= query param (used by the sidebar links) to the real Order
// status enum plus the page copy for each view.
const VIEWS = {
  pending: {
    status: "Booked",
    title: "Pending Approval",
    subtitle: "Orders awaiting admin approval.",
  },
  approved: {
    status: "Approved",
    title: "Approved Orders",
    subtitle: "Orders that have been approved and are moving through fulfilment.",
  },
};

const DEFAULT_VIEW = {
  status: "all",
  title: "Order History & Lifecycle Management",
  subtitle: "Track, search and manage customer orders across all ERP modules.",
};

export const OrderHistory = () => {
  const { fetchOrders, setFilters } = useOrderHistoryStore();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const view = VIEWS[statusParam] || DEFAULT_VIEW;

  // Load the data once.
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply the status filter for the active view whenever the link changes.
  useEffect(() => {
    setFilters({ status: view.status });
  }, [view.status, setFilters]);

  return (
    <div className="flex flex-col gap-6 relative">
      <PageHeader title={view.title} />
      <p className="text-slate-600 -mt-2 text-sm">{view.subtitle}</p>

      <MetricsCard />

      <OrderToolbar />

      <OrderHistoryTable />

      <OrderDrawer />
    </div>
  );
};
