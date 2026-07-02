import { create } from "zustand";
import { useProductStore } from "./productStore";

const initialSummary = {
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  duplicateRows: 0,
  mergedRows: 0,
  totalProducts: 0,
  totalQuantity: 0,
  estimatedValue: 0,
};

export const revalidateRow = (row) => {
  const errors = [];
  let status = "pending";

  if (!row.skuCode?.trim() && !row.msilCode?.trim()) errors.push("Missing SKU and MSIL Code");
  
  const quantity = row.quantity || 0;
  if (quantity <= 0) {
    errors.push("Quantity must be greater than zero");
  }

  if (errors.length > 0) {
    status = "error";
  }

  return {
    ...row,
    product: row.product || null,
    status: row.status === 'valid' || row.status === 'error' ? row.status : status,
    errors: row.errors || errors,
  };
};

export const computeSummary = (rows) => {
  const totalRows = rows.length;
  const validRows = rows.filter(
    (r) => r.status === "valid" || r.status === "warning",
  ).length;
  const invalidRows = rows.filter((r) => r.status === "error").length;
  const mergedRows = rows.filter((r) => r.isMerged).length;

  const validItems = rows.filter(
    (r) => r.status === "valid" || r.status === "warning",
  );
  const totalProducts = validItems.length;
  const totalQuantity = validItems.reduce(
    (acc, r) => acc + (r.quantity || 0),
    0,
  );
  const estimatedValue = validItems.reduce((acc, r) => {
    return acc + (r.quantity || 0) * (r.product?.price || 0);
  }, 0);

  return {
    totalRows,
    validRows,
    invalidRows,
    duplicateRows: 0,
    mergedRows,
    totalProducts,
    totalQuantity,
    estimatedValue,
  };
};

export const useBulkImportStore = create((set) => ({
  file: null,
  rows: [],
  summary: initialSummary,
  setFile: (file) => set({ file }),
  setRows: (rows) => set({ rows, summary: computeSummary(rows) }),
  updateRow: (id, updates) =>
    set((state) => {
      const newRows = state.rows.map((row) => {
        if (row.id === id) {
          const updated = { ...row, ...updates };
          return revalidateRow(updated);
        }
        return row;
      });
      return { rows: newRows, summary: computeSummary(newRows) };
    }),
  removeRow: (id) =>
    set((state) => {
      const newRows = state.rows.filter((r) => r.id !== id);
      return { rows: newRows, summary: computeSummary(newRows) };
    }),
  reset: () => set({ file: null, rows: [], summary: initialSummary }),
}));
