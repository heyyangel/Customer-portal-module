import { CheckCircle, Circle, Clock, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const ApprovalTimeline = ({ workflowStage }) => {
  const STAGES = [
    'Pending Approval',
    'Approved',
    'Inventory Verification',
    'Production Planning',
    'Quality Check',
    'Ready For Dispatch',
    'Dispatched',
    'Delivered',
  ];

  let currentIdx = STAGES.indexOf(workflowStage);
  if (['Rejected', 'Modification Required'].includes(workflowStage)) {
    currentIdx = 0; // Or handle uniquely
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div key={stage} className="relative flex gap-4">
            {idx !== STAGES.length - 1 && (
              <div
                className={clsx(
                  'absolute left-[11px] top-7 w-[2px] h-full -z-10',
                  isCompleted ? 'bg-primary-500' : 'bg-slate-200'
                )}
              />
            )}

            <div className="mt-0.5">
              {isCompleted ? (
                <CheckCircle className="text-primary-500 bg-white" size={24} />
              ) : isCurrent ? (
                <Loader2 className="text-warning-500 bg-white animate-spin" size={24} />
              ) : (
                <Circle className="text-slate-300 bg-white" size={24} />
              )}
            </div>

            <div className="flex flex-col pb-6">
              <span
                className={clsx(
                  'text-sm font-bold',
                  isCompleted ? 'text-slate-900' : isCurrent ? 'text-warning-700' : 'text-slate-400'
                )}
              >
                {stage}
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">
                {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
