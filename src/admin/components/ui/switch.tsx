import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/src/admin/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-input/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] transition-all outline-none data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted focus-visible:border-ring focus-visible:ring-ring/45 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:data-[state=unchecked]:bg-white/20",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-background dark:data-[state=unchecked]:bg-white dark:data-[state=checked]:bg-primary-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
