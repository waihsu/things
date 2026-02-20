import * as React from "react";

import { cn } from "@/src/admin/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/80 selection:bg-primary selection:text-primary-foreground border-border/70 h-10 w-full min-w-0 rounded-xl border bg-background/85 px-3.5 py-2 text-sm text-foreground shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-[color,box-shadow,border-color,background] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium read-only:bg-muted/45 read-only:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:shadow-[0_10px_24px_rgba(0,0,0,0.32)] dark:read-only:bg-white/[0.02]",
        "focus-visible:border-ring focus-visible:ring-ring/45 focus-visible:ring-[3px] focus-visible:bg-background dark:focus-visible:bg-white/[0.06]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
