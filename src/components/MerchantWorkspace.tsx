import { useEffect, useMemo, useReducer, useState } from "react";
import { Alert, Loader, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import type { MerchantInterruption, MerchantStatus } from "../domain/types";
import { initialMerchantState, merchantReducer } from "../domain/merchant/persistence";
import {
  createInterruption,
  deleteInterruption,
  getConfiguredMerchantApiBaseUrl,
  getMerchantStatus,
  getOpeningHours,
  listInterruptions,
  listMerchants,
  replaceOpeningHours,
  updateMerchant,
} from "../services/merchantApi";
import { MerchantPanel, type MerchantProfileInput } from "./MerchantPanel";
import type { ShiftRow } from "./ShiftEditor";
import type { InterruptionDraft } from "./InterruptionsEditor";

// Container: resolves the API base URL, loads the merchant + status + hours + interruptions, and
// wires save/create/delete actions to the typed client. Presentational concerns live in the panel.

function toPayload(input: MerchantProfileInput) {
  const ticket = typeof input.averageTicketReais === "number" ? Math.round(input.averageTicketReais * 100) : null;
  return {
    name: input.name.trim(),
    corporateName: input.corporateName || null,
    description: input.description || null,
    type: input.type,
    status: input.status,
    externalCode: input.externalCode || null,
    cnpj: input.cnpj || null,
    averageTicket: ticket,
    address: {
      street: input.street || null,
      number: input.number || null,
      district: input.district || null,
      city: input.city || null,
      state: input.state || null,
      postalCode: input.postalCode || null,
      country: input.country || "BR",
    },
    operations: input.operations.map((op) => ({ name: op.name, salesChannel: op.salesChannel, enabled: op.enabled })),
  };
}

export function MerchantWorkspace() {
  const baseUrl = useMemo(() => getConfiguredMerchantApiBaseUrl(), []);
  const [state, dispatch] = useReducer(merchantReducer, initialMerchantState);
  const [statuses, setStatuses] = useState<MerchantStatus[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [interruptions, setInterruptions] = useState<MerchantInterruption[]>([]);

  const reload = (url: string) => {
    dispatch({ type: "load" });
    listMerchants(url)
      .then(async (merchants) => {
        const merchant = merchants[0] ?? null;
        dispatch({ type: "loaded", merchant });
        if (!merchant) return;
        const [status, hours, interruptionList] = await Promise.all([
          getMerchantStatus(url, merchant.id),
          getOpeningHours(url, merchant.id),
          listInterruptions(url, merchant.id),
        ]);
        setStatuses(status);
        setShifts(hours.shifts.map((s) => ({ dayOfWeek: s.dayOfWeek, start: s.start, duration: s.duration, enabled: s.enabled ?? true })));
        setInterruptions(interruptionList);
      })
      .catch((error: unknown) => dispatch({ type: "failed", message: error instanceof Error ? error.message : "Falha ao carregar." }));
  };

  useEffect(() => {
    if (baseUrl) reload(baseUrl);
  }, [baseUrl]);

  if (!baseUrl) {
    return <Alert color="warning" title="API não configurada">Defina VITE_C3BOT_API_BASE_URL para gerenciar o merchant.</Alert>;
  }
  if (state.status === "loading" || state.status === "empty") {
    return (
      <Stack align="center" p="lg">
        <Loader />
      </Stack>
    );
  }
  if (state.status === "error") {
    return <Alert color="danger" title="Erro">{state.message}</Alert>;
  }

  const merchant = state.merchant;
  const run = (action: Promise<unknown>, success: string) =>
    action
      .then(() => {
        showNotification({ color: "green", message: success });
        reload(baseUrl);
      })
      .catch((error: unknown) =>
        showNotification({ color: "red", message: error instanceof Error ? error.message : "Falha na operação." }),
      );

  return (
    <MerchantPanel
      merchant={merchant}
      statuses={statuses}
      shifts={shifts}
      interruptions={interruptions}
      onSaveProfile={(input) => run(updateMerchant(baseUrl, merchant.id, toPayload(input)), "Perfil salvo.")}
      onSaveHours={(rows) => run(replaceOpeningHours(baseUrl, merchant.id, rows), "Horários salvos.")}
      onCreateInterruption={(draft: InterruptionDraft) => run(createInterruption(baseUrl, merchant.id, draft), "Interrupção criada.")}
      onDeleteInterruption={(id) => run(deleteInterruption(baseUrl, merchant.id, id), "Interrupção removida.")}
    />
  );
}
