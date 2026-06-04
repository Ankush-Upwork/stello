"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "product-images";

/**
 * Uploads a product image straight to Supabase Storage (client-side, so we
 * avoid the Server Action body-size limit), then exposes the resulting public
 * URL via a hidden input the parent <form> submits.
 */
export function ImageUpload({
  userId,
  name = "image_url",
  defaultUrl = null,
}: {
  userId: string;
  name?: string;
  defaultUrl?: string | null;
}) {
  const [url, setUrl] = React.useState<string | null>(defaultUrl);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large. Please use one under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      setUrl(publicUrl);
      toast.success("Photo uploaded.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not upload the image."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url ?? ""} />

      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted text-muted-foreground"
          )}
        >
          {url ? (
            <Image
              src={url}
              alt="Product"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <ImagePlus className="h-7 w-7" />
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {url ? "Change photo" : "Upload photo"}
          </Button>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => setUrl(null)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG or WEBP · max 5 MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
