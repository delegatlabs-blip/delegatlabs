import { useState, type ReactNode } from "react";
import { Check, Plus } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { cn } from "@shared/lib/utils";
import { formatEnumLabel } from "@shared/lib/format-label";

export interface CheckboxOption {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface CheckboxCardProps {
  title: string;
  subtitle?: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function CheckboxCard({
  title,
  subtitle,
  options,
  selectedValues,
  onChange,
  allowCustom = true,
  customPlaceholder = "Add custom option...",
}: CheckboxCardProps) {
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");

  const toggleOption = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (selectedValues.includes(trimmed)) {
      setCustomError("Option already selected");
      return;
    }
    onChange([...selectedValues, trimmed]);
    setCustomInput("");
    setCustomError("");
  };

  const presetIds = new Set(options.map((o) => o.id));
  const customSelected = selectedValues.filter((v) => !presetIds.has(v));

  return (
    <div className="w-full space-y-5 animate-fade-in">
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mx-auto max-w-md text-sm text-muted-foreground">{subtitle}</p>}
        {selectedValues.length > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">
            <span>{selectedValues.length} selected</span>
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-200",
                isSelected
                  ? "border-primary/60 bg-primary-subtle text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <div className="flex min-w-0 items-center gap-3 pr-2">
                {opt.icon && (
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {opt.icon}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug">{formatEnumLabel(opt.label)}</div>
                  {opt.description && (
                    <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {opt.description}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background group-hover:border-muted-foreground",
                )}
              >
                {isSelected && <Check className="size-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}

        {customSelected.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggleOption(item)}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-primary/60 bg-primary-subtle p-3.5 text-left text-foreground"
          >
            <div className="text-sm font-semibold leading-snug">{formatEnumLabel(item)}</div>
            <div className="flex size-5 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground">
              <Check className="size-3 stroke-[3]" />
            </div>
          </button>
        ))}
      </div>

      {allowCustom && (
        <div className="mx-auto max-w-2xl pt-2">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder={customPlaceholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
          {customError && <p className="mt-1 text-xs text-destructive">{customError}</p>}
        </div>
      )}
    </div>
  );
}
