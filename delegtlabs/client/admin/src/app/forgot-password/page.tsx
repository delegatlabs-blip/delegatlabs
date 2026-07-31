import { AdminForgotPasswordForm } from "@/lib/domains/auth/features/forgot-password-form";

export default function AdminForgotPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">We will email a one-time code</p>
        </div>
        <AdminForgotPasswordForm />
      </div>
    </div>
  );
}
