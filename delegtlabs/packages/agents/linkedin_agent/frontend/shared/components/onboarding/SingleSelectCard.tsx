import { useState, type ReactNode } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { formatEnumLabel } from "@shared/lib/format-label";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";

export interface SingleSelectOption {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface SingleSelectCardProps {
  title: string;
  subtitle?: string;
  options: SingleSelectOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  allowOther?: boolean;
  otherPlaceholder?: string;
}

export function SingleSelectCard({
  title,
  subtitle,
  options,
  selectedValue,
  onChange,
  allowOther = false,
  otherPlaceholder = "Something else...",
}: SingleSelectCardProps) {
  const [customInput, setCustomInput] = useState("");
  const presetIds = new Set(options.map((o) => o.id));
  const isCustom = Boolean(selectedValue) && !presetIds.has(selectedValue);

  return (
    <div className="w-full space-y-5 animate-fade-in">
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mx-auto max-w-md text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-1 gap-3">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all duration-200",
                isSelected
                  ? "border-primary/60 bg-primary-subtle text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <div className="flex min-w-0 items-center gap-3.5 pr-2">
                {opt.icon && (
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {opt.icon}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug sm:text-base">{formatEnumLabel(opt.label)}</div>
                  {opt.description && (
                    <div className="mt-0.5 text-xs font-normal leading-relaxed text-muted-foreground">
                      {opt.description}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "border-border bg-background group-hover:border-muted-foreground",
                )}
              >
                {isSelected && <Check className="size-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {allowOther && (
        <div className="mx-auto max-w-xl space-y-2 pt-1">
          {isCustom && (
            <div className="rounded-xl border border-primary/60 bg-primary-soft p-3 text-sm font-semibold">
              {formatEnumLabel(selectedValue)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = customInput.trim();
                  if (trimmed) {
                    onChange(trimmed);
                    setCustomInput("");
                  }
                }
              }}
              placeholder={otherPlaceholder}
              className="flex-1"
              aria-label="Other answer"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const trimmed = customInput.trim();
                if (trimmed) {
                  onChange(trimmed);
                  setCustomInput("");
                }
              }}
              disabled={!customInput.trim()}
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
