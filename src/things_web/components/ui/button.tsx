import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/src/things_web/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold tracking-[0.02em] transition-[background,color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_14px_34px_rgba(178,136,61,0.34)] hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_18px_42px_rgba(178,136,61,0.42)]",
        destructive:
          "bg-destructive text-white shadow-[0_14px_30px_rgba(166,44,37,0.32)] hover:-translate-y-0.5 hover:bg-destructive/92 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70",
        outline:
          "border border-border/70 bg-card/80 text-foreground/85 shadow-[0_10px_22px_rgba(22,18,12,0.1)] hover:border-border hover:bg-foreground/5 hover:text-foreground dark:bg-white/[0.03] dark:hover:bg-white/[0.08]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_10px_24px_rgba(18,18,20,0.12)] hover:-translate-y-0.5 hover:bg-secondary/90",
        ghost:
          "text-foreground/72 hover:bg-foreground/6 hover:text-foreground dark:text-white/72 dark:hover:bg-white/10 dark:hover:text-white",
        link: "text-primary underline-offset-4 hover:text-brand-strong hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-3.5 text-xs has-[>svg]:px-3",
        lg: "h-11 px-7 text-sm has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
