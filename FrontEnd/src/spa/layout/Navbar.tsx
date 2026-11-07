import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User as UserIcon,
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
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [mobileSearch, setMobileSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(params.get("q") ?? ""), [params]);

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
    inputRef.current?.blur();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  const handleLogout = async () => {
    await logout();
    toast("Signed out");
    navigate("/login");
  };

  const searchField = (
    <form onSubmit={handleSearch} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        autoFocus={mobileSearch}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        aria-label="Search videos"
        className="h-9 w-full rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/80 hover:border-white/15 focus:border-brand/70"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 px-1.5 font-mono text-[10px] text-muted-foreground md:block">
        /
      </kbd>
    </form>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-white/[0.06] bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      {mobileSearch ? (
        <div className="flex h-full items-center gap-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearch(false)}
            aria-label="Close search"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {searchField}
        </div>
      ) : (
        <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4 px-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Logo />
          </div>

          <div className="mx-auto hidden w-full max-w-[560px] md:block">
            {searchField}
          </div>

          <div className="col-start-3 flex items-center gap-1.5">
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
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/upload")}
                >
                  <Plus /> Create
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Account menu"
                    >
                      <UserAvatar
                        src={user.avatar}
                        name={user.fullName}
                        className="h-8 w-8"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
                      <UserAvatar
                        src={user.avatar}
                        name={user.fullName}
                        className="h-9 w-9"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {user.fullName}
                        </div>
                        <div className="truncate text-xs font-normal text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(`/channel/${user.username}`)}
                    >
                      <UserIcon /> Your channel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/studio")}>
                      <LayoutDashboard /> Studio
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="sm:hidden"
                      onClick={() => navigate("/upload")}
                    >
                      <Plus /> Upload video
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings/password")}
                    >
                      <KeyRound /> Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut /> Sign out
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
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
