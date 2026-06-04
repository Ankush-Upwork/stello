"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Instagram,
  Loader2,
  MessageCircle,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import {
  generateCaptions,
  type Captions,
} from "@/app/(app)/products/[id]/marketing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Props = {
  businessName: string;
  businessType: string;
  productName: string;
  category: string | null;
  color: string | null;
  size: string | null;
  price: number;
};

export function MarketingStudio(props: Props) {
  const [captions, setCaptions] = React.useState<Captions | null>(null);
  const [loading, setLoading] = React.useState(false);

  const template = [
    `New arrival at ${props.businessName} ✨`,
    "",
    `Product: ${props.productName}`,
    props.color ? `Color: ${props.color}` : "",
    props.size ? `Size: ${props.size}` : "",
    `Price: ${formatCurrency(props.price)}`,
    "",
    "Message us to order.",
  ]
    .filter((l) => l !== "")
    .join("\n");

  async function generate() {
    setLoading(true);
    try {
      const res = await generateCaptions(props);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCaptions(res.captions);
      toast.success("Captions ready!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick WhatsApp message</CardTitle>
        </CardHeader>
        <CardContent>
          <MessageBlock text={template} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" /> AI captions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!captions ? (
            <Button onClick={generate} disabled={loading} className="w-full" size="lg">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? "Writing…" : "Generate AI captions"}
            </Button>
          ) : (
            <>
              <Labelled icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp">
                <MessageBlock text={captions.whatsapp} />
              </Labelled>
              <Labelled icon={<Instagram className="h-4 w-4" />} label="Instagram">
                <MessageBlock text={captions.instagram} />
              </Labelled>
              <Labelled icon={<Tag className="h-4 w-4" />} label="Discount / Sale">
                <MessageBlock text={captions.discount} />
              </Labelled>
              <Labelled icon={<Sparkles className="h-4 w-4" />} label="New arrival">
                <MessageBlock text={captions.new_arrival} />
              </Labelled>
              <Button onClick={generate} disabled={loading} variant="outline" className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Regenerate
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Labelled({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

function MessageBlock({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy.");
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="whitespace-pre-wrap text-sm">{text}</p>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button asChild variant="whatsapp" size="sm">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Share
          </a>
        </Button>
      </div>
    </div>
  );
}
