# Contract: Session Transfer Eligibility

## Purpose

Define the shared rule that decides which human delivery attendants can receive a
transferred delivery session.

## Eligibility Rule

An attendant is eligible only when all conditions are true:

- The attendant is active.
- The attendant availability status is `online`.
- The attendant record has a display name.
- The attendant has a usable WhatsApp phone.

## Ineligible States

An attendant is not eligible when any condition is true:

- Availability status is `offline`.
- The attendant is inactive or deleted from active management.
- Required identity/contact data is missing or invalid.

## Domain Interface

```ts
type AvailabilityStatus = "online" | "offline";

interface DeliveryAttendant {
  id: string;
  name: string;
  displayName: string;
  whatsappNumber: string;
  availabilityStatus: AvailabilityStatus;
  photoBase64?: string;
  active: boolean;
}

interface SessionTransferTarget {
  attendantId: string;
  displayName: string;
  whatsappNumber: string;
  photoBase64?: string;
}

interface TransferEligibilityResult {
  targets: SessionTransferTarget[];
  blockedReason?: string;
}
```

## Behavior Contract

- Transfer target lists include only eligible attendants.
- Offline attendants do not appear as enabled transfer targets.
- If no eligible target exists, the transfer flow shows: "Nenhum atendente online
  disponivel para transferencia."
- Toggling an attendant offline removes them from future transfer target lists without
  deleting their history.
- Toggling an attendant online makes them eligible immediately when required fields are
  valid.

## Test Contract

- Given one online and one offline attendant, only the online attendant is returned as
  a transfer target.
- Given all attendants offline, the result has no targets and includes a blocked
  reason.
- Given an inactive online attendant, the attendant is not returned.
- Given a status toggle from online to offline, the next eligibility check excludes
  that attendant.
