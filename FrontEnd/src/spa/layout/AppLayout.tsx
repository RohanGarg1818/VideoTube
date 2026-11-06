import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Aurora } from "./Aurora";

const isDesktop = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const location = useLocation();

  // Close the drawer after navigating on mobile and scroll to top on route change
  useEffect(() => {
    if (!isDesktop()) setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen text-foreground">
      <Aurora />
      <Navbar onMenuClick={() => setSidebarOpen((v) => !v)} />
      <div className="flex pt-[4.5rem]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 px-3 pb-16 pt-4 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
