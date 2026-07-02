import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import toast from "react-hot-toast";

import { OrderTable } from "../../components/tables/OrderTable";
import { ProductSearchDropdown } from "../../components/ui";
import { Package, Hash, Tag, MapPin, MessageSquare, Receipt, ArrowRight } from "lucide-react";

export const CustomerOrders = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchVal, setProductSearchVal] = useState("");

  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    resetAll,
    fetchReservations,
    confirmBooking,
    loading,
    error,
    header,
    setPOHeader,
    getEstimatedValue,
    getTax,
    getGrandTotal,
  } = useCartStore();

  const { user } = useUserStore();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      quantity: 1,
    },
  });

  const watchQuantity = watch("quantity");

  // Load existing reservations on mount
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (product) {
      setProductSearchVal(product.code);
      setValue("quantity", 1);
    } else {
      setProductSearchVal("");
    }
  };

  const handleAddToCart = async (data) => {
    if (!selectedProduct) {
      toast.error("Please Select Product", { icon: "⚠️" });
      return;
    }

    const moq = selectedProduct.moq || 1;
    if (data.quantity % moq !== 0) {
      toast.error(`Order quantity must be a multiple of ${moq}`, { icon: "❌" });
      return;
    }

    if (data.quantity > selectedProduct.availableStock) {
      toast.error("Insufficient Stock", { icon: "❌" });
      return;
    }

    const res = await addItem(selectedProduct, data.quantity);

    if (res.success) {
      toast.success("Product reserved and added to Selection List!");
      setSelectedProduct(null);
      setProductSearchVal("");
      setValue("quantity", 1);
    } else {
      toast.error(res.error || "Failed to reserve item");
    }
  };

  const handleInlineQtyChange = async (productCode, qty) => {
    const res = await updateQuantity(productCode, qty);
    if (!res.success) {
      toast.error(res.error || "Quantity update failed");
    } else {
      toast.success("Reservation quantity updated");
    }
  };

  const handleRemoveCartItem = async (productCode) => {
    await removeItem(productCode);
    toast.success("Reservation cancelled and stock released");
  };

  const handleOrderSubmission = async () => {
    if (cartItems.length === 0) {
      toast.error("No reserved items to confirm.");
      return;
    }

    try {
      await confirmBooking();
      toast.success("Booking confirmed! Orders sent to Approval workflow.", { icon: "🚀" });
      navigate("/orders/history?status=pending");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm booking.");
    }
  };

  const remainingQty = selectedProduct ? selectedProduct.availableStock - (watchQuantity || 0) : 0;
  const moq = selectedProduct?.moq || 1;

  return (
    <div className="w-full h-auto p-4 lg:p-4 bg-slate-50/50 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-[38fr_62fr] gap-8 h-full">
        {/* LEFT PANEL: Create Booking */}
        <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a5b9e] to-[#15467a]"></div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Create Booking
            </h1>
            <p className="text-xs text-slate-500 mt-1">ERP Temporary Reservation System</p>
          </div>

          <form onSubmit={handleSubmit(handleAddToCart)} className="flex flex-col gap-6">
            
            {/* ITEM SKU CODE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                Item SKU Code
              </label>
              <div className="rounded-xl shadow-sm transition-colors focus-within:ring-2 focus-within:ring-[#1a5b9e]/20">
                <ProductSearchDropdown
                  placeholder="Search Products..."
                  value={productSearchVal}
                  onChange={handleProductSelect}
                />
              </div>
            </div>

            {/* PRODUCT DETAILS CARDS */}
            <div className="grid grid-cols-2 gap-3">
              {/* MSIL CODE - Admin Only */}
              {user?.role === 'Admin' && (
                <div className="flex flex-col p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Hash size={14} className="text-[#1a5b9e]" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">MSIL Code</span>
                  </div>
                  <span className={`text-sm font-black ${selectedProduct && selectedProduct.msilCode ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selectedProduct ? (selectedProduct.msilCode || "No MSIL Code") : "---"}
                  </span>
                </div>
              )}

              {/* CATEGORY */}
              <div className="flex flex-col p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag size={14} className="text-[#1a5b9e]" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Category</span>
                </div>
                <span className={`text-sm font-black truncate ${selectedProduct && selectedProduct.category ? 'text-slate-800' : 'text-slate-400'}`}>
                  {selectedProduct ? (selectedProduct.category || "Uncategorized") : "---"}
                </span>
              </div>
            </div>

            {/* STOCK AVAILABILITY CARD */}
            <div className="flex flex-col p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#1a5b9e]/80 rounded-l-xl"></div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-[#1a5b9e]" />
                <span className="text-xs font-bold text-slate-700 tracking-widest uppercase">Stock Availability</span>
              </div>
              <div className="grid grid-cols-3 text-center divide-x divide-slate-200/80">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available</span>
                  <span className={`text-xl font-black ${selectedProduct ? "text-[#1a5b9e]" : "text-slate-300"}`}>
                    {selectedProduct ? selectedProduct.availableStock : "-"}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MOQ</span>
                  <span className={`text-xl font-black ${selectedProduct ? "text-[#1a5b9e]" : "text-slate-300"}`}>
                    {selectedProduct ? moq : "-"}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</span>
                  <span className={`text-xl font-black ${selectedProduct ? "text-slate-800" : "text-slate-300"}`}>
                    {selectedProduct ? remainingQty : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* QTY INPUT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                Order Qty
              </label>
              <div className="relative">
                <input
                  {...register("quantity", { 
                    valueAsNumber: true,
                    validate: value => (value % moq === 0) || `Quantity must be a multiple of ${moq}`
                  })}
                  type="number"
                  step={moq}
                  min={moq}
                  max={selectedProduct?.availableStock}
                  placeholder="Enter Qty"
                  className="w-full px-4 py-3 border border-slate-200/80 rounded-xl outline-none focus:border-[#1a5b9e] focus:ring-2 focus:ring-[#1a5b9e]/20 text-slate-800 font-bold placeholder-slate-300 transition-all bg-slate-50/50 focus:bg-white"
                  disabled={!selectedProduct}
                />
              </div>
              {errors.quantity && <span className="text-xs text-red-500 mt-1 font-semibold">{errors.quantity.message}</span>}
              {selectedProduct && watchQuantity % moq !== 0 && (
                <span className="text-xs text-red-500 mt-1 font-semibold">Quantity must be a multiple of {moq}</span>
              )}
              {selectedProduct && watchQuantity > selectedProduct.availableStock && (
                <span className="text-xs text-red-500 mt-1 font-semibold">Quantity exceeds available stock ({selectedProduct.availableStock})</span>
              )}
            </div>

            {/* ADD TO LIST BUTTON */}
            <button
              type="submit"
              disabled={loading || !selectedProduct || (selectedProduct && watchQuantity > selectedProduct.availableStock) || watchQuantity <= 0 || watchQuantity % moq !== 0}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#1a5b9e] to-[#15467a] hover:from-[#15467a] hover:to-[#0f345a] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm active:scale-[0.98]"
            >
              <span className="text-lg font-light leading-none mb-0.5">+</span> ADD TO LIST
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: Selection List */}
        <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Selection List
            </h1>
            <p className="text-xs text-slate-500 mt-1">Pending Reservations Timeline & Checkout</p>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="w-full">
              <OrderTable
                items={cartItems}
                onUpdateQty={handleInlineQtyChange}
                onRemoveItem={handleRemoveCartItem}
              />
            </div>

            <div className="mt-6 border-t border-slate-200/80 pt-6">
              
              {/* ORDER DETAILS & FINANCIAL SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-4 bg-slate-50/80 border border-slate-200/60 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Delivery Location</label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Warehouse A, New Delhi"
                      value={header.deliveryLocation}
                      onChange={(e) => setPOHeader({ deliveryLocation: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200/80 rounded-lg outline-none focus:border-[#1a5b9e] focus:ring-2 focus:ring-[#1a5b9e]/20 text-sm text-slate-800 font-semibold bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare size={14} className="text-slate-400" />
                      <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Remarks (Optional)</label>
                    </div>
                    <input
                      type="text"
                      placeholder="Any specific instructions..."
                      value={header.remarks}
                      onChange={(e) => setPOHeader({ remarks: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200/80 rounded-lg outline-none focus:border-[#1a5b9e] focus:ring-2 focus:ring-[#1a5b9e]/20 text-sm text-slate-800 font-semibold bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className=" bg-slate-50/80 border border-slate-200/60  rounded-xl p-5 shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                    <Receipt size={120} className="text-white -mr-6 -mt-6" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2.5">
                      <span>Total Items:</span>
                      <span className="text-white bg-slate-700/50 px-2 py-0.5 rounded-md">{cartItems.length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2.5">
                      <span>Est. Value:</span>
                      <span className="text-white">₹{getEstimatedValue().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-3">
                      <span>Tax (18%):</span>
                      <span className="text-white">₹{getTax().toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-600/80 border-dashed my-3"></div>
                    <div className="flex justify-between items-center text-sm font-black text-emerald-600">
                      <span className="tracking-widest">GRAND TOTAL:</span>
                      <span className="text-xl">₹{getGrandTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                
                <button
                  onClick={handleOrderSubmission}
                  disabled={loading || cartItems.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed mb-4"
                >
                  <div className="flex flex-col text-left">
                    <span className="tracking-widest text-sm mb-0.5">{loading ? "CONFIRMING..." : "CONFIRM BOOKING"}</span>
                    <span className="text-[10px] text-green-100 font-medium tracking-wide uppercase opacity-90">{loading ? "Please wait" : "Submit to ERP Approval Workflow"}</span>
                  </div>
                  <ArrowRight size={24} className="ml-2 opacity-80" />
                </button>

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 font-medium leading-relaxed px-4">
                  <span>⏳</span> Note : Booking valid for <span className="font-bold text-slate-500">7 Days only.</span>Items will be released if no PO is received.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;