import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Zap, Loader2, KeyRound, AlertCircle, Info } from "lucide-react";
import { adminAuthApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Alert, AlertDescription } from "@shared/components/ui/alert";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: () => adminAuthApi.login(password),
    onSuccess: () => {
      window.location.href = "/overview";
    },
    onError: () => {
      setError("Invalid password. Check ADMIN_PASSWORD in backend .env");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        <Card className="shadow-raised">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="size-6" />
            </div>
            <CardTitle className="text-xl">AntGrav Admin</CardTitle>
            <p className="text-sm text-muted-foreground">Platform admin panel</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && !login.isPending && password && login.mutate()}
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            <Button
              className="w-full"
              onClick={() => login.mutate()}
              disabled={login.isPending || !password}
            >
              {login.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Sign in
            </Button>
          </CardContent>
        </Card>

        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Default password is <code className="rounded bg-muted px-1 py-0.5">changeme123</code>.
            Set <code className="rounded bg-muted px-1 py-0.5">ADMIN_PASSWORD</code> in{" "}
            <code className="rounded bg-muted px-1 py-0.5">backend/.env</code> to change it.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
