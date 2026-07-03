import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Building, Printer, MessageSquare, Check, Hand, Edit } from 'lucide-react';
import { useApprovalStore } from '../../store/approvalStore';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StageBadge } from '../ui/StageBadge';
import { ApprovalTimeline } from './ApprovalTimeline';
import { AuditLogTable } from './AuditLogTable';
import { ActionDialogs } from './ActionDialogs';

export const ApprovalDrawer = () => {
  const { selectedApproval, setSelectedApproval } = useApprovalStore();
  const [activeTab, setActiveTab] = useState('details');
  const [actionType, setActionType] = useState(null);

  if (!selectedApproval) return null;

  const order = selectedApproval;
  // mapOrder() produces `items` (not `products`); guard against missing data.
  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <AnimatePresence>
      {selectedApproval && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedApproval(null)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-4xl bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{order.orderNumber}</h2>
                  <StageBadge stage={order.workflowStage} />
                  <PriorityBadge priority={order.priority} />
                </div>
                <div className="text-sm text-slate-500 font-medium mt-1">
                  PO: {order.poNumber} · Submitted: {new Date(order.createdDate).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" title="Print Approval">
                  <Printer size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedApproval(null)}>
                  <X size={20} className="text-slate-500" />
                </Button>
              </div>
            </div>

            {/* Action Bar (Sticky) */}
            <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
              <span className="text-sm font-semibold text-slate-300">
                Assigned to: <span className="text-white">{order.assignedTo}</span>
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-slate-900 bg-white hover:bg-slate-100" onClick={() => setActionType('modify')}>
                  <Edit size={16} className="mr-2" />
                  Request Mod
                </Button>
                <Button size="sm" variant="danger" onClick={() => setActionType('reject')}>
                  <Hand size={16} className="mr-2" />
                  Reject
                </Button>
                <Button size="sm" variant="primary" onClick={() => setActionType('approve')}>
                  <Check size={16} className="mr-2" />
                  Approve
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 bg-white pt-4 pb-2">
              <div className="flex p-1 bg-slate-100/80 rounded-xl w-fit shadow-inner border border-slate-200/50">
                {['details', 'timeline', 'audit'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-5 py-2 text-sm font-bold capitalize transition-colors rounded-lg z-10 ${
                      activeTab === tab ? 'text-[#1a5b9e]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {tab === 'details' ? 'General Details' : tab === 'timeline' ? 'Workflow Timeline' : 'Audit Logs'}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab_approval"
                        className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/60 z-[-1]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="flex flex-col gap-6">
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mt-1">
                        <Building size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 uppercase">Customer</span>
                        <span className="text-sm font-bold text-slate-900">{order.customer}</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mt-1">
                        <MapPin size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-500 uppercase">Delivery Location</span>
                        <span className="text-sm font-semibold text-slate-700 line-clamp-2">
                          {order.deliveryLocation || order.location || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks / Comments */}
                  <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100">
                    <h3 className="text-sm font-bold text-primary-900 mb-2 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Initial Remarks
                    </h3>
                    <p className="text-sm text-primary-800 font-medium">{order.remarks || '—'}</p>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm">Order Items</h3>
                      <span className="text-xs font-semibold text-slate-500">
                        {orderItems.length} {orderItems.length === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100 text-xs text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Warehouse</th>
                            <th className="px-4 py-3 text-right">Req. Qty</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderItems.map((item, idx) => {
                            const p = item.product || {};
                            const qty = item.orderQuantity ?? item.quantity ?? 0;
                            const price = p.price || 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{p.name || p.code || '—'}</div>
                                  <div className="text-xs text-slate-500 font-mono">{p.msilCode || order.msilCode || '—'}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium">{p.warehouse || '—'}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800">{qty}</td>
                                <td className="px-4 py-3 text-right text-slate-600">₹{price.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900">₹{(price * qty).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right font-bold text-slate-700">Total Value:</td>
                            <td className="px-4 py-3 text-right font-bold text-primary-700 text-lg">
                              ₹{(order.orderValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto">
                  <h3 className="font-bold text-slate-800 text-sm mb-6 border-b border-slate-100 pb-2">
                    Order Lifecycle
                  </h3>
                  <ApprovalTimeline workflowStage={order.workflowStage} />
                </div>
              )}

              {activeTab === 'audit' && (
                <AuditLogTable logs={order.auditLogs} />
              )}
            </div>
          </motion.div>

          <ActionDialogs
            actionType={actionType}
            setActionType={setActionType}
            selectedApproval={selectedApproval}
          />
        </>
      )}
    </AnimatePresence>
  );
};
