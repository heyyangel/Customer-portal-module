import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

export const OrderSummaryCard = ({ order }) => {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="py-4 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-700">
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Subtotal:</span>
          <span className="font-bold text-slate-800">
            ₹
            {(order.estimatedValue || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Discount:</span>
          <span className="font-bold text-error-600">
            - ₹
            {(order.discount || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Shipping:</span>
          <span className="font-bold text-slate-800">
            ₹
            {(order.shipping || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Tax (18% GST):</span>
          <span className="font-bold text-slate-800">
            ₹
            {(order.tax || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="w-full h-px bg-slate-200 my-1" />
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-black text-slate-800">
            Grand Total:
          </span>
          <span className="text-xl font-black text-primary-800">
            ₹
            {(order.grandTotal || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
