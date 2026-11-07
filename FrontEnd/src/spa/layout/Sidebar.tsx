import { NavLink } from "react-router-dom";
import {
  Flame,
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
      { to: "/explore", label: "Trending", icon: Flame },
      { to: "/subscriptions", label: "Subscriptions", icon: Users, auth: true },
      { to: "/community", label: "Community", icon: MessageSquare },
    ],
  },
  {
    title: "Library",
    items: [
      { to: "/history", label: "History", icon: History, auth: true },
      { to: "/playlists", label: "Playlists", icon: ListVideo, auth: true },
      { to: "/liked", label: "Liked videos", icon: ThumbsUp, auth: true },
    ],
  },
  {
    title: "Creator",
    items: [
      { to: "/studio", label: "Studio", icon: LayoutDashboard, auth: true },
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
        title={it.label}
        className={({ isActive }) =>
          cn(
            "relative flex items-center gap-4 rounded-lg px-3 py-2 text-sm transition-colors",
            isActive
              ? "bg-white/[0.06] font-medium text-foreground before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-brand [&>svg]:text-brand"
              : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            !open && "lg:flex-col lg:gap-1.5 lg:px-0 lg:py-3.5 lg:text-[10px]",
          )
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <span className="truncate">{it.label}</span>
      </NavLink>
    );
  };

  const visible = sections
    .map((s) => ({ ...s, items: s.items.filter((it) => !it.auth || user) }))
    .filter((s) => s.items.length);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-40 overflow-y-auto border-r border-white/[0.06] bg-background px-3 py-3 transition-[transform,width] duration-200",
          open
            ? "w-60 translate-x-0"
            : "w-60 -translate-x-full lg:w-[72px] lg:translate-x-0 lg:px-1.5",
        )}
      >
        <nav>
          {visible.map((section, i) => (
            <div
              key={i}
              className={cn(
                i > 0 && "mt-3 border-t border-white/[0.06] pt-3",
                !open && i > 0 && "lg:mt-0 lg:border-0 lg:pt-0",
              )}
            >
              {section.title && open && (
                <p className="eyebrow px-3 pb-2.5 pt-2 text-[10px]">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">{section.items.map(link)}</div>
            </div>
          ))}
          {user && open && (
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              {link({
                to: `/channel/${user.username}`,
                label: "Your channel",
                icon: UserRound,
              })}
            </div>
          )}
          {!user && open && (
            <div className="mt-3 border-t border-white/[0.06] px-3 pt-4 text-[13px] leading-relaxed text-muted-foreground">
              Sign in to like videos, comment and subscribe.
              <NavLink
                to="/login"
                className="mt-3 flex h-8 w-fit items-center rounded-lg border border-white/10 px-3 text-[13px] font-medium text-foreground hover:bg-white/[0.06]"
              >
                Sign in
              </NavLink>
            </div>
          )}
        </nav>
        {open && (
          <p className="mt-6 px-3 text-[11px] leading-5 text-muted-foreground/60">
            © {new Date().getFullYear()} VideoTube
          </p>
        )}
      </aside>
    </>
  );
}
