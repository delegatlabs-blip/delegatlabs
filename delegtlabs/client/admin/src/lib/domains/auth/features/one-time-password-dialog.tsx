"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OneTimePasswordDialog({
  open,
  onOpenChange,
  email,
  oneTimePassword,
  kind,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  email: string;
  oneTimePassword: string;
  kind: "owner" | "user";
}) {
  const portal = kind === "owner" ? "admin console" : "user portal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>One-time login password</DialogTitle>
          <DialogDescription>
            Share this with {email}. They sign in to the {portal}, then must set a new
            password. It will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Password</label>
          <div className="flex gap-2">
            <Input readOnly value={oneTimePassword} className="font-mono text-sm" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(oneTimePassword);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
