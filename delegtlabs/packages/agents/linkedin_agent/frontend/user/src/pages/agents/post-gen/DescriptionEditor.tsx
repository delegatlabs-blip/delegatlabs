import { forwardRef, useImperativeHandle, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { stripHtmlToPlain } from "@shared/lib/strip-html";
import { cn } from "@shared/lib/utils";

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

const EDITOR_EXTENSIONS = [
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
    autolink: true,
    defaultProtocol: "https",
    protocols: ["http", "https"],
    HTMLAttributes: { target: null, rel: null, class: null },
    isAllowedUri: (url) => isHttpUrl(url),
  }),
];

export type DescriptionEditorHandle = {
  setContent: (html: string) => void;
};

type DescriptionEditorProps = {
  title: string;
  onHtmlChange: (html: string) => void;
  improvePending: boolean;
  onImprove: () => void;
};

export const DescriptionEditor = forwardRef<DescriptionEditorHandle, DescriptionEditorProps>(
  function DescriptionEditor({ title, onHtmlChange, improvePending, onImprove }, ref) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");

    const editor = useEditor({
      extensions: EDITOR_EXTENSIONS,
      content: "",
      immediatelyRender: true,
      shouldRerenderOnTransaction: true,
      onUpdate: ({ editor: next }) => {
        onHtmlChange(next.getHTML());
      },
      editorProps: {
        attributes: {
          id: "pg-desc",
          class: "min-h-[144px] outline-none",
        },
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        setContent: (html: string) => {
          editor?.commands.setContent(html || "<p></p>");
        },
      }),
      [editor],
    );

    const html = editor?.getHTML() ?? "";
    const improveDisabled =
      improvePending || (title.trim() === "" && stripHtmlToPlain(html).trim() === "");

    function openLinkDialog() {
      const prev = editor?.getAttributes("link").href;
      setLinkUrl(typeof prev === "string" ? prev : "");
      setLinkOpen(true);
    }

    function applyLink() {
      const raw = linkUrl.trim();
      if (!raw) {
        editor?.chain().focus().extendMarkRange("link").unsetLink().run();
        setLinkOpen(false);
        return;
      }
      if (!isHttpUrl(raw)) {
        toast.error("Only http and https URLs are allowed");
        return;
      }
      editor?.chain().focus().extendMarkRange("link").setLink({ href: raw }).run();
      setLinkOpen(false);
    }

    return (
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="pg-desc">
          Description
        </label>
        <div className="rounded-xl border border-input bg-card shadow-xs focus-within:ring-2 focus-within:ring-ring/40">
          <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-11 sm:size-9", editor?.isActive("bold") && "bg-surface-active text-foreground")}
              aria-label="Bold"
              aria-pressed={editor?.isActive("bold") ?? false}
              disabled={!editor}
              title="Bold"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-11 sm:size-9", editor?.isActive("italic") && "bg-surface-active text-foreground")}
              aria-label="Italic"
              aria-pressed={editor?.isActive("italic") ?? false}
              disabled={!editor}
              title="Italic"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-11 sm:size-9", editor?.isActive("bulletList") && "bg-surface-active text-foreground")}
              aria-label="Bullet list"
              aria-pressed={editor?.isActive("bulletList") ?? false}
              disabled={!editor}
              title="Bullet list"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-11 sm:size-9", editor?.isActive("orderedList") && "bg-surface-active text-foreground")}
              aria-label="Ordered list"
              aria-pressed={editor?.isActive("orderedList") ?? false}
              disabled={!editor}
              title="Ordered list"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-11 sm:size-9", editor?.isActive("link") && "bg-surface-active text-foreground")}
              aria-label="Link"
              aria-pressed={editor?.isActive("link") ?? false}
              disabled={!editor}
              title="Link"
              onClick={openLinkDialog}
            >
              <LinkIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-11 w-full sm:ml-auto sm:h-8 sm:w-auto"
              disabled={improveDisabled}
              onClick={onImprove}
            >
              <Sparkles className="size-3.5 text-primary" />
              Improve the text
            </Button>
          </div>
          <div className="relative min-h-[12rem] px-3 py-3 text-base md:text-sm">
            <EditorContent
              editor={editor}
              className={cn(
                "[&_.ProseMirror]:min-h-[12rem] [&_.ProseMirror]:text-base md:[&_.ProseMirror]:text-sm",
                "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline",
                "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5",
                "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
              )}
            />
            {editor?.isEmpty ? (
              <div className="pointer-events-none absolute left-3 top-2 text-base text-muted-foreground md:text-sm">
                Main post body
              </div>
            ) : null}
          </div>
        </div>

        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link</DialogTitle>
            </DialogHeader>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyLink}>
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);
