import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "./SidebarNav";
import { NAVIGATION_DESTINATIONS } from "../domain/navigation";

function renderNav(collapsed = false, onNavigate = vi.fn()) {
  render(
    <SidebarNav
      activeDestinationId="dashboard"
      destinations={NAVIGATION_DESTINATIONS}
      collapsed={collapsed}
      onNavigate={onNavigate}
    />,
  );
  return onNavigate;
}

describe("SidebarNav", () => {
  it("renders the two destinations and marks the active one", () => {
    renderNav();
    expect(screen.getByRole("button", { name: /Dashboard/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Atendentes/i })).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate with the destination id on click", async () => {
    const onNavigate = renderNav();
    await userEvent.click(screen.getByRole("button", { name: /Atendentes/i }));
    expect(onNavigate).toHaveBeenCalledWith("attendants");
  });

  it("hides the brand subtitle text when collapsed", () => {
    const { container } = render(
      <SidebarNav activeDestinationId="dashboard" destinations={NAVIGATION_DESTINATIONS} collapsed onNavigate={vi.fn()} />,
    );
    expect(container.querySelector("nav")).toHaveAttribute("data-collapsed", "true");
    expect(screen.queryByText("Admin workspace")).not.toBeInTheDocument();
  });
});
