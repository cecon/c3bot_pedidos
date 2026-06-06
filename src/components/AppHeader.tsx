import { Badge, Box, Button, Group, Text, ThemeIcon } from "@mantine/core";
import { Database, MessageCircle, Wifi } from "./icons";
import { ThemeSettingsDrawer } from "./ThemeSettingsDrawer";
import { getCatalogSubPageById, type CatalogSubPageId, type NavigationDestination } from "../domain/navigation";
import type { SessionStatus } from "../domain/types";

interface AppHeaderProps {
  activeDestination: NavigationDestination;
  activeSubPageId?: CatalogSubPageId;
  onVerifyDatabase: () => void;
  sessionCounts: Record<SessionStatus, number>;
}

export function AppHeader({ activeDestination, activeSubPageId, onVerifyDatabase, sessionCounts }: AppHeaderProps) {
  const subPage = activeSubPageId ? getCatalogSubPageById(activeSubPageId) : null;
  const title = subPage ? `${activeDestination.label} · ${subPage.label}` : activeDestination.label;
  const description = subPage ? subPage.description : activeDestination.description;

  return (
    <Box className="app-header">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon radius="sm" size="lg" color="brand">
          <MessageCircle size={20} />
        </ThemeIcon>
        <Box className="header-title">
          <Text fw={800} size="lg" truncate>
            {title}
          </Text>
          <Text c="dimmed" size="xs" truncate>
            {description}
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
        <ThemeSettingsDrawer />
      </Group>
    </Box>
  );
}
