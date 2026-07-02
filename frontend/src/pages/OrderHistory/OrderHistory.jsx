import { useEffect } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { MetricsCard } from "../../components/cards/MetricsCard";
import { OrderToolbar } from "../../components/layout/OrderToolbar";
import { OrderHistoryTable } from "../../components/tables/OrderHistoryTable";
import { OrderDrawer } from "../../components/drawer/OrderDrawer";
import { useOrderHistoryStore } from "../../store/orderHistoryStore";

export const OrderHistory = () => {
  const { fetchOrders } = useOrderHistoryStore();

  // Initial load filters
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="flex flex-col gap-6 relative">
      <PageHeader title="Order History & Lifecycle Management" />
      <p className="text-slate-600 -mt-2 text-sm">
        Track, search and manage customer orders across all ERP modules.
      </p>

      <MetricsCard />

      <OrderToolbar />

      <OrderHistoryTable />

      <OrderDrawer />
    </div>
  );
};
