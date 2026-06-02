import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { StoreSettingsEditor, type StoreSettingsValue } from "./StoreSettingsEditor";

const EMPTY: StoreSettingsValue = {
  name: "",
  cnpj: "",
  street: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  externalCode: "",
};

function renderEditor(initial: Partial<StoreSettingsValue> = {}, onSave = vi.fn()) {
  render(
    <MantineProvider>
      <StoreSettingsEditor initial={{ ...EMPTY, ...initial }} onSave={onSave} />
    </MantineProvider>,
  );
  return onSave;
}

describe("StoreSettingsEditor", () => {
  it("disables save until a name is provided", () => {
    renderEditor({ name: "" });
    expect(screen.getByRole("button", { name: "Salvar loja" })).toBeDisabled();
  });

  it("shows an error and blocks save for an invalid CNPJ", () => {
    renderEditor({ name: "Loja", cnpj: "11222333000182" }); // valid base, wrong check digit
    expect(screen.getByRole("button", { name: "Salvar loja" })).toBeDisabled();
    expect(screen.getByText(/Dígitos verificadores/)).toBeInTheDocument();
  });

  it("accepts an alphanumeric CNPJ and saves the value", async () => {
    const onSave = renderEditor({ name: "Loja", cnpj: "12.ABC.345/01DE-35" });
    const button = screen.getByRole("button", { name: "Salvar loja" });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Loja", cnpj: "12.ABC.345/01DE-35" }));
  });
});
