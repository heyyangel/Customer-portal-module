import { Badge } from "../ui/Badge";

export const StockCard = ({ product }) => {
  if (!product) return null;

  const getStockStatus = (stock) => {
    if (stock > 50) return { label: "IN STOCK", variant: "success" };
    if (stock >= 10) return { label: "LOW STOCK", variant: "warning" };
    return { label: "CRITICAL LOW", variant: "danger" };
  };

  const statusInfo = getStockStatus(product.availableStock);
  const availableForSale = Math.max(
    0,
    product.availableStock - product.reservedStock,
  );
  const totalInventory = product.availableStock + product.reservedStock;

  return (
    <div className="border border-slate-200 rounded-xl p-5 flex flex-col gap-4 bg-white shadow-sm select-none animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Inventory Ledger Balance
        </h3>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Available Stock
          </span>
          <span className="text-base font-black text-slate-800">
            {product.availableStock} {product.unit}
          </span>
        </div>

        <div className="flex flex-col bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Reserved Stock
          </span>
          <span className="text-base font-black text-slate-500">
            {product.reservedStock} {product.unit}
          </span>
        </div>

        <div className="flex flex-col bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Available for Sale
          </span>
          <span className="text-base font-black text-primary-700">
            {availableForSale} {product.unit}
          </span>
        </div>

        <div className="flex flex-col bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Total Inventory
          </span>
          <span className="text-base font-black text-slate-700">
            {totalInventory} {product.unit}
          </span>
        </div>
      </div>
    </div>
  );
};
export default StockCard;
