import React from "react";
import { useUserStore } from "../../store/userStore";

export const PageHeader = ({
  title,
  customerName,
  orderDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  userName,
  userEmail,
  actions,
}) => {
  const { user } = useUserStore();
  // Fall back to the logged-in user's company/name so every page shows the
  // customer, not "Not Selected", unless a page explicitly overrides it.
  const resolvedCustomer =
    customerName ?? (user?.company || user?.user || user?.email || "—");

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4 select-none">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
          <div>
            Customer:{" "}
            <span className="text-primary-700 font-bold">{resolvedCustomer}</span>
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div>
            Order Date:{" "}
            <span className="text-slate-700 font-bold">{orderDate}</span>
          </div>
          {(userName || userEmail) && (
            <>
              <div className="hidden sm:block text-slate-300">•</div>
              <div>
                User:{" "}
                <span className="text-slate-700 font-bold">
                  {userName || userEmail}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
export default PageHeader;
