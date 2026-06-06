import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import {
  NAVIGATION_DESTINATIONS,
  getVisibleNavigationGroups,
  type NavigationGroup,
} from "../domain/navigation";
import { SidebarNav } from "./SidebarNav";

function renderNav(onNavigate = vi.fn(), onNavigateSubPage = vi.fn()) {
  render(
    <MantineProvider>
      <SidebarNav
        activeDestinationId="orders"
        destinations={NAVIGATION_DESTINATIONS}
        groups={getVisibleNavigationGroups()}
        onNavigate={onNavigate}
        onNavigateSubPage={onNavigateSubPage}
      />
    </MantineProvider>,
  );
  return onNavigate;
}

describe("SidebarNav", () => {
  it("renders grouped destinations and marks the active destination", () => {
    renderNav();

    expect(screen.getByText("Operacao")).toBeInTheDocument();
    expect(screen.getByText("Administracao")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pedidos/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Campanhas/i })).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate when a destination is clicked", async () => {
    const onNavigate = renderNav();

    await userEvent.click(screen.getByRole("button", { name: /Catalogo/i }));

    expect(onNavigate).toHaveBeenCalledWith("catalog");
  });

  it("supports keyboard activation through native buttons", async () => {
    const user = userEvent.setup();
    const onNavigate = renderNav();

    screen.getByRole("button", { name: /Sessoes/i }).focus();
    await user.keyboard("{Enter}");

    expect(onNavigate).toHaveBeenCalledWith("sessions");
  });

  it("does not render empty groups and exposes responsive group structure", () => {
    const groups: NavigationGroup[] = [
      ...getVisibleNavigationGroups(),
      { id: "administration", label: "Vazio", destinationIds: [] },
    ];

    render(
      <MantineProvider>
        <SidebarNav
          activeDestinationId="dashboard"
          destinations={NAVIGATION_DESTINATIONS}
          groups={groups}
          onNavigate={vi.fn()}
          onNavigateSubPage={vi.fn()}
        />
      </MantineProvider>,
    );

    expect(screen.queryByText("Vazio")).not.toBeInTheDocument();
    expect(screen.getByText("Operacao").closest(".nav-groups")).toBeTruthy();
  });

  it("hides the catalog submenu unless catalog is the active destination", () => {
    renderNav(); // active destination is "orders"

    expect(screen.queryByRole("button", { name: /Grupos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Produtos/i })).not.toBeInTheDocument();
  });

  it("renders the catalog submenu and routes sub-page clicks to onNavigateSubPage", async () => {
    const onNavigateSubPage = vi.fn();
    render(
      <MantineProvider>
        <SidebarNav
          activeDestinationId="catalog"
          activeSubPageId="grupos"
          destinations={NAVIGATION_DESTINATIONS}
          groups={getVisibleNavigationGroups()}
          onNavigate={vi.fn()}
          onNavigateSubPage={onNavigateSubPage}
        />
      </MantineProvider>,
    );

    expect(screen.getByRole("button", { name: /Grupos/i })).toHaveAttribute("aria-current", "page");

    await userEvent.click(screen.getByRole("button", { name: /Produtos/i }));

    expect(onNavigateSubPage).toHaveBeenCalledWith("#/catalog/produtos");
  });
});
