import { NavLink } from "react-router-dom";
import {
  Compass,
  History,
  Home,
  LayoutDashboard,
  ListVideo,
  MessageSquare,
  ThumbsUp,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/authStore";

type Item = { to: string; label: string; icon: typeof Home; auth?: boolean };

const sections: { title?: string; items: Item[] }[] = [
  {
    items: [
      { to: "/", label: "Home", icon: Home },
      { to: "/explore", label: "Trending", icon: Compass },
      { to: "/subscriptions", label: "Subscriptions", icon: Users, auth: true },
      { to: "/community", label: "Community", icon: MessageSquare },
    ],
  },
  {
    title: "You",
    items: [
      { to: "/history", label: "History", icon: History, auth: true },
      { to: "/playlists", label: "Playlists", icon: ListVideo, auth: true },
      { to: "/liked", label: "Liked videos", icon: ThumbsUp, auth: true },
    ],
  },
  {
    title: "Create",
    items: [
      {
        to: "/studio",
        label: "Creator studio",
        icon: LayoutDashboard,
        auth: true,
      },
      { to: "/upload", label: "Upload", icon: Upload, auth: true },
    ],
  },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);

  const link = (it: Item) => {
    const Icon = it.icon;
    return (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.to === "/"}
        title={!open ? it.label : undefined}
        className={({ isActive }) =>
          cn(
            "group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all",
            "hover:bg-white/[0.07] hover:text-foreground",
            isActive &&
              "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-foreground ring-1 ring-inset ring-white/10",
            !open && "lg:flex-col lg:gap-1 lg:px-1 lg:py-3 lg:text-[10px]",
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
            )}
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-fuchsia-300" : "group-hover:text-foreground",
              )}
            />
            <span
              className={cn(
                "truncate",
                !open && "lg:max-w-full lg:text-center",
              )}
            >
              {it.label}
            </span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {open && (
        <button
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
        />
      )}
      <aside
        className={cn(
          "fixed bottom-2 left-2 top-[4.75rem] z-40 w-64 shrink-0 transition-all duration-300 lg:sticky lg:bottom-auto lg:left-auto lg:top-[4.75rem] lg:z-auto lg:ml-3 lg:h-[calc(100vh-5.5rem)]",
          open
            ? "translate-x-0"
            : "-translate-x-[110%] lg:w-[84px] lg:translate-x-0",
        )}
      >
        <nav className="glass-strong h-full overflow-y-auto rounded-2xl p-2.5">
          {sections.map((section, i) => {
            const items = section.items.filter((it) => !it.auth || user);
            if (!items.length) return null;
            return (
              <div
                key={i}
                className={cn(i > 0 && "mt-3 border-t border-white/10 pt-3")}
              >
                {section.title && open && (
                  <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">{items.map(link)}</div>
              </div>
            );
          })}
          {user && (
            <div className="mt-3 border-t border-white/10 pt-3">
              {link({
                to: `/channel/${user.username}`,
                label: "Your channel",
                icon: UserRound,
              })}
            </div>
          )}
          {!user && open && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 p-4 text-sm">
              <p className="font-semibold">Join VideoTube</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to like videos, comment and subscribe.
              </p>
              <NavLink
                to="/login"
                className="mt-3 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                Sign in
              </NavLink>
            </div>
          )}
          {open && (
            <p className="mt-6 px-3 pb-2 text-[11px] text-muted-foreground/60">
              © {new Date().getFullYear()} VideoTube
            </p>
          )}
        </nav>
      </aside>
    </>
  );
}
