import { useEffect, useRef, useState } from "react";
import { Button } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { copyText } from "./utils";

export function CopyActionButton({
  label = "Copy",
  text,
}: {
  label?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = () => {
    copyText(text);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      aria-label={copied ? "Copied" : label}
      className="h-6 w-6 rounded-md"
      onClick={handleCopy}
      size="sm"
      variant="icon"
    >
      <HugeiconsIcon
        aria-hidden="true"
        className={cn(
          copied && "animate-madoo-checkbox-control-in",
        )}
        icon={copied ? Tick02Icon : Copy01Icon}
        key={copied ? "copied" : "copy"}
        primaryColor="currentColor"
        size={13}
        strokeWidth={copied ? 2 : 1.5}
      />
    </Button>
  );
}
