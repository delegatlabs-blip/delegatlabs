"use client";

import { type FieldErrors, type UseFormRegister, type UseFormWatch, type UseFormSetValue } from "react-hook-form";
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
import type { AgentStatus } from "@/lib/domains/agent/types";
import type { AgentDrawerFormValues } from "@/lib/domains/agent/schema/agent-drawer.schema";
import { FieldError, fieldControlClass } from "./field-error";

type FormValues = AgentDrawerFormValues;

export function AgentDrawerBasicsFields({
  register,
  errors,
  watch,
  setValue,
  isEdit,
  namePlaceholder,
}: {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  isEdit: boolean;
  namePlaceholder: string;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Basics
      </h3>
      <div className="space-y-1.5">
        <Label htmlFor="agent-name">Agent name</Label>
        <Input
          id="agent-name"
          placeholder={namePlaceholder}
          aria-invalid={!!errors.name}
          className={fieldControlClass(!!errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="agent-type">Agent type</Label>
          <Input
            id="agent-type"
            list="agent-type-options"
            placeholder="e.g. LinkedIn Growth Agent"
            disabled={isEdit}
            aria-invalid={!!errors.agentType}
            className={fieldControlClass(!!errors.agentType)}
            {...register("agentType")}
          />
          <datalist id="agent-type-options">
            <option value="LinkedIn Growth Agent" />
            <option value="Lawyer Drafting Agent" />
          </datalist>
          <FieldError message={errors.agentType?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agent-category">Category</Label>
          <Input
            id="agent-category"
            list="agent-category-options"
            placeholder="e.g. Social Media"
            aria-invalid={!!errors.category}
            className={fieldControlClass(!!errors.category)}
            {...register("category")}
          />
          <datalist id="agent-category-options">
            <option value="Social Media" />
            <option value="Lead Generation" />
            <option value="Legal & Compliance" />
            <option value="Marketing" />
            <option value="Content Creation" />
          </datalist>
          <FieldError message={errors.category?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select
          value={watch("status")}
          onValueChange={(v) => setValue("status", v as AgentStatus, { shouldValidate: true })}
        >
          <SelectTrigger className={fieldControlClass()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

export function AgentDrawerListingFields({
  register,
  errors,
}: {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Website listing
      </h3>
      <div className="space-y-1.5">
        <Label htmlFor="short-desc">Short description</Label>
        <Input
          id="short-desc"
          placeholder="Punchy one-liner shown on marketplace cards"
          aria-invalid={!!errors.shortDescription}
          className={fieldControlClass(!!errors.shortDescription)}
          {...register("shortDescription")}
        />
        <FieldError message={errors.shortDescription?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="detailed-desc">Detailed description</Label>
        <Textarea
          id="detailed-desc"
          rows={4}
          placeholder="Full overview for the agent detail page"
          aria-invalid={!!errors.detailedDescription}
          className={fieldControlClass(!!errors.detailedDescription)}
          {...register("detailedDescription")}
        />
        <FieldError message={errors.detailedDescription?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="LinkedIn, Lead Gen"
          className={fieldControlClass()}
          {...register("tags")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="features">Key features</Label>
        <Textarea
          id="features"
          rows={2}
          placeholder="Feature bullets (comma-separated)"
          className={fieldControlClass()}
          {...register("features")}
        />
      </div>
    </section>
  );
}

export function AgentDrawerLinksFields({
  register,
  errors,
}: {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Access & links
      </h3>
      <div className="space-y-1.5">
        <Label htmlFor="redirect-url">Redirect URL (agent panel)</Label>
        <Input
          id="redirect-url"
          type="url"
          placeholder="https://…"
          aria-invalid={!!errors.redirectUrl}
          className={fieldControlClass(!!errors.redirectUrl)}
          {...register("redirectUrl")}
        />
        <FieldError message={errors.redirectUrl?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="demo-url">Demo URL</Label>
        <Input
          id="demo-url"
          type="url"
          placeholder="https://… (optional)"
          aria-invalid={!!errors.demoUrl}
          className={fieldControlClass(!!errors.demoUrl)}
          {...register("demoUrl")}
        />
        <FieldError message={errors.demoUrl?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="docs-url">Documentation URL</Label>
        <Input
          id="docs-url"
          type="url"
          placeholder="https://… (optional)"
          aria-invalid={!!errors.documentationUrl}
          className={fieldControlClass(!!errors.documentationUrl)}
          {...register("documentationUrl")}
        />
        <FieldError message={errors.documentationUrl?.message} />
      </div>
    </section>
  );
}
