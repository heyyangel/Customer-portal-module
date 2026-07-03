import * as XLSX from "xlsx";
import { revalidateRow } from "../store/bulkImportStore";

export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Convert sheet to JSON
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Process rows, skip header
        const rows = [];
        const mergedRowsMap = new Map();
        const headers = rawRows[0] || [];
        // Find column indices
        const getIndex = (names) => {
          return headers.findIndex((h) =>
            names.some(
              (n) =>
                typeof h === "string" &&
                h.toLowerCase().includes(n.toLowerCase()),
            ),
          );
        };
        const cSKU = getIndex(["SKU Code", "SKU", "Product Code", "Product"]);
        const cMSIL = getIndex(["MSIL Code", "MSIL"]);
        const cQty = getIndex(["Quantity", "Qty"]);

        for (let i = 1; i < rawRows.length; i++) {
          const rowData = rawRows[i];
          // Skip completely empty rows
          if (!rowData || rowData.length === 0) continue;
          const skuCode = String(rowData[cSKU] || "").trim();
          const msilCode = String(rowData[cMSIL] || "").trim();
          const quantity = Number(rowData[cQty]) || 0;
          const newRow = {
            id: `row-${i}-${Date.now()}`,
            originalRowNumber: i + 1,
            skuCode,
            msilCode,
            quantity,
          };

          const validatedRow = revalidateRow(newRow);

          // Handle duplicates by merging
          // We merge rows based on the combination of SKU and MSIL if both are present,
          // or whichever is present.
          const mergeKey = `${skuCode}_${msilCode}`;
          
          if (mergeKey !== "_" && mergedRowsMap.has(mergeKey)) {
            const existingRow = mergedRowsMap.get(mergeKey);
            const updatedRow = {
              ...existingRow,
              quantity: existingRow.quantity + quantity,
              isMerged: true,
            };
            const revalidatedMerged = revalidateRow(updatedRow);
            mergedRowsMap.set(mergeKey, revalidatedMerged);
          } else {
            if (mergeKey !== "_") {
              mergedRowsMap.set(mergeKey, validatedRow);
            } else {
              // Rows without any identifying codes can't be safely merged
              rows.push(validatedRow);
            }
          }
        }
        // Combine merged rows and non-merged invalid rows
        const finalRows = [...rows, ...Array.from(mergedRowsMap.values())];
        // Sort by original row number
        finalRows.sort((a, b) => a.originalRowNumber - b.originalRowNumber);
        resolve(finalRows);
      } catch (error) {
        reject(new Error("Failed to parse Excel file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
};

// Two bulk-import templates, keyed by customer category.
// MSIL customers order by MSIL Code; Non-MSIL customers order by SKU Code.
export const TEMPLATE_CONFIG = {
  MSIL: {
    label: "MSIL Bulk Import Template",
    fileName: "MSIL_Bulk_Order_Template.xlsx",
    headers: ["MSIL Code", "Quantity"],
    sample: [
      ["MSIL-XYZ-1", "10"],
      ["MSIL-ABC-2", "5"],
    ],
  },
  "Non-MSIL": {
    label: "Non-MSIL Bulk Import Template",
    fileName: "NonMSIL_Bulk_Order_Template.xlsx",
    headers: ["SKU Code", "Quantity"],
    sample: [
      ["13405M-8", "10"],
      ["22110K-2", "5"],
    ],
  },
};

// Resolve a category (defaults to Non-MSIL for anything unrecognised).
export const resolveTemplate = (category) =>
  TEMPLATE_CONFIG[category] || TEMPLATE_CONFIG["Non-MSIL"];

export const downloadTemplate = (category = "Non-MSIL") => {
  const cfg = resolveTemplate(category);
  const templateData = [cfg.headers, ...cfg.sample];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, cfg.fileName);
};

export const downloadErrorReport = (rows) => {
  const errorData = [["Row Number", "SKU Code", "MSIL Code", "Quantity", "Errors"]];
  rows
    .filter((r) => r.status === "error")
    .forEach((row) => {
      errorData.push([
        String(row.originalRowNumber),
        row.skuCode,
        row.msilCode,
        String(row.quantity),
        row.errors.join("; "),
      ]);
    });

  const ws = XLSX.utils.aoa_to_sheet(errorData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Error Report");
  XLSX.writeFile(wb, "Bulk_Order_Errors.xlsx");
};
