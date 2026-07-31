import { Suspense } from "react";
import { AdminVerifyOtpForm } from "@/lib/domains/auth/features/verify-otp-form";

export default function AdminVerifyOtpPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Verify OTP</h1>
          <p className="text-sm text-muted-foreground">Enter the code, then set a new password</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
          <AdminVerifyOtpForm />
        </Suspense>
      </div>
    </div>
  );
}
