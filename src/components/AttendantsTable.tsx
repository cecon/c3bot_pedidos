import { useState } from "react";
import { ActionIcon, Avatar, Badge, Box, Button, Group, Table, Text, Tooltip } from "@mantine/core";
import { Edit, Power, PowerOff, Trash2 } from "lucide-react";
import type { Attendant, AttendantMutationResult, AvailabilityStatus } from "../domain/types";
import { availabilityStatusColor } from "../ui/status";

interface AttendantsTableProps {
  activeSessionCountByAttendant: Record<string, number>;
  attendants: Attendant[];
  onDeleteAttendant: (attendantId: string) => AttendantMutationResult;
  onEditAttendant: (attendant: Attendant) => void;
  onSetAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void;
}

export function AttendantsTable({
  activeSessionCountByAttendant,
  attendants,
  onDeleteAttendant,
  onEditAttendant,
  onSetAvailability,
}: AttendantsTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | undefined>();

  function handleConfirmDelete(attendantId: string) {
    const result = onDeleteAttendant(attendantId);
    if (result.ok) setConfirmDeleteId(undefined);
  }

  return (
    <Table.ScrollContainer minWidth={820}>
      <Table className="attendants-table" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Atendente</Table.Th>
            <Table.Th>WhatsApp</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Sessoes</Table.Th>
            <Table.Th>Acoes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {attendants.map((attendant) => (
            <AttendantRow
              activeSessionCount={activeSessionCountByAttendant[attendant.id] ?? 0}
              attendant={attendant}
              confirmDelete={confirmDeleteId === attendant.id}
              key={attendant.id}
              onCancelDelete={() => setConfirmDeleteId(undefined)}
              onConfirmDelete={() => handleConfirmDelete(attendant.id)}
              onDelete={() => setConfirmDeleteId(attendant.id)}
              onEdit={() => onEditAttendant(attendant)}
              onSetAvailability={onSetAvailability}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

interface AttendantRowProps {
  activeSessionCount: number;
  attendant: Attendant;
  confirmDelete: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSetAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void;
}

function AttendantRow({
  activeSessionCount,
  attendant,
  confirmDelete,
  onCancelDelete,
  onConfirmDelete,
  onDelete,
  onEdit,
  onSetAvailability,
}: AttendantRowProps) {
  const nextAvailability = attendant.availabilityStatus === "online" ? "offline" : "online";
  const availabilityLabel = attendant.availabilityStatus === "online" ? "Online" : "Offline";
  const toggleLabel =
    nextAvailability === "online" ? `Tornar online ${attendant.displayName}` : `Tornar offline ${attendant.displayName}`;

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar radius="xl" src={attendant.photoBase64}>
            {attendant.displayName.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box className="attendant-identity">
            <Text fw={800} size="sm">
              {attendant.displayName}
            </Text>
            <Text c="dimmed" size="xs">
              {attendant.name}
            </Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{attendant.whatsappNumber}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={availabilityStatusColor[attendant.availabilityStatus]} variant="light">
          {availabilityLabel}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{activeSessionCount}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Tooltip label={`Editar ${attendant.displayName}`}>
            <ActionIcon aria-label={`Editar ${attendant.displayName}`} onClick={onEdit} variant="light">
              <Edit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={toggleLabel}>
            <ActionIcon
              aria-label={toggleLabel}
              color={nextAvailability === "online" ? "green" : "gray"}
              onClick={() => onSetAvailability(attendant.id, nextAvailability)}
              variant="light"
            >
              {nextAvailability === "online" ? <Power size={16} /> : <PowerOff size={16} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label={`Excluir ${attendant.displayName}`}>
            <ActionIcon aria-label={`Excluir ${attendant.displayName}`} color="red" onClick={onDelete} variant="light">
              <Trash2 size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {confirmDelete && (
          <Group className="delete-confirmation" gap="xs" mt="xs">
            <Button color="red" size="xs" onClick={onConfirmDelete}>
              Confirmar exclusao
            </Button>
            <Button size="xs" variant="subtle" onClick={onCancelDelete}>
              Cancelar
            </Button>
          </Group>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
