export const ImportSummaryCard = ({ summary }) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm select-none">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
        Import Summary
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Total Rows
          </span>
          <span className="text-lg font-black text-slate-800">
            {summary.totalRows}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Valid Rows
          </span>
          <span className="text-lg font-black text-success-600">
            {summary.validRows}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Invalid Rows
          </span>
          <span className="text-lg font-black text-error-600">
            {summary.invalidRows}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Merged Rows
          </span>
          <span className="text-lg font-black text-primary-600">
            {summary.mergedRows}
          </span>
        </div>
      </div>
      <div className="w-full h-px bg-slate-200 my-1" />
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-black text-slate-800">
          Total Valid Qty:
        </span>
        <span className="text-xl font-black text-slate-800">
          {summary.totalQuantity} Units
        </span>
      </div>
    </div>
  );
};
