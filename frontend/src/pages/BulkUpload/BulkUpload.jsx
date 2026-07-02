import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { BulkUploadCard } from "../../components/upload/BulkUploadCard";
import { ExcelPreviewTable } from "../../components/tables/ExcelPreviewTable";
import { ImportSummaryCard } from "../../components/cards/ImportSummaryCard";
import { ErrorPanel } from "../../components/cards/ErrorPanel";
import { ERPButton, ConfirmationDialog } from "../../components/ui";
import { useBulkImportStore } from "../../store/bulkImportStore";
import { useCartStore } from "../../store/cartStore";
import { useProductStore } from "../../store/productStore";
import {
  parseExcelFile,
  downloadTemplate,
  downloadErrorReport,
} from "../../utils/excelParser";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { Play, Download, AlertTriangle, Check } from "lucide-react";

export const BulkUpload = () => {
  const navigate = useNavigate();
  const { file, rows, summary, setFile, setRows, updateRow, reset } =
    useBulkImportStore();
  const { addItem, confirmBooking } = useCartStore();
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleUpload = async (uploadedFile) => {
    setIsParsing(true);
    setFile(uploadedFile);
    try {
      const parsed = await parseExcelFile(uploadedFile);
      
      // Call backend to validate the rows
      const response = await api.post("/reservations/validate-bulk", { rows: parsed });
      const validatedRows = response.data.data;
      
      setRows(validatedRows);
      
      const hasErrors = validatedRows.some(r => r.status === 'error');
      if (hasErrors) {
        toast.error("File parsed with validation errors");
      } else {
        toast.success("Excel file parsed and validated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to validate Excel file");
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportToCart = async () => {
    const validRows = rows.filter(
      (r) => r.status === "valid" || r.status === "warning",
    );

    let successCount = 0;
    for (const row of validRows) {
      if (row.product) {
        await addItem(row.product, row.quantity);
        successCount++;
      }
    }

    toast.success(`Successfully imported ${successCount} items to selection list`);
    reset();
    setShowConfirm(false);
    navigate("/orders/new");
  };

  const handleDirectConfirm = async () => {
    setIsConfirming(true);
    const validRows = rows.filter((r) => r.status === "valid" || r.status === "warning");

    try {
      // 1. Create reservations sequentially
      for (const row of validRows) {
        if (row.product) {
          const res = await addItem(row.product, row.quantity);
          if (!res.success) throw new Error(res.error);
        }
      }
      
      // 2. Confirm booking immediately
      await confirmBooking();
      
      toast.success("Bulk booking confirmed successfully! Sent to Approval Workflow.", { icon: "🚀" });
      reset();
      navigate("/orders/history?status=pending");
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || "Failed to confirm bulk booking directly.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bulk Order Import"
        actions={
          <ERPButton variant="outline" size="sm" onClick={() => reset()}>
            Reset Session
          </ERPButton>
        }
      />

      <p className="text-slate-600">
        Import customer orders using an Excel template.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[30fr_70fr] gap-8 items-start">
        <div className="flex flex-col gap-6">
          <BulkUploadCard
            file={file}
            onUpload={handleUpload}
            onRemove={reset}
            isLoading={isParsing}
          />

          <div className="bg-white border border-slate-200 p-6 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Validation Rules</h4>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>SKU Code, MSIL Code, & Quantity are validated.</li>
              <li>Missing SKU will look up by MSIL Code.</li>
              <li>Duplicates will be automatically merged.</li>
              <li>Quantities exceeding available stock will be flagged.</li>
            </ul>
            <ERPButton
              variant="outline"
              className="w-full mt-4"
              onClick={downloadTemplate}
            >
              <Download size={16} className="mr-2" />
              Download Sample Template
            </ERPButton>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {file ? (
            <>
              <ImportSummaryCard summary={summary} />

              <ErrorPanel rows={rows} />

              {summary.invalidRows > 0 && (
                <div className="flex justify-end">
                  <ERPButton
                    variant="outline"
                    size="sm"
                    onClick={() => downloadErrorReport(rows)}
                    className="text-error-600 border-error-200 hover:bg-error-50"
                  >
                    <AlertTriangle size={14} className="mr-2" /> Download Error
                    Report
                  </ERPButton>
                </div>
              )}

              <ExcelPreviewTable rows={rows} onUpdateRow={updateRow} />

              <div className="flex justify-end mt-4 gap-4">
                <ERPButton
                  variant="outline"
                  size="lg"
                  disabled={summary.invalidRows > 0 || summary.validRows === 0 || isConfirming}
                  onClick={() => setShowConfirm(true)}
                  className="w-full md:w-auto px-6 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Play size={16} className="mr-2" />
                  Add to Selection List
                </ERPButton>

                <ERPButton
                  variant="success"
                  size="lg"
                  disabled={summary.invalidRows > 0 || summary.validRows === 0 || isConfirming}
                  onClick={handleDirectConfirm}
                  className="bg-green-600 hover:bg-green-700 w-full md:w-auto px-8 shadow-md"
                >
                  <Check size={18} className="mr-2 text-white" />
                  {isConfirming ? "Confirming..." : "Confirm Booking Directly"}
                </ERPButton>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl h-64 flex items-center justify-center text-slate-400">
              Upload a file to see preview and validation results.
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleImportToCart}
        title="Confirm Bulk Import"
        description={`You are about to import ${summary.validRows} valid rows (${summary.totalQuantity} items) to the Order Cart. Existing manual cart entries will not be overwritten, duplicate products will be merged.`}
        confirmText="Confirm Import"
      />
    </div>
  );
};
export default BulkUpload;
