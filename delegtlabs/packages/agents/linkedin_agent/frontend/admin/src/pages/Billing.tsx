import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import {
  adminApi,
  adminAuthApi,
  type CatalogActionCost,
  type CatalogActionCostWrite,
  type CatalogPack,
  type CatalogPackWrite,
  type CatalogPlan,
  type CatalogPlanWrite,
} from "@shared/api";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Switch } from "@shared/components/ui/switch";
import { Textarea } from "@shared/components/ui/textarea";
import { PageHeader } from "@shared/components/shared-ui";

const AGENT_KINDS = ["post_gen", "lead_gen", "analytics"] as const;
const TIERS = ["free", "starter", "pro", "enterprise"] as const;
const PERIODS = ["monthly", "yearly"] as const;

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "message" in detail) {
      const msg = (detail as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function majorToMinor(major: string): number {
  const n = Number(major);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function minorToMajor(minor: number): string {
  return String(minor / 100);
}

function parseFeatures(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function featuresToText(features: string[] | undefined): string {
  return Array.isArray(features) ? features.join("\n") : "";
}

export default function BillingPage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminAuthApi.me,
  });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: adminApi.catalog,
  });

  const writesDisabled = me?.role === "support";

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ["admin-catalog"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Catalog plans, credit packs, and action costs. Soft-off with is_active. No deletes."
      />

      {writesDisabled ? (
        <p className="text-sm text-muted-foreground">
          Support can view the catalog. Writes require tech or finance.
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(error, "Could not load catalog.")}
        </p>
      ) : (
        <>
          <PlansSection
            plans={data?.plans ?? []}
            writesDisabled={writesDisabled}
            onSaved={invalidate}
          />
          <PacksSection
            packs={data?.packs ?? []}
            writesDisabled={writesDisabled}
            onSaved={invalidate}
          />
          <ActionCostsSection
            costs={data?.action_costs ?? []}
            writesDisabled={writesDisabled}
            onSaved={invalidate}
          />
        </>
      )}
    </div>
  );
}

function PlansSection({
  plans,
  writesDisabled,
  onSaved,
}: {
  plans: CatalogPlan[];
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Plans</h2>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plans yet.</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanEditor
              key={`${plan.id}-${plan.updated_at}`}
              plan={plan}
              writesDisabled={writesDisabled}
              onSaved={onSaved}
            />
          ))}
        </div>
      )}
      <CreatePlanForm writesDisabled={writesDisabled} onSaved={onSaved} />
    </section>
  );
}

function PlanEditor({
  plan,
  writesDisabled,
  onSaved,
}: {
  plan: CatalogPlan;
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(plan.code);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [agentKind, setAgentKind] = useState(plan.agent_kind);
  const [tier, setTier] = useState(plan.tier);
  const [inr, setInr] = useState(minorToMajor(plan.price_inr_minor));
  const [usd, setUsd] = useState(minorToMajor(plan.price_usd_minor));
  const [period, setPeriod] = useState(plan.billing_period);
  const [monthlyCredits, setMonthlyCredits] = useState(String(plan.monthly_credits ?? 0));
  const [dailyText, setDailyText] = useState(String(plan.daily_text ?? 0));
  const [dailyImage, setDailyImage] = useState(String(plan.daily_image ?? 0));
  const [weeklyImage, setWeeklyImage] = useState(String(plan.weekly_image ?? 0));
  const [rollover, setRollover] = useState(String(plan.rollover_months));
  const [seats, setSeats] = useState(String(plan.seats));
  const [accounts, setAccounts] = useState(String(plan.linkedin_accounts));
  const [features, setFeatures] = useState(featuresToText(plan.features));
  const [badge, setBadge] = useState(plan.badge ?? "");
  const [sortOrder, setSortOrder] = useState(String(plan.sort_order));
  const [isActive, setIsActive] = useState(plan.is_active);
  const [isDefault, setIsDefault] = useState(plan.is_default);

  const mut = useMutation({
    mutationFn: (body: CatalogPlanWrite) => adminApi.updatePlan(plan.id, body),
    onSuccess: () => {
      toast.success("Plan updated");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Plan update failed")),
  });

  function save() {
    mut.mutate({
      code,
      name,
      description: description || null,
      agent_kind: agentKind,
      tier,
      price_inr_minor: majorToMinor(inr),
      price_usd_minor: majorToMinor(usd),
      billing_period: period,
      monthly_credits: Number(monthlyCredits) || 0,
      daily_text: Number(dailyText) || 0,
      daily_image: Number(dailyImage) || 0,
      weekly_image: Number(weeklyImage) || 0,
      rollover_months: Number(rollover) || 0,
      seats: Number(seats) || 1,
      linkedin_accounts: Number(accounts) || 1,
      features: parseFeatures(features),
      badge: badge || null,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      is_default: isDefault,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{plan.code}</Badge>
          {plan.is_active ? <Badge>active</Badge> : <Badge variant="outline">inactive</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Badge"><Input value={badge} onChange={(e) => setBadge(e.target.value)} disabled={writesDisabled} /></Field>
        </div>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={writesDisabled} />
        </Field>
        <div className="grid gap-2 md:grid-cols-4">
          <Field label="Agent">
            <KindSelect value={agentKind} onChange={setAgentKind} disabled={writesDisabled} />
          </Field>
          <Field label="Tier">
            <Select value={tier} onValueChange={setTier} disabled={writesDisabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Period">
            <Select value={period} onValueChange={setPeriod} disabled={writesDisabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sort">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <PriceFields inr={inr} usd={usd} setInr={setInr} setUsd={setUsd} disabled={writesDisabled} />
        <div className="grid gap-2 md:grid-cols-4">
          <Field label="Monthly credits">
            <Input type="number" value={monthlyCredits} onChange={(e) => setMonthlyCredits(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Daily text">
            <Input type="number" min="0" value={dailyText} onChange={(e) => setDailyText(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Daily image">
            <Input type="number" min="0" value={dailyImage} onChange={(e) => setDailyImage(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Weekly image">
            <Input type="number" min="0" value={weeklyImage} onChange={(e) => setWeeklyImage(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <Field label="Rollover months">
            <Input type="number" value={rollover} onChange={(e) => setRollover(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Seats">
            <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="LinkedIn accounts">
            <Input type="number" value={accounts} onChange={(e) => setAccounts(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <Field label="Features (one per line)">
          <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} disabled={writesDisabled} />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <ActiveSwitch checked={isActive} onChange={setIsActive} disabled={writesDisabled} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={writesDisabled}
            />
            Default
          </label>
          <Button size="sm" disabled={writesDisabled || mut.isPending || !code.trim() || !name.trim()} onClick={save}>
            Save plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePlanForm({
  writesDisabled,
  onSaved,
}: {
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [inr, setInr] = useState("0");
  const [usd, setUsd] = useState("0");
  const [dailyText, setDailyText] = useState("0");
  const [dailyImage, setDailyImage] = useState("0");
  const [weeklyImage, setWeeklyImage] = useState("0");

  const mut = useMutation({
    mutationFn: (body: CatalogPlanWrite) => adminApi.createPlan(body),
    onSuccess: () => {
      setCode("");
      setName("");
      setInr("0");
      setUsd("0");
      setDailyText("0");
      setDailyImage("0");
      setWeeklyImage("0");
      toast.success("Plan created");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Plan create failed")),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Create plan</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} disabled={writesDisabled} /></Field>
        </div>
        <PriceFields inr={inr} usd={usd} setInr={setInr} setUsd={setUsd} disabled={writesDisabled} />
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Daily text">
            <Input type="number" min="0" value={dailyText} onChange={(e) => setDailyText(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Daily image">
            <Input type="number" min="0" value={dailyImage} onChange={(e) => setDailyImage(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Weekly image">
            <Input type="number" min="0" value={weeklyImage} onChange={(e) => setWeeklyImage(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <Button
          size="sm"
          disabled={writesDisabled || mut.isPending || !code.trim() || !name.trim()}
          onClick={() =>
            mut.mutate({
              code: code.trim(),
              name: name.trim(),
              price_inr_minor: majorToMinor(inr),
              price_usd_minor: majorToMinor(usd),
              daily_text: Number(dailyText) || 0,
              daily_image: Number(dailyImage) || 0,
              weekly_image: Number(weeklyImage) || 0,
            })
          }
        >
          Create plan
        </Button>
      </CardContent>
    </Card>
  );
}

function PacksSection({
  packs,
  writesDisabled,
  onSaved,
}: {
  packs: CatalogPack[];
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Credit packs</h2>
      {packs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No credit packs yet.</p>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <PackEditor
              key={`${pack.id}-${pack.updated_at}`}
              pack={pack}
              writesDisabled={writesDisabled}
              onSaved={onSaved}
            />
          ))}
        </div>
      )}
      <CreatePackForm writesDisabled={writesDisabled} onSaved={onSaved} />
    </section>
  );
}

function PackEditor({
  pack,
  writesDisabled,
  onSaved,
}: {
  pack: CatalogPack;
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(pack.code);
  const [name, setName] = useState(pack.name);
  const [description, setDescription] = useState(pack.description ?? "");
  const [inr, setInr] = useState(minorToMajor(pack.price_inr_minor));
  const [usd, setUsd] = useState(minorToMajor(pack.price_usd_minor));
  const [credits, setCredits] = useState(String(pack.credits));
  const [bonus, setBonus] = useState(String(pack.bonus_credits));
  const [badge, setBadge] = useState(pack.badge ?? "");
  const [sortOrder, setSortOrder] = useState(String(pack.sort_order));
  const [isActive, setIsActive] = useState(pack.is_active);

  const mut = useMutation({
    mutationFn: (body: CatalogPackWrite) => adminApi.updatePack(pack.id, body),
    onSuccess: () => {
      toast.success("Pack updated");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Pack update failed")),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{pack.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{pack.code}</Badge>
          <Badge variant="outline">{pack.total_credits} total credits</Badge>
          {pack.is_active ? <Badge>active</Badge> : <Badge variant="outline">inactive</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Badge"><Input value={badge} onChange={(e) => setBadge(e.target.value)} disabled={writesDisabled} /></Field>
        </div>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={writesDisabled} />
        </Field>
        <PriceFields inr={inr} usd={usd} setInr={setInr} setUsd={setUsd} disabled={writesDisabled} />
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Credits">
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Bonus credits">
            <Input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Sort">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ActiveSwitch checked={isActive} onChange={setIsActive} disabled={writesDisabled} />
          <Button
            size="sm"
            disabled={writesDisabled || mut.isPending || !code.trim() || !name.trim()}
            onClick={() =>
              mut.mutate({
                code,
                name,
                description: description || null,
                price_inr_minor: majorToMinor(inr),
                price_usd_minor: majorToMinor(usd),
                credits: Number(credits) || 0,
                bonus_credits: Number(bonus) || 0,
                badge: badge || null,
                sort_order: Number(sortOrder) || 0,
                is_active: isActive,
              })
            }
          >
            Save pack
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePackForm({
  writesDisabled,
  onSaved,
}: {
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("200");
  const [inr, setInr] = useState("0");
  const [usd, setUsd] = useState("0");

  const mut = useMutation({
    mutationFn: (body: CatalogPackWrite) => adminApi.createPack(body),
    onSuccess: () => {
      setCode("");
      setName("");
      setCredits("200");
      setInr("0");
      setUsd("0");
      toast.success("Pack created");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Pack create failed")),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Create pack</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Code"><Input value={code} onChange={(e) => setCode(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} disabled={writesDisabled} /></Field>
          <Field label="Credits">
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <PriceFields inr={inr} usd={usd} setInr={setInr} setUsd={setUsd} disabled={writesDisabled} />
        <Button
          size="sm"
          disabled={writesDisabled || mut.isPending || !code.trim() || !name.trim()}
          onClick={() =>
            mut.mutate({
              code: code.trim(),
              name: name.trim(),
              credits: Number(credits) || 0,
              price_inr_minor: majorToMinor(inr),
              price_usd_minor: majorToMinor(usd),
            })
          }
        >
          Create pack
        </Button>
      </CardContent>
    </Card>
  );
}

function ActionCostsSection({
  costs,
  writesDisabled,
  onSaved,
}: {
  costs: CatalogActionCost[];
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Action costs</h2>
      {costs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No action costs yet.</p>
      ) : (
        <div className="space-y-3">
          {costs.map((cost) => (
            <ActionCostEditor
              key={`${cost.id}-${cost.updated_at}`}
              cost={cost}
              writesDisabled={writesDisabled}
              onSaved={onSaved}
            />
          ))}
        </div>
      )}
      <CreateActionCostForm writesDisabled={writesDisabled} onSaved={onSaved} />
    </section>
  );
}

function ActionCostEditor({
  cost,
  writesDisabled,
  onSaved,
}: {
  cost: CatalogActionCost;
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  const [actionKey, setActionKey] = useState(cost.action_key);
  const [label, setLabel] = useState(cost.label);
  const [description, setDescription] = useState(cost.description ?? "");
  const [agentKind, setAgentKind] = useState(cost.agent_kind);
  const [credits, setCredits] = useState(String(cost.credits));
  const [sortOrder, setSortOrder] = useState(String(cost.sort_order));
  const [isActive, setIsActive] = useState(cost.is_active);

  const mut = useMutation({
    mutationFn: (body: CatalogActionCostWrite) => adminApi.updateActionCost(cost.id, body),
    onSuccess: () => {
      toast.success("Action cost updated");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Action cost update failed")),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{cost.label}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{cost.action_key}</Badge>
          {cost.is_active ? <Badge>active</Badge> : <Badge variant="outline">inactive</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Action key">
            <Input value={actionKey} onChange={(e) => setActionKey(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Label">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Credits">
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={writesDisabled} />
        </Field>
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Agent">
            <KindSelect value={agentKind} onChange={setAgentKind} disabled={writesDisabled} />
          </Field>
          <Field label="Sort">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ActiveSwitch checked={isActive} onChange={setIsActive} disabled={writesDisabled} />
          <Button
            size="sm"
            disabled={writesDisabled || mut.isPending || !actionKey.trim() || !label.trim()}
            onClick={() =>
              mut.mutate({
                action_key: actionKey,
                label,
                description: description || null,
                agent_kind: agentKind,
                credits: Number(credits) || 0,
                sort_order: Number(sortOrder) || 0,
                is_active: isActive,
              })
            }
          >
            Save action cost
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateActionCostForm({
  writesDisabled,
  onSaved,
}: {
  writesDisabled: boolean;
  onSaved: () => void;
}) {
  const [actionKey, setActionKey] = useState("");
  const [label, setLabel] = useState("");
  const [credits, setCredits] = useState("0");

  const mut = useMutation({
    mutationFn: (body: CatalogActionCostWrite) => adminApi.createActionCost(body),
    onSuccess: () => {
      setActionKey("");
      setLabel("");
      setCredits("0");
      toast.success("Action cost created");
      onSaved();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Action cost create failed")),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Create action cost</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Action key">
            <Input value={actionKey} onChange={(e) => setActionKey(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Label">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} disabled={writesDisabled} />
          </Field>
          <Field label="Credits">
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} disabled={writesDisabled} />
          </Field>
        </div>
        <Button
          size="sm"
          disabled={writesDisabled || mut.isPending || !actionKey.trim() || !label.trim()}
          onClick={() =>
            mut.mutate({
              action_key: actionKey.trim(),
              label: label.trim(),
              credits: Number(credits) || 0,
            })
          }
        >
          Create action cost
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PriceFields({
  inr,
  usd,
  setInr,
  setUsd,
  disabled,
}: {
  inr: string;
  usd: string;
  setInr: (v: string) => void;
  setUsd: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <Field label="INR (₹ major; stored as paise)">
        <Input type="number" min="0" step="0.01" value={inr} onChange={(e) => setInr(e.target.value)} disabled={disabled} />
      </Field>
      <Field label="USD ($ major; stored as cents)">
        <Input type="number" min="0" step="0.01" value={usd} onChange={(e) => setUsd(e.target.value)} disabled={disabled} />
      </Field>
    </div>
  );
}

function KindSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {AGENT_KINDS.map((k) => (
          <SelectItem key={k} value={k}>{k}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActiveSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      Active
    </label>
  );
}
