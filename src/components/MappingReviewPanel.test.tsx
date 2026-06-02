import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it } from "vitest";
import type { MappingReadiness } from "../domain/catalog/mapping";
import { MappingReviewPanel } from "./MappingReviewPanel";

function renderPanel(readiness: MappingReadiness) {
  render(
    <MantineProvider>
      <MappingReviewPanel readiness={readiness} />
    </MantineProvider>,
  );
}

describe("MappingReviewPanel", () => {
  it("reports ready when nothing is unmapped", () => {
    renderPanel({ ready: true, unmapped: [] });
    expect(screen.getByText("Pronto para handoff")).toBeInTheDocument();
  });

  it("lists unmapped elements with kind and path when not ready", () => {
    renderPanel({
      ready: false,
      unmapped: [
        { kind: "product", id: "p1", path: "Bebidas/Coca" },
        { kind: "option", id: "o1", path: "Burger/Extras/Bacon" },
      ],
    });
    expect(screen.getByText("Não pronto para handoff")).toBeInTheDocument();
    expect(screen.getByText(/Bebidas\/Coca/)).toBeInTheDocument();
    expect(screen.getByText(/Burger\/Extras\/Bacon/)).toBeInTheDocument();
  });
});
