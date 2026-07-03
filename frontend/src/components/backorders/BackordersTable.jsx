import { PackageX } from "lucide-react";

/**
 * Renders the list of pending backorders (unfulfilled reservation quantities).
 *
 * @param {Array}   items        Pending items from the cart store.
 * @param {boolean} showCustomer Show the customer column (admin view).
 * @param {boolean} compact      Tighter padding for embedding in a dashboard.
 */
export const BackordersTable = ({ items = [], showCustomer = false, compact = false }) => {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <PackageX size={32} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-400">No pending backorders</p>
        <p className="text-xs text-slate-400">
          Unfulfilled quantities from confirmations will appear here.
        </p>
      </div>
    );
  }

  const pad = compact ? "py-2" : "py-3";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/80">
            <th className={`${pad} pr-4`}>SKU Code</th>
            {showCustomer && <th className={`${pad} pr-4`}>Customer</th>}
            <th className={`${pad} pr-4`}>Category</th>
            <th className={`${pad} pr-4 text-center`}>Pending Qty</th>
            <th className={`${pad} pr-4 text-center`}>Current Stock</th>
            <th className={`${pad} pr-4 text-center`}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item._id} className="text-slate-700">
              <td className={`${pad} pr-4 font-bold text-slate-800`}>{item.product.code}</td>
              {showCustomer && (
                <td className={`${pad} pr-4 text-slate-600 font-semibold`}>
                  {item.customer?.name || "—"}
                </td>
              )}
              <td className={`${pad} pr-4 text-slate-500`}>{item.product.category}</td>
              <td className={`${pad} pr-4 text-center font-black text-amber-600`}>
                {item.pendingQuantity}
              </td>
              <td className={`${pad} pr-4 text-center font-semibold text-slate-600`}>
                {item.product.availableStock}
              </td>
              <td className={`${pad} pr-4 text-center`}>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BackordersTable;
