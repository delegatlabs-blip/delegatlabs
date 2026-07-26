import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Bot,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "./theme-provider";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <LayoutDashboard /> Dashboard
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/agents")}>
            <Bot /> Agents
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/users")}>
            <Users /> Users
            <CommandShortcut>G U</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/customers")}>
            <Building2 /> Customers
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />} Switch to {theme === "dark" ? "light" : "dark"} mode
          </CommandItem>
          <CommandItem>
            <Sparkles /> Ask Delegate Labs AI
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
