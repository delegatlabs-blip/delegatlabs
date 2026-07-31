"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import type { AgentDrawerFormValues } from "@/lib/domains/agent/schema/agent-drawer.schema";
import { AgentDrawerLinksFields } from "./agent-drawer-fields";

type FormValues = AgentDrawerFormValues;

export function AgentDrawerPublishStep({
  register,
  errors,
  watch,
  setValue,
}: {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}) {
  return (
    <div className="space-y-6">
      <AgentDrawerLinksFields register={register} errors={errors} />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visibility
        </h3>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">List on website</p>
            <p className="text-xs text-muted-foreground">Show in the public marketplace</p>
          </div>
          <Switch
            checked={watch("listedOnWebsite")}
            onCheckedChange={(v) => setValue("listedOnWebsite", v)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Featured</p>
            <p className="text-xs text-muted-foreground">Highlight on homepage / explore</p>
          </div>
          <Switch
            checked={watch("featured")}
            onCheckedChange={(v) => setValue("featured", v)}
          />
        </div>
      </section>
    </div>
  );
}
