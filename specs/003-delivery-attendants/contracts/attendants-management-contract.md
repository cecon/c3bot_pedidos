# Contract: Attendants Management

## Purpose

Define the user-facing behavior for the delivery attendants admin destination.

## Navigation Destination

| Property | Value |
|----------|-------|
| Destination ID | `delivery-attendants` |
| Route | `#/delivery-attendants` |
| Menu label | `Atendentes` |
| Group | Administration |
| First view | Attendants list |

## List Contract

- Opening the destination shows the attendants list first.
- The page exposes a clear add action above or near the list.
- Each row shows photo or placeholder, display name, full name, WhatsApp phone, and
  online/offline status.
- Each row exposes icon actions with accessible labels for edit, delete, set online,
  and set offline.
- The visible status action matches current state: online rows show set offline;
  offline rows show set online.
- Empty state explains that no attendants exist and offers the add action.

## Form Contract

Required fields:

- Name
- Display name
- WhatsApp phone

Optional fields:

- Profile photo

Validation behavior:

- Blank or whitespace-only required values block save.
- Invalid WhatsApp phone blocks save.
- A WhatsApp phone already used by another active attendant blocks save.
- Invalid image input blocks save and explains that the selected file is not usable.
- Saving a valid create starts the attendant offline.
- Saving a valid edit updates the list and transfer labels.

## Delete Contract

- Delete requires confirmation.
- Delete is blocked when the attendant has active assigned sessions.
- A blocked delete explains that active sessions must be transferred or resolved first.
- A successful delete removes the attendant from the active list while preserving
  historical session accountability.

## Accessibility Contract

- Add, edit, delete, set online, and set offline actions have readable labels.
- Online/offline status is represented by text and color, not color alone.
- The form supports keyboard navigation and visible validation messages.
- Focus returns to a sensible location after saving, canceling, or deleting.

## Acceptance Checks

- From any primary admin destination, `#/delivery-attendants` is reachable in no more
  than two interactions.
- A valid attendant can be created in under 2 minutes.
- Offline attendants are visibly distinguishable within 5 seconds of viewing the
  list.
- Invalid saves identify the missing or invalid field.
