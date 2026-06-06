import type { ReactNode } from "react";
import { Settings } from "./icons";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAppearance } from "./ThemeSettingsProvider";
import {
  COLOR_MODES,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  PRIMARY_OPTIONS,
  PRIMARY_SWATCH,
  RADIUS_OPTIONS,
} from "../theme/themeTokens";
import { cn } from "../lib/utils";

const COLOR_MODE_LABEL: Record<string, string> = { light: "Claro", dark: "Escuro", auto: "Automático" };
const FONT_LABEL: Record<string, string> = {
  inter: "Inter", poppins: "Poppins", roboto: "Roboto", openSans: "Open Sans", montserrat: "Montserrat",
};
const DENSITY_LABEL: Record<string, string> = { compact: "Compacto", normal: "Normal", comfortable: "Confortável" };
const RADIUS_LABEL: Record<string, string> = { sm: "Pequeno", md: "Médio", lg: "Grande" };
const COLOR_LABEL: Record<string, string> = {
  blue: "Azul", violet: "Violeta", emerald: "Esmeralda", amber: "Âmbar", rose: "Rosa", cyan: "Ciano", slate: "Ardósia",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ThemeSettingsDrawer() {
  const { settings, update } = useAppearance();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Configurações de tema">
          <Settings size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Aparência</SheetTitle>
          <SheetDescription>Personalize cores, tipografia e densidade. Salvo automaticamente.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-5 pb-5">
          <Field label="Modo de cor">
            <Select value={settings.colorMode} onValueChange={(v) => update("colorMode", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLOR_MODES.map((m) => <SelectItem key={m} value={m}>{COLOR_MODE_LABEL[m]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Cor primária">
            <div className="flex flex-wrap gap-2">
              {PRIMARY_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor primária: ${COLOR_LABEL[c]}`}
                  aria-pressed={settings.primaryColor === c}
                  onClick={() => update("primaryColor", c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2",
                    settings.primaryColor === c ? "border-foreground" : "border-transparent",
                  )}
                  style={{ background: PRIMARY_SWATCH[c] }}
                />
              ))}
            </div>
          </Field>

          <Field label="Tipografia">
            <Select value={settings.fontFamily} onValueChange={(v) => update("fontFamily", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{FONT_LABEL[f]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Densidade">
            <Select value={settings.density} onValueChange={(v) => update("density", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DENSITY_OPTIONS.map((d) => <SelectItem key={d} value={d}>{DENSITY_LABEL[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Bordas (radius)">
            <Select value={settings.radiusPreset} onValueChange={(v) => update("radiusPreset", v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((r) => <SelectItem key={r} value={r}>{RADIUS_LABEL[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SheetContent>
    </Sheet>
  );
}
