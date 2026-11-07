import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        This page drifted off into space
      </h1>
      <p className="mt-2 text-muted-foreground">
        The link may be broken or the page may have been removed.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link to="/">
            <Home /> Go home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/explore">
            <Compass /> Explore
          </Link>
        </Button>
      </div>
    </div>
  );
}
