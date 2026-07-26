import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/layout/theme-provider";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Delegate Labs" },
      { name: "description", content: "Workspace preferences, appearance and notifications." },
      { property: "og:title", content: "Settings — Delegate Labs" },
      { property: "og:description", content: "Workspace preferences and appearance." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your profile and workspace preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src="https://i.pravatar.cc/96?img=13" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <Button variant="outline">Change photo</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input defaultValue="Avery Chen" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue="avery@delegatelabs.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Delegate Labs looks to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Use a darker theme across the app.</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you'd like to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Product updates", desc: "New features and improvements" },
            { label: "Billing", desc: "Invoices, receipts and plan changes" },
            { label: "Weekly digest", desc: "A summary of your workspace" },
          ].map((n, i) => (
            <div key={n.label}>
              {i > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch defaultChecked={i !== 2} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button className="shadow-elegant">Save changes</Button>
      </div>
    </div>
  );
}
