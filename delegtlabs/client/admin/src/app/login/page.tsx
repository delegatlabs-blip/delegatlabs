import { AdminLoginForm } from "@/lib/domains/auth/features/login-form";

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">Owner access to the admin console</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
