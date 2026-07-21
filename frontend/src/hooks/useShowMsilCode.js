import { useUserStore } from "../store/userStore";

// MSIL Codes are only meaningful to Admins, MSIL customers (who order by them),
// and anyone explicitly flagged. Non-MSIL customers never see or enter an MSIL
// Code, so it is hidden from their tables, forms, templates and exports.
// Mirrors msilAppliesTo() in the reservations controller on the server.
export const useShowMsilCode = () => {
  const user = useUserStore((s) => s.user);
  return (
    user?.role === "Admin" ||
    user?.customerCategory === "MSIL" ||
    user?.showMsilCode === true
  );
};

export default useShowMsilCode;
