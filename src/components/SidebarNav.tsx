import type { ComponentType } from "react";
import { Box, Group, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import {
  Activity,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Package,
  Settings,
  Store,
  UserCheck,
  Users,
} from "./icons";
import {
  CATALOG_SUB_PAGES,
  type CatalogSubPageId,
  type DestinationId,
  type NavigationDestination,
  type NavigationGroup,
  type NavigationIconName,
} from "../domain/navigation";

interface SidebarNavProps {
  activeDestinationId: DestinationId;
  activeSubPageId?: CatalogSubPageId;
  destinations: readonly NavigationDestination[];
  groups: readonly NavigationGroup[];
  onNavigate: (destinationId: DestinationId) => void;
  onNavigateSubPage: (path: string) => void;
}

const iconMap: Record<NavigationIconName, ComponentType<{ size?: number }>> = {
  activity: Activity,
  "book-open": BookOpen,
  bot: Bot,
  "building-2": Building2,
  "calendar-clock": CalendarClock,
  "layout-grid": LayoutGrid,
  megaphone: Megaphone,
  "message-circle": MessageCircle,
  package: Package,
  settings: Settings,
  store: Store,
  "user-check": UserCheck,
  users: Users,
};

export function SidebarNav({
  activeDestinationId,
  activeSubPageId,
  destinations,
  groups,
  onNavigate,
  onNavigateSubPage,
}: SidebarNavProps) {
  const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      destinationIds: group.destinationIds.filter((destinationId) => destinationById.has(destinationId)),
    }))
    .filter((group) => group.destinationIds.length > 0);

  return (
    <Box className="sidebar-nav" component="nav" aria-label="Navegacao principal">
      <Box className="sidebar-brand">
        <ThemeIcon radius="sm" size="lg" color="brand">
          <MessageCircle size={20} />
        </ThemeIcon>
        <Box>
          <Text fw={900}>C3Bot</Text>
          <Text c="dimmed" size="xs">
            Admin workspace
          </Text>
        </Box>
      </Box>
      <Stack className="nav-groups" gap="lg">
        {visibleGroups.map((group) => (
          <Box className="nav-group" key={group.id}>
            <Text className="nav-group-label" c="dimmed" fw={700} size="xs">
              {group.label}
            </Text>
            <Stack className="nav-items" gap={4}>
              {group.destinationIds.map((destinationId) => {
                const destination = destinationById.get(destinationId);
                if (!destination) return null;

                const Icon = iconMap[destination.iconName];
                const active = destination.id === activeDestinationId;

                const hasSubmenu = destination.id === "catalog";

                return (
                  <Box key={destination.id}>
                    <Tooltip label={destination.description} openDelay={500}>
                      <UnstyledButton
                        aria-current={active ? "page" : undefined}
                        className="nav-item"
                        data-active={active || undefined}
                        onClick={() => onNavigate(destination.id)}
                      >
                        <Group gap="sm" wrap="nowrap">
                          <ThemeIcon color={active ? "brand" : "gray"} radius="sm" size="sm" variant="light">
                            <Icon size={16} />
                          </ThemeIcon>
                          <Text fw={active ? 800 : 600} size="sm" truncate>
                            {destination.label}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    </Tooltip>
                    {hasSubmenu && active && (
                      <Stack className="nav-subitems" gap={2} role="group" aria-label={`Seções de ${destination.label}`}>
                        {CATALOG_SUB_PAGES.map((sub) => {
                          const SubIcon = iconMap[sub.iconName];
                          const subActive = sub.id === activeSubPageId;
                          return (
                            <UnstyledButton
                              key={sub.id}
                              aria-current={subActive ? "page" : undefined}
                              className="nav-subitem"
                              data-active={subActive || undefined}
                              onClick={() => onNavigateSubPage(sub.path)}
                            >
                              <Group gap="xs" wrap="nowrap">
                                <SubIcon size={14} />
                                <Text fw={subActive ? 700 : 500} size="sm" truncate>
                                  {sub.label}
                                </Text>
                              </Group>
                            </UnstyledButton>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
