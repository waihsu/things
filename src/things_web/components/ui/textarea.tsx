import * as React from "react";

import { cn } from "@/src/things_web/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/90 text-foreground focus-visible:border-ring focus-visible:ring-ring/45 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-20 w-full rounded-xl border bg-background/75 px-4 py-2.5 text-sm shadow-[0_10px_20px_rgba(24,19,13,0.08)] transition-[color,box-shadow,border-color,background] outline-none focus-visible:ring-[3px] focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/[0.03] dark:focus-visible:bg-white/[0.05] dark:shadow-[0_12px_24px_rgba(0,0,0,0.2)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
