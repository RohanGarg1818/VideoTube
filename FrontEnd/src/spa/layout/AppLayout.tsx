import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

const isDesktop = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const location = useLocation();

  useEffect(() => {
    if (!isDesktop()) setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen((v) => !v)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={cn(
          "pt-14 transition-[padding] duration-200",
          sidebarOpen ? "lg:pl-60" : "lg:pl-[72px]",
        )}
      >
        <div className="mx-auto w-full max-w-[1680px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
