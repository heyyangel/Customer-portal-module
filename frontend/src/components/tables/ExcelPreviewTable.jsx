import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/Badge";

export const ExcelPreviewTable = ({ rows, onUpdateRow }) => {
  return (
    <div className="overflow-x-auto w-full border border-slate-200 rounded-xl bg-white shadow-sm h-[400px]">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead className="sticky top-0 bg-slate-50 z-10">
          <tr className="border-b border-slate-200 text-xs text-slate-500 font-bold uppercase select-none">
            <th className="px-4 py-3">Row</th>
            <th className="px-4 py-3">SKU Code</th>
            <th className="px-4 py-3">MSIL Code</th>
            <th className="px-4 py-3">Product Info</th>
            <th className="px-4 py-3 text-center">Avail Stock</th>
            <th className="px-4 py-3 text-center">Req Qty</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`transition-colors ${
                  row.status === "error"
                    ? "bg-error-50/50"
                    : "hover:bg-slate-50/50"
                }`}
              >
                <td className="px-4 py-3 font-bold text-slate-500">
                  {row.originalRowNumber}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.skuCode || ""}
                    onChange={(e) =>
                      onUpdateRow(row.id, { skuCode: e.target.value })
                    }
                    className="w-24 px-2 py-1 text-sm font-bold border border-slate-300 rounded outline-none focus:border-primary-500 bg-white"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.msilCode || ""}
                    onChange={(e) =>
                      onUpdateRow(row.id, { msilCode: e.target.value })
                    }
                    className="w-24 px-2 py-1 text-sm font-bold border border-slate-300 rounded outline-none focus:border-primary-500 bg-white"
                  />
                </td>
                <td
                  className="px-4 py-3 text-slate-600 truncate max-w-[150px]"
                  title={row.product ? String(row.product.category || row.product.name) : ""}
                >
                  {row.product ? (
                    <span className="text-sm font-medium">{String(row.product.category || row.product.name)}</span>
                  ) : (
                    <span className="text-error-500 italic">Unknown</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-slate-600">
                  {row.product
                    ? `${row.product.availableStock} ${row.product.unit || 'PCS'}`
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        onUpdateRow(row.id, {
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-20 px-2 py-1 text-center font-bold border border-slate-300 rounded outline-none focus:border-primary-500 bg-white"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 flex gap-2 items-center">
                  {row.status === "valid" && (
                    <Badge variant="success">Valid</Badge>
                  )}
                  {row.status === "warning" && (
                    <Badge variant="warning">Warning</Badge>
                  )}
                  {row.status === "error" && (
                    <Badge variant="danger">Error</Badge>
                  )}
                  {row.status === "pending" && (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                  {row.isMerged && <Badge variant="primary">Merged</Badge>}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};
