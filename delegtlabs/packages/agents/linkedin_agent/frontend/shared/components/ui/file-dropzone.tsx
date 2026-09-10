import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";

type FileDropzoneProps = {
  id?: string;
  accept: string;
  previewUrl?: string | null;
  disabled?: boolean;
  helperText?: string;
  onFile: (file: File | null) => void;
  onInvalid?: () => void;
  isAllowed?: (file: File) => boolean;
  children?: ReactNode;
  className?: string;
};

export function FileDropzone({
  id,
  accept,
  previewUrl,
  disabled,
  helperText = "JPEG or PNG",
  onFile,
  onInvalid,
  isAllowed,
  children,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(file: File | null) {
    if (!file) {
      onFile(null);
      return;
    }
    if (isAllowed && !isAllowed(file)) {
      onInvalid?.();
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    take(e.target.files?.[0] ?? null);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    take(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex min-h-[9rem] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors duration-fast",
          over ? "border-primary bg-primary-subtle" : "border-border bg-surface-secondary",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={onChange}
        />
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Upload preview"
              className="h-28 w-full max-w-xs rounded-lg object-cover"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-11 sm:h-8" onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 sm:h-8"
                onClick={() => {
                  if (inputRef.current) inputRef.current.value = "";
                  onFile(null);
                }}
              >
                <X className="size-3.5" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="flex flex-col items-center gap-2 text-sm"
            onClick={() => inputRef.current?.click()}
          >
            <span className="grid size-10 place-items-center rounded-full bg-primary-subtle text-primary">
              <ImagePlus className="size-5" />
            </span>
            <span className="font-medium text-foreground">Upload an image</span>
            <span className="text-xs text-muted-foreground">{helperText}</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
