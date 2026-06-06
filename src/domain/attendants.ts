import { normalizeWhatsAppNumber } from "./phone";
import type {
  Attendant,
  AttendantFormValues,
  AttendantMutationResult,
  AvailabilityStatus,
  SessionTransferTarget,
  TransferEligibilityResult,
  WhatsAppSession,
} from "./types";

export const NO_ELIGIBLE_ATTENDANTS_MESSAGE = "Nenhum atendente online disponivel para transferencia.";
export const MAX_ATTENDANT_PHOTO_BYTES = 512 * 1024;

const allowedPhotoTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

export function normalizeAttendantWhatsAppNumber(input: string): string {
  return normalizeWhatsAppNumber(input);
}

export function isUsableWhatsAppNumber(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 || (digits.length === 13 && digits.startsWith("55"));
}

export function validateAttendantDraft(
  draft: AttendantFormValues,
  attendants: readonly Attendant[],
  currentAttendantId?: string,
): AttendantMutationResult {
  const fieldErrors: AttendantMutationResult["fieldErrors"] = {};
  const name = draft.name.trim();
  const displayName = draft.displayName.trim();
  const whatsappNumber = normalizeAttendantWhatsAppNumber(draft.whatsappNumber);

  if (!name) {
    fieldErrors.name = "Informe o nome do funcionario.";
  }

  if (!displayName) {
    fieldErrors.displayName = "Informe o nome para exibicao.";
  }

  if (!draft.whatsappNumber.trim()) {
    fieldErrors.whatsappNumber = "Informe o WhatsApp.";
  } else if (!isUsableWhatsAppNumber(draft.whatsappNumber)) {
    fieldErrors.whatsappNumber = "Informe um WhatsApp valido com DDD.";
  } else {
    const duplicate = attendants.some(
      (attendant) =>
        attendant.active &&
        attendant.id !== currentAttendantId &&
        normalizeAttendantWhatsAppNumber(attendant.whatsappNumber) === whatsappNumber,
    );

    if (duplicate) {
      fieldErrors.whatsappNumber = "Este WhatsApp ja esta em uso por outro atendente.";
    }
  }

  return {
    fieldErrors,
    ok: Object.keys(fieldErrors).length === 0,
  };
}

export function buildNewAttendant(
  draft: AttendantFormValues,
  attendants: readonly Attendant[],
  now = new Date().toISOString(),
): Attendant {
  const validation = validateAttendantDraft(draft, attendants);

  if (!validation.ok) {
    throw new Error("Cannot create attendant from invalid draft.");
  }

  return {
    id: `att-${Date.now()}`,
    name: draft.name.trim(),
    displayName: draft.displayName.trim(),
    whatsappNumber: normalizeAttendantWhatsAppNumber(draft.whatsappNumber),
    role: "attendant",
    active: true,
    availabilityStatus: "offline",
    photoBase64: draft.photoBase64,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateAttendantRecord(
  attendant: Attendant,
  draft: AttendantFormValues,
  attendants: readonly Attendant[],
  now = new Date().toISOString(),
): AttendantMutationResult & { attendant?: Attendant } {
  const validation = validateAttendantDraft(draft, attendants, attendant.id);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    attendant: {
      ...attendant,
      name: draft.name.trim(),
      displayName: draft.displayName.trim(),
      whatsappNumber: normalizeAttendantWhatsAppNumber(draft.whatsappNumber),
      photoBase64: draft.photoBase64,
      updatedAt: now,
    },
  };
}

export function setAttendantAvailability(
  attendant: Attendant,
  availabilityStatus: AvailabilityStatus,
  now = new Date().toISOString(),
): Attendant {
  return {
    ...attendant,
    availabilityStatus,
    updatedAt: now,
  };
}

export function validateAttendantPhotoFile(file: File): AttendantMutationResult {
  if (!allowedPhotoTypes.has(file.type)) {
    return {
      ok: false,
      fieldErrors: {
        photoBase64: "Selecione uma imagem PNG, JPG, GIF ou WebP.",
      },
    };
  }

  if (file.size > MAX_ATTENDANT_PHOTO_BYTES) {
    return {
      ok: false,
      fieldErrors: {
        photoBase64: "Selecione uma imagem de ate 512 KB.",
      },
    };
  }

  return { ok: true };
}

export async function readAttendantPhotoAsBase64(file: File): Promise<string> {
  const validation = validateAttendantPhotoFile(file);

  if (!validation.ok) {
    throw new Error(validation.fieldErrors?.photoBase64 ?? "Invalid attendant photo.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  return `data:${file.type};base64,${bytesToBase64(bytes)}`;
}

export function getEligibleTransferTargets(attendants: readonly Attendant[]): TransferEligibilityResult {
  const targets: SessionTransferTarget[] = attendants
    .filter(
      (attendant) =>
        attendant.active &&
        attendant.availabilityStatus === "online" &&
        Boolean(attendant.displayName.trim()) &&
        isUsableWhatsAppNumber(attendant.whatsappNumber),
    )
    .map((attendant) => ({
      attendantId: attendant.id,
      displayName: attendant.displayName,
      whatsappNumber: attendant.whatsappNumber,
      photoBase64: attendant.photoBase64,
    }));

  return {
    targets,
    blockedReason: targets.length === 0 ? NO_ELIGIBLE_ATTENDANTS_MESSAGE : undefined,
  };
}

export function countActiveAssignedSessions(attendantId: string, sessions: readonly WhatsAppSession[]): number {
  return sessions.filter((session) => session.assignedAttendantId === attendantId && session.status !== "offline")
    .length;
}

export function canDeleteAttendant(
  attendantId: string,
  sessions: readonly WhatsAppSession[],
): AttendantMutationResult & { activeSessionCount: number } {
  const activeSessionCount = countActiveAssignedSessions(attendantId, sessions);

  if (activeSessionCount > 0) {
    return {
      activeSessionCount,
      ok: false,
      message: "Transfira ou resolva as sessoes ativas antes de excluir este atendente.",
    };
  }

  return {
    activeSessionCount,
    ok: true,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return globalThis.btoa(binary);
}
