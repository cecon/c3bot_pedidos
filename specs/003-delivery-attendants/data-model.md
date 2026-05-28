# Data Model: Delivery Attendants

## DeliveryAttendant

Represents a human delivery attendant who can be shown in the admin list and, when
eligible, receive transferred delivery sessions.

**Fields**:

- `id`: stable identifier.
- `name`: legal or internal employee name; required.
- `displayName`: operational label shown in lists and transfer screens; required.
- `whatsappNumber`: normalized WhatsApp contact number; required and unique among
  active attendants.
- `availabilityStatus`: `online` or `offline`.
- `photoBase64`: optional Base64 image data used for the profile photo.
- `active`: whether the attendant remains in the active management list.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.

**Relationships**:

- May be referenced by many `WhatsAppSession` records as the assigned attendant.
- May appear as a `SessionTransferTarget` only when active and online.

**Validation Rules**:

- `name`, `displayName`, and `whatsappNumber` must be present after trimming.
- `whatsappNumber` must normalize to a usable WhatsApp phone value.
- Active attendants must not share the same normalized WhatsApp number.
- New attendants start with `availabilityStatus = offline`.
- Inactive attendants must not appear as transfer targets.

## AvailabilityStatus

Represents whether an attendant can receive new session transfers.

**Values**:

- `online`: attendant is eligible for new transfers when active.
- `offline`: attendant is not eligible for new transfers.

**State Transitions**:

```text
new attendant -> offline
offline -> online
online -> offline
online/offline -> inactive, only when active assigned sessions are resolved
```

**Validation Rules**:

- Status changes must be available from the list row.
- Setting offline must preserve session history.
- Offline status must block new transfer eligibility.

## AttendantPhoto

Represents the optional profile image associated with a delivery attendant.

**Fields**:

- `photoBase64`: Base64-encoded image data.
- `mimeType`: image media type when needed for display.
- `sourceFileName`: optional local-only display reference for the selected file.

**Validation Rules**:

- Only readable image files are accepted.
- Invalid or unreadable image input is rejected with a clear message.
- Missing photos use a visual placeholder and do not block saving.
- Photo data must not be written to logs or diagnostics.

## SessionTransferTarget

Represents an attendant choice offered when transferring a delivery session.

**Fields**:

- `attendantId`: delivery attendant identifier.
- `displayName`: label shown to the operator.
- `photoBase64`: optional photo shown in target selection.
- `whatsappNumber`: contact number available for operator context.

**Relationships**:

- Derived from an active `DeliveryAttendant`.
- Used by the session transfer flow for one selected `WhatsAppSession`.

**Validation Rules**:

- Only active online attendants can become transfer targets.
- Offline attendants must not appear as enabled options.
- If no eligible target exists, the transfer action must explain that no online
  attendant is available.

## AttendantDeletionCheck

Represents the rule that prevents deleting an attendant while they own active work.

**Fields**:

- `attendantId`: candidate attendant.
- `activeSessionCount`: number of active assigned sessions.
- `canDelete`: whether deletion can proceed.
- `blockingReason`: message shown when deletion is blocked.

**Validation Rules**:

- Deletion requires confirmation.
- Deletion is blocked when active assigned sessions would lose their accountable
  attendant.
- Successful deletion removes the attendant from active management without erasing
  historical session references.
