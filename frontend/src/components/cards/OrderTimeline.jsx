import { CheckCircle2, Circle, Check, Ban } from "lucide-react";

// Stages map to the real Order status enum (Booked → Pending Approval, etc.).
const LIFECYCLE = [
  { key: "Booked", label: "Pending Approval" },
  { key: "Approved", label: "Approved" },
  { key: "Dispatched", label: "Dispatched" },
  { key: "Delivered", label: "Delivered" },
];

const TERMINAL = ["Cancelled", "Rejected"];

export const OrderTimeline = ({ currentStatus }) => {
  const isTerminal = TERMINAL.includes(currentStatus);
  const currentIdx = LIFECYCLE.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex flex-col relative py-2">
      <div className="absolute left-3.5 top-4 bottom-8 w-0.5 bg-slate-200 z-0" />

      {LIFECYCLE.map((stage, idx) => {
        const isCompleted = currentIdx >= 0 && idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        let icon = <Circle size={16} className="text-slate-300 fill-white" />;
        if (isCompleted && !isCurrent) {
          icon = <CheckCircle2 size={16} className="text-primary-600 fill-primary-100" />;
        }
        if (isCurrent) {
          icon = <Check size={16} className="text-white" />;
        }

        return (
          <div key={stage.key} className="flex gap-4 relative z-10 group">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${
                isCurrent
                  ? "bg-primary-600 border-primary-600"
                  : isCompleted
                    ? "bg-white border-transparent"
                    : "bg-white border-slate-200"
              }`}
            >
              {icon}
            </div>

            <div className="flex flex-col pb-6">
              <span
                className={`text-sm font-bold ${
                  isCurrent
                    ? "text-primary-700"
                    : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                }`}
              >
                {stage.label}
              </span>
              {isCurrent && (
                <span className="text-[11px] font-semibold text-primary-600 mt-0.5">Current stage</span>
              )}
            </div>
          </div>
        );
      })}

      {isTerminal && (
        <div className="flex gap-4 relative z-10 group mt-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 bg-error-600 border-error-600 mt-0.5">
            <Ban size={15} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-error-700">{currentStatus}</span>
            <span className="text-[11px] font-semibold text-error-500 mt-0.5">Order closed</span>
          </div>
        </div>
      )}
    </div>
  );
};
