import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPanel } from "./DashboardPanel";
import type { Attendant } from "../domain/types";

function attendant(id: string, availability: "online" | "offline", active = true): Attendant {
  return {
    id,
    name: id,
    displayName: id,
    whatsappNumber: "+55 11 90000-0000",
    active,
    availabilityStatus: availability,
    role: "attendant",
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
  };
}

function statValue(label: string): string {
  const labelEl = screen.getByText(label);
  return labelEl.parentElement?.querySelector("p:nth-child(2)")?.textContent ?? "";
}

describe("DashboardPanel", () => {
  it("derives active/online/offline counts from attendants only", () => {
    render(
      <DashboardPanel
        attendants={[
          attendant("a", "online"),
          attendant("b", "offline"),
          attendant("c", "online"),
          attendant("d", "offline", false), // inactive — excluded
        ]}
      />,
    );
    expect(statValue("Atendentes ativos")).toBe("3");
    expect(statValue("Online agora")).toBe("2");
    expect(statValue("Offline")).toBe("1");
  });

  it("shows the welcome card and references only the Attendants destination", () => {
    render(<DashboardPanel attendants={[]} />);
    expect(screen.getByText("Bem-vindo ao C3Bot")).toBeInTheDocument();
    expect(screen.getByText("Atendentes")).toBeInTheDocument(); // the welcome <strong>, exact match
  });
});
