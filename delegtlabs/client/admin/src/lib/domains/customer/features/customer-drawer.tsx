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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createCustomer, updateCustomer, type Customer } from "@/lib/domains/customer";
import { OneTimePasswordDialog } from "@/lib/domains/auth/features/one-time-password-dialog";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  plan: z.enum(["Free", "Starter", "Pro", "Enterprise"]),
  status: z.enum(["active", "trial", "churned", "suspended"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CustomerDrawer({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer | null;
  onSaved?: () => void;
}) {
  const isEdit = !!customer;
  const [otp, setOtp] = useState<{ email: string; password: string } | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      plan: "Starter",
      status: "active",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        customer
          ? {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              company: customer.company,
              plan: customer.plan,
              status: customer.status,
              notes: customer.notes,
            }
          : {
              name: "",
              email: "",
              phone: "",
              company: "",
              plan: "Starter",
              status: "active",
              notes: "",
            },
      );
    }
  }, [open, customer, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && customer) {
        const updated = await updateCustomer(customer.id, values);
        if (!updated) throw new Error("Update failed");
        toast.success("User updated", { description: `${values.name} · ${values.company}` });
        onSaved?.();
        onOpenChange(false);
      } else {
        const { oneTimePassword } = await createCustomer(values);
        toast.success("User created", { description: `${values.name} · ${values.company}` });
        onSaved?.();
        onOpenChange(false);
        setOtp({ email: values.email.trim().toLowerCase(), password: oneTimePassword });
      }
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
          <SheetTitle>{isEdit ? "Edit user" : "Add user"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update profile, plan and account status."
              : "Create a portal user and issue a one-time login password."}
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
                <Input id="name" placeholder="Jordan Brooks" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="jordan@company.com" {...form.register("email")} />
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
                <Input id="company" placeholder="Northwind AI" {...form.register("company")} />
                {form.formState.errors.company && (
                  <p className="text-xs text-destructive">{form.formState.errors.company.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select
                  value={form.watch("plan")}
                  onValueChange={(v) => form.setValue("plan", v as FormValues["plan"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Free", "Starter", "Pro", "Enterprise"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["active", "trial", "churned", "suspended"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
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
          </div>

          <SheetFooter className="border-t bg-muted/30 p-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="shadow-elegant">
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add user"}
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
      kind="user"
    />
    </>
  );
}
