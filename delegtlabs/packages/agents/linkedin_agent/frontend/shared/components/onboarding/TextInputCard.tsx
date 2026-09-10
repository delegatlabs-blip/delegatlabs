import { Sparkles } from "lucide-react";
import { Textarea } from "@shared/components/ui/textarea";

interface TextInputCardProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  hint?: string;
}

export function TextInputCard({
  title,
  subtitle,
  placeholder = "Type your answer here...",
  value,
  onChange,
  hint,
}: TextInputCardProps) {
  return (
    <div className="w-full space-y-5 animate-fade-in">
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mx-auto max-w-md text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="mx-auto max-w-xl space-y-3">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="min-h-[120px] resize-none leading-relaxed"
        />

        {hint && (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}
