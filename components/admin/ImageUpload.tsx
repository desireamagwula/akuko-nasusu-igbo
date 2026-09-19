"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { ImagePlus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { errorInfo } from "./ui";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

export type Thumbnail = { storageId: string; url: string } | null;

/**
 * Drag-and-drop or click-to-browse thumbnail upload into Convex file storage.
 * The picture uploads immediately; the post only remembers its storage id, so
 * nothing is attached to the post until it is saved.
 */
export function ImageUpload({
  value,
  onChange,
  ratio,
  error,
  onError,
}: {
  value: Thumbnail;
  onChange: (value: Thumbnail) => void;
  ratio: "video" | "blog";
  error?: string;
  onError: (message: string | null) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const input = useRef<HTMLInputElement>(null);
  const localUrl = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => {
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
  }, []);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return onError("Use a JPEG, PNG, WebP or AVIF image.");
    if (file.size > MAX_BYTES) return onError("That image is larger than 10 MB.");
    onError(null);
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("upload failed");
      const { storageId } = (await response.json()) as { storageId: string };
      if (localUrl.current) URL.revokeObjectURL(localUrl.current);
      localUrl.current = URL.createObjectURL(file);
      onChange({ storageId, url: localUrl.current });
    } catch (caught) {
      onError(caught instanceof Error && caught.message === "upload failed" ? "The upload failed. Try again." : errorInfo(caught).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  const aspect = ratio === "video" ? "aspect-video" : "aspect-[3/2]";

  return (
    <div>
      {value ? (
        <div className="space-y-3">
          <div className={`relative overflow-hidden bg-ink ${aspect}`}>
            <Image src={value.url} alt="Thumbnail preview" fill unoptimized sizes="320px" className="object-cover" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 border border-hairline bg-surface text-[0.8125rem] hover:border-ink disabled:opacity-50"
            >
              <ImagePlus size={15} strokeWidth={1.5} aria-hidden="true" /> {uploading ? "Uploading..." : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={uploading}
              className="inline-flex h-9 items-center justify-center gap-1.5 border border-hairline bg-surface px-3 text-[0.8125rem] text-oxblood hover:border-oxblood disabled:opacity-50"
            >
              <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 text-center transition-colors duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-oxblood ${aspect} ${
            dragging ? "border-ink bg-hairline/60" : error ? "border-oxblood bg-surface" : "border-muted/60 bg-surface hover:border-ink"
          }`}
        >
          <ImagePlus size={24} strokeWidth={1.5} aria-hidden="true" className="text-muted" />
          <span className="text-[0.875rem] font-medium">{uploading ? "Uploading..." : "Drop an image here"}</span>
          <span className="meta">{uploading ? "Please wait" : "or click to browse. JPEG, PNG, WebP or AVIF, up to 10 MB."}</span>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED.join(",")}
            className="sr-only"
            disabled={uploading}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </label>
      )}

      {/* Replace uses this hidden input when a picture is already present. */}
      {value && (
        <input
          ref={input}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-[0.8125rem] text-oxblood">
          {error}
        </p>
      )}
    </div>
  );
}
