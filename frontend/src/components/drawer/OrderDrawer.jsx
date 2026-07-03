import {
  X,
  Printer,
  Download,
  Copy,
  Ban,
  MapPin,
  User,
  Hash,
  Calendar as CalendarIcon,
  Package,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrderHistoryStore } from "../../store/orderHistoryStore";
import { useUserStore } from "../../store/userStore";
import { StatusBadge } from "../ui/StatusBadge";
import { ERPButton } from "../ui/ERPButton";
import { OrderTimeline } from "../cards/OrderTimeline";
import { OrderSummaryCard } from "../cards/OrderSummaryCard";
import { useCanViewPrice } from "../../hooks/useCanViewPrice";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "Booked", label: "Pending Approval" },
  { value: "Approved", label: "Approved" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

export const OrderDrawer = () => {
  const { selectedOrder, setSelectedOrder, updateOrderStatus } = useOrderHistoryStore();
  const { user } = useUserStore();
  const canViewPrice = useCanViewPrice();
  const isAdmin = user?.role === "Admin";

  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // Sync the status selector whenever a different order is opened.
  useEffect(() => {
    if (selectedOrder) setStatus(selectedOrder.status);
  }, [selectedOrder?.id, selectedOrder?.status]);

  if (!selectedOrder) return null;

  const applyStatus = async (newStatus) => {
    if (busy || newStatus === selectedOrder.status) return;
    setBusy(true);
    const res = await updateOrderStatus(selectedOrder.id, newStatus);
    setBusy(false);
    if (res.success) toast.success(`Status updated to ${newStatus}`);
    else toast.error(res.error || "Failed to update status");
  };

  // Build printable / exportable rows for this order (price columns admin-only).
  const buildExport = () => {
    const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
    const rows = items.map((item, i) => {
      const p = item.product || {};
      const qty = item.orderQuantity ?? item.quantity ?? 0;
      const price = p.price || 0;
      return {
        sr: i + 1,
        code: p.code || p.name || "-",
        msil: p.msilCode || selectedOrder.msilCode || "-",
        qty,
        price: price.toFixed(2),
        subtotal: (price * qty).toFixed(2),
      };
    });
    const columns = [
      { key: "sr", label: "S.No" },
      { key: "code", label: "SKU / Product" },
      { key: "msil", label: "MSIL Code" },
      { key: "qty", label: "Qty" },
      ...(canViewPrice
        ? [
            { key: "price", label: "Unit Price (INR)" },
            { key: "subtotal", label: "Subtotal (INR)" },
          ]
        : []),
    ];
    const title = `Order ${selectedOrder.orderNumber}${selectedOrder.customer ? ` - ${selectedOrder.customer}` : ""}`;
    return { rows, columns, title };
  };

  const handlePrint = () => {
    const { rows, columns, title } = buildExport();
    import("../../utils/exportUtils").then(({ printData }) => {
      const ok = printData(rows, columns, title);
      if (!ok) toast.error("Unable to open print window (check pop-up blocker).");
    });
  };

  const handlePDF = () => {
    const { rows, columns, title } = buildExport();
    import("../../utils/exportUtils").then(({ exportToPDF }) => {
      exportToPDF(rows, columns, title, selectedOrder.orderNumber || "Order");
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedOrder(null)}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm cursor-pointer"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-4xl bg-slate-50 h-full shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-800">
                Order {selectedOrder.orderNumber}
              </h2>
              <StatusBadge status={selectedOrder.status} />
              {selectedOrder.orderType === "bulk_upload" && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md border border-indigo-200">
                  Bulk Import
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ERPButton variant="outline" size="sm" className="hidden sm:flex" onClick={handlePrint}>
                <Printer size={16} className="mr-2" /> Print
              </ERPButton>
              <ERPButton variant="outline" size="sm" className="hidden sm:flex" onClick={handlePDF}>
                <Download size={16} className="mr-2" /> PDF
              </ERPButton>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            {/* Top Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Customer
                  </p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2">
                    {selectedOrder.customer}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Hash size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    PO Number
                  </p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2">
                    {selectedOrder.poNumber}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                  <CalendarIcon size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Order Date
                  </p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2">
                    {new Date(selectedOrder.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Location
                  </p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2">
                    {selectedOrder.deliveryLocation}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Product Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Package size={18} className="text-primary-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Line Items
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Code / MSIL</th>
                          <th className="px-5 py-3">Product Name</th>
                          <th className="px-5 py-3 text-center">Qty</th>
                          {canViewPrice && <th className="px-5 py-3 text-right">Unit Price</th>}
                          {canViewPrice && <th className="px-5 py-3 text-right">Subtotal</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">
                                  {item.product.code}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {item.product.msilCode}
                                </span>
                              </div>
                            </td>
                            <td
                              className="px-5 py-4 font-medium text-slate-700 truncate max-w-[200px]"
                              title={item.product.name}
                            >
                              {item.product.name}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-slate-700">
                              {item.orderQuantity} {item.product.unit}
                            </td>
                            {canViewPrice && (
                              <td className="px-5 py-4 text-right font-semibold text-slate-600">
                                ₹{item.product.price.toLocaleString()}
                              </td>
                            )}
                            {canViewPrice && (
                              <td className="px-5 py-4 text-right font-black text-slate-900">
                                ₹
                                {(
                                  item.product.price * item.orderQuantity
                                ).toLocaleString()}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks */}
                {selectedOrder.remarks && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                      <FileText size={18} className="text-primary-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Remarks & Instructions
                      </h3>
                    </div>
                    <div className="p-5 text-sm text-slate-600 bg-slate-50/50">
                      {selectedOrder.remarks}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                {canViewPrice && <OrderSummaryCard order={selectedOrder} />}

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">
                      Lifecycle Timeline
                    </h3>
                  </div>
                  <div className="p-5">
                    <OrderTimeline currentStatus={selectedOrder.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            {isAdmin ? (
              <ERPButton
                variant="outline"
                className="text-error-600 border-error-200 hover:bg-error-50"
                disabled={busy || selectedOrder.status === "Cancelled"}
                onClick={() => applyStatus("Cancelled")}
              >
                <Ban size={16} className="mr-2" /> Cancel Order
              </ERPButton>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                Status: {selectedOrder.status}
              </span>
            )}

            <div className="flex items-center gap-2">
              <ERPButton
                variant="outline"
                onClick={() => toast("Duplicate is coming soon", { icon: "🧾" })}
              >
                <Copy size={16} className="mr-2" /> Duplicate
              </ERPButton>

              {isAdmin && (
                <>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={busy}
                    className="text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-700 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ERPButton
                    variant="primary"
                    disabled={busy || status === selectedOrder.status}
                    onClick={() => applyStatus(status)}
                  >
                    {busy ? "Updating..." : "Update Status"}
                  </ERPButton>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
