import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Loader2, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAPI } from "../services/endpoints";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { ImageDrop } from "../components/ImageDrop";
import { PageHeader } from "../components/PageHeader";
import { toast } from "sonner";

export function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user)!;
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);

  const dirty =
    fullName.trim() !== user.fullName || email.trim() !== (user.email ?? "");

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      setUser(
        await AuthAPI.updateAccount({
          fullName: fullName.trim(),
          email: email.trim(),
        }),
      );
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const upload = async (kind: "avatar" | "cover", file: File | null) => {
    if (!file) return;
    setUploading(kind);
    try {
      setUser(
        kind === "avatar"
          ? await AuthAPI.updateAvatar(file)
          : await AuthAPI.updateCover(file),
      );
      toast.success(kind === "avatar" ? "Avatar updated" : "Cover updated");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Manage how your channel looks"
        actions={
          <Button variant="outline" asChild>
            <Link to="/settings/password">
              <KeyRound /> Change password
            </Link>
          </Button>
        }
      />

      <section className="surface mb-6 rounded-xl p-6">
        <h2 className="mb-4 font-semibold">Branding</h2>
        <div className="relative mb-14">
          <ImageDrop
            file={null}
            onChange={(f) => upload("cover", f)}
            existingUrl={user.coverImage || undefined}
            label="Upload cover image"
            hint="Drop an image or click"
          />
          <div className="absolute -bottom-12 left-6 rounded-full bg-[var(--background)] p-1">
            <ImageDrop
              file={null}
              onChange={(f) => upload("avatar", f)}
              existingUrl={user.avatar}
              label="Avatar"
              shape="round"
              className="h-24 w-24"
            />
          </div>
          {uploading && (
            <span className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading{" "}
              {uploading}…
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Click or drag an image onto the cover or avatar to replace it.
        </p>
      </section>

      <form onSubmit={saveAccount} className="surface space-y-5 rounded-xl p-6">
        <h2 className="font-semibold">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={`@${user.username}`} disabled />
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
          />
        </div>
        <Button type="submit" disabled={savingAccount || !dirty}>
          <Save /> {savingAccount ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
