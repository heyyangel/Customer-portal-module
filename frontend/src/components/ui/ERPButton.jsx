import React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const ERPButton = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variants = {
      primary:
        "bg-primary-600 hover:bg-primary-700 text-white shadow-enterprise focus:ring-primary-500",
      success:
        "bg-success-600 hover:bg-success-700 text-white shadow-enterprise focus:ring-success-500",
      danger:
        "bg-error-500 hover:bg-error-600 text-white shadow-enterprise focus:ring-error-500",
      outline:
        "bg-transparent border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          clsx(baseStyles, variants[variant], sizes[size], className),
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  },
);
ERPButton.displayName = "ERPButton";
export default ERPButton;
