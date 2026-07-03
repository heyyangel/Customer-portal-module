import { useUserStore } from "../store/userStore";

// Pricing / financial figures are admin-only. Customers must not see prices,
// price summaries, or financial totals anywhere in the portal.
export const useCanViewPrice = () => {
  const user = useUserStore((s) => s.user);
  return user?.role === "Admin";
};

export default useCanViewPrice;
