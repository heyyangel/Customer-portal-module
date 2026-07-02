import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, Clock } from "lucide-react";

export const OrderTable = ({ items, onUpdateQty, onRemoveItem }) => {
  const getCountdownBadge = (remainingDays) => {
    if (remainingDays <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500 border border-slate-300">
          Expired
        </span>
      );
    }
    if (remainingDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-200 animate-pulse">
          <Clock size={12} /> 1 Day
        </span>
      );
    }
    if (remainingDays <= 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-200">
          <Clock size={12} /> {remainingDays} Days
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-success-50 text-success-700 border border-success-200">
        <Clock size={12} /> {remainingDays} Days
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase select-none">
            <th className="px-4 py-4 w-[25%]">SKU & Product</th>
            <th className="px-4 py-4 w-[25%]">Reservation Dates</th>
            <th className="px-4 py-4 w-[15%] text-center">Countdown</th>
            <th className="px-4 py-4 w-[12%] text-center">Qty</th>
            <th className="px-4 py-4 w-[13%] text-center">Status</th>
            <th className="px-4 py-4 w-[10%] text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[13px]">
          <AnimatePresence initial={false}>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                  No active reservations in your selection list.
                </td>
              </tr>
            )}
            {items.map((item) => {
              return (
                <motion.tr
                  key={item.product.code}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white hover:bg-slate-50 transition-colors"
                >
                  {/* SKU & Name */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 select-all">{item.product.code}</span>
                      <span className="text-slate-500 text-[11px] font-medium line-clamp-1">{item.product.name}</span>
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5 text-slate-600 text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-semibold">Res:</span>
                        <span>{formatDate(item.reservationDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-semibold">Exp:</span>
                        <span className="text-slate-800 font-bold">{formatDate(item.expiryDate)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Countdown Badge */}
                  <td className="px-4 py-4 text-center">
                    {getCountdownBadge(item.remainingDays)}
                  </td>

                  {/* Qty Input */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 items-center">
                      <input
                        type="number"
                        value={item.orderQuantity}
                        min={item.product.moq || 1}
                        step={item.product.moq || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const moq = item.product.moq || 1;
                          if (!isNaN(val) && val > 0) {
                            if (val % moq === 0) {
                               onUpdateQty(item.product.code, val);
                            }
                          }
                        }}
                        className="w-14 px-1 py-1 text-center font-bold border border-slate-300 text-slate-800 rounded-md outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white text-xs shadow-sm"
                      />
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                      {item.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => onRemoveItem(item.product.code)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all focus:outline-none"
                      title="Remove Item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
