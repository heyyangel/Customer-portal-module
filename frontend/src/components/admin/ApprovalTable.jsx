import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useApprovalStore } from '../../store/approvalStore';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StageBadge } from '../ui/StageBadge';

export const ApprovalTable = () => {
  const { approvals, page, setPage, limit, setSelectedApproval, sortBy, sortOrder, setSort } =
    useApprovalStore();

  const totalPages = Math.ceil(approvals.length / limit);
  const paginatedData = approvals.slice((page - 1) * limit, page * limit);

  // Toggle direction when re-clicking the active column; otherwise sort desc first.
  const handleSort = (field) => {
    if (sortBy === field) {
      setSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field, 'desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-slate-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className="text-primary-600" />
    ) : (
      <ArrowDown size={12} className="text-primary-600" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-115 overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider select-none">
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('orderNumber')}
              >
                <div className="flex items-center gap-1">
                  Order No <SortIcon field="orderNumber" />
                </div>
              </th>
              <th className="px-4 py-3">Customer</th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('orderValue')}
              >
                <div className="flex items-center gap-1">
                  Value <SortIcon field="orderValue" />
                </div>
              </th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Assigned To</th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('createdDate')}
              >
                <div className="flex items-center gap-1">
                  Created Date <SortIcon field="createdDate" />
                </div>
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <AnimatePresence mode="popLayout">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 italic">
                    No approval requests found for these filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((req) => (
                  <motion.tr
                    key={req.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900">{req.orderNumber}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{req.customer}</div>
                      <div className="text-xs text-slate-500">{req.poNumber}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">
                      ₹{req.orderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StageBadge stage={req.workflowStage} />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600">{req.assignedTo}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(req.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedApproval(req)}
                        className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Eye size={16} className="mr-1.5" />
                        Review
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between select-none">
        <div className="text-sm text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{paginatedData.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
          <span className="font-bold text-slate-900">
            {Math.min(page * limit, approvals.length)}
          </span>{' '}
          of <span className="font-bold text-slate-900">{approvals.length}</span> requests
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center px-3 text-sm font-semibold text-slate-700">
            {page} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
