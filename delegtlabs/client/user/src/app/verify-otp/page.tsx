"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  resetUserPasswordWithOtpAction,
  verifyUserOtpAction,
} from "@/lib/domains/auth/actions";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [loading, setLoading] = useState(false);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyUserOtpAction(email, otp);
      toast.success("Code verified — set a new password");
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetUserPasswordWithOtpAction(email, otp, password);
      toast.success("Password updated — sign in");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  if (step === "password") {
    return (
      <form onSubmit={onReset} className="space-y-4">
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
          {loading ? "Saving…" : "Save password & sign in"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onVerify} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="otp">OTP code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">Dev default OTP: 123456</p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verifying…" : "Verify OTP"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Resend code
        </Link>
      </p>
    </form>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md space-y-6 p-8 shadow-lg">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verify OTP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the code, then set a new password
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <VerifyOtpForm />
        </Suspense>
      </Card>
    </div>
  );
}
