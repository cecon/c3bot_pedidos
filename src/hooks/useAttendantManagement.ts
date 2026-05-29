import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { showNotification } from "@mantine/notifications";
import {
  buildNewAttendant,
  canDeleteAttendant,
  countActiveAssignedSessions,
  getEligibleTransferTargets,
  setAttendantAvailability,
  updateAttendantRecord,
  validateAttendantDraft,
} from "../domain/attendants";
import {
  getErroredAttendantPersistenceState,
  getLoadedAttendantPersistenceState,
  getLoadingAttendantPersistenceState,
  getUnavailableAttendantPersistenceState,
  initialAttendantPersistenceState,
} from "../domain/attendantPersistence";
import type {
  Attendant,
  AttendantFormValues,
  AttendantMutationResult,
  AttendantPersistenceState,
  AvailabilityStatus,
  WhatsAppSession,
} from "../domain/types";
import type { AttendantManagementRepository } from "../services/attendantRepositoryContract";
import {
  getDefaultAttendantRepository,
  isDefaultAttendantRepositoryAvailable,
} from "../services/attendantRepositoryRuntime";

interface UseAttendantManagementOptions {
  repository?: AttendantManagementRepository;
  runtimeAvailable?: boolean;
  sessionRows: WhatsAppSession[];
  setSessionRows: Dispatch<SetStateAction<WhatsAppSession[]>>;
}

export function useAttendantManagement({
  repository = getDefaultAttendantRepository(),
  runtimeAvailable = isDefaultAttendantRepositoryAvailable(),
  sessionRows,
  setSessionRows,
}: UseAttendantManagementOptions) {
  const [attendantRows, setAttendantRows] = useState<Attendant[]>([]);
  const [persistenceState, setPersistenceState] = useState<AttendantPersistenceState>(initialAttendantPersistenceState);
  const transferEligibility = useMemo(() => getEligibleTransferTargets(attendantRows), [attendantRows]);
  const activeSessionCountByAttendant = useMemo(
    () =>
      attendantRows.reduce<Record<string, number>>((counts, attendant) => {
        counts[attendant.id] = countActiveAssignedSessions(attendant.id, sessionRows);
        return counts;
      }, {}),
    [attendantRows, sessionRows],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAttendants() {
      if (!runtimeAvailable || !repository) {
        if (isMounted) setPersistenceState(getUnavailableAttendantPersistenceState());
        return;
      }

      if (isMounted) setPersistenceState(getLoadingAttendantPersistenceState());

      try {
        const rows = await repository.listAttendants();
        if (!isMounted) return;
        setAttendantRows(rows);
        setPersistenceState(getLoadedAttendantPersistenceState(rows.length));
      } catch (error) {
        if (!isMounted) return;
        setAttendantRows([]);
        setPersistenceState(getErroredAttendantPersistenceState(error));
      }
    }

    void loadAttendants();
    return () => {
      isMounted = false;
    };
  }, [repository, runtimeAvailable]);

  async function createAttendant(values: AttendantFormValues): Promise<AttendantMutationResult> {
    if (!runtimeAvailable || !repository) return { ok: false, message: "API de atendentes indisponivel." };

    const validation = validateAttendantDraft(values, attendantRows);
    if (!validation.ok) return validation;

    const nextAttendant = buildNewAttendant(values, attendantRows);
    try {
      await repository.createAttendant(nextAttendant);
    } catch {
      return { ok: false, message: "Falha ao gravar atendente local." };
    }

    setAttendantRows((rows) => [nextAttendant, ...rows]);
    setPersistenceState({ status: "ready" });
    showNotification({
      title: "Atendente cadastrado",
      message: `${nextAttendant.displayName} comeca offline.`,
      color: "green",
    });
    return { ok: true };
  }

  async function updateExistingAttendant(
    attendantId: string,
    values: AttendantFormValues,
  ): Promise<AttendantMutationResult> {
    if (!runtimeAvailable || !repository) return { ok: false, message: "API de atendentes indisponivel." };

    const current = attendantRows.find((attendant) => attendant.id === attendantId);
    if (!current) return { ok: false, message: "Atendente nao encontrado." };

    const result = updateAttendantRecord(current, values, attendantRows);
    if (!result.ok || !result.attendant) return result;

    try {
      await repository.updateAttendant(attendantId, values, result.attendant.updatedAt);
    } catch {
      return { ok: false, message: "Falha ao atualizar atendente local." };
    }

    setAttendantRows((rows) => rows.map((attendant) => (attendant.id === attendantId ? result.attendant! : attendant)));
    showNotification({ title: "Atendente atualizado", message: result.attendant.displayName, color: "green" });
    return { ok: true };
  }

  async function setAvailability(attendantId: string, availabilityStatus: AvailabilityStatus) {
    if (!runtimeAvailable || !repository) return;

    const updatedAt = new Date().toISOString();
    const current = attendantRows.find((attendant) => attendant.id === attendantId);
    if (!current) return;

    const nextAttendant = setAttendantAvailability(current, availabilityStatus, updatedAt);
    try {
      await repository.updateAttendantAvailability(attendantId, availabilityStatus, updatedAt);
    } catch {
      showNotification({ title: "Falha ao atualizar status local", message: "Tente novamente no Tauri.", color: "red" });
      return;
    }

    setAttendantRows((rows) => rows.map((attendant) => (attendant.id === attendantId ? nextAttendant : attendant)));
    showNotification({
      title: availabilityStatus === "online" ? "Atendente online" : "Atendente offline",
      message: nextAttendant.displayName,
      color: availabilityStatus === "online" ? "green" : "gray",
    });
  }

  async function deleteAttendant(attendantId: string): Promise<AttendantMutationResult> {
    if (!runtimeAvailable || !repository) return { ok: false, message: "API de atendentes indisponivel." };

    const deletion = canDeleteAttendant(attendantId, sessionRows);
    if (!deletion.ok) return deletion;

    const updatedAt = new Date().toISOString();
    const current = attendantRows.find((attendant) => attendant.id === attendantId);
    try {
      await repository.softDeleteAttendant(attendantId, updatedAt);
    } catch {
      return { ok: false, message: "Falha ao remover atendente local." };
    }

    const nextRows = attendantRows.map((attendant) =>
      attendant.id === attendantId
        ? { ...attendant, active: false, availabilityStatus: "offline" as const, updatedAt }
        : attendant,
    );
    setAttendantRows(nextRows);
    setPersistenceState(getLoadedAttendantPersistenceState(nextRows.filter((attendant) => attendant.active).length));
    showNotification({ title: "Atendente removido", message: current?.displayName ?? "Lista atualizada", color: "blue" });
    return { ok: true };
  }

  function transferSession(sessionId: string, attendantId: string) {
    const target = transferEligibility.targets.find((item) => item.attendantId === attendantId);

    if (!target) {
      showNotification({
        title: "Transferencia indisponivel",
        message: transferEligibility.blockedReason ?? "Selecione um atendente online.",
        color: "yellow",
      });
      return;
    }

    setSessionRows((rows) =>
      rows.map((session) => (session.id === sessionId ? { ...session, assignedAttendantId: attendantId } : session)),
    );
    showNotification({ title: "Sessao transferida", message: target.displayName, color: "green" });
  }

  return {
    activeSessionCountByAttendant,
    attendantRows,
    createAttendant,
    deleteAttendant,
    persistenceState,
    setAvailability,
    transferEligibility,
    transferSession,
    updateExistingAttendant,
  };
}
