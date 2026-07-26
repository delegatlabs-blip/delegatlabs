import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/lib/mock-data";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  role: z.enum(["Admin", "Editor", "Viewer", "Owner"]),
  department: z.string().min(1, "Department is required"),
  status: z.enum(["active", "invited", "suspended"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UserDrawer({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user?: User | null;
}) {
  const editing = !!user;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "Editor",
      department: "Engineering",
      status: "active",
      notes: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: "",
        role: user.role,
        department: user.department,
        status: user.status,
        notes: "",
      });
    } else {
      form.reset();
    }
  }, [user, open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 500));
    toast.success(editing ? "User updated" : "User created", {
      description: `${values.name} · ${values.role}`,
    });
    onOpenChange(false);
  });

  const initials = form.watch("name").split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="text-lg">{editing ? "Edit user" : "Invite new user"}</SheetTitle>
          <SheetDescription>
            {editing ? "Update profile, role and permissions." : "Fill in the details to add a member."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 ring-4 ring-muted/60">
                <AvatarFallback className="bg-[image:var(--gradient-primary)] text-lg font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button type="button" variant="outline" size="sm">
                  Upload photo
                </Button>
                <p className="mt-1.5 text-[11px] text-muted-foreground">PNG or JPG, max 2MB</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} placeholder="Jane Cooper" />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input {...form.register("email")} type="email" placeholder="jane@company.com" />
              </Field>
              <Field label="Phone">
                <Input {...form.register("phone")} placeholder="+1 555 0100" />
              </Field>
              <Field label="Department" error={form.formState.errors.department?.message}>
                <Input {...form.register("department")} />
              </Field>
              <Field label="Role">
                <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as FormValues["role"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Owner", "Admin", "Editor", "Viewer"] as const).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Notes">
              <Textarea {...form.register("notes")} rows={3} placeholder="Optional internal notes…" />
            </Field>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t bg-muted/30 p-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : editing ? "Save changes" : "Send invite"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}