import { Alert, Box, Button, Paper, Stack, Text } from "@mantine/core";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import type {
  Attendant,
  AttendantFormValues,
  AttendantMutationResult,
  AvailabilityStatus,
} from "../domain/types";
import { AttendantForm, type AttendantFormMode } from "./AttendantForm";
import { AttendantsTable } from "./AttendantsTable";

interface AttendantsPanelProps {
  activeSessionCountByAttendant: Record<string, number>;
  attendants: Attendant[];
  onCreateAttendant: (values: AttendantFormValues) => AttendantMutationResult;
  onDeleteAttendant: (attendantId: string) => AttendantMutationResult;
  onSetAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void;
  onUpdateAttendant: (attendantId: string, values: AttendantFormValues) => AttendantMutationResult;
}

export function AttendantsPanel({
  activeSessionCountByAttendant,
  attendants,
  onCreateAttendant,
  onDeleteAttendant,
  onSetAvailability,
  onUpdateAttendant,
}: AttendantsPanelProps) {
  const activeAttendants = attendants.filter((attendant) => attendant.active);
  const [formMode, setFormMode] = useState<AttendantFormMode>("closed");
  const [editingAttendant, setEditingAttendant] = useState<Attendant | undefined>();
  const [actionMessage, setActionMessage] = useState<string | undefined>();

  function startCreate() {
    setFormMode("create");
    setEditingAttendant(undefined);
  }

  function startEdit(attendant: Attendant) {
    setFormMode("edit");
    setEditingAttendant(attendant);
  }

  function closeForm() {
    setFormMode("closed");
    setEditingAttendant(undefined);
  }

  function handleDelete(attendantId: string): AttendantMutationResult {
    const result = onDeleteAttendant(attendantId);
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
          <Button leftSection={<UserPlus size={16} />} onClick={startCreate}>
            Adicionar atendente
          </Button>
        </Box>

        {actionMessage && (
          <Alert color="yellow" radius="sm" variant="light">
            {actionMessage}
          </Alert>
        )}

        {formMode !== "closed" && (
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
              <Button leftSection={<UserPlus size={16} />} onClick={startCreate} variant="light">
                Adicionar primeiro atendente
              </Button>
            </Stack>
          </Paper>
        ) : (
          <AttendantsTable
            activeSessionCountByAttendant={activeSessionCountByAttendant}
            attendants={activeAttendants}
            onDeleteAttendant={handleDelete}
            onEditAttendant={startEdit}
            onSetAvailability={onSetAvailability}
          />
        )}
      </Stack>
    </Paper>
  );
}
