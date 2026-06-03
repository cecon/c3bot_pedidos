import { Alert, Box, Button, Paper, Stack, Text } from "@mantine/core";
import { UserPlus } from "./icons";
import { useState } from "react";
import type {
  Attendant,
  AttendantDeleteHandler,
  AttendantMutationHandler,
  AttendantPersistenceState,
  AttendantUpdateHandler,
  AvailabilityStatus,
} from "../domain/types";
import { canMutatePersistedAttendants, getAttendantPersistenceLabel } from "../domain/attendantPersistence";
import { AttendantForm, type AttendantFormMode } from "./AttendantForm";
import { AttendantsTable } from "./AttendantsTable";

interface AttendantsPanelProps {
  activeSessionCountByAttendant: Record<string, number>;
  attendants: Attendant[];
  onCreateAttendant: AttendantMutationHandler;
  onDeleteAttendant: AttendantDeleteHandler;
  onSetAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void | Promise<void>;
  onUpdateAttendant: AttendantUpdateHandler;
  persistenceState: AttendantPersistenceState;
}

export function AttendantsPanel({
  activeSessionCountByAttendant,
  attendants,
  onCreateAttendant,
  onDeleteAttendant,
  onSetAvailability,
  onUpdateAttendant,
  persistenceState,
}: AttendantsPanelProps) {
  const activeAttendants = attendants.filter((attendant) => attendant.active);
  const canMutate = canMutatePersistedAttendants(persistenceState);
  const persistenceLabel = getAttendantPersistenceLabel(persistenceState);
  const [formMode, setFormMode] = useState<AttendantFormMode>("closed");
  const [editingAttendant, setEditingAttendant] = useState<Attendant | undefined>();
  const [actionMessage, setActionMessage] = useState<string | undefined>();

  function startCreate() {
    if (!canMutate) return;
    setFormMode("create");
    setEditingAttendant(undefined);
  }

  function startEdit(attendant: Attendant) {
    if (!canMutate) return;
    setFormMode("edit");
    setEditingAttendant(attendant);
  }

  function closeForm() {
    setFormMode("closed");
    setEditingAttendant(undefined);
  }

  async function handleDelete(attendantId: string) {
    const result = await onDeleteAttendant(attendantId);
    setActionMessage(result.ok ? undefined : result.message);
    return result;
  }

  return (
    <Paper className="page-card attendants-panel" radius="sm">
      <Stack gap="md">
        <Box className="attendants-heading">
          <Box>
            <Text fw={800}>Atendentes</Text>
            <Text c="dimmed" size="sm">
              Funcionarios humanos que podem receber sessoes do delivery.
            </Text>
          </Box>
          <Button disabled={!canMutate} leftSection={<UserPlus size={16} />} onClick={startCreate}>
            Adicionar atendente
          </Button>
        </Box>

        {persistenceLabel && (
          <Alert
            className="attendants-state"
            color={persistenceState.status === "error" ? "red" : "yellow"}
            radius="sm"
            variant="light"
          >
            {persistenceLabel}
          </Alert>
        )}

        {actionMessage && (
          <Alert color="yellow" radius="sm" variant="light">
            {actionMessage}
          </Alert>
        )}

        {formMode !== "closed" && canMutate && (
          <AttendantForm
            attendants={attendants}
            editingAttendant={editingAttendant}
            mode={formMode}
            onClose={closeForm}
            onCreateAttendant={onCreateAttendant}
            onUpdateAttendant={onUpdateAttendant}
          />
        )}

        {activeAttendants.length === 0 ? (
          <Paper className="attendants-empty" radius="sm">
            <Stack align="center" gap="sm">
              <Text fw={800}>Nenhum atendente cadastrado</Text>
              <Text c="dimmed" ta="center" size="sm">
                Cadastre o primeiro funcionario humano para receber transferencias do delivery.
              </Text>
              <Button disabled={!canMutate} leftSection={<UserPlus size={16} />} onClick={startCreate} variant="light">
                Adicionar primeiro atendente
              </Button>
            </Stack>
          </Paper>
        ) : (
          <AttendantsTable
            activeSessionCountByAttendant={activeSessionCountByAttendant}
            attendants={activeAttendants}
            onDeleteAttendant={(attendantId) => handleDelete(attendantId)}
            onEditAttendant={startEdit}
            onSetAvailability={onSetAvailability}
          />
        )}
      </Stack>
    </Paper>
  );
}
