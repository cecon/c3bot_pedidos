import { useState } from "react";
import { Badge, Button, Group, NumberInput, Paper, Stack, Text, TextInput } from "@mantine/core";
import { Plus } from "lucide-react";
import { formatCurrency } from "../domain/analytics";
import { validateOptionGroup } from "../domain/catalog/validation";

// Presentational option-group (complemento) editor (no IO). Selection counts are governed by
// min/max; "required" is derived (min >= 1) and shown as a mandatory badge. FR-013/014/016.
export interface OptionView {
  id: string;
  name: string;
  priceCents: number;
  externalCode: string | null;
}

export interface OptionGroupSettings {
  name: string;
  minQuantity: number;
  maxQuantity: number;
}

interface OptionGroupEditorProps {
  group: OptionGroupSettings;
  options: OptionView[];
  onSaveGroup: (settings: OptionGroupSettings) => void;
  onAddOption: (payload: { name: string; priceReais: number | string }) => void;
}

export function OptionGroupEditor({ group, options, onSaveGroup, onAddOption }: OptionGroupEditorProps) {
  const [name, setName] = useState(group.name);
  const [minQuantity, setMinQuantity] = useState<number | string>(group.minQuantity);
  const [maxQuantity, setMaxQuantity] = useState<number | string>(group.maxQuantity);
  const [optionName, setOptionName] = useState("");
  const [optionPrice, setOptionPrice] = useState<number | string>("");

  const min = typeof minQuantity === "number" ? minQuantity : 0;
  const max = typeof maxQuantity === "number" ? maxQuantity : 0;
  const required = min >= 1;
  const groupCheck = validateOptionGroup({ minQuantity: min, maxQuantity: max, required });
  const canSaveGroup = name.trim() !== "" && groupCheck.ok;
  const canAddOption = optionName.trim() !== "" && typeof optionPrice === "number" && optionPrice >= 0;

  return (
    <Stack gap="xs">
      <Group gap="xs" align="end" wrap="wrap">
        <TextInput label="Complemento" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <NumberInput label="Mín." w={80} min={0} value={minQuantity} onChange={setMinQuantity} />
        <NumberInput label="Máx." w={80} min={1} value={maxQuantity} onChange={setMaxQuantity} error={groupCheck.ok ? undefined : "≥ mín"} />
        {required && (
          <Badge color="red" variant="light" mb={6}>
            Obrigatório
          </Badge>
        )}
        <Button disabled={!canSaveGroup} onClick={() => onSaveGroup({ name: name.trim(), minQuantity: min, maxQuantity: max })}>
          Salvar grupo
        </Button>
      </Group>

      {options.map((option) => (
        <Paper key={option.id} withBorder p="xs" radius="sm">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Text size="sm">{option.name}</Text>
              {(!option.externalCode || option.externalCode.trim() === "") && (
                <Badge size="xs" color="orange" variant="light">
                  não mapeado
                </Badge>
              )}
            </Group>
            <Badge color="green">{formatCurrency(option.priceCents)}</Badge>
          </Group>
        </Paper>
      ))}

      <Group gap="xs" align="end">
        <TextInput label="Nova opção" value={optionName} onChange={(event) => setOptionName(event.currentTarget.value)} />
        <NumberInput label="Preço (R$)" w={120} min={0} decimalScale={2} fixedDecimalScale value={optionPrice} onChange={setOptionPrice} />
        <Button
          leftSection={<Plus size={14} />}
          disabled={!canAddOption}
          onClick={() => {
            onAddOption({ name: optionName.trim(), priceReais: optionPrice });
            setOptionName("");
            setOptionPrice("");
          }}
        >
          Adicionar opção
        </Button>
      </Group>
    </Stack>
  );
}
