import { ActionIcon, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { Plus, Trash2 } from "./icons";
import type { ScheduleWindow } from "../domain/types";

// Presentational weekly-hours editor (no IO). Value is a flat list of windows tagged by
// dayOfWeek; a day with no window is "closed". Reused at store/catalog/category/item scope.
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface WeeklyHoursEditorProps {
  value: ScheduleWindow[];
  onChange: (windows: ScheduleWindow[]) => void;
}

export function WeeklyHoursEditor({ value, onChange }: WeeklyHoursEditorProps) {
  const addWindow = (dayOfWeek: number) => onChange([...value, { dayOfWeek, start: "08:00", end: "18:00" }]);
  const removeWindow = (index: number) => onChange(value.filter((_, i) => i !== index));
  const updateWindow = (index: number, patch: Partial<ScheduleWindow>) =>
    onChange(value.map((window, i) => (i === index ? { ...window, ...patch } : window)));

  return (
    <Stack gap="xs">
      {DAY_LABELS.map((label, day) => {
        const dayWindows = value.map((window, index) => ({ window, index })).filter((entry) => entry.window.dayOfWeek === day);
        return (
          <Group key={day} align="start" wrap="nowrap">
            <Text w={48} fw={600} size="sm">
              {label}
            </Text>
            <Stack gap={4} style={{ flex: 1 }}>
              {dayWindows.length === 0 && (
                <Text c="dimmed" size="xs">
                  Fechado
                </Text>
              )}
              {dayWindows.map(({ window, index }) => (
                <Group key={index} gap="xs" wrap="nowrap">
                  <TextInput
                    aria-label={`${label} início`}
                    value={window.start}
                    onChange={(event) => updateWindow(index, { start: event.currentTarget.value })}
                    w={90}
                  />
                  <TextInput
                    aria-label={`${label} fim`}
                    value={window.end}
                    onChange={(event) => updateWindow(index, { end: event.currentTarget.value })}
                    w={90}
                  />
                  <ActionIcon
                    aria-label={`Remover janela ${label}`}
                    variant="subtle"
                    color="red"
                    onClick={() => removeWindow(index)}
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                aria-label={`Adicionar janela ${label}`}
                variant="subtle"
                size="compact-xs"
                leftSection={<Plus size={12} />}
                onClick={() => addWindow(day)}
              >
                janela
              </Button>
            </Stack>
          </Group>
        );
      })}
    </Stack>
  );
}
