import type { AvailabilityStatus, Order, SessionStatus } from "../domain/types";

export const statusColor: Record<SessionStatus, string> = {
  connected: "green",
  connecting: "yellow",
  paused: "orange",
  offline: "gray",
};

export const orderStatusColor: Record<Order["status"], string> = {
  draft: "gray",
  scheduled: "blue",
  confirmed: "cyan",
  preparing: "yellow",
  out_for_delivery: "orange",
  done: "green",
  canceled: "red",
};

export const availabilityStatusColor: Record<AvailabilityStatus, string> = {
  online: "green",
  offline: "gray",
};
