import { Outlet, Link } from "react-router-dom";
import { Play } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="bg-primary text-primary-foreground rounded-md p-1">
              <Play className="h-4 w-4" />
            </span>
            VideoTube
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Outlet />
      </div>
    </div>
  );
}