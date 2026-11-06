import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "../store/authStore";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Logo } from "../components/Logo";
import { UserAvatar } from "../components/UserAvatar";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [mobileSearch, setMobileSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(params.get("q") ?? ""), [params]);

  // "/" focuses search, like on YouTube / GitHub
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setMobileSearch(false);
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="glass-strong flex h-14 items-center gap-2 rounded-2xl px-2 md:gap-4 md:px-3">
        {mobileSearch ? (
          <form
            onSubmit={handleSearch}
            className="flex flex-1 items-center gap-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileSearch(false)}
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </Button>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos…"
              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-violet-400/60"
            />
          </form>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Logo className="mr-2" />

            <form
              onSubmit={handleSearch}
              className="mx-auto hidden max-w-xl flex-1 md:flex"
            >
              <div className="group relative flex w-full items-center">
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-fuchsia-300" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search videos…"
                  className="h-10 w-full rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground hover:border-white/20 focus:border-violet-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-violet-500/15"
                />
                <kbd className="pointer-events-none absolute right-4 hidden rounded-md border border-white/15 px-1.5 text-[10px] text-muted-foreground lg:block">
                  /
                </kbd>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileSearch(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
              {user ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => navigate("/upload")}
                    className="hidden h-9 rounded-full px-4 sm:inline-flex"
                    disabled={location.pathname === "/upload"}
                  >
                    <Upload /> Upload
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Account menu"
                      >
                        <UserAvatar
                          src={user.avatar}
                          name={user.fullName}
                          ring
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="flex items-center gap-3 py-2">
                        <UserAvatar
                          src={user.avatar}
                          name={user.fullName}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {user.fullName}
                          </div>
                          <div className="truncate text-xs font-normal text-muted-foreground">
                            @{user.username}
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => navigate(`/channel/${user.username}`)}
                      >
                        <UserIcon className="mr-2 h-4 w-4" /> Your channel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => navigate("/studio")}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Creator
                        studio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg sm:hidden"
                        onClick={() => navigate("/upload")}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload video
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => navigate("/settings")}
                      >
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => navigate("/settings/password")}
                      >
                        <KeyRound className="mr-2 h-4 w-4" /> Change password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        className="rounded-lg text-red-300 focus:text-red-200"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex"
                    asChild
                  >
                    <Link to="/signup">Create account</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full px-5"
                    onClick={() => navigate("/login")}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
