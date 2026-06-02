import { useState } from "react";
import { Badge, Button, Group, NumberInput, Paper, Select, Stack, Text, TextInput } from "@mantine/core";
import { Plus } from "lucide-react";
import type { UnitOfMeasure } from "../domain/types";
import { formatCurrency } from "../domain/analytics";
import { validateCatalogItem, validateProduct } from "../domain/catalog/validation";

// Presentational items-of-category panel (no IO). Lists the category's items and creates a
// product + places it as an item in one action (container performs the two calls).
export interface CategoryItemView {
  id: string;
  productName: string;
  priceCents: number;
  status: "available" | "unavailable" | "paused";
  externalCode: string | null;
}

export interface AddItemPayload {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  referenceWeightGrams: number | null;
  externalCode: string;
  priceReais: number | string;
}

interface CategoryItemsPanelProps {
  categoryName: string;
  items: CategoryItemView[];
  onAdd: (payload: AddItemPayload) => void;
}

export function CategoryItemsPanel({ categoryName, items, onAdd }: CategoryItemsPanelProps) {
  const [name, setName] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>("unit");
  const [referenceWeightGrams, setReferenceWeightGrams] = useState<number | string>("");
  const [externalCode, setExternalCode] = useState("");
  const [priceReais, setPriceReais] = useState<number | string>("");

  const refGrams = typeof referenceWeightGrams === "number" ? referenceWeightGrams : null;
  const priceCents = typeof priceReais === "number" ? Math.round(priceReais * 100) : Number.NaN;
  const productOk = validateProduct({ name, unitOfMeasure, referenceWeightGrams: refGrams }).ok;
  const priceOk = validateCatalogItem({ priceCents }).ok;
  const canAdd = productOk && priceOk;

  const submit = () => {
    onAdd({ name: name.trim(), unitOfMeasure, referenceWeightGrams: refGrams, externalCode, priceReais });
    setName("");
    setReferenceWeightGrams("");
    setExternalCode("");
    setPriceReais("");
  };

  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Itens de {categoryName}
      </Text>
      {items.length === 0 && (
        <Text c="dimmed" size="sm">
          Nenhum item nesta categoria.
        </Text>
      )}
      {items.map((item) => (
        <Paper key={item.id} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Text size="sm">{item.productName}</Text>
              {(!item.externalCode || item.externalCode.trim() === "") && (
                <Badge size="xs" color="orange" variant="light">
                  não mapeado
                </Badge>
              )}
            </Group>
            <Badge color="green">{formatCurrency(item.priceCents)}</Badge>
          </Group>
        </Paper>
      ))}

      <Group gap="xs" align="end" wrap="wrap">
        <TextInput label="Produto" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <Select
          label="Medida"
          w={120}
          data={[
            { value: "unit", label: "Unidade" },
            { value: "weight", label: "Peso (kg)" },
          ]}
          value={unitOfMeasure}
          onChange={(value) => setUnitOfMeasure((value as UnitOfMeasure) ?? "unit")}
        />
        {unitOfMeasure === "weight" && (
          <NumberInput
            label="Peso ref. (g)"
            w={110}
            min={1}
            value={referenceWeightGrams}
            onChange={setReferenceWeightGrams}
          />
        )}
        <NumberInput
          label="Preço (R$)"
          w={120}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          value={priceReais}
          onChange={setPriceReais}
        />
        <TextInput
          label="Código externo"
          value={externalCode}
          onChange={(event) => setExternalCode(event.currentTarget.value)}
        />
        <Button leftSection={<Plus size={14} />} disabled={!canAdd} onClick={submit}>
          Adicionar item
        </Button>
      </Group>
    </Stack>
  );
}
