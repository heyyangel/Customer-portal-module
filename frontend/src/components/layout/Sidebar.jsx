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
      className={`bg-linear-to-bl from-slate-800 via-primary-900 to-slate-900 h-screen flex flex-col transition-all duration-300 relative z-30 select-none shadow-xl shadow-primary-950/20 ${sidebarOpen ? "w-64" : "w-20"
        }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-white text-primary-700 hover:text-primary-900 w-6 h-6 rounded-full flex items-center justify-center shadow-enterprise-md hover:scale-110 transition-all focus:outline-none ring-1 ring-primary-100"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div className={`py-6 flex flex-col items-center overflow-hidden ${sidebarOpen ? "px-4" : "justify-center"}`}>
        <div className={`bg-white rounded-xl flex items-center justify-center transition-all duration-300 ${sidebarOpen ? "w-48 h-16 p-2" : "w-11 h-11 p-1"}`}>
          <img
            src="/logo.avif"
            alt="Shraddha Impex"
            className="object-contain w-full h-full"
          />
        </div>
        {sidebarOpen && (
          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-primary-100 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-md ring-1 ring-white/10">
              Customer Portal
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
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
              `group relative flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive && !item.comingSoon
                ? "bg-white text-primary-800 shadow-md shadow-primary-950/30 border border-transparent"
                : "text-primary-100 border border-transparent hover:bg-primary-400/20 hover:text-white hover:border-primary-400/30 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !item.comingSoon && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-white" />
                )}
                <item.icon size={20} className="shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}
                {sidebarOpen && item.badge !== undefined && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-primary-600 text-white" : "bg-white text-primary-800"}`}>
                    {item.badge}
                  </span>
                )}
                {sidebarOpen && item.comingSoon && (
                  <span className="text-[9px] text-primary-200 bg-white/10 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                    Soon
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-white/10 flex flex-col gap-1 text-center">
          <span className="text-[10px] font-bold text-primary-200 uppercase tracking-widest">
            Portal Engine v1.0
          </span>
          <span className="text-[11px] text-primary-300/70 font-medium">
            © 2026 Enterprise Corp
          </span>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
