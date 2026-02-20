import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/src/admin/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[5px] border border-border/75 bg-background/90 text-primary-foreground shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-[border-color,background,box-shadow] outline-none data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:border-ring focus-visible:ring-ring/45 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:border-white/18 dark:bg-white/[0.05] dark:shadow-[0_4px_10px_rgba(0,0,0,0.28)] dark:data-[state=checked]:bg-primary dark:aria-invalid:ring-destructive/35",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
