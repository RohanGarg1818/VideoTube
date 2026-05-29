import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthAPI } from "../services/endpoints";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";

export function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user)!;
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [savingAccount, setSavingAccount] = useState(false);

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const updated = await AuthAPI.updateAccount({ fullName, email });
      setUser(updated);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSavingAccount(false);
    }
  };

  const updateAvatar = async (file: File | null) => {
    if (!file) return;
    try {
      const updated = await AuthAPI.updateAvatar(file);
      setUser(updated);
      toast.success("Avatar updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const updateCover = async (file: File | null) => {
    if (!file) return;
    try {
      const updated = await AuthAPI.updateCover(file);
      setUser(updated);
      toast.success("Cover updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={savingAccount}>{savingAccount ? "Saving…" : "Save profile"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Avatar</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <Input type="file" accept="image/*" onChange={(e) => updateAvatar(e.target.files?.[0] ?? null)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cover image</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {user.coverImage && (
            <img src={user.coverImage} alt="Cover" className="w-full aspect-[6/1] object-cover rounded-md" />
          )}
          <Input type="file" accept="image/*" onChange={(e) => updateCover(e.target.files?.[0] ?? null)} />
        </CardContent>
      </Card>
    </div>
  );
}