import * as React from "react";

import { cn } from "@/src/chat_app/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border/70 placeholder:text-muted-foreground/80 text-foreground focus-visible:border-ring focus-visible:ring-ring/45 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-20 w-full rounded-xl border bg-background/85 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_rgba(15,23,42,0.1)] transition-[color,box-shadow,border-color,background] outline-none focus-visible:ring-[3px] focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/18 dark:bg-white/[0.04] dark:focus-visible:bg-white/[0.06] dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
