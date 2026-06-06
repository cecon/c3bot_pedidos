export type SessionStatus = "connected" | "connecting" | "paused" | "offline";
export type AvailabilityStatus = "online" | "offline";
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
  displayName: string;
  whatsappNumber: string;
  role: "supervisor" | "attendant";
  active: boolean;
  availabilityStatus: AvailabilityStatus;
  photoBase64?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendantFormValues {
  displayName: string;
  name: string;
  photoBase64?: string;
  whatsappNumber: string;
}

export interface AttendantMutationResult {
  fieldErrors?: Partial<Record<keyof AttendantFormValues, string>>;
  message?: string;
  ok: boolean;
}

export type AttendantPersistenceStatus = "idle" | "loading" | "ready" | "empty" | "unavailable" | "error";

export interface AttendantPersistenceState {
  message?: string;
  status: AttendantPersistenceStatus;
}

export type AttendantMutationHandler = (
  values: AttendantFormValues,
) => AttendantMutationResult | Promise<AttendantMutationResult>;

export type AttendantUpdateHandler = (
  attendantId: string,
  values: AttendantFormValues,
) => AttendantMutationResult | Promise<AttendantMutationResult>;

export type AttendantDeleteHandler = (attendantId: string) => AttendantMutationResult | Promise<AttendantMutationResult>;

export interface SessionTransferTarget {
  attendantId: string;
  displayName: string;
  photoBase64?: string;
  whatsappNumber: string;
}

export interface TransferEligibilityResult {
  blockedReason?: string;
  targets: SessionTransferTarget[];
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

// Product catalog (feature 005) value types.
export type AvailabilityState = "available" | "unavailable" | "paused";
export type UnitOfMeasure = "unit" | "weight";
export type PizzaPricingStrategy = "highest" | "average";

// A single weekly operating-hours window. dayOfWeek: 0 (Sun) .. 6 (Sat); times are "HH:MM".
export interface ScheduleWindow {
  dayOfWeek: number;
  start: string;
  end: string;
}

export type WeeklyHours = ScheduleWindow[];

export type CatalogPersistenceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "empty" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

// Merchant registry (feature 006), iFood Merchant API-aligned value types.
export type OperationName = "DELIVERY" | "INDOOR";
export type SalesChannelName = string; // e.g. "ifood-app"
export type MerchantStatusValue = "AVAILABLE" | "UNAVAILABLE";
export type MerchantType = "RESTAURANT";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
// Availability state per operation (iFood Status schema).
export type MerchantState = "OK" | "WARNING" | "CLOSED" | "ERROR";

export interface MerchantOperation {
  name: OperationName;
  salesChannel: SalesChannelName;
  enabled: boolean;
}

export interface MerchantShift {
  dayOfWeek: DayOfWeek;
  start: string; // "HH:MM" or "HH:MM:SS"
  duration: number; // minutes from start
  enabled: boolean;
}

export interface MerchantInterruption {
  id: string;
  description: string;
  start: string; // ISO-8601
  end: string; // ISO-8601
  createdAt?: string;
}

export interface StatusValidation {
  id: string;
  code: string;
  state: MerchantState;
  message: { title: string; subtitle: string; description: string };
}

export interface MerchantStatus {
  operation: OperationName;
  salesChannel: SalesChannelName;
  available: boolean;
  state: MerchantState;
  reopenable: boolean;
  validations: StatusValidation[];
}
