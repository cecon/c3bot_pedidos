import type { Order, SessionStatus, WhatsAppSession } from "./types";

export interface OrderSummary {
  scheduled: number;
  inProgress: number;
  done: number;
  canceled: number;
  revenueCents: number;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function normalizeWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 11) {
    return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  return input.trim();
}

export function summarizeOrders(orders: Order[]): OrderSummary {
  return orders.reduce<OrderSummary>(
    (summary, order) => {
      if (order.status === "scheduled" || order.status === "confirmed") {
        summary.scheduled += 1;
      }

      if (order.status === "preparing" || order.status === "out_for_delivery") {
        summary.inProgress += 1;
      }

      if (order.status === "done") {
        summary.done += 1;
        summary.revenueCents += order.totalCents;
      }

      if (order.status === "canceled") {
        summary.canceled += 1;
      }

      return summary;
    },
    { scheduled: 0, inProgress: 0, done: 0, canceled: 0, revenueCents: 0 },
  );
}

export function countSessionsByStatus(
  sessions: WhatsAppSession[],
): Record<SessionStatus, number> {
  return sessions.reduce<Record<SessionStatus, number>>(
    (count, session) => {
      count[session.status] += 1;
      return count;
    },
    { connected: 0, connecting: 0, paused: 0, offline: 0 },
  );
}

export function filterSessions(
  sessions: WhatsAppSession[],
  searchTerm: string,
): WhatsAppSession[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return sessions;
  }

  return sessions.filter((session) =>
    `${session.displayName} ${session.phoneNumber}`.toLowerCase().includes(normalizedSearch),
  );
}
