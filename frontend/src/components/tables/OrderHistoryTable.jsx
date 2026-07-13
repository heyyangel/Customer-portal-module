import { ChevronUp, ChevronDown, Eye, FileDown, PackageX } from "lucide-react";
import toast from "react-hot-toast";
import { useOrderHistoryStore } from "../../store/orderHistoryStore";
import { useCartStore } from "../../store/cartStore";

export const OrderHistoryTable = () => {
  const {
    orders,
    sortBy,
    sortOrder,
    setSort,
    page,
    setPage,
    limit,
    setSelectedOrder,
    selectedIds,
    toggleSelectId,
    toggleSelectAll,
  } = useOrderHistoryStore();

  // PO numbers that have unfulfilled pending indents — used to flag rows.
  const pendingItems = useCartStore((s) => s.pendingItems);
  const indentPOs = new Set(
    pendingItems.map((p) => p.poNumber).filter(Boolean),
  );

  const totalPages = Math.ceil(orders.length / limit);
  const currentOrders = orders.slice((page - 1) * limit, page * limit);
  const allSelected =
    orders.length > 0 && orders.every((o) => selectedIds.includes(o.orderNumber));

  const handleSort = (field) => {
    if (sortBy === field) {
      setSort(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSort(field, "desc");
    }
  };

  const handleRowPDF = (order) => {
    import("../../utils/exportUtils").then(({ exportToPDF }) => {
      const cols = [
        { key: "sku", label: "SKU Code" },
        { key: "quantity", label: "Quantity" },
      ];
      const items = (order.items || []).map((it) => ({
        sku: it.product?.code || it.product?.name || "-",
        quantity: it.orderQuantity ?? it.quantity ?? 0,
      }));
      const ok = exportToPDF(
        items,
        cols,
        `Booking ${order.orderNumber} — ${order.customer || ""}`,
        `Booking_${order.orderNumber}`,
      );
      if (!ok) toast.error("PDF download failed");
    });
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto w-full border border-slate-200 rounded-xl bg-white shadow-sm h-[600px]">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            <tr className="text-xs text-slate-500 font-bold uppercase select-none">
              <th className="px-5 py-3 border-b border-slate-200 text-center w-[4%]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  title="Select all bookings"
                />
              </th>
              <th className="px-5 py-3 border-b border-slate-200">Booking ID</th>
              <th className="px-5 py-3 border-b border-slate-200">PO Number</th>
              <th className="px-5 py-3 border-b border-slate-200">Customer</th>
              <th
                className="px-5 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort("date")}
              >
                Date {renderSortIcon("date")}
              </th>
              <th className="px-5 py-3 border-b border-slate-200 text-center">
                Items
              </th>
              <th className="px-5 py-3 border-b border-slate-200 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.orderNumber)}
                      onChange={() => toggleSelectId(order.orderNumber)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{order.orderNumber}</span>
                      {indentPOs.has(order.poNumber) && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                          title="This booking has items to raise an indent for"
                        >
                          <PackageX size={10} /> Raise Indent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-600">
                    {order.poNumber}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{order.customer}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-slate-700">
                    {order.totalQuantity}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleRowPDF(order)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none"
                      title="Download PDF"
                    >
                      <FileDown size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-slate-400"
                >
                  No bookings found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 font-semibold">
          Showing {orders.length === 0 ? 0 : (page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, orders.length)} of {orders.length} entries
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 font-semibold disabled:opacity-50 hover:bg-slate-50"
          >
            Prev
          </button>
          <span className="px-4 py-1.5 font-bold text-slate-800">
            {page} / {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 font-semibold disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
