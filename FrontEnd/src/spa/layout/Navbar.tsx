import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, Search, Upload, Play, LogOut, User as UserIcon, Settings, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "../store/authStore";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur">
      <div className="h-full flex items-center gap-2 md:gap-4 px-2 md:px-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-bold mr-2">
          <span className="bg-primary text-primary-foreground rounded-md p-1">
            <Play className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">VideoTube</span>
        </Link>
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto flex">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos…"
            className="rounded-r-none border-r-0"
          />
          <Button type="submit" variant="secondary" className="rounded-l-none px-4">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex items-center gap-1 md:gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/upload")}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden md:inline">Upload</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback>
                        {user.fullName?.slice(0, 1).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/channel/${user.username}`)}>
                    <UserIcon className="h-4 w-4 mr-2" /> My channel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings/password")}>
                    <KeyRound className="h-4 w-4 mr-2" /> Change password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate("/login")} size="sm">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}