import { CheckCircle2, Circle, Check } from "lucide-react";

const LIFECYCLE_STAGES = [
  "draft",
  "pending_approval",
  "approved",
  "production",
  "ready",
  "dispatched",
  "delivered",
  "completed",
];

export const OrderTimeline = ({ timeline, currentStatus }) => {
  const currentIdx = LIFECYCLE_STAGES.indexOf(currentStatus);
  const isTerminal = ["rejected", "cancelled"].includes(currentStatus);

  return (
    <div className="flex flex-col relative py-2">
      <div className="absolute left-3.5 top-4 bottom-8 w-0.5 bg-slate-200 z-0" />

      {LIFECYCLE_STAGES.map((stage, idx) => {
        const isCompleted =
          idx < currentIdx || (idx === currentIdx && !isTerminal);
        const isCurrent = idx === currentIdx;
        const entry = timeline?.find((t) => t.status === stage);

        let icon = <Circle size={16} className="text-slate-300 fill-white" />;
        if (isCompleted && !isCurrent) {
          icon = (
            <CheckCircle2
              size={16}
              className="text-primary-600 fill-primary-100"
            />
          );
        }
        if (isCurrent) {
          icon = <Check size={16} className="text-white" />;
        }

        return (
          <div key={stage} className="flex gap-4 relative z-10 group">
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
                className={`text-sm font-bold capitalize ${
                  isCurrent
                    ? "text-primary-700"
                    : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                }`}
              >
                {stage.replace("_", " ")}
              </span>

              {entry && (
                <div className="flex flex-col gap-0.5 mt-1 bg-slate-50 border border-slate-200 p-2.5 rounded-lg w-full max-w-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {entry.date} • {entry.time} • {entry.user}
                  </span>
                  {entry.remarks && (
                    <span className="text-xs text-slate-700 mt-0.5">
                      "{entry.remarks}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isTerminal && (
        <div className="flex gap-4 relative z-10 group mt-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 bg-error-600 border-error-600 mt-0.5">
            <Check size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold capitalize text-error-700">
              {currentStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
