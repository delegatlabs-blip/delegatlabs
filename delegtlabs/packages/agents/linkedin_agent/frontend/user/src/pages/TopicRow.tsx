import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";

import { patchPersonaTopic, type TopicOption, type TopicPersona } from "@shared/api/topics-persona";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { Switch } from "@shared/components/ui/switch";
import { Slider } from "@shared/components/ui/slider";
import { cn } from "@shared/lib/utils";
import { formatEnumLabel } from "@shared/lib/format-label";

function TopicOptionRadios({
  topicId,
  options,
  selected,
  onSelect,
  disabled,
}: {
  topicId: number;
  options: TopicOption[];
  selected: string | null;
  onSelect: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Topic option"
      className="mt-3 space-y-2"
    >
      {options.map((opt) => {
        const checked = selected === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left transition-colors duration-fast",
              checked
                ? "border-primary bg-primary-subtle"
                : "border-border hover:bg-surface-hover",
              disabled && "pointer-events-none opacity-70",
            )}
          >
            <input
              type="radio"
              className="mt-1 accent-primary"
              name={`topic-${topicId}-option`}
              value={opt.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onSelect(opt.value)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-snug">{formatEnumLabel(opt.label)}</span>
              {opt.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function TopicRow({ topic }: { topic: TopicPersona }) {
  const qc = useQueryClient();
  const [weight, setWeight] = useState(Number(topic.weight));
  const [active, setActive] = useState(topic.is_active);
  const [selected, setSelected] = useState<string | null>(topic.selected_option_value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setWeight(Number(topic.weight));
    setActive(topic.is_active);
    setSelected(topic.selected_option_value);
    setDirty(false);
  }, [topic.id, topic.weight, topic.is_active, topic.selected_option_value]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Pick<TopicPersona, "weight" | "is_active" | "name" | "selected_option_value">>) =>
      patchPersonaTopic(topic.id, data),
    onSuccess: (updated) => {
      qc.setQueryData<TopicPersona[]>(["topics"], (old) =>
        Array.isArray(old) ? old.map((t) => (t.id === updated.id ? updated : t)) : old,
      );
      setWeight(Number(updated.weight));
      setActive(updated.is_active);
      setSelected(updated.selected_option_value);
      setDirty(false);
    },
    onError: () => {
      setWeight(Number(topic.weight));
      setActive(topic.is_active);
      setSelected(topic.selected_option_value);
    },
  });

  const options = Array.isArray(topic.options) ? topic.options : [];
  const needsOption = topic.persona_generated && options.length > 0;
  const hasOption = Boolean(selected);
  const switchDisabled = needsOption && !hasOption && !active;
  const avgScore = topic.avg_score != null ? Number(topic.avg_score).toFixed(1) : "—";
  const busy = mutation.isPending;

  return (
    <Card className={cn("min-w-0 w-full transition-opacity", !active && "opacity-80")}>
      <CardContent className="overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold">{formatEnumLabel(topic.name)}</div>
              <Badge variant={active ? "brand" : "muted"} className="uppercase tracking-wide">
                {active ? "Active" : "Draft"}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {topic.published_count} published · avg score {avgScore}
            </div>
          </div>
          <Switch
            checked={active}
            disabled={switchDisabled || busy}
            onCheckedChange={(v) => {
              setActive(v);
              const data: Partial<Pick<TopicPersona, "is_active" | "selected_option_value">> = {
                is_active: v,
              };
              if (v && selected) data.selected_option_value = selected;
              mutation.mutate(data);
            }}
            aria-label={active ? "Set topic to draft" : "Set topic active"}
          />
        </div>

        {options.length > 0 ? (
          <TopicOptionRadios
            topicId={topic.id}
            options={options}
            selected={selected}
            disabled={busy}
            onSelect={(value) => {
              setSelected(value);
              mutation.mutate({ selected_option_value: value });
            }}
          />
        ) : null}

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weight</span>
            <span className="font-mono text-sm font-medium tabular-nums">{weight.toFixed(2)}</span>
          </div>
          <div className="min-w-0 w-full py-1">
            <Slider
              min={0.05}
              max={1}
              step={0.05}
              value={[weight]}
              onValueChange={([v]) => {
                setWeight(v ?? 0.05);
                setDirty(true);
              }}
              disabled={!active}
            />
          </div>
        </div>

        {dirty && (
          <Button
            size="sm"
            className="mt-3 h-11 w-full"
            onClick={() => {
              const data: Partial<Pick<TopicPersona, "weight" | "is_active" | "selected_option_value">> = {
                weight,
                is_active: active,
              };
              if (active && selected) data.selected_option_value = selected;
              mutation.mutate(data);
            }}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Save className="size-3" />
            )}
            Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
