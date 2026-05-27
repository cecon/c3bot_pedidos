import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { customers } from "../domain/mockData";
import { CustomersPanel } from "./CustomersPanel";

describe("CustomersPanel", () => {
  it("renders customer records with address enrichment status", () => {
    render(
      <MantineProvider>
        <CustomersPanel customers={customers} />
      </MantineProvider>,
    );

    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText(customers[0].name)).toBeInTheDocument();
    expect(screen.getByText(customers[0].whatsappNumber)).toBeInTheDocument();
    expect(screen.getAllByText(/verified|pending|failed/).length).toBeGreaterThan(0);
  });
});
