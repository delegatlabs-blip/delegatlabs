import { AdminResetPasswordForm } from "@/lib/domains/auth/features/reset-password-form";

export default function AdminResetPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground">Required after first one-time login</p>
        </div>
        <AdminResetPasswordForm />
      </div>
    </div>
  );
}
