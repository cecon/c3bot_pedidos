import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { ApiDocsPanel } from "./ApiDocsPanel";

function renderPanel(baseUrl: string | null) {
  render(
    <MantineProvider>
      <ApiDocsPanel baseUrl={baseUrl} />
    </MantineProvider>,
  );
}

describe("ApiDocsPanel", () => {
  it("embeds the Swagger UI iframe when a base URL is configured", () => {
    renderPanel("http://localhost:3922");
    const frame = screen.getByTitle("Documentação da API");
    expect(frame).toHaveAttribute("src", "http://localhost:3922/api/docs");
  });

  it("shows the unavailable state when there is no API base URL", () => {
    renderPanel(null);
    expect(screen.getByText(/API indisponível/)).toBeInTheDocument();
  });
});
