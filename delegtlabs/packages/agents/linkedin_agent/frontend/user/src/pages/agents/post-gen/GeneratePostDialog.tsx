import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authApi, postsApi, summarizePublishResults, type Post } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Switch } from "@shared/components/ui/switch";
import { apiErrorMessage } from "./api-error";

const PUBLISH_DEST_COPY =
  "Enable a publishable LinkedIn destination on Connections";

type GeneratePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveTopic: boolean;
};

export function GeneratePostDialog({
  open,
  onOpenChange,
  hasActiveTopic,
}: GeneratePostDialogProps) {
  const qc = useQueryClient();
  const [withImage, setWithImage] = useState(false);
  const [preview, setPreview] = useState<Post | null>(null);
  const [imageMode, setImageMode] = useState(false);

  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const publishBlocked = authStatus != null && (authStatus.enabled_publishable_count ?? 0) === 0;

  useEffect(() => {
    if (!open) return;
    setWithImage(false);
    setPreview(null);
    setImageMode(false);
  }, [open]);

  function closeLeavingDraft() {
    qc.invalidateQueries({ queryKey: ["posts"] });
    onOpenChange(false);
  }

  const generateMut = useMutation({
    mutationFn: (skipImage: boolean) => postsApi.generate({ skipImage }),
    retry: false,
    onSuccess: (post, skipImage) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["tenant-credits"] });
      setImageMode(!skipImage);
      setPreview(post);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Insufficient credits"));
    },
  });

  const publishMut = useMutation({
    mutationFn: (id: number) => postsApi.publish(id),
    retry: false,
    onSuccess: (data) => {
      toast.success(summarizePublishResults(data));
      closeLeavingDraft();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Publish failed")),
  });

  const generating = generateMut.isPending;
  const publishing = publishMut.isPending;
  const imageFailed = preview != null && imageMode && !preview.image_url;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          qc.invalidateQueries({ queryKey: ["posts"] });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Post</DialogTitle>
        </DialogHeader>

        {preview ? (
          <div className="space-y-3">
            {imageFailed ? (
              <p className="text-sm text-destructive">Image generation failed.</p>
            ) : null}
            {preview.image_url ? (
              <img
                src={preview.image_url}
                alt=""
                className="max-h-56 w-full rounded-xl border object-contain"
              />
            ) : null}
            <p className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap rounded-xl border bg-surface-secondary p-3 text-sm leading-relaxed">
              {preview.generated_text}
            </p>
            {publishBlocked ? (
              <p className="text-xs text-muted-foreground">{PUBLISH_DEST_COPY}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-surface-secondary px-3 py-3">
              <span className="text-sm">text only</span>
              <Switch
                checked={withImage}
                disabled={generating}
                onCheckedChange={setWithImage}
                aria-label="post with image"
              />
              <span className="text-sm">post with image</span>
            </div>
            {!hasActiveTopic ? (
              <p className="text-xs text-muted-foreground">Activate a topic on Topic Weights.</p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={closeLeavingDraft}>
            Cancel
          </Button>
          {preview ? (
            <Button
              type="button"
              className="h-11 sm:h-9"
              disabled={publishBlocked || publishing}
              title={publishBlocked ? PUBLISH_DEST_COPY : undefined}
              onClick={() => publishMut.mutate(preview.id)}
            >
              {publishing ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Confirm
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 sm:h-9"
              disabled={!hasActiveTopic || generating}
              onClick={() => generateMut.mutate(!withImage)}
            >
              {generating ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
