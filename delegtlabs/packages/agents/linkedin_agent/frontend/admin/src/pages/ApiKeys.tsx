import { useQuery } from "@tanstack/react-query";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { adminApi } from "@shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Separator } from "@shared/components/ui/separator";
import { PageHeader, InlineLoader } from "@shared/components/shared-ui";

const KEY_LABELS: Record<string, string> = {
  GEMINI_API_KEY: "Gemini API Key",
  GROK_API_KEY: "Grok (xAI) API Key",
  LINKEDIN_CLIENT_ID: "LinkedIn Client ID",
  LINKEDIN_CLIENT_SECRET: "LinkedIn Client Secret",
  ADMIN_JWT_SECRET: "Admin JWT Secret",
  TOKEN_ENC_KEY: "Token Encryption Key",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase Service Role Key",
};

export default function ApiKeysPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-keys"],
    queryFn: () => adminApi.platformKeys(),
  });

  const keys = data?.keys || {};

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="API keys"
        description="Platform secrets are set in backend .env — only admins can view configuration status. Values are never sent to the browser."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" />
            Configuration status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <InlineLoader label="Checking keys" />
          ) : (
            <div className="space-y-0">
              {Object.entries(KEY_LABELS).map(([env, label], i) => {
                const configured = Boolean(keys[env]?.configured);
                return (
                  <div key={env}>
                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{env}</div>
                      </div>
                      {configured ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="size-3.5" /> Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <XCircle className="size-3.5" /> Missing
                        </span>
                      )}
                    </div>
                    {i < Object.keys(KEY_LABELS).length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Update keys in <code className="rounded bg-muted px-1">packages/agents/linkedin_agent/backend/.env</code>{" "}
            then recreate the backend container.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
