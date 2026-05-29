# Data Model: Attendant Database Persistence and ORM Governance

## DeliveryAttendant

Represents a real human delivery attendant saved by an administrator.

### Fields

- `id`: stable attendant identifier.
- `name`: legal or internal employee name; required.
- `displayName`: operational name shown in lists and transfer controls; required.
- `whatsappNumber`: normalized WhatsApp contact; required and unique among active
  attendants.
- `role`: attendant role classification retained from the existing schema.
- `active`: whether the attendant is visible in the active management list.
- `availabilityStatus`: `online` or `offline`; controls transfer eligibility.
- `photoBase64`: optional profile image data.
- `createdAt`: creation timestamp.
- `updatedAt`: last persisted update timestamp.

### Relationships

- Can be assigned to zero or more WhatsApp sessions.
- Can be a transfer target only when active and online.

### Validation Rules

- `name`, `displayName`, and `whatsappNumber` must be present.
- Active attendants must not share a normalized WhatsApp number.
- New attendants start offline.
- Soft-deleted attendants are inactive and offline.
- Photo data must remain optional and must not be logged.

## AttendantPersistenceState

Represents the runtime state of loading persisted attendants.

### States

- `idle`: load has not started.
- `loading`: database-backed attendant load is in progress.
- `ready`: persisted attendants were loaded successfully.
- `empty`: database loaded successfully and no active attendants exist.
- `unavailable`: the current runtime cannot access the local SQLite database.
- `error`: database access failed in a runtime where it should be available.

### State Transitions

- `idle` -> `loading` when the attendants workflow initializes.
- `loading` -> `ready` when at least one active attendant is loaded.
- `loading` -> `empty` when the database returns no active attendants.
- `loading` -> `unavailable` when the app is not running inside Tauri.
- `loading` -> `error` when database access fails unexpectedly.
- `ready` -> `empty` when the last active attendant is removed.

## ORMAttendantRecord

Represents the typed database row used by the ORM layer for the existing attendants
table.

### Fields

- Snake-case database columns for the existing attendants table.
- Typed mapping to and from the `DeliveryAttendant` domain shape.
- Numeric database flags mapped to boolean domain values.

### Validation Rules

- Repository code must map through ORM schema definitions rather than handwritten SQL.
- Raw row mapping must be tested so persisted values match domain values.

## MigrationTrace

Represents evidence that a schema migration was generated through the approved command
workflow.

### Fields

- `migrationName`: human-readable migration name.
- `command`: terminal command used to generate the migration.
- `generatedPath`: generated migration file or folder.
- `reviewNotes`: optional note explaining manual adjustments, if any.
- `registeredInTauri`: whether the generated SQL is included in the Tauri migration
  registration list when required.

### Validation Rules

- Every future schema-changing PR must include a migration trace.
- Manual migration edits require a review note.
- No runtime seed data may be added through migrations without an explicit future
  demo/import decision.

## DatabaseAccessPolicy

Represents the ADR-backed governance rule for application-owned data.

### Rules

- Application repositories must use the approved ORM access boundary.
- Direct SQL is allowed only inside the ORM proxy/adapter, migration files, generated
  tooling output, and explicitly documented exceptions.
- Tests may use fixtures, but production runtime paths must not import mock
  attendants.
