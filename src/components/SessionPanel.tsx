import { useState } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { ArrowRightLeft, Plus, Search } from "./icons";
import type { Attendant, SessionTransferTarget, WhatsAppSession } from "../domain/types";
import { statusColor } from "../ui/status";

interface SessionPanelProps {
  attendants: Attendant[];
  currentSessionId?: string;
  newSessionNumber: string;
  onAddSession: () => void;
  onNewSessionNumberChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectSession: (sessionId: string) => void;
  onTransferSession: (sessionId: string, attendantId: string) => void;
  search: string;
  sessions: WhatsAppSession[];
  transferBlockedReason?: string;
  transferTargets: SessionTransferTarget[];
}

export function SessionPanel({
  attendants,
  currentSessionId,
  newSessionNumber,
  onAddSession,
  onNewSessionNumberChange,
  onSearchChange,
  onSelectSession,
  onTransferSession,
  search,
  sessions,
  transferBlockedReason,
  transferTargets,
}: SessionPanelProps) {
  const [transferTargetId, setTransferTargetId] = useState<string | null>(transferTargets[0]?.attendantId ?? null);

  const selectedTransferTargetId = transferTargets.some((target) => target.attendantId === transferTargetId)
    ? transferTargetId
    : transferTargets[0]?.attendantId ?? null;
  const canTransfer = Boolean(currentSessionId && selectedTransferTargetId);

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
        <Box className="transfer-box">
          <Group justify="space-between" gap="xs" mb={6}>
            <Text fw={700} size="sm">
              Transferir sessao
            </Text>
            <ArrowRightLeft size={16} />
          </Group>
          {transferTargets.length === 0 ? (
            <Text c="dimmed" role="status" size="xs">
              {transferBlockedReason ?? "Nenhum atendente disponivel."}
            </Text>
          ) : (
            <Group grow gap="xs">
              <Select
                aria-label="Atendente para transferencia"
                data={transferTargets.map((target) => ({
                  value: target.attendantId,
                  label: target.displayName,
                }))}
                onChange={setTransferTargetId}
                value={selectedTransferTargetId}
              />
              <Button
                disabled={!canTransfer}
                onClick={() => {
                  if (currentSessionId && selectedTransferTargetId) {
                    onTransferSession(currentSessionId, selectedTransferTargetId);
                  }
                }}
                variant="light"
              >
                Transferir
              </Button>
            </Group>
          )}
        </Box>
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
                      {session.phoneNumber} - {attendant?.displayName ?? attendant?.name ?? "Sem atendente"}
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
