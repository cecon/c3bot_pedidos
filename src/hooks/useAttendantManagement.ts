import { Dispatch, SetStateAction, useMemo, useState } from "react";
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
import type {
  Attendant,
  AttendantFormValues,
  AttendantMutationResult,
  AvailabilityStatus,
  WhatsAppSession,
} from "../domain/types";
import { isTauriRuntime } from "../services/database";
import {
  createAttendant as persistAttendant,
  softDeleteAttendant,
  updateAttendant,
  updateAttendantAvailability,
} from "../services/attendantRepository";

interface UseAttendantManagementOptions {
  initialAttendants: Attendant[];
  sessionRows: WhatsAppSession[];
  setSessionRows: Dispatch<SetStateAction<WhatsAppSession[]>>;
}

export function useAttendantManagement({
  initialAttendants,
  sessionRows,
  setSessionRows,
}: UseAttendantManagementOptions) {
  const [attendantRows, setAttendantRows] = useState<Attendant[]>(initialAttendants);
  const transferEligibility = useMemo(() => getEligibleTransferTargets(attendantRows), [attendantRows]);
  const activeSessionCountByAttendant = useMemo(
    () =>
      attendantRows.reduce<Record<string, number>>((counts, attendant) => {
        counts[attendant.id] = countActiveAssignedSessions(attendant.id, sessionRows);
        return counts;
      }, {}),
    [attendantRows, sessionRows],
  );

  function createAttendant(values: AttendantFormValues): AttendantMutationResult {
    const validation = validateAttendantDraft(values, attendantRows);
    if (!validation.ok) return validation;

    const nextAttendant = buildNewAttendant(values, attendantRows);
    setAttendantRows((rows) => [nextAttendant, ...rows]);
    persistAttendantIfAvailable(nextAttendant);
    showNotification({
      title: "Atendente cadastrado",
      message: `${nextAttendant.displayName} comeca offline.`,
      color: "green",
    });
    return { ok: true };
  }

  function updateExistingAttendant(attendantId: string, values: AttendantFormValues): AttendantMutationResult {
    const current = attendantRows.find((attendant) => attendant.id === attendantId);
    if (!current) return { ok: false, message: "Atendente nao encontrado." };

    const result = updateAttendantRecord(current, values, attendantRows);
    if (!result.ok || !result.attendant) return result;

    setAttendantRows((rows) => rows.map((attendant) => (attendant.id === attendantId ? result.attendant! : attendant)));
    persistAttendantUpdateIfAvailable(result.attendant);
    showNotification({ title: "Atendente atualizado", message: result.attendant.displayName, color: "green" });
    return { ok: true };
  }

  function setAvailability(attendantId: string, availabilityStatus: AvailabilityStatus) {
    const updatedAt = new Date().toISOString();
    const current = attendantRows.find((attendant) => attendant.id === attendantId);
    if (!current) return;

    const nextAttendant = setAttendantAvailability(current, availabilityStatus, updatedAt);
    setAttendantRows((rows) => rows.map((attendant) => (attendant.id === attendantId ? nextAttendant : attendant)));
    persistAttendantAvailabilityIfAvailable(attendantId, availabilityStatus, updatedAt);
    showNotification({
      title: availabilityStatus === "online" ? "Atendente online" : "Atendente offline",
      message: nextAttendant.displayName,
      color: availabilityStatus === "online" ? "green" : "gray",
    });
  }

  function deleteAttendant(attendantId: string): AttendantMutationResult {
    const deletion = canDeleteAttendant(attendantId, sessionRows);
    if (!deletion.ok) return deletion;

    const updatedAt = new Date().toISOString();
    const current = attendantRows.find((attendant) => attendant.id === attendantId);
    setAttendantRows((rows) =>
      rows.map((attendant) =>
        attendant.id === attendantId
          ? { ...attendant, active: false, availabilityStatus: "offline", updatedAt }
          : attendant,
      ),
    );
    persistAttendantDeleteIfAvailable(attendantId, updatedAt);
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
    setAvailability,
    transferEligibility,
    transferSession,
    updateExistingAttendant,
  };
}

function persistAttendantIfAvailable(attendant: Attendant) {
  if (!isTauriRuntime()) return;
  void persistAttendant(attendant).catch(() => {
    showNotification({ title: "Falha ao gravar atendente local", message: "Tente novamente no Tauri.", color: "red" });
  });
}

function persistAttendantUpdateIfAvailable(attendant: Attendant) {
  if (!isTauriRuntime()) return;
  void updateAttendant(
    attendant.id,
    {
      name: attendant.name,
      displayName: attendant.displayName,
      whatsappNumber: attendant.whatsappNumber,
      photoBase64: attendant.photoBase64,
    },
    attendant.updatedAt,
  ).catch(() => {
    showNotification({ title: "Falha ao atualizar atendente local", message: "Tente novamente no Tauri.", color: "red" });
  });
}

function persistAttendantAvailabilityIfAvailable(
  attendantId: string,
  availabilityStatus: AvailabilityStatus,
  updatedAt: string,
) {
  if (!isTauriRuntime()) return;
  void updateAttendantAvailability(attendantId, availabilityStatus, updatedAt).catch(() => {
    showNotification({ title: "Falha ao atualizar status local", message: "Tente novamente no Tauri.", color: "red" });
  });
}

function persistAttendantDeleteIfAvailable(attendantId: string, updatedAt: string) {
  if (!isTauriRuntime()) return;
  void softDeleteAttendant(attendantId, updatedAt).catch(() => {
    showNotification({ title: "Falha ao remover atendente local", message: "Tente novamente no Tauri.", color: "red" });
  });
}
