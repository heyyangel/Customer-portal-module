// Reusable pagination bar — "Showing X to Y of Z" + Prev / page / Next.
export const Pagination = ({ page, pageSize, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between text-sm px-1 py-1">
      <span className="text-slate-500 font-semibold">
        Showing {from} to {to} of {totalItems} entries
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Prev
        </button>
        <span className="px-4 py-1.5 font-bold text-slate-800">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
