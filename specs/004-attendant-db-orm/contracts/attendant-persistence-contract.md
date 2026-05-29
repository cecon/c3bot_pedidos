# Contract: Attendant Persistence Runtime Behavior

## Scope

Defines the user-visible and repository behavior for replacing runtime attendant mock
data with real database-backed attendants.

## Initial Load

- The attendants workflow loads attendants from local SQLite through the ORM-backed
  repository.
- A clean database with no active attendants returns an empty list.
- The UI shows the existing empty state and add action when no active attendants are
  saved.
- The workflow must not import or inject mock attendants during startup.

## Database Unavailable

- In a browser-only runtime where local SQLite is unavailable, the attendants workflow
  must not fall back to mock attendants.
- The UI must show a clear unavailable or error state before persistence-backed
  actions are attempted.
- Automated tests may inject explicit fixtures through test setup only.

## Create Attendant

- A valid create action persists the attendant through the ORM-backed repository.
- The saved record appears in the list after persistence succeeds.
- New attendants start offline.
- The record remains available after application restart.

## Update, Status Change, and Delete

- Edits persist through the ORM-backed repository before the UI reports success.
- Online/offline changes persist through the ORM-backed repository.
- Soft deletion persists `active = false` and `availabilityStatus = offline`.
- If persistence fails, the UI shows an error and must not pretend mock-backed success.

## Transfer Eligibility

- Transfer targets are derived only from active, persisted, online attendants.
- A clean workspace with no saved online attendants shows the existing blocked reason.
- Test-only attendants must never appear in production transfer controls.

## Privacy

- WhatsApp and Base64 photo values must not be written to logs or diagnostic messages.
