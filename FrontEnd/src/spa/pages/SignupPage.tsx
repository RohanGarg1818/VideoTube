import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAPI } from "../services/endpoints";
import { apiErrorMessage } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { ImageDrop } from "../components/ImageDrop";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STRENGTH = ["Too short", "Weak", "Okay", "Good", "Strong"];

export function SignupPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const score = strength(password);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!avatar) return setError("Please choose an avatar image");
    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("fullName", fullName.trim());
      form.append("email", email.trim());
      form.append("username", username.trim().toLowerCase());
      form.append("password", password);
      form.append("avatar", avatar);
      if (coverImage) form.append("coverImage", coverImage);
      await AuthAPI.register(form);
      await login({ email: email.trim(), password });
      toast.success("Account created");
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Set up your channel to start uploading.
      </p>

      <form onSubmit={handle} className="mt-6 space-y-4">
        <div className="relative mb-12">
          <ImageDrop
            file={coverImage}
            onChange={setCoverImage}
            label="Cover image (optional)"
            hint="Wide images look best"
          />
          <div className="absolute -bottom-10 left-5 rounded-full bg-[var(--background)] p-1">
            <ImageDrop
              file={avatar}
              onChange={setAvatar}
              label="Avatar *"
              shape="round"
              className="h-20 w-20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={60}
              placeholder="Rohan Garg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""),
                )
              }
              required
              minLength={3}
              maxLength={30}
              placeholder="rohan_dev"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          {password && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full bg-white/10 transition-colors",
                      i < score &&
                        (score <= 1
                          ? "bg-red-400"
                          : score === 2
                            ? "bg-amber-400"
                            : "bg-emerald-400"),
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {STRENGTH[score]}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Creating your channel…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4 decoration-white/30 hover:decoration-white"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
