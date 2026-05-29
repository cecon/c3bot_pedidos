import { describe, expect, it } from "vitest";
import {
  MAX_ATTENDANT_PHOTO_BYTES,
  buildNewAttendant,
  canDeleteAttendant,
  getEligibleTransferTargets,
  isUsableWhatsAppNumber,
  readAttendantPhotoAsBase64,
  setAttendantAvailability,
  updateAttendantRecord,
  validateAttendantDraft,
  validateAttendantPhotoFile,
} from "./attendants";
import type { Attendant, WhatsAppSession } from "./types";

const baseAttendant: Attendant = {
  id: "att-ana",
  name: "Ana Paula",
  displayName: "Ana",
  whatsappNumber: "+55 11 98888-1040",
  role: "attendant",
  active: true,
  availabilityStatus: "online",
  createdAt: "2026-05-28T10:00:00.000Z",
  updatedAt: "2026-05-28T10:00:00.000Z",
};

describe("attendant domain helpers", () => {
  it("accepts only common Brazilian WhatsApp shapes", () => {
    expect(isUsableWhatsAppNumber("11988881040")).toBe(true);
    expect(isUsableWhatsAppNumber("5511988881040")).toBe(true);
    expect(isUsableWhatsAppNumber("9911988881040")).toBe(false);
    expect(isUsableWhatsAppNumber("551198888104")).toBe(false);
  });

  it("validates required fields, usable WhatsApp, and duplicate active numbers", () => {
    const requiredResult = validateAttendantDraft(
      {
        name: " ",
        displayName: " ",
        whatsappNumber: " ",
      },
      [baseAttendant],
    );
    const invalidPhoneResult = validateAttendantDraft(
      {
        name: "Lucas Rocha",
        displayName: "Lucas",
        whatsappNumber: "123",
      },
      [baseAttendant],
    );
    const duplicateResult = validateAttendantDraft(
      {
        name: "Lucas Rocha",
        displayName: "Lucas",
        whatsappNumber: "11988881040",
      },
      [baseAttendant],
    );

    expect(requiredResult).toMatchObject({
      ok: false,
      fieldErrors: {
        name: "Informe o nome do funcionario.",
        displayName: "Informe o nome para exibicao.",
        whatsappNumber: "Informe o WhatsApp.",
      },
    });
    expect(invalidPhoneResult).toMatchObject({
      ok: false,
      fieldErrors: {
        whatsappNumber: "Informe um WhatsApp valido com DDD.",
      },
    });
    expect(duplicateResult).toMatchObject({
      ok: false,
      fieldErrors: {
        whatsappNumber: "Este WhatsApp ja esta em uso por outro atendente.",
      },
    });
  });

  it("allows updating an attendant without treating its own WhatsApp as duplicate", () => {
    expect(
      validateAttendantDraft(
        {
          name: "Ana Paula",
          displayName: "Ana",
          whatsappNumber: "11988881040",
        },
        [baseAttendant],
        "att-ana",
      ),
    ).toMatchObject({ ok: true });
  });

  it("builds and updates normalized attendant records", () => {
    const created = buildNewAttendant(
      {
        name: " Lucas Rocha ",
        displayName: " Lucas ",
        whatsappNumber: "11977772030",
        photoBase64: "data:image/png;base64,YQ==",
      },
      [baseAttendant],
      "2026-05-28T11:00:00.000Z",
    );
    const updated = updateAttendantRecord(
      created,
      {
        name: " Lucas R. ",
        displayName: " LR ",
        whatsappNumber: "5511977772030",
      },
      [baseAttendant, created],
      "2026-05-28T11:30:00.000Z",
    );

    expect(created).toMatchObject({
      name: "Lucas Rocha",
      displayName: "Lucas",
      whatsappNumber: "+55 11 97777-2030",
      role: "attendant",
      active: true,
      availabilityStatus: "offline",
      createdAt: "2026-05-28T11:00:00.000Z",
      updatedAt: "2026-05-28T11:00:00.000Z",
    });
    expect(() => buildNewAttendant({ name: "", displayName: "", whatsappNumber: "" }, [baseAttendant])).toThrow(
      "Cannot create attendant from invalid draft.",
    );
    expect(updated).toMatchObject({
      ok: true,
      attendant: {
        name: "Lucas R.",
        displayName: "LR",
        whatsappNumber: "+55 11 97777-2030",
        photoBase64: undefined,
        updatedAt: "2026-05-28T11:30:00.000Z",
      },
    });
    expect(updateAttendantRecord(created, { name: "", displayName: "", whatsappNumber: "" }, [created])).toMatchObject({
      ok: false,
    });
  });

  it("validates attendant photo type, size, and Base64 output", async () => {
    const validImage = new File(["avatar"], "avatar.png", { type: "image/png" });
    const validGif = new File(["g"], "avatar.gif", { type: "image/gif" });
    const validJpeg = new File(["j"], "avatar.jpg", { type: "image/jpeg" });
    const validWebp = new File(["w"], "avatar.webp", { type: "image/webp" });
    const invalidType = new File(["avatar"], "avatar.txt", { type: "text/plain" });
    const largeImage = new File([new Uint8Array(MAX_ATTENDANT_PHOTO_BYTES + 1)], "large.png", {
      type: "image/png",
    });
    const boundaryImage = new File([new Uint8Array(MAX_ATTENDANT_PHOTO_BYTES)], "boundary.png", {
      type: "image/png",
    });
    const multiChunkBytes = new Uint8Array(0x8000 + 2);
    multiChunkBytes[0] = 65;
    multiChunkBytes[0x8000] = 66;
    multiChunkBytes[0x8001] = 67;
    const multiChunkImage = new File([multiChunkBytes], "multi.png", { type: "image/png" });

    expect(validateAttendantPhotoFile(validImage)).toMatchObject({ ok: true });
    expect(validateAttendantPhotoFile(validGif)).toMatchObject({ ok: true });
    expect(validateAttendantPhotoFile(validJpeg)).toMatchObject({ ok: true });
    expect(validateAttendantPhotoFile(validWebp)).toMatchObject({ ok: true });
    expect(validateAttendantPhotoFile(boundaryImage)).toMatchObject({ ok: true });
    expect(validateAttendantPhotoFile(invalidType)).toMatchObject({
      ok: false,
      fieldErrors: { photoBase64: "Selecione uma imagem PNG, JPG, GIF ou WebP." },
    });
    expect(validateAttendantPhotoFile(largeImage)).toMatchObject({
      ok: false,
      fieldErrors: { photoBase64: "Selecione uma imagem de ate 512 KB." },
    });
    await expect(readAttendantPhotoAsBase64(validImage)).resolves.toBe("data:image/png;base64,YXZhdGFy");
    await expect(readAttendantPhotoAsBase64(multiChunkImage)).resolves.toBe(
      `data:image/png;base64,${Buffer.from(multiChunkBytes).toString("base64")}`,
    );
    await expect(readAttendantPhotoAsBase64(invalidType)).rejects.toThrow(
      "Selecione uma imagem PNG, JPG, GIF ou WebP.",
    );
  });

  it("returns only active online attendants as transfer targets", () => {
    const offline = setAttendantAvailability({ ...baseAttendant, id: "att-off", whatsappNumber: "+55 11 97777-2030" }, "offline");
    const inactive = {
      ...baseAttendant,
      id: "att-inactive",
      whatsappNumber: "+55 11 96666-9988",
      active: false,
    };
    const blankDisplayName = {
      ...baseAttendant,
      id: "att-blank",
      displayName: " ",
      whatsappNumber: "+55 11 95555-0000",
    };
    const invalidPhone = {
      ...baseAttendant,
      id: "att-invalid",
      whatsappNumber: "123",
    };

    expect(getEligibleTransferTargets([baseAttendant, offline, inactive, blankDisplayName, invalidPhone])).toEqual({
      targets: [
        {
          attendantId: "att-ana",
          displayName: "Ana",
          whatsappNumber: "+55 11 98888-1040",
          photoBase64: undefined,
        },
      ],
      blockedReason: undefined,
    });
  });

  it("reports when no online attendant can receive a transfer", () => {
    const offline = setAttendantAvailability(baseAttendant, "offline", "2026-05-28T11:00:00.000Z");

    expect(offline).toMatchObject({
      availabilityStatus: "offline",
      updatedAt: "2026-05-28T11:00:00.000Z",
    });
    expect(getEligibleTransferTargets([offline])).toMatchObject({
      targets: [],
      blockedReason: "Nenhum atendente online disponivel para transferencia.",
    });
  });

  it("blocks deletion while active sessions still reference the attendant", () => {
    const sessions: WhatsAppSession[] = [
      {
        id: "ses-1",
        displayName: "Delivery",
        phoneNumber: "+55 11 98888-1040",
        status: "connected",
        unread: 0,
        assignedAttendantId: "att-ana",
        automationGroupId: "grp-1",
        lastMessageAt: "agora",
      },
      {
        id: "ses-2",
        displayName: "Offline",
        phoneNumber: "+55 11 97777-2030",
        status: "offline",
        unread: 0,
        assignedAttendantId: "att-ana",
        automationGroupId: "grp-1",
        lastMessageAt: "ontem",
      },
    ];

    expect(canDeleteAttendant("att-ana", sessions)).toMatchObject({
      activeSessionCount: 1,
      ok: false,
      message: "Transfira ou resolva as sessoes ativas antes de excluir este atendente.",
    });
    expect(canDeleteAttendant("att-maria", sessions)).toMatchObject({
      activeSessionCount: 0,
      ok: true,
    });
  });
});
