import React from "react";
import { useUserStore } from "../../store/userStore";

export const PageHeader = ({
  title,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4 select-none">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
export default PageHeader;
