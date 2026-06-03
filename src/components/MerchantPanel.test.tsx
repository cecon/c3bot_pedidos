import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { MerchantPanel } from "./MerchantPanel";
import type { Merchant } from "../domain/merchant/mapping";
import type { MerchantStatus } from "../domain/types";
import { theme } from "../theme";

const merchant: Merchant = {
  id: "store-default",
  name: "Pizzaria do Edu",
  corporateName: "Edu LTDA",
  description: "",
  averageTicket: 4500,
  exclusive: false,
  type: "RESTAURANT",
  status: "AVAILABLE",
  cnpj: "12ABC34501DE35",
  externalCode: "",
  mappedToDestination: false,
  address: { country: "BR", state: "SP", city: "São Paulo", postalCode: null, district: "Centro", street: "Rua A", number: "1", complement: null, latitude: null, longitude: null },
  operations: [{ name: "DELIVERY", salesChannel: "ifood-app", enabled: true }],
  createdAt: null,
};

const statuses: MerchantStatus[] = [
  { operation: "DELIVERY", salesChannel: "ifood-app", available: false, state: "CLOSED", reopenable: true, validations: [] },
];

function renderPanel(overrides: Partial<Parameters<typeof MerchantPanel>[0]> = {}) {
  const onSaveProfile = vi.fn();
  render(
    <MantineProvider theme={theme}>
      <MerchantPanel
        merchant={merchant}
        statuses={statuses}
        shifts={[]}
        interruptions={[]}
        onSaveProfile={onSaveProfile}
        onSaveHours={vi.fn()}
        onCreateInterruption={vi.fn()}
        onDeleteInterruption={vi.fn()}
        {...overrides}
      />
    </MantineProvider>,
  );
  return onSaveProfile;
}

describe("MerchantPanel", () => {
  it("flags a merchant not mapped to destination", () => {
    renderPanel();
    expect(screen.getByText("não mapeado ao destino")).toBeInTheDocument();
  });

  it("renders a per-operation status badge", () => {
    renderPanel();
    expect(screen.getByText(/DELIVERY: fechado \(CLOSED\)/)).toBeInTheDocument();
  });

  it("saves the profile via the callback", async () => {
    const onSaveProfile = renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));
    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ name: "Pizzaria do Edu", status: "AVAILABLE" }));
  });

  it("disables save when the public name is cleared", async () => {
    renderPanel();
    await userEvent.clear(screen.getByLabelText("Nome público"));
    expect(screen.getByRole("button", { name: "Salvar perfil" })).toBeDisabled();
  });
});
