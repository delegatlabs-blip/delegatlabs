import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, RefreshCw, Save, Loader2, CheckCircle2, AlertTriangle, Shield } from "lucide-react";

import { authApi, settingsApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Switch } from "@shared/components/ui/switch";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { LinkedInSessionHint, PageHeader } from "@shared/components/shared-ui";

/** User settings: LinkedIn + agent behavior only. Platform API keys live in the admin panel. */
export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const [autoPub, setAutoPub] = useState("false");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setAutoPub(settings["auto_publish_enabled"]?.value ?? "false");
      setInitialized(true);
    }
  }, [settings, initialized]);

  const mutation = useMutation({
    mutationFn: () => settingsApi.patch({ auto_publish_enabled: autoPub }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Your LinkedIn connection and agent preferences" />

      <section className="space-y-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-4 text-primary" />
              LinkedIn Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {authStatus?.connected ? (
              <>
                <Alert className="border-success/25 bg-success/5">
                  <CheckCircle2 className="size-4 text-success" />
                  <AlertDescription>
                    <div className="font-medium">{authStatus.display_name ?? "Connected"}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{authStatus.email}</div>
                  </AlertDescription>
                </Alert>
                <div className="flex min-h-14 flex-wrap items-center gap-3 rounded-lg border bg-surface-secondary p-3 text-sm text-muted-foreground">
                  {authStatus.expiry_warning || authStatus.expired ? (
                    <AlertTriangle className={`size-3.5 ${authStatus.expired ? "text-destructive" : "text-warning"}`} />
                  ) : (
                    <CheckCircle2 className="size-3.5 text-success" />
                  )}
                  Token expires in <strong>{authStatus.days_to_expiry} days</strong>
                </div>
                <Button variant="outline" asChild>
                  <a href={authApi.loginUrl()}>
                    <RefreshCw className="size-3.5" />
                    Reconnect LinkedIn
                  </a>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">No LinkedIn account connected yet.</p>
                <Button asChild>
                  <a href={authApi.loginUrl()}>
                    <Link2 className="size-3.5" />
                    Connect LinkedIn Account
                  </a>
                </Button>
                <LinkedInSessionHint />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Publishing</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Agent behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : (
              <div className="space-y-4">
                <div className="flex min-h-14 items-center justify-between gap-4 rounded-lg border px-3 py-3">
                  <div>
                    <div className="text-sm font-medium">Auto-Publish Mode</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Approved posts publish automatically on schedule
                    </div>
                  </div>
                  <Switch checked={autoPub === "true"} onCheckedChange={(v) => setAutoPub(v ? "true" : "false")} />
                </div>
                <Button className="h-11 sm:h-9" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save
                </Button>
                {mutation.isSuccess && <p className="text-xs text-success">Settings saved</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
