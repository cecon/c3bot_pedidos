import { useState } from "react";
import { ActionIcon, Badge, Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

// Presentational category tree (no IO): ordered categories with reorder + create.
export interface CategorySummary {
  id: string;
  name: string;
  status: "available" | "unavailable" | "paused";
}

interface CategoryTreeProps {
  categories: CategorySummary[];
  onCreate: (name: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

function move(ids: string[], index: number, delta: number): string[] {
  const target = index + delta;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function CategoryTree({ categories, onCreate, onReorder }: CategoryTreeProps) {
  const [name, setName] = useState("");
  const ids = categories.map((category) => category.id);

  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Categorias
      </Text>
      {categories.length === 0 && (
        <Text c="dimmed" size="sm">
          Nenhuma categoria neste catálogo.
        </Text>
      )}
      {categories.map((category, index) => (
        <Paper key={category.id} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Text size="sm">{category.name}</Text>
              {category.status !== "available" && (
                <Badge size="xs" color="gray">
                  {category.status}
                </Badge>
              )}
            </Group>
            <Group gap={2} wrap="nowrap">
              <ActionIcon
                aria-label={`Mover ${category.name} para cima`}
                variant="subtle"
                disabled={index === 0}
                onClick={() => onReorder(move(ids, index, -1))}
              >
                <ChevronUp size={14} />
              </ActionIcon>
              <ActionIcon
                aria-label={`Mover ${category.name} para baixo`}
                variant="subtle"
                disabled={index === categories.length - 1}
                onClick={() => onReorder(move(ids, index, 1))}
              >
                <ChevronDown size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>
      ))}
      <Group gap="xs" align="end">
        <TextInput
          label="Nova categoria"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Button
          leftSection={<Plus size={14} />}
          disabled={name.trim() === ""}
          onClick={() => {
            onCreate(name.trim());
            setName("");
          }}
        >
          Criar
        </Button>
      </Group>
    </Stack>
  );
}
