export type SessionStatus = "connected" | "connecting" | "paused" | "offline";
export type OrderStatus =
  | "draft"
  | "scheduled"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "done"
  | "canceled";

export interface WhatsAppSession {
  id: string;
  displayName: string;
  phoneNumber: string;
  status: SessionStatus;
  unread: number;
  assignedAttendantId: string;
  automationGroupId: string;
  lastMessageAt: string;
}

export interface Attendant {
  id: string;
  name: string;
  role: "supervisor" | "attendant";
  active: boolean;
}

export interface Message {
  id: string;
  sessionId: string;
  direction: "inbound" | "outbound" | "system";
  author: string;
  body: string;
  sentAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  imageUrl: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  whatsappNumber: string;
  tags: string[];
  address: {
    label: string;
    city: string;
    state: string;
    enrichmentStatus: "pending" | "verified" | "failed";
  };
}

export interface Order {
  id: string;
  customerId: string;
  sessionId: string;
  status: OrderStatus;
  scheduledFor: string;
  totalCents: number;
  itemCount: number;
}

export interface AutomationBinding {
  id: string;
  groupId: string;
  type: "mcp" | "skill" | "agent";
  name: string;
  enabled: boolean;
}

export interface AutomationGroup {
  id: string;
  name: string;
  description: string;
  sessionCount: number;
}

export interface Campaign {
  id: string;
  name: string;
  segment: string;
  status: "draft" | "scheduled" | "running" | "paused" | "finished";
  scheduledFor: string;
  sent: number;
  conversions: number;
}
