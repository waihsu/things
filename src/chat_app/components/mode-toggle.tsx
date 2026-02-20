import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/src/providers/theme-provider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const ActiveIcon =
    options.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border/60 bg-background/75 dark:border-white/15 dark:bg-white/[0.04]"
        >
          <ActiveIcon className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 min-w-36">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex items-center justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {option.label}
              </span>
              {active ? <Check className="h-4 w-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
