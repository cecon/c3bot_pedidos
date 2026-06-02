import { useState } from "react";
import { Badge, Button, Group, SimpleGrid, Stack, Textarea, TextInput, NumberInput, Select } from "@mantine/core";
import type { UnitOfMeasure } from "../domain/types";
import { validateProduct } from "../domain/catalog/validation";

// Presentational product editor (no IO). Unit of measure + reference weight live on the
// product (FR-035); a missing external code shows a "não mapeado" badge (FR-009).
export interface ProductEditorValue {
  name: string;
  description: string;
  unitOfMeasure: UnitOfMeasure;
  referenceWeightGrams: number | string;
  externalCode: string;
}

interface ProductEditorProps {
  initial: ProductEditorValue;
  onSave: (value: ProductEditorValue) => void;
  saving?: boolean;
}

export function ProductEditor({ initial, onSave, saving = false }: ProductEditorProps) {
  const [value, setValue] = useState<ProductEditorValue>(initial);
  const set = (patch: Partial<ProductEditorValue>) => setValue((current) => ({ ...current, ...patch }));

  const referenceWeightGrams = typeof value.referenceWeightGrams === "number" ? value.referenceWeightGrams : null;
  const check = validateProduct({ name: value.name, unitOfMeasure: value.unitOfMeasure, referenceWeightGrams });
  const unmapped = value.externalCode.trim() === "";

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <TextInput
          label="Produto"
          required
          style={{ flex: 1 }}
          value={value.name}
          error={value.name.trim() === "" ? "Obrigatório" : undefined}
          onChange={(event) => set({ name: event.currentTarget.value })}
        />
        {unmapped && <Badge color="orange" variant="light" mt={24}>não mapeado</Badge>}
      </Group>
      <Textarea
        label="Descrição"
        rows={2}
        value={value.description}
        onChange={(event) => set({ description: event.currentTarget.value })}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Select
          label="Unidade de medida"
          data={[
            { value: "unit", label: "Unidade" },
            { value: "weight", label: "Peso (kg)" },
          ]}
          value={value.unitOfMeasure}
          onChange={(unit) => set({ unitOfMeasure: (unit as UnitOfMeasure) ?? "unit" })}
        />
        {value.unitOfMeasure === "weight" && (
          <NumberInput
            label="Peso de referência (g)"
            required
            min={1}
            value={value.referenceWeightGrams}
            error={referenceWeightGrams && referenceWeightGrams > 0 ? undefined : "Obrigatório p/ peso"}
            onChange={(referenceWeightGrams) => set({ referenceWeightGrams })}
          />
        )}
        <TextInput
          label="Código externo"
          value={value.externalCode}
          onChange={(event) => set({ externalCode: event.currentTarget.value })}
        />
      </SimpleGrid>
      <Group justify="end">
        <Button disabled={!check.ok || saving} loading={saving} onClick={() => onSave(value)}>
          Salvar produto
        </Button>
      </Group>
    </Stack>
  );
}
