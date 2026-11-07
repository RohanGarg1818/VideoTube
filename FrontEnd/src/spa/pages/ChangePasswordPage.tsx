import { useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAPI } from "../services/endpoints";
import { apiErrorMessage, tokenStore } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { toast } from "sonner";

export function ChangePasswordPage() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const mismatch = confirm.length > 0 && newPassword !== confirm;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const tokens = await AuthAPI.changePassword({ oldPassword, newPassword });
      // The server rotates the session – keep this device signed in with the new tokens
      tokenStore.set(tokens?.accessToken, tokens?.refreshToken);
      toast.success("Password updated · other devices were signed out");
      setOld("");
      setNew("");
      setConfirm("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        icon={KeyRound}
        title="Change password"
        subtitle="Changing your password signs you out everywhere else."
      />
      <form onSubmit={submit} className="surface space-y-5 rounded-xl p-6">
        <div className="space-y-2">
          <Label htmlFor="old">Current password</Label>
          <Input
            id="old"
            type="password"
            value={oldPassword}
            onChange={(e) => setOld(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new">New password</Label>
          <Input
            id="new"
            type="password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          {mismatch && (
            <p className="text-xs text-red-400">Passwords don't match</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || mismatch}
          className="w-full"
          size="lg"
        >
          <ShieldCheck /> {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
