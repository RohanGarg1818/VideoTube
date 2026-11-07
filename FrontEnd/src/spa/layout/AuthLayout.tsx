import { Outlet } from "react-router-dom";
import { Logo } from "../components/Logo";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-6">
        <Logo />
      </header>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-[8vh]">
        <Outlet />
      </div>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VideoTube
      </footer>
    </div>
  );
}
