import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  UploadCloud,
  History,
  Clock,
  CheckCircle2,
  Boxes,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import toast from "react-hot-toast";

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const cartItems = useCartStore((state) => state.items);

  const { user } = useUserStore();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    {
      name: "Create Order",
      path: "/orders/new",
      icon: PlusCircle,
      badge: cartItems.length > 0 ? cartItems.length : undefined,
    },
    { name: "Bulk Upload", path: "/orders/bulk-upload", icon: UploadCloud },
    { name: "Order History", path: "/orders/history", icon: History },
    {
      name: "Pending Approval",
      path: "/orders/history?status=pending",
      icon: Clock,
    },
    {
      name: "Approved Orders",
      path: "/orders/history?status=approved",
      icon: CheckCircle2,
    },
    ...(user?.role === 'Admin' ? [
      {
        name: "Admin Approvals",
        path: "/admin/approvals",
        icon: Boxes,
      },
      { name: "Inventory", path: "/inventory", icon: Boxes },
      { name: "Reports", path: "/reports", icon: BarChart3 },
    ] : []),
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 h-screen flex flex-col transition-all duration-300 relative z-30 select-none ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 w-6 h-6 rounded-full flex items-center justify-center shadow-enterprise hover:scale-105 transition-all focus:outline-none"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div className={`h-16 flex items-center border-b border-slate-100 overflow-hidden ${sidebarOpen ? "px-6" : "justify-center"}`}>
        <img 
          src="/logo.avif" 
            alt="Shraddha Impex" 
          className={`object-contain transition-all duration-300 ${sidebarOpen ? "w-28 h-12" : "w-10 h-10"}`} 
        />
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.comingSoon ? "#" : item.path}
            onClick={(e) => {
              if (item.comingSoon) {
                e.preventDefault();
                toast.success(
                  `${item.name} module placeholder: Coming in Phase 2!`,
                  {
                    icon: "🚀",
                  },
                );
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive && !item.comingSoon
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {sidebarOpen && (
              <span className="flex-1 truncate">{item.name}</span>
            )}
            {sidebarOpen && item.badge !== undefined && (
              <span className="text-xs bg-primary-600 text-white font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            {sidebarOpen && item.comingSoon && (
              <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                Soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Portal Engine v1.0
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            © 2026 Enterprise Corp
          </span>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
