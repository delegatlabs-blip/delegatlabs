import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { authApi, postsApi, summarizePublishResults } from "@shared/api";
import { improvePost } from "@shared/api/posts-improve";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { FileDropzone } from "@shared/components/ui/file-dropzone";
import { Input } from "@shared/components/ui/input";
import { stripHtmlToPlain } from "@shared/lib/strip-html";
import { apiErrorMessage } from "./api-error";
import { DescriptionEditor, type DescriptionEditorHandle } from "./DescriptionEditor";
import { ImprovePreviewDialog } from "./ImprovePreviewDialog";

const LINKEDIN_CHAR_LIMIT = 3000;
const MANUAL_IMAGE_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";
const ALLOWED_MANUAL_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MANUAL_IMAGE_TYPE_TOAST = "Image must be JPEG or PNG";

/** C-posts-manual: strip, lowercase, then substring before first `;`. */
function normalizeFileType(type: string): string {
  const normalized = type.trim().toLowerCase();
  const semi = normalized.indexOf(";");
  return semi === -1 ? normalized : normalized.slice(0, semi);
}

function isAllowedManualImageType(type: string): boolean {
  return ALLOWED_MANUAL_IMAGE_TYPES.has(normalizeFileType(type));
}

function composePreview(title: string, description: string, tags: string): string {
  const tagList = tags
    .split(",")
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean);
  let body = `${title.trim()}\n\n${description.trim()}`;
  if (tagList.length) {
    body = `${body}\n\n${tagList.map((t) => `#${t}`).join(" ")}`;
  }
  return body;
}

function tagChips(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

export function PostGenerationTab() {
  const qc = useQueryClient();
  const editorRef = useRef<DescriptionEditorHandle>(null);
  const improveDiscardedRef = useRef(false);
  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const publishBlocked = authStatus != null && (authStatus.enabled_publishable_count ?? 0) === 0;
  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [tags, setTags] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [improveOpen, setImproveOpen] = useState(false);
  const [improveHtml, setImproveHtml] = useState("");
  const [improvePlain, setImprovePlain] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const plainDescription = stripHtmlToPlain(descriptionHtml);
  const composed = composePreview(title, plainDescription, tags);
  const overLimit = composed.length > LINKEDIN_CHAR_LIMIT;
  const chips = tagChips(tags);

  const improveMut = useMutation({
    mutationFn: () =>
      improvePost({
        title: title.trim(),
        description: stripHtmlToPlain(descriptionHtml),
        tags: tags.trim() || undefined,
      }),
    onSuccess: (data) => {
      if (improveDiscardedRef.current) return;
      const composedOut = composePreview(title, data.plainText, tags);
      if (composedOut.length > LINKEDIN_CHAR_LIMIT) {
        toast.error(
          `Composed post exceeds LinkedIn limit (${composedOut.length} / ${LINKEDIN_CHAR_LIMIT})`,
        );
        setImproveOpen(false);
        return;
      }
      setImproveHtml(data.html);
      setImprovePlain(data.plainText);
      setImproveOpen(true);
    },
    onError: (err) => {
      setImproveOpen(false);
      toast.error(apiErrorMessage(err, "Improve failed"));
    },
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !plainDescription.trim()) {
        throw new Error("Title and description are required");
      }
      if (overLimit) {
        throw new Error(`Post exceeds LinkedIn limit (${composed.length} / ${LINKEDIN_CHAR_LIMIT})`);
      }
      if (imageFile && !isAllowedManualImageType(imageFile.type)) {
        toast.error(MANUAL_IMAGE_TYPE_TOAST);
        throw new Error(MANUAL_IMAGE_TYPE_TOAST);
      }
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", plainDescription.trim());
      if (tags.trim()) fd.append("tags", tags.trim());
      if (imageFile) fd.append("image", imageFile);
      return postsApi.manualPublish(fd);
    },
    onSuccess: (data) => {
      toast.success(summarizePublishResults(data));
      setTitle("");
      setDescriptionHtml("");
      editorRef.current?.setContent("");
      setTags("");
      setTagDraft("");
      setImageFile(null);
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      if (err instanceof Error && err.message === MANUAL_IMAGE_TYPE_TOAST) return;
      toast.error(apiErrorMessage(err, "Publish failed"));
    },
  });

  function startImprove() {
    improveDiscardedRef.current = false;
    setImproveHtml("");
    setImprovePlain("");
    setImproveOpen(true);
    improveMut.mutate();
  }

  function discardImprove() {
    improveDiscardedRef.current = true;
    setImproveOpen(false);
    setImproveHtml("");
    setImprovePlain("");
  }

  function acceptImprove() {
    const composedOut = composePreview(title, improvePlain, tags);
    if (composedOut.length > LINKEDIN_CHAR_LIMIT) {
      toast.error(
        `Composed post exceeds LinkedIn limit (${composedOut.length} / ${LINKEDIN_CHAR_LIMIT})`,
      );
      return;
    }
    editorRef.current?.setContent(improveHtml);
    setImproveOpen(false);
    setImproveHtml("");
    setImprovePlain("");
  }

  function commitTagDraft() {
    const next = tagDraft.trim().replace(/^#+/, "");
    if (!next) return;
    const current = tagChips(tags);
    if (!current.includes(next)) {
      setTags([...current, next].join(", "));
    }
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags(tagChips(tags).filter((t) => t !== tag).join(", "));
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold tracking-tight">Create Post</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compose and publish content to your LinkedIn audience.
            </p>
          </div>
          <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="pg-title">
              Title
            </label>
            <Input
              id="pg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post headline"
            />
          </div>
          <DescriptionEditor
            ref={editorRef}
            title={title}
            onHtmlChange={setDescriptionHtml}
            improvePending={improveMut.isPending || improveOpen}
            onImprove={startImprove}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="pg-tags">
              Tags (comma-separated)
            </label>
            <Input
              id="pg-tags"
              value={tagDraft}
              onChange={(e) => {
                const v = e.target.value;
                if (v.includes(",")) {
                  const [head, ...rest] = v.split(",");
                  setTagDraft(rest.join(","));
                  const next = head.trim().replace(/^#+/, "");
                  if (next) {
                    const current = tagChips(tags);
                    if (!current.includes(next)) setTags([...current, next].join(", "));
                  }
                  return;
                }
                setTagDraft(v);
              }}
              onBlur={commitTagDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitTagDraft();
                }
              }}
              placeholder="e.g. React, WebDev, AI"
            />
            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {chips.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-primary-subtle px-2.5 text-xs font-medium text-accent-foreground"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          </div>
          <div className="space-y-1.5 lg:row-start-2 lg:row-span-2">
            <label className="text-sm font-medium" htmlFor="pg-image">
              Image
            </label>
            <FileDropzone
              id="pg-image"
              accept={MANUAL_IMAGE_ACCEPT}
              previewUrl={previewUrl}
              helperText="JPEG or PNG"
              className="h-full min-h-[9rem] lg:min-h-[22rem]"
              isAllowed={(file) => isAllowedManualImageType(file.type)}
              onInvalid={() => toast.error(MANUAL_IMAGE_TYPE_TOAST)}
              onFile={setImageFile}
            />
          </div>
          <div className="flex flex-col gap-5 lg:col-start-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Preview length:{" "}
              <span className={overLimit ? "font-semibold text-destructive" : ""}>
                {composed.length.toLocaleString()} / {LINKEDIN_CHAR_LIMIT.toLocaleString()}
              </span>
            </span>
          </div>
          {publishBlocked ? (
            <p className="text-xs text-muted-foreground">
              Enable at least one publishable LinkedIn destination on Connections before publishing.
            </p>
          ) : null}
          <div className="pt-1">
            <Button
              size="lg"
              className="h-12 w-full sm:h-11 sm:w-auto"
              onClick={() => {
                if (imageFile && !isAllowedManualImageType(imageFile.type)) {
                  toast.error(MANUAL_IMAGE_TYPE_TOAST);
                  return;
                }
                publishMut.mutate();
              }}
              disabled={
                publishBlocked ||
                publishMut.isPending ||
                !title.trim() ||
                !plainDescription.trim() ||
                overLimit
              }
            >
              {publishMut.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Publishing…
                </>
              ) : (
                "Generate Post"
              )}
            </Button>
          </div>
          </div>
        </CardContent>
        <ImprovePreviewDialog
          open={improveOpen}
          pending={improveMut.isPending}
          html={improveHtml}
          plainText={improvePlain}
          onAccept={acceptImprove}
          onDiscard={discardImprove}
        />
    </Card>
  );
}
