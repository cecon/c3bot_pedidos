import { describe, expect, it } from "vitest";
import {
  countSessionsByStatus,
  filterSessions,
  formatCurrency,
  normalizeWhatsAppNumber,
  summarizeOrders,
} from "./analytics";
import type { Order, WhatsAppSession } from "./types";

const sampleOrders: Order[] = [
  {
    id: "1",
    customerId: "c1",
    sessionId: "s1",
    status: "scheduled",
    scheduledFor: "Hoje, 19:00",
    totalCents: 1000,
    itemCount: 1,
  },
  {
    id: "2",
    customerId: "c2",
    sessionId: "s1",
    status: "out_for_delivery",
    scheduledFor: "Hoje, 19:30",
    totalCents: 2000,
    itemCount: 2,
  },
  {
    id: "3",
    customerId: "c1",
    sessionId: "s2",
    status: "done",
    scheduledFor: "Ontem, 20:00",
    totalCents: 3000,
    itemCount: 3,
  },
  {
    id: "4",
    customerId: "c2",
    sessionId: "s2",
    status: "confirmed",
    scheduledFor: "Amanha, 12:00",
    totalCents: 4000,
    itemCount: 1,
  },
  {
    id: "5",
    customerId: "c2",
    sessionId: "s2",
    status: "canceled",
    scheduledFor: "Amanha, 13:00",
    totalCents: 5000,
    itemCount: 1,
  },
];

const sampleSessions: WhatsAppSession[] = [
  {
    id: "s1",
    displayName: "Delivery Centro",
    phoneNumber: "+55 11 98888-1040",
    status: "connected",
    unread: 2,
    assignedAttendantId: "a1",
    automationGroupId: "g1",
    lastMessageAt: "10:00",
  },
  {
    id: "s2",
    displayName: "Balcao",
    phoneNumber: "+55 11 97777-2030",
    status: "paused",
    unread: 0,
    assignedAttendantId: "a2",
    automationGroupId: "g2",
    lastMessageAt: "09:00",
  },
];

describe("analytics helpers", () => {
  it("summarizes order states and only counts done revenue", () => {
    expect(summarizeOrders(sampleOrders)).toEqual({
      scheduled: 2,
      inProgress: 1,
      done: 1,
      canceled: 1,
      revenueCents: 3000,
    });
  });

  it("counts sessions by status", () => {
    expect(countSessionsByStatus(sampleSessions)).toEqual({
      connected: 1,
      connecting: 0,
      paused: 1,
      offline: 0,
    });
  });

  it("filters sessions by name or phone", () => {
    expect(filterSessions(sampleSessions, "centro")).toHaveLength(1);
    expect(filterSessions(sampleSessions, "97777")).toHaveLength(1);
    expect(filterSessions(sampleSessions, "  balcao  ")).toHaveLength(1);
    expect(filterSessions(sampleSessions, "")).toHaveLength(2);
  });

  it("normalizes common Brazilian WhatsApp numbers", () => {
    expect(normalizeWhatsAppNumber("11988881040")).toBe("+55 11 98888-1040");
    expect(normalizeWhatsAppNumber("+55 (11) 98888-1040")).toBe("+55 11 98888-1040");
    expect(normalizeWhatsAppNumber("  +44 7700 900123  ")).toBe("+44 7700 900123");
  });

  it("formats currency in Brazilian reais", () => {
    expect(formatCurrency(8990)).toContain("89,90");
  });
});
