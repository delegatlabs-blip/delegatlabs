import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Loader2 } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

const PREVIEW_EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    trailingNode: false,
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: false,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    HTMLAttributes: { target: null, rel: null, class: null },
    isAllowedUri: (url) => isHttpUrl(url),
  }),
];

function ReadOnlyHtmlPreview({ html }: { html: string }) {
  const editor = useEditor({
    extensions: PREVIEW_EXTENSIONS,
    content: html,
    editable: false,
    immediatelyRender: true,
  }, [html]);

  return (
    <EditorContent
      editor={editor}
      className={
        "max-h-[50vh] overflow-y-auto rounded-md border border-input px-3 py-2 text-sm " +
        "[&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline " +
        "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 " +
        "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5"
      }
    />
  );
}

type ImprovePreviewDialogProps = {
  open: boolean;
  pending: boolean;
  html: string;
  plainText: string;
  onAccept: () => void;
  onDiscard: () => void;
};

export function ImprovePreviewDialog({
  open,
  pending,
  html,
  plainText,
  onAccept,
  onDiscard,
}: ImprovePreviewDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDiscard();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Improved text</DialogTitle>
          <DialogDescription>Review the improved post body before replacing the editor.</DialogDescription>
        </DialogHeader>
        {pending ? (
          <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Improving…
          </div>
        ) : html ? (
          <ReadOnlyHtmlPreview html={html} />
        ) : (
          <p className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm">{plainText}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDiscard} disabled={pending}>
            Discard
          </Button>
          <Button type="button" onClick={onAccept} disabled={pending || !html}>
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
