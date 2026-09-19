"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  Video,
} from "lucide-react";
import { extractEmbedSrc } from "@/convex/lib/facebook";
import { FacebookEmbed } from "./facebook-embed";
import { buttonClass, inputClass } from "./ui";

type Panel = "link" | "embed" | null;

export function RichTextEditor({
  value,
  onChange,
  invalid = false,
  describedBy,
}: {
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [panel, setPanel] = useState<Panel>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Start writing. Use the toolbar for headings, quotes, links and Facebook videos." }),
      FacebookEmbed,
    ],
    content: value,
    editorProps: {
      attributes: {
        id: "body",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Article body",
        class: "prose-akuko min-h-[380px] px-5 py-5 outline-none md:px-7",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
            quote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  if (!editor) {
    return <div className="skeleton h-[460px]" aria-busy="true" aria-label="Loading editor" />;
  }

  const run = () => editor.chain().focus();

  return (
    <div className={`border bg-surface ${invalid ? "border-oxblood" : "border-hairline focus-within:border-ink"}`}>
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-hairline bg-paper px-2 py-1.5">
        <Tool label="Bold" pressed={active?.bold} onClick={() => run().toggleBold().run()} icon={Bold} />
        <Tool label="Italic" pressed={active?.italic} onClick={() => run().toggleItalic().run()} icon={Italic} />
        <Tool label="Underline" pressed={active?.underline} onClick={() => run().toggleUnderline().run()} icon={UnderlineIcon} />
        <Divider />
        <Tool label="Heading" pressed={active?.h2} onClick={() => run().toggleHeading({ level: 2 }).run()} icon={Heading2} />
        <Tool label="Subheading" pressed={active?.h3} onClick={() => run().toggleHeading({ level: 3 }).run()} icon={Heading3} />
        <Tool label="Quote" pressed={active?.quote} onClick={() => run().toggleBlockquote().run()} icon={Quote} />
        <Divider />
        <Tool label="Bulleted list" pressed={active?.bullet} onClick={() => run().toggleBulletList().run()} icon={List} />
        <Tool label="Numbered list" pressed={active?.ordered} onClick={() => run().toggleOrderedList().run()} icon={ListOrdered} />
        <Tool label="Divider line" onClick={() => run().setHorizontalRule().run()} icon={Minus} />
        <Divider />
        <Tool label="Link" pressed={active?.link || panel === "link"} onClick={() => setPanel(panel === "link" ? null : "link")} icon={Link2} />
        <Tool label="Facebook video" pressed={panel === "embed"} onClick={() => setPanel(panel === "embed" ? null : "embed")} icon={Video} />
        <span className="flex-1" />
        <Tool label="Undo" disabled={!active?.canUndo} onClick={() => run().undo().run()} icon={Undo2} />
        <Tool label="Redo" disabled={!active?.canRedo} onClick={() => run().redo().run()} icon={Redo2} />
      </div>

      {panel === "link" && <LinkPanel editor={editor} onClose={() => setPanel(null)} />}
      {panel === "embed" && <EmbedPanel editor={editor} onClose={() => setPanel(null)} />}

      <EditorContent editor={editor} />
    </div>
  );
}

function Tool({
  label,
  icon: Icon,
  onClick,
  pressed,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      disabled={disabled}
      // Keep the editor selection when the button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center transition-colors duration-150 disabled:opacity-30 ${
        pressed ? "bg-ink text-paper" : "text-ink hover:bg-hairline"
      }`}
    >
      <Icon size={17} strokeWidth={1.5} aria-hidden />
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-hairline" />;

function LinkPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [href, setHref] = useState<string>(editor.getAttributes("link").href ?? "");

  function apply() {
    const trimmed = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!trimmed) chain.unsetLink().run();
    else chain.setLink({ href: /^(https?:|mailto:|tel:|\/)/i.test(trimmed) ? trimmed : `https://${trimmed}` }).run();
    onClose();
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 border-b border-hairline bg-paper/60 px-3 py-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <label htmlFor="link-href" className="sr-only">
        Link address
      </label>
      <input
        id="link-href"
        autoFocus
        value={href}
        onChange={(event) => setHref(event.target.value)}
        placeholder="https://example.com (leave empty to remove the link)"
        className={`${inputClass} h-10 min-w-56 flex-1 py-0`}
      />
      <button type="submit" className={`${buttonClass.primary} h-10`}>
        Apply
      </button>
      <button type="button" className={`${buttonClass.secondary} h-10`} onClick={onClose}>
        Cancel
      </button>
    </form>
  );
}

function EmbedPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function insert() {
    const src = extractEmbedSrc(code);
    if (!src) {
      setError("That is not a Facebook embed. Paste the iframe code from Facebook's Embed dialog, or a video link.");
      return;
    }
    editor.chain().focus().insertContent({ type: "facebookEmbed", attrs: { src } }).run();
    onClose();
  }

  return (
    <div className="space-y-2 border-b border-hairline bg-paper/60 px-3 py-3">
      <label htmlFor="embed-code" className="block text-[0.8125rem] font-medium">
        Facebook video embed code
      </label>
      <textarea
        id="embed-code"
        autoFocus
        rows={3}
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
          setError(null);
        }}
        placeholder={'<iframe src="https://www.facebook.com/plugins/video.php?..." ...></iframe>'}
        aria-invalid={error ? true : undefined}
        className={`${inputClass} font-mono text-[0.8125rem]`}
      />
      {error && (
        <p role="alert" className="text-[0.8125rem] text-oxblood">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className={`${buttonClass.primary} h-10`} onClick={insert}>
          Insert video
        </button>
        <button type="button" className={`${buttonClass.secondary} h-10`} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
