import { FormEvent, useState } from "react";
import { ActionIcon, Alert, Avatar, Box, Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { Check, X } from "lucide-react";
import {
  readAttendantPhotoAsBase64,
  validateAttendantDraft,
  validateAttendantPhotoFile,
} from "../domain/attendants";
import type { Attendant, AttendantFormValues, AttendantMutationResult } from "../domain/types";

export type AttendantFormMode = "closed" | "create" | "edit";

interface AttendantFormProps {
  attendants: Attendant[];
  editingAttendant?: Attendant;
  mode: Exclude<AttendantFormMode, "closed">;
  onClose: () => void;
  onCreateAttendant: (values: AttendantFormValues) => AttendantMutationResult;
  onUpdateAttendant: (attendantId: string, values: AttendantFormValues) => AttendantMutationResult;
}

const emptyForm: AttendantFormValues = {
  name: "",
  displayName: "",
  whatsappNumber: "",
  photoBase64: undefined,
};

export function AttendantForm({
  attendants,
  editingAttendant,
  mode,
  onClose,
  onCreateAttendant,
  onUpdateAttendant,
}: AttendantFormProps) {
  const [formValues, setFormValues] = useState<AttendantFormValues>(() => getInitialValues(editingAttendant));
  const [formErrors, setFormErrors] = useState<AttendantMutationResult["fieldErrors"]>({});
  const [formMessage, setFormMessage] = useState<string | undefined>();

  async function handlePhotoChange(file: File | null) {
    if (!file) {
      setFormValues((values) => ({ ...values, photoBase64: undefined }));
      setFormErrors((errors) => ({ ...errors, photoBase64: undefined }));
      return;
    }

    const validation = validateAttendantPhotoFile(file);
    if (!validation.ok) {
      setFormErrors((errors) => ({ ...errors, photoBase64: validation.fieldErrors?.photoBase64 }));
      return;
    }

    const photoBase64 = await readAttendantPhotoAsBase64(file);
    setFormValues((values) => ({ ...values, photoBase64 }));
    setFormErrors((errors) => ({ ...errors, photoBase64: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateAttendantDraft(formValues, attendants, editingAttendant?.id);
    if (!validation.ok) {
      setFormErrors(validation.fieldErrors);
      return;
    }

    const result =
      mode === "edit" && editingAttendant
        ? onUpdateAttendant(editingAttendant.id, formValues)
        : onCreateAttendant(formValues);
    if (!result.ok) {
      setFormErrors(result.fieldErrors);
      setFormMessage(result.message);
      return;
    }

    onClose();
  }

  return (
    <Paper className="attendant-form" component="form" onSubmit={handleSubmit} radius="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={800}>{mode === "create" ? "Novo atendente" : "Editar atendente"}</Text>
          <ActionIcon aria-label="Fechar formulario" variant="subtle" onClick={onClose}>
            <X size={16} />
          </ActionIcon>
        </Group>
        {formMessage && (
          <Alert color="red" radius="sm" variant="light">
            {formMessage}
          </Alert>
        )}
        <Group grow align="flex-start">
          <AttendantTextField
            error={formErrors?.name}
            label="Nome"
            value={formValues.name}
            onChange={(name) => setFormValues((values) => ({ ...values, name }))}
          />
          <AttendantTextField
            error={formErrors?.displayName}
            label="Nome para exibicao"
            value={formValues.displayName}
            onChange={(displayName) => setFormValues((values) => ({ ...values, displayName }))}
          />
          <AttendantTextField
            error={formErrors?.whatsappNumber}
            label="WhatsApp obrigatorio"
            placeholder="+55 11 99999-0000"
            value={formValues.whatsappNumber}
            onChange={(whatsappNumber) => setFormValues((values) => ({ ...values, whatsappNumber }))}
          />
        </Group>
        <Group align="flex-end">
          <Box className="attendant-photo-input">
            <Text component="label" fw={500} size="sm">
              Foto do funcionario
            </Text>
            <input
              accept="image/gif,image/jpeg,image/png,image/webp"
              aria-label="Foto do funcionario"
              onChange={(event) => void handlePhotoChange(event.currentTarget.files?.[0] ?? null)}
              type="file"
            />
            {formErrors?.photoBase64 && (
              <Text c="red" size="xs">
                {formErrors.photoBase64}
              </Text>
            )}
          </Box>
          {formValues.photoBase64 && (
            <Group gap="xs">
              <Avatar radius="xl" size="md" src={formValues.photoBase64}>
                {formValues.displayName.slice(0, 2).toUpperCase()}
              </Avatar>
              <Text c="dimmed" size="sm">
                Foto carregada
              </Text>
            </Group>
          )}
        </Group>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button leftSection={<Check size={16} />} type="submit">
            Salvar
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function getInitialValues(attendant?: Attendant): AttendantFormValues {
  return attendant
    ? {
        name: attendant.name,
        displayName: attendant.displayName,
        whatsappNumber: attendant.whatsappNumber,
        photoBase64: attendant.photoBase64,
      }
    : emptyForm;
}

interface AttendantTextFieldProps {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function AttendantTextField({ error, label, onChange, placeholder, value }: AttendantTextFieldProps) {
  return (
    <TextInput
      aria-required
      error={error}
      label={label}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}
