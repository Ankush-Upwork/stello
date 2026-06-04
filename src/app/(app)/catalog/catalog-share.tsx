"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CatalogShare({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [link, setLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setLink(`${window.location.origin}/catalog/share/${businessId}`);
  }, [businessId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Long-press to copy the link.");
    }
  }

  const shareText = `Check out our latest collection at ${businessName} 🛍️\n${link}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={link} readOnly className="font-mono text-sm" />
        <Button type="button" variant="outline" size="icon" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="whatsapp" className="flex-1">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Preview catalog
          </a>
        </Button>
      </div>
    </div>
  );
}
