import { useState } from "react";
import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { Plus } from "./icons";

// Presentational catalog manager (no IO): pick the active catalog and create new ones.
export interface CatalogSummary {
  id: string;
  name: string;
  context: string;
}

interface CatalogManagerProps {
  catalogs: CatalogSummary[];
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, context: "delivery" | "indoor" | "takeout") => void;
}

export function CatalogManager({ catalogs, activeId, onSelect, onCreate }: CatalogManagerProps) {
  const [name, setName] = useState("");
  const [context, setContext] = useState<"delivery" | "indoor" | "takeout">("delivery");

  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Catálogos
      </Text>
      <Group gap="xs">
        {catalogs.length === 0 && (
          <Text c="dimmed" size="sm">
            Nenhum catálogo ainda.
          </Text>
        )}
        {catalogs.map((catalog) => (
          <Button
            key={catalog.id}
            size="compact-sm"
            variant={catalog.id === activeId ? "filled" : "light"}
            onClick={() => onSelect(catalog.id)}
          >
            {catalog.name}
          </Button>
        ))}
      </Group>
      <Group gap="xs" align="end">
        <TextInput
          label="Novo catálogo"
          placeholder="Ex.: Café da Manhã"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Select
          label="Contexto"
          data={[
            { value: "delivery", label: "Delivery" },
            { value: "indoor", label: "Salão" },
            { value: "takeout", label: "Retirada" },
          ]}
          value={context}
          onChange={(value) => setContext((value as "delivery" | "indoor" | "takeout") ?? "delivery")}
          w={140}
        />
        <Button
          leftSection={<Plus size={14} />}
          disabled={name.trim() === ""}
          onClick={() => {
            onCreate(name.trim(), context);
            setName("");
          }}
        >
          Criar
        </Button>
      </Group>
    </Stack>
  );
}
