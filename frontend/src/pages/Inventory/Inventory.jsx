import { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Boxes, PackageSearch, AlertTriangle, Search } from 'lucide-react';
import { useProductStore } from '../../store/productStore';
import { useUserStore } from '../../store/userStore';
import { Pagination } from '../../components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 12;

export const Inventory = () => {
  const { products, fetchAllProducts } = useProductStore();
  const { user } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [page, setPage] = useState(1);

  // Admin Inventory shows every item across all brands, including low/zero stock.
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => 
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.msilCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'stock-asc': return a.availableStock - b.availableStock;
        case 'stock-desc': return b.availableStock - a.availableStock;
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'name-asc': 
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return result;
  }, [products, searchTerm, sortBy]);

  const totalSKUs = products.length;
  const lowStockItems = products.filter(p => p.availableStock < (p.moq * 2 || 10)).length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.availableStock), 0);

  // Clamp the page in case the filtered set shrank, then slice for the current page.
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Inventory exposes product prices and total stock value — admin only.
  if (user && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Manage products, track stock levels, and monitor warehouse assets.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Boxes size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total SKUs</p>
              <h3 className="text-2xl font-black text-slate-900">{totalSKUs}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Low Stock</p>
              <h3 className="text-2xl font-black text-slate-900">{lowStockItems}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center text-success-600">
              <PackageSearch size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Est. Value</p>
              <h3 className="text-2xl font-black text-slate-900">₹{totalValue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 rounded-t-xl">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by SKU, MSIL Code, or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-medium text-slate-800"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                className="w-full md:w-auto px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-asc">Sort: A to Z</option>
                <option value="name-desc">Sort: Z to A</option>
                <option value="stock-desc">Sort: Stock (High-Low)</option>
                <option value="stock-asc">Sort: Stock (Low-High)</option>
                <option value="price-desc">Sort: Price (High-Low)</option>
                <option value="price-asc">Sort: Price (Low-High)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">SKU Code</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">MSIL Code</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Product Name</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Brand / Category</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs text-center">In Stock</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {pageProducts.map(product => (
                    <motion.tr 
                      key={product.code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">{product.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{product.msilCode || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{product.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{product.brand || 'GENERIC'}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{product.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                          product.availableStock < (product.moq * 2 || 10) 
                          ? 'bg-red-50 text-red-600' 
                          : 'bg-success-50 text-success-700'
                        }`}>
                          {product.availableStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                        ₹{product.price.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No products found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > 0 && (
            <div className="p-4 border-t border-slate-200">
              <Pagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredProducts.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
