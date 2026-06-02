import type { ComponentType } from "react";
import { Box, Group, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import {
  Activity,
  BookOpen,
  Bot,
  CalendarClock,
  Megaphone,
  MessageCircle,
  Settings,
  Store,
  UserCheck,
  Users,
} from "lucide-react";
import type {
  DestinationId,
  NavigationDestination,
  NavigationGroup,
  NavigationIconName,
} from "../domain/navigation";

interface SidebarNavProps {
  activeDestinationId: DestinationId;
  destinations: readonly NavigationDestination[];
  groups: readonly NavigationGroup[];
  onNavigate: (destinationId: DestinationId) => void;
}

const iconMap: Record<NavigationIconName, ComponentType<{ size?: number }>> = {
  activity: Activity,
  "book-open": BookOpen,
  bot: Bot,
  "calendar-clock": CalendarClock,
  megaphone: Megaphone,
  "message-circle": MessageCircle,
  settings: Settings,
  store: Store,
  "user-check": UserCheck,
  users: Users,
};

export function SidebarNav({ activeDestinationId, destinations, groups, onNavigate }: SidebarNavProps) {
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
        <ThemeIcon radius="sm" size="lg" color="green">
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

                return (
                  <Tooltip label={destination.description} key={destination.id} openDelay={500}>
                    <UnstyledButton
                      aria-current={active ? "page" : undefined}
                      className="nav-item"
                      data-active={active || undefined}
                      onClick={() => onNavigate(destination.id)}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon color={active ? "green" : "gray"} radius="sm" size="sm" variant="light">
                          <Icon size={16} />
                        </ThemeIcon>
                        <Text fw={active ? 800 : 600} size="sm" truncate>
                          {destination.label}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  </Tooltip>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
