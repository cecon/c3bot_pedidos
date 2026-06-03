import { useState } from "react";
import { ActionIcon, Button, Group, NumberInput, Paper, Select, Stack, Switch, Text, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import type { DayOfWeek } from "../domain/types";
import { DAYS_OF_WEEK, validateShift } from "../domain/merchant/validation";

// Presentational weekly opening-hours editor (no IO). Edits a list of shifts and emits the full
// set via onSave; the save action is disabled until every shift passes the domain validator.

export interface ShiftRow {
  dayOfWeek: DayOfWeek;
  start: string;
  duration: number;
  enabled: boolean;
}

interface ShiftEditorProps {
  shifts: ShiftRow[];
  onSave: (shifts: ShiftRow[]) => void;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({ value: day, label: DAY_LABELS[day] }));

export function ShiftEditor({ shifts, onSave }: ShiftEditorProps) {
  const [rows, setRows] = useState<ShiftRow[]>(shifts);

  const update = (index: number, patch: Partial<ShiftRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const remove = (index: number) => setRows((current) => current.filter((_, i) => i !== index));
  const add = () => setRows((current) => [...current, { dayOfWeek: "MONDAY", start: "18:00", duration: 240, enabled: true }]);

  const allValid = rows.every((row) => validateShift({ dayOfWeek: row.dayOfWeek, start: row.start, duration: row.duration }).ok);

  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Horário de funcionamento (turnos)
      </Text>
      {rows.length === 0 && (
        <Text c="dimmed" size="sm">
          Nenhum turno — o merchant fica fechado. Adicione um turno por dia/horário.
        </Text>
      )}
      {rows.map((row, index) => (
        <Paper key={index} withBorder p="xs" radius="sm">
          <Group gap="xs" align="end" wrap="wrap">
            <Select
              label="Dia"
              w={120}
              data={DAY_OPTIONS}
              value={row.dayOfWeek}
              onChange={(value) => update(index, { dayOfWeek: (value as DayOfWeek) ?? "MONDAY" })}
            />
            <TextInput
              label="Início (HH:MM)"
              w={110}
              value={row.start}
              onChange={(event) => update(index, { start: event.currentTarget.value })}
            />
            <NumberInput
              label="Duração (min)"
              w={120}
              min={1}
              max={1440}
              value={row.duration}
              onChange={(value) => update(index, { duration: typeof value === "number" ? value : 0 })}
            />
            <Switch
              label="Ativo"
              checked={row.enabled}
              onChange={(event) => update(index, { enabled: event.currentTarget.checked })}
            />
            <ActionIcon
              color="danger"
              variant="light"
              aria-label="Remover turno"
              onClick={() => remove(index)}
            >
              <Trash2 size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}
      <Group gap="xs">
        <Button leftSection={<Plus size={14} />} variant="light" onClick={add}>
          Adicionar turno
        </Button>
        <Button disabled={!allValid} onClick={() => onSave(rows)}>
          Salvar horários
        </Button>
      </Group>
    </Stack>
  );
}
