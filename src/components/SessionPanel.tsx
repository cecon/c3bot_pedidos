import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { Plus, Search } from "lucide-react";
import type { Attendant, WhatsAppSession } from "../domain/types";
import { statusColor } from "../ui/status";

interface SessionPanelProps {
  attendants: Attendant[];
  currentSessionId?: string;
  newSessionNumber: string;
  onAddSession: () => void;
  onNewSessionNumberChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectSession: (sessionId: string) => void;
  search: string;
  sessions: WhatsAppSession[];
}

export function SessionPanel({
  attendants,
  currentSessionId,
  newSessionNumber,
  onAddSession,
  onNewSessionNumberChange,
  onSearchChange,
  onSelectSession,
  search,
  sessions,
}: SessionPanelProps) {
  return (
    <Paper className="session-panel" radius="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>Sessoes</Text>
          <Tooltip label="Adicionar sessao">
            <ActionIcon variant="light" color="green" onClick={onAddSession} aria-label="Adicionar sessao">
              <Plus size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <TextInput
          leftSection={<Search size={15} />}
          placeholder="Buscar numero ou fila"
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
        />
        <Group grow gap="xs">
          <TextInput
            placeholder="+55 11 99999-0000"
            value={newSessionNumber}
            onChange={(event) => onNewSessionNumberChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onAddSession();
              }
            }}
          />
          <Button leftSection={<Plus size={15} />} onClick={onAddSession}>
            Nova
          </Button>
        </Group>
      </Stack>
      <ScrollArea className="session-list" type="auto">
        <Stack gap="xs">
          {sessions.map((session) => {
            const attendant = attendants.find((item) => item.id === session.assignedAttendantId);
            return (
              <button
                className="session-item"
                data-active={session.id === currentSessionId || undefined}
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                type="button"
              >
                <Avatar color={statusColor[session.status]} radius="xl">
                  {session.displayName.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box className="session-meta">
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={700} size="sm" truncate>
                      {session.displayName}
                    </Text>
                    <Text c="dimmed" size="xs">
                      {session.lastMessageAt}
                    </Text>
                  </Group>
                  <Group justify="space-between" wrap="nowrap">
                    <Text c="dimmed" size="xs" truncate>
                      {session.phoneNumber} - {attendant?.name}
                    </Text>
                    {session.unread > 0 && <Badge size="xs">{session.unread}</Badge>}
                  </Group>
                </Box>
              </button>
            );
          })}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
