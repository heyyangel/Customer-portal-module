import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export const ErrorPanel = ({ rows }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const errorRows = rows.filter((r) => r.status === "error");

  if (errorRows.length === 0) return null;

  return (
    <div className="border border-error-200 bg-error-50 rounded-xl overflow-hidden shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-error-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-error-600" />
          <h3 className="text-sm font-bold text-error-800">
            {errorRows.length} Validation Error
            {errorRows.length !== 1 ? "s" : ""} Found
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-error-600" />
        ) : (
          <ChevronDown size={18} className="text-error-600" />
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-error-200 max-h-60 overflow-y-auto"
          >
            <div className="p-4 flex flex-col gap-3">
              {errorRows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white border border-error-200 rounded-lg p-3 text-sm flex justify-between items-start shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-error-700">
                      Row {row.originalRowNumber} (SKU Code:{" "}
                      {row.skuCode || "Missing"})
                    </span>
                    <ul className="list-disc list-inside text-error-600 text-xs">
                      {row.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Edit row to resolve
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
