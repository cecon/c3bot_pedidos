import { Badge, Box, Button, Group, Text, ThemeIcon } from "@mantine/core";
import { Database, MessageCircle, Wifi } from "./icons";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { NavigationDestination } from "../domain/navigation";
import type { SessionStatus } from "../domain/types";

interface AppHeaderProps {
  activeDestination: NavigationDestination;
  onVerifyDatabase: () => void;
  sessionCounts: Record<SessionStatus, number>;
}

export function AppHeader({ activeDestination, onVerifyDatabase, sessionCounts }: AppHeaderProps) {
  return (
    <Box className="app-header">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon radius="sm" size="lg" color="brand">
          <MessageCircle size={20} />
        </ThemeIcon>
        <Box className="header-title">
          <Text fw={800} size="lg" truncate>
            {activeDestination.label}
          </Text>
          <Text c="dimmed" size="xs" truncate>
            {activeDestination.description}
          </Text>
        </Box>
      </Group>
      <Group className="header-actions" gap="xs" wrap="nowrap">
        <Badge color="green" variant="light" leftSection={<Wifi size={12} />}>
          {sessionCounts.connected} online
        </Badge>
        <Badge color="yellow" variant="light">
          {sessionCounts.connecting} conectando
        </Badge>
        <Button size="xs" variant="light" leftSection={<Database size={14} />} onClick={onVerifyDatabase}>
          SQLite
        </Button>
        <ThemeSwitcher />
      </Group>
    </Box>
  );
}
