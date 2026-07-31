import { cn } from "@/lib/utils";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function fieldControlClass(hasError?: boolean, className?: string) {
  return cn(
    "bg-background",
    hasError && "border-destructive focus-visible:ring-destructive",
    className,
  );
}
