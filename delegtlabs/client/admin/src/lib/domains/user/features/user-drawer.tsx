"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createUser, updateUser, type User } from "@/lib/domains/user";
import { OneTimePasswordDialog } from "@/lib/domains/auth/features/one-time-password-dialog";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  role: z.enum(["Owner", "Admin", "Editor", "Viewer", "Billing"]),
  company: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function UserDrawer({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User | null;
  onSaved?: () => void;
}) {
  const isEdit = !!user;
  const [otp, setOtp] = useState<{ email: string; password: string } | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "Editor",
      company: "",
      notes: "",
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        user
          ? {
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: (["Owner", "Admin", "Editor", "Viewer", "Billing"].includes(user.role)
                ? user.role
                : "Editor") as FormValues["role"],
              company: user.company,
              notes: user.notes,
              active: user.status === "active",
            }
          : {
              name: "",
              email: "",
              phone: "",
              role: "Editor",
              company: "",
              notes: "",
              active: true,
            },
      );
    }
  }, [open, user, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const status = values.active ? "active" : "suspended";
      if (isEdit && user) {
        const updated = await updateUser(user.id, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          company: values.company,
          role: values.role,
          notes: values.notes,
          status,
        });
        if (!updated) throw new Error("Update failed");
        toast.success("User updated", { description: `${values.name} · ${values.role}` });
      } else {
        const { oneTimePassword } = await createUser({
          name: values.name,
          email: values.email,
          phone: values.phone,
          company: values.company,
          role: values.role,
          notes: values.notes,
          status: values.active ? "active" : "invited",
        });
        toast.success("Owner created", { description: `${values.name} · ${values.role}` });
        onSaved?.();
        onOpenChange(false);
        setOtp({ email: values.email.trim().toLowerCase(), password: oneTimePassword });
        return;
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save user");
    }
  };

  const initials = form
    .watch("name")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-6">
          <SheetTitle>{isEdit ? "Edit owner" : "Add owner"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update owner profile and access."
              : "Create an admin-console owner and issue a one-time login password."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarFallback className="text-lg">{initials || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{isEdit ? "Profile" : "New user"}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">Avatar is generated from initials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Ada Lovelace" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="ada@delegatelabs.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+1 555 0100" {...form.register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Delegate Labs" {...form.register("company")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Role</Label>
                <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as FormValues["role"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Owner", "Admin", "Editor", "Viewer", "Billing"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} placeholder="Add any internal notes" {...form.register("notes")} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Account active</p>
                <p className="text-xs text-muted-foreground">User can sign in and access the workspace</p>
              </div>
              <Switch checked={form.watch("active")} onCheckedChange={(v) => form.setValue("active", v)} />
            </div>
          </div>

          <SheetFooter className="border-t bg-muted/30 p-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="shadow-elegant">
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add owner"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
    <OneTimePasswordDialog
      open={!!otp}
      onOpenChange={(v) => !v && setOtp(null)}
      email={otp?.email ?? ""}
      oneTimePassword={otp?.password ?? ""}
      kind="owner"
    />
    </>
  );
}
