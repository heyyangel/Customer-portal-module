import { Clock, User } from 'lucide-react';
import { Pagination } from '../ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

const PAGE_SIZE = 10;

export const AuditLogTable = ({ logs }) => {
  const { page, setPage, pageItems, total } = usePagination(logs, PAGE_SIZE);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Clock size={16} className="text-slate-500" />
          System Audit Logs
        </h3>
        <span className="text-xs font-semibold text-slate-500">{logs.length} entries</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-white border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User & Role</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">{log.action}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={12} className="text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-xs">{log.user}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{log.role}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                  {log.ip || '192.168.1.1'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                  No audit logs available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="px-4 py-3 border-t border-slate-200">
          <Pagination page={page} pageSize={PAGE_SIZE} totalItems={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};
