import { Group, Select, Stack, Text, TextInput } from "@mantine/core";
import type { AvailabilityState } from "../domain/types";

// Presentational availability control (no IO): status + optional auto-return time for pause.
// FR-017/018. Changes are delegated via onChange.
interface AvailabilityControlProps {
  status: AvailabilityState;
  pauseUntil: string | null;
  onChange: (status: AvailabilityState, pauseUntil: string | null) => void;
}

export function AvailabilityControl({ status, pauseUntil, onChange }: AvailabilityControlProps) {
  return (
    <Stack gap="xs">
      <Group gap="sm" align="end">
        <Select
          label="Disponibilidade"
          data={[
            { value: "available", label: "Disponível" },
            { value: "unavailable", label: "Indisponível" },
            { value: "paused", label: "Pausado (sem estoque)" },
          ]}
          value={status}
          onChange={(value) => onChange((value as AvailabilityState) ?? "available", value === "paused" ? pauseUntil : null)}
        />
        {status === "paused" && (
          <TextInput
            type="datetime-local"
            label="Retorno automático"
            aria-label="Retorno automático"
            value={pauseUntil ?? ""}
            onChange={(event) => onChange("paused", event.currentTarget.value || null)}
          />
        )}
      </Group>
      {status === "paused" && !pauseUntil && (
        <Text c="dimmed" size="xs">
          Sem retorno automático: permanece pausado até reativar manualmente.
        </Text>
      )}
    </Stack>
  );
}
