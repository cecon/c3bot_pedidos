import { useState } from "react";
import { Badge, Button, Divider, Group, NumberInput, Paper, Select, Stack, Switch, Text, TextInput, Textarea } from "@mantine/core";
import type { Merchant } from "../domain/merchant/mapping";
import type { MerchantInterruption, MerchantOperation, MerchantStatus, MerchantStatusValue } from "../domain/types";
import { validateMerchant } from "../domain/merchant/validation";
import { STATUS_COLORS, UNMAPPED_COLOR, type StatusState } from "../theme";
import { ShiftEditor, type ShiftRow } from "./ShiftEditor";
import { InterruptionsEditor, type InterruptionDraft } from "./InterruptionsEditor";

// Presentational merchant panel (no IO). Profile + operations + availability status, plus the
// opening-hours and interruptions editors. Data via props, actions via callbacks. All colors come
// from the theme's semantic tokens (STATUS_COLORS / UNMAPPED_COLOR).

export interface MerchantProfileInput {
  name: string;
  corporateName: string;
  description: string;
  type: string;
  status: MerchantStatusValue;
  externalCode: string;
  cnpj: string;
  averageTicketReais: number | string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  operations: MerchantOperation[];
}

interface MerchantPanelProps {
  merchant: Merchant;
  statuses: MerchantStatus[];
  shifts: ShiftRow[];
  interruptions: MerchantInterruption[];
  onSaveProfile: (input: MerchantProfileInput) => void;
  onSaveHours: (shifts: ShiftRow[]) => void;
  onCreateInterruption: (draft: InterruptionDraft) => void;
  onDeleteInterruption: (id: string) => void;
}

function toForm(merchant: Merchant): MerchantProfileInput {
  return {
    name: merchant.name ?? "",
    corporateName: merchant.corporateName ?? "",
    description: merchant.description ?? "",
    type: merchant.type ?? "RESTAURANT",
    status: merchant.status,
    externalCode: merchant.externalCode ?? "",
    cnpj: merchant.cnpj ?? "",
    averageTicketReais: merchant.averageTicket != null ? merchant.averageTicket / 100 : "",
    street: merchant.address.street ?? "",
    number: merchant.address.number ?? "",
    district: merchant.address.district ?? "",
    city: merchant.address.city ?? "",
    state: merchant.address.state ?? "",
    postalCode: merchant.address.postalCode ?? "",
    country: merchant.address.country ?? "BR",
    operations: merchant.operations,
  };
}

function StatusBadges({ statuses }: { statuses: MerchantStatus[] }) {
  if (statuses.length === 0) return <Text c="dimmed" size="sm">Sem operações configuradas.</Text>;
  return (
    <Group gap="xs">
      {statuses.map((status) => (
        <Badge
          key={`${status.operation}-${status.salesChannel}`}
          color={STATUS_COLORS[status.state as StatusState]}
          variant="filled"
        >
          {status.operation} · {status.salesChannel}: {status.available ? "aberto" : "fechado"} ({status.state})
        </Badge>
      ))}
    </Group>
  );
}

export function MerchantPanel(props: MerchantPanelProps) {
  const { merchant, statuses, shifts, interruptions } = props;
  const [form, setForm] = useState<MerchantProfileInput>(() => toForm(merchant));
  const set = <K extends keyof MerchantProfileInput>(key: K, value: MerchantProfileInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const ticketCents = typeof form.averageTicketReais === "number" ? Math.round(form.averageTicketReais * 100) : null;
  const canSave = validateMerchant({ name: form.name, status: form.status, type: form.type, averageTicketCents: ticketCents }).ok;

  const toggleOperation = (index: number, enabled: boolean) =>
    setForm((current) => ({
      ...current,
      operations: current.operations.map((op, i) => (i === index ? { ...op, enabled } : op)),
    }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={800}>Merchant</Text>
        {!merchant.mappedToDestination && (
          <Badge color={UNMAPPED_COLOR}>não mapeado ao destino</Badge>
        )}
      </Group>

      <StatusBadges statuses={statuses} />
      <Divider />

      <Group gap="xs" align="end" wrap="wrap">
        <TextInput label="Nome público" value={form.name} onChange={(e) => set("name", e.currentTarget.value)} />
        <TextInput label="Razão social" value={form.corporateName} onChange={(e) => set("corporateName", e.currentTarget.value)} />
        <Select
          label="Status"
          w={150}
          data={[{ value: "AVAILABLE", label: "Disponível" }, { value: "UNAVAILABLE", label: "Indisponível" }]}
          value={form.status}
          onChange={(value) => set("status", (value as MerchantStatusValue) ?? "AVAILABLE")}
        />
        <Select
          label="Tipo"
          w={150}
          data={[{ value: "RESTAURANT", label: "Restaurante" }]}
          value={form.type}
          onChange={(value) => set("type", value ?? "RESTAURANT")}
        />
        <NumberInput
          label="Ticket médio (R$)"
          w={150}
          min={0}
          decimalScale={2}
          fixedDecimalScale
          value={form.averageTicketReais}
          onChange={(value) => set("averageTicketReais", value)}
        />
      </Group>
      <Textarea label="Descrição" value={form.description} onChange={(e) => set("description", e.currentTarget.value)} />

      <Group gap="xs" align="end" wrap="wrap">
        <TextInput label="CNPJ" value={form.cnpj} onChange={(e) => set("cnpj", e.currentTarget.value)} />
        <TextInput label="Código externo" value={form.externalCode} onChange={(e) => set("externalCode", e.currentTarget.value)} />
      </Group>

      <Text fw={700} size="sm">Endereço</Text>
      <Group gap="xs" align="end" wrap="wrap">
        <TextInput label="Rua" value={form.street} onChange={(e) => set("street", e.currentTarget.value)} />
        <TextInput label="Número" w={90} value={form.number} onChange={(e) => set("number", e.currentTarget.value)} />
        <TextInput label="Bairro" value={form.district} onChange={(e) => set("district", e.currentTarget.value)} />
        <TextInput label="Cidade" value={form.city} onChange={(e) => set("city", e.currentTarget.value)} />
        <TextInput label="UF" w={70} value={form.state} onChange={(e) => set("state", e.currentTarget.value)} />
        <TextInput label="CEP" w={120} value={form.postalCode} onChange={(e) => set("postalCode", e.currentTarget.value)} />
        <TextInput label="País" w={80} value={form.country} onChange={(e) => set("country", e.currentTarget.value)} />
      </Group>

      <Stack gap="xs">
        <Text fw={700} size="sm">Operações</Text>
        {form.operations.length === 0 && <Text c="dimmed" size="sm">Nenhuma operação.</Text>}
        {form.operations.map((op, index) => (
          <Switch
            key={`${op.name}-${op.salesChannel}`}
            label={`${op.name} · ${op.salesChannel}`}
            checked={op.enabled}
            onChange={(e) => toggleOperation(index, e.currentTarget.checked)}
          />
        ))}
      </Stack>

      <Group>
        <Button disabled={!canSave} onClick={() => props.onSaveProfile(form)}>
          Salvar perfil
        </Button>
      </Group>

      <Divider />
      <Paper p="sm">
        <ShiftEditor shifts={shifts} onSave={props.onSaveHours} />
      </Paper>
      <Paper p="sm">
        <InterruptionsEditor
          interruptions={interruptions}
          onCreate={props.onCreateInterruption}
          onDelete={props.onDeleteInterruption}
        />
      </Paper>
    </Stack>
  );
}
