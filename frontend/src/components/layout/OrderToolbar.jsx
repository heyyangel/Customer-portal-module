import { Search, Filter, Download, RefreshCw, X } from "lucide-react";
import { ERPButton } from "../ui/ERPButton";
import { useOrderHistoryStore } from "../../store/orderHistoryStore";
import { useState, useEffect } from "react";
import { api } from "../../services/api";

export const OrderToolbar = () => {
  const { searchQuery, setSearchQuery, filters, setFilters, refresh } =
    useOrderHistoryStore();
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState([]);

  // Load distinct company names from real orders
  useEffect(() => {
    api.get('/orders')
      .then(r => {
        const all = r.data.data || [];
        const unique = [...new Set(all.map(o => o.company).filter(Boolean))].sort();
        setCompanies(unique);
      })
      .catch(() => setCompanies([]));
  }, []);

  return (
    <div className="flex flex-col gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search Order No, PO No, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />

          {searchQuery && (
            <X
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600"
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <ERPButton
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" /> Filters
          </ERPButton>
          <ERPButton variant="outline" size="sm" onClick={refresh}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </ERPButton>
          <div className="relative group">
            <ERPButton variant="primary" size="sm">
              <Download size={16} className="mr-2" /> Export
            </ERPButton>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <button 
                onClick={() => {
                  import('../../utils/exportUtils').then(({ exportToExcel }) => {
                    const data = useOrderHistoryStore.getState().orders;
                    const cols = [
                      { key: 'orderId', label: 'Order ID' },
                      { key: 'poNumber', label: 'PO Number' },
                      { key: 'company', label: 'Customer' },
                      { key: 'totalAmount', label: 'Total Amount' },
                      { key: 'status', label: 'Status' }
                    ];
                    exportToExcel(data, cols, 'Order_History');
                  });
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
              >
                Export to Excel
              </button>
              <button 
                onClick={() => {
                  import('../../utils/exportUtils').then(({ exportToPDF }) => {
                    const data = useOrderHistoryStore.getState().orders;
                    const cols = [
                      { key: 'orderId', label: 'Order ID' },
                      { key: 'poNumber', label: 'PO Number' },
                      { key: 'company', label: 'Customer' },
                      { key: 'totalAmount', label: 'Total Amount' },
                      { key: 'status', label: 'Status' }
                    ];
                    exportToPDF(data, cols, 'Order History Report', 'Order_History');
                  });
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors border-t border-slate-100"
              >
                Export to PDF
              </button>
              <button 
                onClick={() => {
                  import('../../utils/exportUtils').then(({ printData }) => {
                    const data = useOrderHistoryStore.getState().orders;
                    const cols = [
                      { key: 'orderId', label: 'Order ID' },
                      { key: 'poNumber', label: 'PO Number' },
                      { key: 'company', label: 'Customer' },
                      { key: 'totalAmount', label: 'Total Amount' },
                      { key: 'status', label: 'Status' }
                    ];
                    printData(data, cols, 'Order History Report');
                  });
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors border-t border-slate-100"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-primary-500 text-slate-700 font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="ready">Ready</option>
              <option value="production">In Production</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">Customer</label>
            <select
              value={filters.customer}
              onChange={(e) => setFilters({ customer: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-primary-500 text-slate-700 font-semibold"
            >
              <option value="all">All Customers</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">
              Order Type
            </label>
            <select
              value={filters.orderType}
              onChange={(e) => setFilters({ orderType: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-primary-500 text-slate-700 font-semibold"
            >
              <option value="all">All Types</option>
              <option value="manual">Manual Entry</option>
              <option value="bulk_upload">Bulk Import</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
