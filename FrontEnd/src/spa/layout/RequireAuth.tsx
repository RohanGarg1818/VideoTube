import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  return <Outlet />;
}
