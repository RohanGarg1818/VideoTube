import { NavLink } from "react-router-dom";
import {
  Home,
  ListVideo,
  ThumbsUp,
  History,
  Users,
  MessageSquare,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/authStore";

const items = [
  { to: "/", label: "Home", icon: Home, auth: false },
  { to: "/subscriptions", label: "Subscriptions", icon: Users, auth: true },
  { to: "/playlists", label: "Playlists", icon: ListVideo, auth: true },
  { to: "/liked", label: "Liked Videos", icon: ThumbsUp, auth: true },
  { to: "/history", label: "History", icon: History, auth: true },
  { to: "/community", label: "Community", icon: MessageSquare, auth: false },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      {open && (
        <button
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-14 z-40 lg:z-auto h-[calc(100vh-3.5rem)] w-60 shrink-0",
          "bg-background border-r border-border overflow-y-auto transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16",
        )}
      >
        <nav className="p-2 space-y-1">
          {items.map((it) => {
            if (it.auth && !user) return null;
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground",
                    !open && "lg:justify-center lg:px-2",
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(!open && "lg:hidden")}>{it.label}</span>
              </NavLink>
            );
          })}
          {user && (
            <NavLink
              to={`/channel/${user.username}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                  !open && "lg:justify-center lg:px-2",
                )
              }
            >
              <Library className="h-5 w-5 shrink-0" />
              <span className={cn(!open && "lg:hidden")}>My Channel</span>
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}