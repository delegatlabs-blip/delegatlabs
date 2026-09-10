import { useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";

import { FlashcardFlow } from "@shared/components/onboarding/FlashcardFlow";

/** Full-screen first-time persona setup — no sidebar until complete. */
export default function OnboardingGatePage() {
  const qc = useQueryClient();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="safe-x shrink-0 border-b py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">AntGrav</p>
            <p className="text-xs text-muted-foreground">Complete setup to continue</p>
          </div>
        </div>
      </header>
      <div className="app-page-pad flex min-h-0 flex-1 flex-col overflow-hidden py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <FlashcardFlow
          mode="gate"
          onCompleted={async () => {
            await qc.invalidateQueries({ queryKey: ["onboarding"] });
            await qc.invalidateQueries({ queryKey: ["topics"] });
            window.location.assign("/topics?tab=weights");
          }}
        />
      </div>
    </div>
  );
}
