"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui-store";
import { LayoutDashboard, Users, ShoppingBag, BarChart3, Settings, Moon, Sun, Plus } from "lucide-react";

export function CommandPalette() {
  const { commandOpen, setCommandOpen, toggleTheme, theme } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandOpen, setCommandOpen]);

  const go = (to: string) => {
    setCommandOpen(false);
    router.push(to);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search commands, users, orders…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/")}><LayoutDashboard className="size-4" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/users")}><Users className="size-4" /> Users</CommandItem>
          <CommandItem onSelect={() => go("/orders")}><ShoppingBag className="size-4" /> Orders</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="size-4" /> Analytics</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="size-4" /> Settings</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { setCommandOpen(false); }}><Plus className="size-4" /> New user</CommandItem>
          <CommandItem onSelect={() => { toggleTheme(); setCommandOpen(false); }}>
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
