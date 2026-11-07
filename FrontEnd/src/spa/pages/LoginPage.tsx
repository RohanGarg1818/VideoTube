import { useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const from =
    params.get("next") ??
    (location.state as { from?: string } | null)?.from ??
    "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const id = identifier.trim();
      await login({ [id.includes("@") ? "email" : "username"]: id, password });

      navigate(from.startsWith("/") ? from : "/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      <h1 className="display text-[52px]">
        Welcome <span className="italic text-brand">back.</span>
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to pick up where you left off.
      </p>

      <form onSubmit={handle} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="id">Email or username</Label>
          <Input
            id="id"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Password</Label>
          <div className="relative">
            <Input
              id="pw"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to VideoTube?{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground underline underline-offset-4 decoration-white/30 hover:decoration-white"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
