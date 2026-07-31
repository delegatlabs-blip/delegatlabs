"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetOwnerPasswordAction } from "@/lib/domains/auth/controllers/auth.controller";
import { useAdminAuthStore } from "@/lib/domains/auth/session-store";

export function AdminResetPasswordForm() {
  const router = useRouter();
  const session = useAdminAuthStore((s) => s.session);
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.email) {
      toast.error("Sign in with your one-time password first");
      router.replace("/login");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetOwnerPasswordAction(session.email, password);
      setSession({ ...session, mustReset: false });
      toast.success("Password updated");
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a permanent password for <span className="font-medium">{session?.email}</span>
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
