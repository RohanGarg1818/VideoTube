import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onMenuClick={() => setSidebarOpen((v) => !v)} />
      <div className="flex pt-14">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 px-4 md:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}