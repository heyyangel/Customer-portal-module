export const SummaryCard = ({
  totalProducts,
  totalQuantity,
  subtotal,
  tax,
  grandTotal,
}) => {
  const lines = [
    { label: "Total Line Items", value: `${totalProducts} Products` },
    { label: "Cumulative Quantity", value: `${totalQuantity} Units` },
    {
      label: "Estimated Booking Value",
      value: `₹${subtotal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: "Tax Ledger Line (18% GST)",
      value: `₹${tax.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-3.5 shadow-sm select-none">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
        Financial Booking Summary
      </h3>
      <div className="flex flex-col gap-2.5">
        {lines.map((l, idx) => (
          <div
            key={idx}
            className="flex justify-between text-xs font-semibold text-slate-600"
          >
            <span>{l.label}:</span>
            <span className="font-bold text-slate-800">{l.value}</span>
          </div>
        ))}
        <div className="w-full h-px bg-slate-200 my-1" />
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-black text-slate-800">
            Grand Total:
          </span>
          <span className="text-xl font-black text-primary-800">
            ₹
            {grandTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
export default SummaryCard;
