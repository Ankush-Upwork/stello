import { MessageCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { waLink } from "@/lib/whatsapp";

/**
 * Opens WhatsApp (wa.me) pre-filled with `message` for the given phone.
 * Renders a disabled button with a hint when there's no usable phone number.
 * Works without client JS — it's just a link.
 */
export function WhatsAppButton({
  phone,
  message,
  label = "Send on WhatsApp",
  size,
  variant = "whatsapp",
  className,
}: {
  phone: string | null | undefined;
  message: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const href = waLink(phone, message);

  if (!href) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled
        title="Add a phone number to message this customer"
      >
        <MessageCircle className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
