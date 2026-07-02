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
        <Button variant="outline" size="sm">
          <Download size={16} className="mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};
