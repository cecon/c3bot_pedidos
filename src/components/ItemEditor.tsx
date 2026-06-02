import { useState } from "react";
import { Badge, Button, Group, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import type { AvailabilityState } from "../domain/types";
import { validateCatalogItem } from "../domain/catalog/validation";

// Presentational catalog-item editor (no IO). Price is entered in reais and stored as cents;
// an optional promotional reference price must be >= the current price (FR-006).
export interface ItemEditorValue {
  priceReais: number | string;
  originalPriceReais: number | string;
  status: AvailabilityState;
  externalCode: string;
}

interface ItemEditorProps {
  initial: ItemEditorValue;
  onSave: (value: ItemEditorValue) => void;
  saving?: boolean;
}

function toCents(value: number | string): number {
  return typeof value === "number" ? Math.round(value * 100) : Number.NaN;
}

export function ItemEditor({ initial, onSave, saving = false }: ItemEditorProps) {
  const [value, setValue] = useState<ItemEditorValue>(initial);
  const set = (patch: Partial<ItemEditorValue>) => setValue((current) => ({ ...current, ...patch }));

  const priceCents = toCents(value.priceReais);
  const originalPriceCents = value.originalPriceReais === "" ? null : toCents(value.originalPriceReais);
  const check = validateCatalogItem({ priceCents, originalPriceCents });
  const unmapped = value.externalCode.trim() === "";

  return (
    <Stack gap="sm">
      <Group grow>
        <NumberInput
          label="Preço (R$)"
          required
          min={0}
          decimalScale={2}
          fixedDecimalScale
          value={value.priceReais}
          error={check.ok ? undefined : "Preço inválido"}
          onChange={(priceReais) => set({ priceReais })}
        />
        <NumberInput
          label="Preço de referência (R$)"
          min={0}
          decimalScale={2}
          fixedDecimalScale
          value={value.originalPriceReais}
          onChange={(originalPriceReais) => set({ originalPriceReais })}
        />
      </Group>
      <Group grow align="end">
        <Select
          label="Status"
          data={[
            { value: "available", label: "Disponível" },
            { value: "unavailable", label: "Indisponível" },
            { value: "paused", label: "Pausado" },
          ]}
          value={value.status}
          onChange={(status) => set({ status: (status as AvailabilityState) ?? "available" })}
        />
        <TextInput
          label="Código externo"
          value={value.externalCode}
          onChange={(event) => set({ externalCode: event.currentTarget.value })}
        />
      </Group>
      <Group justify="space-between">
        {unmapped ? (
          <Badge color="orange" variant="light">
            não mapeado
          </Badge>
        ) : (
          <span />
        )}
        <Button disabled={!check.ok || saving} loading={saving} onClick={() => onSave(value)}>
          Salvar item
        </Button>
      </Group>
    </Stack>
  );
}
