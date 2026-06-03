import { describe, expect, it } from "vitest";
import { toMerchant, type StoreRow } from "./mapping";

const row: StoreRow = {
  id: "store-default",
  name: "Pizzaria do Edu",
  cnpj: "12ABC34501DE35",
  street: "Rua A",
  number: "100",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  postalCode: "01000-000",
  complement: "Sala 2",
  latitude: -23.5,
  longitude: -46.6,
  externalCode: "M-1",
  status: "available",
  corporateName: "Edu Alimentos LTDA",
  description: "Melhor pizza",
  averageTicketCents: 4500,
  exclusive: true,
  merchantType: "RESTAURANT",
  country: "BR",
  createdAt: "2026-06-01T00:00:00Z",
};

describe("toMerchant", () => {
  it("maps every store column to the iFood-shaped merchant (full object)", () => {
    const merchant = toMerchant(row, [{ name: "DELIVERY", salesChannel: "ifood-app", enabled: true }]);
    expect(merchant).toEqual({
      id: "store-default",
      name: "Pizzaria do Edu",
      corporateName: "Edu Alimentos LTDA",
      description: "Melhor pizza",
      averageTicket: 4500,
      exclusive: true,
      type: "RESTAURANT",
      status: "AVAILABLE",
      cnpj: "12ABC34501DE35",
      externalCode: "M-1",
      mappedToDestination: true,
      address: {
        country: "BR",
        state: "SP",
        city: "São Paulo",
        postalCode: "01000-000",
        district: "Centro",
        street: "Rua A",
        number: "100",
        complement: "Sala 2",
        latitude: -23.5,
        longitude: -46.6,
      },
      operations: [{ name: "DELIVERY", salesChannel: "ifood-app", enabled: true }],
      createdAt: "2026-06-01T00:00:00Z",
    });
  });

  it("defaults type to RESTAURANT and coerces nullish fields to null", () => {
    const merchant = toMerchant({ id: "s", name: "X", status: "available" }, []);
    expect(merchant.type).toBe("RESTAURANT");
    expect(merchant.corporateName).toBeNull();
    expect(merchant.description).toBeNull();
    expect(merchant.averageTicket).toBeNull();
    expect(merchant.cnpj).toBeNull();
    expect(merchant.externalCode).toBeNull();
    expect(merchant.address.country).toBeNull();
    expect(merchant.exclusive).toBe(false);
  });

  it("flags not-mapped and UNAVAILABLE when external code/status are absent", () => {
    const merchant = toMerchant({ ...row, externalCode: null, status: "paused" }, []);
    expect(merchant.mappedToDestination).toBe(false);
    expect(merchant.status).toBe("UNAVAILABLE");
  });

  it("maps operation enabled flags faithfully", () => {
    const merchant = toMerchant(row, [
      { name: "DELIVERY", salesChannel: "ifood-app", enabled: false },
      { name: "INDOOR", salesChannel: "ifood-app", enabled: true },
    ]);
    expect(merchant.operations).toEqual([
      { name: "DELIVERY", salesChannel: "ifood-app", enabled: false },
      { name: "INDOOR", salesChannel: "ifood-app", enabled: true },
    ]);
  });
});
