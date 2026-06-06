import { useState, type FormEvent } from "react";
import { Check, X } from "./icons";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { readAttendantPhotoAsBase64, validateAttendantDraft, validateAttendantPhotoFile } from "../domain/attendants";
import type {
  Attendant,
  AttendantFormValues,
  AttendantMutationHandler,
  AttendantMutationResult,
  AttendantUpdateHandler,
} from "../domain/types";

export type AttendantFormMode = "closed" | "create" | "edit";

interface AttendantFormProps {
  attendants: Attendant[];
  editingAttendant?: Attendant;
  mode: Exclude<AttendantFormMode, "closed">;
  onClose: () => void;
  onCreateAttendant: AttendantMutationHandler;
  onUpdateAttendant: AttendantUpdateHandler;
}

const emptyForm: AttendantFormValues = { name: "", displayName: "", whatsappNumber: "", photoBase64: undefined };

function initialValues(attendant?: Attendant): AttendantFormValues {
  return attendant
    ? { name: attendant.name, displayName: attendant.displayName, whatsappNumber: attendant.whatsappNumber, photoBase64: attendant.photoBase64 }
    : emptyForm;
}

export function AttendantForm({ attendants, editingAttendant, mode, onClose, onCreateAttendant, onUpdateAttendant }: AttendantFormProps) {
  const [values, setValues] = useState<AttendantFormValues>(() => initialValues(editingAttendant));
  const [errors, setErrors] = useState<AttendantMutationResult["fieldErrors"]>({});
  const [message, setMessage] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function handlePhoto(file: File | null) {
    if (!file) {
      setValues((v) => ({ ...v, photoBase64: undefined }));
      return;
    }
    const check = validateAttendantPhotoFile(file);
    if (!check.ok) {
      setErrors((e) => ({ ...e, photoBase64: check.fieldErrors?.photoBase64 }));
      return;
    }
    setValues((v) => ({ ...v, photoBase64: undefined }));
    const photoBase64 = await readAttendantPhotoAsBase64(file);
    setValues((v) => ({ ...v, photoBase64 }));
    setErrors((e) => ({ ...e, photoBase64: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const validation = validateAttendantDraft(values, attendants, editingAttendant?.id);
    if (!validation.ok) {
      setErrors(validation.fieldErrors);
      return;
    }
    try {
      setSaving(true);
      const result = mode === "edit" && editingAttendant
        ? await onUpdateAttendant(editingAttendant.id, values)
        : await onCreateAttendant(values);
      if (!result.ok) {
        setErrors(result.fieldErrors);
        setMessage(result.message);
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const field = (key: "name" | "displayName" | "whatsappNumber", label: string, placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`att-${key}`}>{label}</Label>
      <Input
        id={`att-${key}`}
        aria-required
        placeholder={placeholder}
        value={values[key]}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.currentTarget.value }))}
      />
      {errors?.[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <Card>
      <CardContent className="p-4">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{mode === "create" ? "Novo atendente" : "Editar atendente"}</h3>
            <Button type="button" variant="ghost" size="icon" aria-label="Fechar formulário" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          {message && <p className="text-sm text-destructive">{message}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {field("name", "Nome")}
            {field("displayName", "Nome para exibição")}
            {field("whatsappNumber", "WhatsApp obrigatório", "+55 11 99999-0000")}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-photo">Foto do funcionário</Label>
            <input
              id="att-photo"
              type="file"
              aria-label="Foto do funcionário"
              accept="image/gif,image/jpeg,image/png,image/webp"
              className="text-sm"
              onChange={(e) => void handlePhoto(e.currentTarget.files?.[0] ?? null)}
            />
            {errors?.photoBase64 && <p className="text-xs text-destructive">{errors.photoBase64}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              <Check size={16} /> Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
