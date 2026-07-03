import { useState } from 'react';
import { useApprovalStore } from '../../store/approvalStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

export const ActionDialogs = ({
  actionType,
  setActionType,
  selectedApproval,
}) => {
  const { approveOrder, rejectOrder, requestModification, assignOrder } = useApprovalStore();
  const [remarks, setRemarks] = useState('');
  const [role, setRole] = useState('Production Manager');

  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedApproval || submitting) return;

    const label = selectedApproval.orderNumber;
    setSubmitting(true);
    let res = { success: false };

    switch (actionType) {
      case 'approve':
        res = await approveOrder(selectedApproval.id, remarks);
        if (res?.success) toast.success(`Order ${label} approved`);
        break;
      case 'reject':
        res = await rejectOrder(selectedApproval.id, remarks);
        if (res?.success) toast.success(`Order ${label} rejected`);
        break;
      case 'modify':
        res = await requestModification(selectedApproval.id, remarks);
        if (res?.success) toast.success(`Modification requested for ${label}`);
        break;
      case 'assign':
        res = await assignOrder(selectedApproval.id, role, remarks);
        if (res?.success) toast.success(`Order assigned to ${role}`);
        break;
      default:
        break;
    }

    setSubmitting(false);

    if (!res?.success) {
      toast.error(res?.error || 'Action failed. Please try again.');
      return; // keep the dialog open so the admin can retry
    }

    setActionType(null);
    setRemarks('');
  };

  const getTitle = () => {
    switch(actionType) {
      case 'approve': return 'Approve Order';
      case 'reject': return 'Reject Order';
      case 'modify': return 'Request Modification';
      case 'assign': return 'Assign Workflow Stage';
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={!!actionType}
      onClose={() => setActionType(null)}
      title={getTitle()}
      size="md"
    >
      <div className="flex flex-col gap-4 py-2">
        {actionType === 'assign' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Assign To Role</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Sales Manager">Sales Manager</option>
              <option value="Production Manager">Production Manager</option>
              <option value="Inventory Manager">Inventory Manager</option>
              <option value="Dispatch Manager">Dispatch Manager</option>
            </select>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Remarks / Comments</label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
            placeholder="Enter your remarks here..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
        <Button
          variant={actionType === 'reject' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : `Confirm ${actionType === 'modify' ? 'Request' : actionType}`}
        </Button>
      </div>
    </Modal>
  );
};
