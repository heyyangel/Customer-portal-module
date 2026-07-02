import { Search, Filter, RefreshCw, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApprovalStore } from '../../store/approvalStore';

export const ApprovalToolbar = () => {
  const { searchQuery, setSearchQuery, filters, setFilters, refresh } = useApprovalStore();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search Order ID, PO, Customer..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.stage}
            onChange={(e) => setFilters({ stage: e.target.value })}
          >
            <option value="all">All Stages</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Modification Required">Modification Required</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.priority}
            onChange={(e) => setFilters({ priority: e.target.value })}
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

        <Button variant="outline" size="sm" onClick={refresh} title="Refresh Data">
          <RefreshCw size={16} />
        </Button>
        <div className="relative group">
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button 
              onClick={() => {
                import('../../utils/exportUtils').then(({ exportToExcel }) => {
                  const data = useApprovalStore.getState().pendingApprovals;
                  const cols = [
                    { key: 'orderId', label: 'Order ID' },
                    { key: 'poNumber', label: 'PO Number' },
                    { key: 'company', label: 'Customer' },
                    { key: 'totalAmount', label: 'Total Amount' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'priority', label: 'Priority' }
                  ];
                  exportToExcel(data, cols, 'Approvals');
                });
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
            >
              Export to Excel
            </button>
            <button 
              onClick={() => {
                import('../../utils/exportUtils').then(({ exportToPDF }) => {
                  const data = useApprovalStore.getState().pendingApprovals;
                  const cols = [
                    { key: 'orderId', label: 'Order ID' },
                    { key: 'poNumber', label: 'PO Number' },
                    { key: 'company', label: 'Customer' },
                    { key: 'totalAmount', label: 'Total Amount' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'priority', label: 'Priority' }
                  ];
                  exportToPDF(data, cols, 'Pending Approvals', 'Approvals');
                });
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors border-t border-slate-100"
            >
              Export to PDF
            </button>
            <button 
              onClick={() => {
                import('../../utils/exportUtils').then(({ printData }) => {
                  const data = useApprovalStore.getState().pendingApprovals;
                  const cols = [
                    { key: 'orderId', label: 'Order ID' },
                    { key: 'poNumber', label: 'PO Number' },
                    { key: 'company', label: 'Customer' },
                    { key: 'totalAmount', label: 'Total Amount' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'priority', label: 'Priority' }
                  ];
                  printData(data, cols, 'Pending Approvals');
                });
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors border-t border-slate-100"
            >
              Print List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
