import { useState } from "react";
import { ActionIcon, Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { Trash2 } from "lucide-react";
import type { MerchantInterruption } from "../domain/types";
import { validateInterruption } from "../domain/merchant/interruptions";

// Presentational interruptions editor (no IO). Lists current/future interruptions and creates a
// new one; the create action is gated by the domain validator. Deletion is delegated via onDelete
// (the container surfaces a 409 "recently created" as a non-blocking warning).

export interface InterruptionDraft {
  description: string;
  start: string;
  end: string;
}

interface InterruptionsEditorProps {
  interruptions: MerchantInterruption[];
  onCreate: (draft: InterruptionDraft) => void;
  onDelete: (id: string) => void;
}

const EMPTY: InterruptionDraft = { description: "", start: "", end: "" };

export function InterruptionsEditor({ interruptions, onCreate, onDelete }: InterruptionsEditorProps) {
  const [draft, setDraft] = useState<InterruptionDraft>(EMPTY);
  const canCreate = validateInterruption(draft).ok;

  const submit = () => {
    onCreate(draft);
    setDraft(EMPTY);
  };

  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Interrupções
      </Text>
      {interruptions.length === 0 && (
        <Text c="dimmed" size="sm">
          Nenhuma interrupção atual ou futura.
        </Text>
      )}
      {interruptions.map((item) => (
        <Paper key={item.id} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={0}>
              <Text size="sm">{item.description}</Text>
              <Text c="dimmed" size="xs">
                {item.start} → {item.end}
              </Text>
            </Stack>
            <ActionIcon color="danger" variant="light" aria-label="Remover interrupção" onClick={() => onDelete(item.id)}>
              <Trash2 size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}

      <Group gap="xs" align="end" wrap="wrap">
        <TextInput
          label="Descrição"
          value={draft.description}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setDraft((d) => ({ ...d, description: value }));
          }}
        />
        <TextInput
          label="Início (ISO-8601)"
          w={200}
          placeholder="2026-06-03T14:00:00Z"
          value={draft.start}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setDraft((d) => ({ ...d, start: value }));
          }}
        />
        <TextInput
          label="Fim (ISO-8601)"
          w={200}
          placeholder="2026-06-03T16:00:00Z"
          value={draft.end}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setDraft((d) => ({ ...d, end: value }));
          }}
        />
        <Button disabled={!canCreate} onClick={submit}>
          Criar interrupção
        </Button>
      </Group>
    </Stack>
  );
}
