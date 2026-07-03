import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, ToggleLeft, Database, Key } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import toast from "react-hot-toast";

export const Admin = () => {
  const navigate = useNavigate();
  const adminCards = [
    {
      name: "User Management",
      desc: "Add customers and set/change their category (MSIL / Non-MSIL).",
      icon: Users,
      path: "/admin/users",
    },
    {
      name: "Feature Flag Toggles",
      desc: "Enable/disable beta portal components.",
      icon: ToggleLeft,
    },
    {
      name: "Database Operations",
      desc: "Sync catalog files or check transaction logs.",
      icon: Database,
    },
    {
      name: "Access Permissions",
      desc: "Manage role-based policies (RBAC).",
      icon: Key,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">
          Admin Control Panel
        </h1>
        <Badge variant="primary">Root Account</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card) => (
          <Card
            key={card.name}
            className="hover:border-primary-300 transition-colors cursor-pointer select-none"
            onClick={() =>
              card.path
                ? navigate(card.path)
                : toast.error(
                    `Admin module "${card.name}" is locked. Verify administrator token key.`,
                    {
                      icon: "🔒",
                    },
                  )
            }
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-primary-600 shadow-sm">
                <card.icon size={18} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  {card.name}
                </CardTitle>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {card.desc}
                </p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
export default Admin;
