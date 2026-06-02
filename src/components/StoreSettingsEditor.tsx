import { useState } from "react";
import { Button, Group, NumberInput, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { validateCnpj } from "../domain/catalog/validation";

// Presentational store-profile editor (no IO). CNPJ is validated inline via the domain rule
// (legacy + alphanumeric). Saving is delegated to the onSave callback. See FR-027/028.
export interface StoreSettingsValue {
  name: string;
  cnpj: string;
  street: string;
  city: string;
  state: string;
  latitude: number | string;
  longitude: number | string;
  externalCode: string;
}

interface StoreSettingsEditorProps {
  initial: StoreSettingsValue;
  onSave: (value: StoreSettingsValue) => void;
  saving?: boolean;
}

export function StoreSettingsEditor({ initial, onSave, saving = false }: StoreSettingsEditorProps) {
  const [value, setValue] = useState<StoreSettingsValue>(initial);
  const set = (patch: Partial<StoreSettingsValue>) => setValue((current) => ({ ...current, ...patch }));

  const cnpjResult = value.cnpj.trim() === "" ? null : validateCnpj(value.cnpj);
  const cnpjError = cnpjResult && !cnpjResult.ok ? cnpjResult.reason : null;
  const nameMissing = value.name.trim() === "";
  const canSave = !nameMissing && !cnpjError && !saving;

  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <TextInput
          label="Nome da loja"
          required
          value={value.name}
          error={nameMissing ? "Obrigatório" : undefined}
          onChange={(event) => set({ name: event.currentTarget.value })}
        />
        <TextInput
          label="CNPJ"
          placeholder="00.000.000/0000-00 ou alfanumérico"
          value={value.cnpj}
          error={cnpjError ?? undefined}
          onChange={(event) => set({ cnpj: event.currentTarget.value })}
        />
        <TextInput label="Rua" value={value.street} onChange={(event) => set({ street: event.currentTarget.value })} />
        <TextInput label="Cidade" value={value.city} onChange={(event) => set({ city: event.currentTarget.value })} />
        <TextInput label="UF" value={value.state} onChange={(event) => set({ state: event.currentTarget.value })} />
        <TextInput
          label="Código externo"
          value={value.externalCode}
          onChange={(event) => set({ externalCode: event.currentTarget.value })}
        />
        <NumberInput label="Latitude" value={value.latitude} decimalScale={6} onChange={(latitude) => set({ latitude })} />
        <NumberInput label="Longitude" value={value.longitude} decimalScale={6} onChange={(longitude) => set({ longitude })} />
      </SimpleGrid>
      <Group justify="end">
        <Button disabled={!canSave} loading={saving} onClick={() => onSave(value)}>
          Salvar loja
        </Button>
      </Group>
    </Stack>
  );
}
