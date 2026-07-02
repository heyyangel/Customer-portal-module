export const ProductCard = ({ product }) => {
  if (!product) {
    return (
      <div className="border border-dashed border-slate-200 rounded-lg p-6 flex items-center justify-center text-center bg-slate-50/50 min-h-[140px] select-none">
        <span className="text-xs text-slate-400 font-semibold italic">
          Select a product code above to inspect catalog parameters
        </span>
      </div>
    );
  }

  const items = [
    { label: "Product Name", value: product.name },
    { label: "Brand Name", value: product.brand },
    { label: "Category Group", value: product.category },
    { label: "Warehouse Location", value: product.warehouse },
    { label: "MSIL Catalog Code", value: product.msilCode },
    { label: "Unit", value: product.unit },
    { label: "Standard Price", value: `₹${product.price.toFixed(2)}` },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm select-none animate-fade-in">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        ERP Product Specifications
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {item.label}
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg truncate">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProductCard;
