import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, PackageX } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import { PageHeader } from "../../components/common/PageHeader";
import { BackordersTable } from "../../components/backorders/BackordersTable";
import { Pagination } from "../../components/ui/Pagination";

const PAGE_SIZE = 10;

export const Backorders = () => {
  const { pendingItems, fetchPendingReservations, restorePending, loading } = useCartStore();
  const { user } = useUserStore();
  const isAdmin = user?.role === "Admin";
  const [page, setPage] = useState(1);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    fetchPendingReservations();
  }, [fetchPendingReservations]);

  const handleRestore = async (item) => {
    setRestoringId(item._id);
    const res = await restorePending(item._id);
    setRestoringId(null);
    if (res.success) {
      toast.success(
        `${item.product.code} moved to ${item.customer?.name || "the customer"}'s selection list. They've been emailed to confirm.`,
      );
    } else {
      toast.error(res.error || "Could not move pending indent to selection list.");
    }
  };

  const totalPendingQty = pendingItems.reduce(
    (sum, i) => sum + (i.pendingQuantity || 0),
    0,
  );

  // Distinct booking confirmations represented in the pending indent list
  // (grouped by indentNumber; ungrouped/legacy rows each count as their own).
  const distinctIndents = new Set(
    pendingItems.map((i) => i.indentNumber || i._id),
  ).size;

  const totalPages = Math.ceil(pendingItems.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const pageItems = pendingItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pending Indents"
        actions={
          <button
            onClick={() => fetchPendingReservations()}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />
      <p className="text-slate-500 text-sm font-medium -mt-2">
        {isAdmin
          ? "Unfulfilled quantities across all customers, awaiting fresh stock."
          : "Your unfulfilled quantities, awaiting fresh stock."}
      </p>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200/70 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Pending Indents
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{distinctIndents}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200/70 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Pending Indent Lines
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingItems.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200/70 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Total Pending Qty
          </p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{totalPendingQty}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="flex items-center gap-2 mb-4">
          <PackageX size={18} className="text-amber-500" />
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Pending Indent Details</h2>
        </div>
        <BackordersTable
          items={pageItems}
          showCustomer={isAdmin}
          onRestore={isAdmin ? handleRestore : null}
          restoringId={restoringId}
        />

        {pendingItems.length > PAGE_SIZE && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={pendingItems.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Backorders;
