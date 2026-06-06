import type { ComponentType } from "react";
import { Activity, MessageCircle, UserCheck } from "./icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { DestinationId, NavigationDestination, NavigationIconName } from "../domain/navigation";
import { cn } from "../lib/utils";

interface SidebarNavProps {
  activeDestinationId: DestinationId;
  destinations: readonly NavigationDestination[];
  collapsed: boolean;
  onNavigate: (destinationId: DestinationId) => void;
}

const iconMap: Record<NavigationIconName, ComponentType<{ size?: number }>> = {
  activity: Activity,
  "user-check": UserCheck,
};

export function SidebarNav({ activeDestinationId, destinations, collapsed, onNavigate }: SidebarNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      data-collapsed={collapsed || undefined}
      className="flex h-screen shrink-0 flex-col gap-2 border-r border-border bg-card py-3 transition-[width] duration-200"
      style={{ width: collapsed ? "var(--app-sidebar-collapsed-width)" : "var(--app-sidebar-width)" }}
    >
      <div className={cn("flex h-10 items-center gap-2 px-3", collapsed && "justify-center px-0")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <MessageCircle size={18} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold">C3Bot</p>
            <p className="text-xs text-muted-foreground">Admin workspace</p>
          </div>
        )}
      </div>

      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-1 px-2">
          {destinations.map((destination) => {
            const Icon = iconMap[destination.iconName];
            const active = destination.id === activeDestinationId;
            const button = (
              <button
                type="button"
                aria-label={destination.label}
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(destination.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon size={18} />
                {!collapsed && <span className="truncate">{destination.label}</span>}
              </button>
            );
            return collapsed ? (
              <Tooltip key={destination.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">{destination.label}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={destination.id}>{button}</div>
            );
          })}
        </div>
      </TooltipProvider>
    </nav>
  );
}
