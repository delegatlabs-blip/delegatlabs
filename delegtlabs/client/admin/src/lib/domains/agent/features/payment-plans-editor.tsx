"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BillingInterval } from "@/lib/domains/agent";

export type SubscriptionPlanForm = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  featuresText?: string;
  active: boolean;
};

export type CreditPackForm = {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  featuresText?: string;
  active: boolean;
};

function newId() {
  return crypto.randomUUID();
}

const emptySubscription = (): SubscriptionPlanForm => ({
  id: newId(),
  name: "",
  price: 49,
  currency: "USD",
  billingInterval: "monthly",
  featuresText: "",
  active: true,
});

const emptyCredit = (): CreditPackForm => ({
  id: newId(),
  name: "",
  price: 29,
  currency: "USD",
  credits: 100,
  featuresText: "",
  active: true,
});

export function SubscriptionPlansEditor({
  plans,
  onChange,
  error,
}: {
  plans: SubscriptionPlanForm[];
  onChange: (next: SubscriptionPlanForm[]) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<SubscriptionPlanForm>(emptySubscription());

  const openCreate = () => {
    setEditIndex(null);
    setDraft(emptySubscription());
    setOpen(true);
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    setDraft({ ...plans[index] });
    setOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editIndex === null) {
      onChange([...plans, { ...draft, id: draft.id || newId() }]);
    } else {
      const next = [...plans];
      next[editIndex] = { ...draft };
      onChange(next);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Subscription plans</p>
        <Button type="button" size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add more
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No plans yet. Click Add more to create one.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan, index) => (
                <TableRow key={plan.id} className={!plan.active ? "opacity-60" : undefined}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.name || "Untitled"}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {plan.featuresText || "No features"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {plan.currency} {plan.price}
                  </TableCell>
                  <TableCell className="capitalize">{plan.billingInterval}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.active ? "default" : "secondary"}>
                        {plan.active ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={plan.active}
                        onCheckedChange={(v) => {
                          const next = [...plans];
                          next[index] = { ...plan, active: v };
                          onChange(next);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(index)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      disabled={plans.length <= 1}
                      onClick={() => onChange(plans.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[60] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editIndex === null ? "Add subscription plan" : "Edit subscription plan"}</DialogTitle>
            <DialogDescription>
              Set pricing and features for this plan. Toggle Active in the table after saving.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Growth"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Billing interval</Label>
              <Select
                value={draft.billingInterval}
                onValueChange={(v) =>
                  setDraft({ ...draft, billingInterval: v as BillingInterval })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Features</Label>
              <Textarea
                rows={3}
                placeholder="Comma-separated features"
                value={draft.featuresText || ""}
                onChange={(e) => setDraft({ ...draft, featuresText: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this plan to customers</p>
              </div>
              <Switch
                checked={draft.active}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={!draft.name.trim()}>
              {editIndex === null ? "Add plan" : "Save plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CreditPacksEditor({
  packs,
  onChange,
  error,
}: {
  packs: CreditPackForm[];
  onChange: (next: CreditPackForm[]) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<CreditPackForm>(emptyCredit());

  useEffect(() => {
    if (!open) setEditIndex(null);
  }, [open]);

  const openCreate = () => {
    setEditIndex(null);
    setDraft(emptyCredit());
    setOpen(true);
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    setDraft({ ...packs[index] });
    setOpen(true);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editIndex === null) {
      onChange([...packs, { ...draft, id: draft.id || newId() }]);
    } else {
      const next = [...packs];
      next[editIndex] = { ...draft };
      onChange(next);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Credit packs</p>
        <Button type="button" size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add more
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No packs yet. Click Add more to create one.
                </TableCell>
              </TableRow>
            ) : (
              packs.map((pack, index) => (
                <TableRow key={pack.id} className={!pack.active ? "opacity-60" : undefined}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pack.name || "Untitled"}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {pack.featuresText || "No features"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {pack.currency} {pack.price}
                  </TableCell>
                  <TableCell>{pack.credits}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={pack.active ? "default" : "secondary"}>
                        {pack.active ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={pack.active}
                        onCheckedChange={(v) => {
                          const next = [...packs];
                          next[index] = { ...pack, active: v };
                          onChange(next);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="icon" variant="ghost" onClick={() => openEdit(index)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      disabled={packs.length <= 1}
                      onClick={() => onChange(packs.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[60] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editIndex === null ? "Add credit pack" : "Edit credit pack"}</DialogTitle>
            <DialogDescription>
              Set pack price, credit amount, and features shown on the website.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. 100 credits"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Credits</Label>
              <Input
                type="number"
                min={1}
                value={draft.credits}
                onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Currency</Label>
              <Input
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Features</Label>
              <Textarea
                rows={3}
                placeholder="Comma-separated features"
                value={draft.featuresText || ""}
                onChange={(e) => setDraft({ ...draft, featuresText: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this pack to customers</p>
              </div>
              <Switch
                checked={draft.active}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={!draft.name.trim()}>
              {editIndex === null ? "Add pack" : "Save pack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
