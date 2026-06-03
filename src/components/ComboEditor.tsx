import { useState } from "react";
import { ActionIcon, Button, Group, NumberInput, Paper, Select, Stack, Text } from "@mantine/core";
import { Plus, Trash2 } from "./icons";

// Presentational combo editor (no IO): bundle component products with quantities. FR-024.
export interface ComboProduct {
  id: string;
  name: string;
}
export interface ComboComponentValue {
  componentProductId: string;
  quantity: number;
}

interface ComboEditorProps {
  products: ComboProduct[];
  initial: ComboComponentValue[];
  onSave: (components: ComboComponentValue[]) => void;
}

export function ComboEditor({ products, initial, onSave }: ComboEditorProps) {
  const [components, setComponents] = useState<ComboComponentValue[]>(initial);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const nameById = new Map(products.map((product) => [product.id, product.name]));

  const add = () => {
    if (!productId) return;
    setComponents((current) => [...current, { componentProductId: productId, quantity: typeof quantity === "number" ? quantity : 1 }]);
    setProductId(null);
    setQuantity(1);
  };

  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Componentes do combo
      </Text>
      {components.length === 0 && (
        <Text c="dimmed" size="sm">
          Nenhum componente.
        </Text>
      )}
      {components.map((component, index) => (
        <Paper key={`${component.componentProductId}-${index}`} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm">
              {component.quantity}× {nameById.get(component.componentProductId) ?? "(produto)"}
            </Text>
            <ActionIcon
              aria-label={`Remover componente ${index + 1}`}
              variant="subtle"
              color="red"
              onClick={() => setComponents((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 size={14} />
            </ActionIcon>
          </Group>
        </Paper>
      ))}
      <Group gap="xs" align="end">
        <Select
          label="Produto"
          placeholder="Selecione"
          data={products.map((product) => ({ value: product.id, label: product.name }))}
          value={productId}
          onChange={setProductId}
        />
        <NumberInput label="Qtd." w={80} min={1} value={quantity} onChange={setQuantity} />
        <Button leftSection={<Plus size={14} />} disabled={!productId} onClick={add}>
          Adicionar
        </Button>
        <Button variant="light" onClick={() => onSave(components)}>
          Salvar combo
        </Button>
      </Group>
    </Stack>
  );
}
