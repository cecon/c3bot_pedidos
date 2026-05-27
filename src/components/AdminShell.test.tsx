import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { getDestinationById } from "../domain/navigation";
import { AdminShell } from "./AdminShell";

function renderShell(destinationId: Parameters<typeof getDestinationById>[0], content: string, fallbackMessage?: string) {
  return render(
    <MantineProvider>
      <AdminShell
        activeDestination={getDestinationById(destinationId)}
        fallbackMessage={fallbackMessage}
        header={<header>Persistent header</header>}
        navigation={<nav>Persistent nav</nav>}
      >
        <section>{content}</section>
      </AdminShell>
    </MantineProvider>,
  );
}

describe("AdminShell", () => {
  it("renders persistent navigation, header, and one active section", () => {
    renderShell("dashboard", "Dashboard metrics");

    expect(screen.getByText("Persistent nav")).toBeInTheDocument();
    expect(screen.getByText("Persistent header")).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Dashboard" })).toHaveAttribute("data-destination", "dashboard");
    expect(screen.getByText("Dashboard metrics")).toBeInTheDocument();
  });

  it("switches focused section content without rendering stale page content", () => {
    const view = renderShell("orders", "Orders table");

    expect(screen.getByRole("main", { name: "Pedidos" })).toHaveTextContent("Orders table");

    view.rerender(
      <MantineProvider>
        <AdminShell
          activeDestination={getDestinationById("catalog")}
          header={<header>Persistent header</header>}
          navigation={<nav>Persistent nav</nav>}
        >
          <section>Catalog grid</section>
        </AdminShell>
      </MantineProvider>,
    );

    expect(screen.getByRole("main", { name: "Catalogo" })).toHaveTextContent("Catalog grid");
    expect(screen.queryByText("Orders table")).not.toBeInTheDocument();
    expect(screen.getByText("Persistent nav")).toBeInTheDocument();
  });

  it("shows fallback messages without blanking preserved workspace context", () => {
    renderShell("dashboard", "Selected session ses-1", "Destino desconhecido. Abrindo dashboard.");

    expect(screen.getByText("Destino desconhecido. Abrindo dashboard.")).toBeInTheDocument();
    expect(screen.getByText("Selected session ses-1")).toBeInTheDocument();
  });
});
