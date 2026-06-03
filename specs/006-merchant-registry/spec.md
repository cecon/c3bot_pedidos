# Feature Specification: Merchant (Restaurant) Registry — iFood Merchant API-aligned

**Feature Branch**: `006-merchant-registry`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Cadastro de merchants (restaurantes) baseado na iFood Merchant API v1.0 — usar a estrutura comprovada do iFood como blueprint (não somos o destino final; campos de referência externa para integração futura, sem sync agora)."

## Context & Intent

C3Bot is an **operator workspace**, not the final fulfillment destination. This feature adds a
**merchant (restaurant) registry** whose data model mirrors the **iFood Merchant API v1.0** —
a proven domain shape — so a future destination integration can map each merchant unambiguously
through reserved **external reference** fields. As with the catalog (feature 005):

- The model mirrors the iFood Merchant structure (merchant → address + operations; status;
  interruptions; opening hours; check-in QR).
- Every merchant carries an external destination reference (the iFood `merchantId` slot).
- **No synchronization/integration with the iFood API is built now** — only the local,
  destination-mappable registry plus its maintenance UI. Integrations come later.

Relationship to the catalog: feature 005 introduced a single `store` ("uma loja por instalação").
This feature **enriches and consolidates** that store into a single **merchant** profile (see
Clarifications): there is exactly one merchant per installation, it absorbs the catalog's
`store` (the catalog hangs off the merchant), and the store's operating hours become the
merchant's **opening hours** (shift model).

## Clarifications

### Session 2026-06-02

- Q: Multi-merchant ou single-store? → A: **Single-store enriquecido** — exatamente um merchant por instalação; o merchant é o perfil rico da loja única (não multi-tenant). A listagem do iFood é modelada, mas retorna esse único merchant.
- Q: Relação com a `store` do catálogo (feature 005) e os horários de loja? → A: **Consolidar** — o Merchant absorve/substitui a `store` do catálogo (o catálogo passa a pendurar do merchant) e os horários de loja passam a ser as opening-hours do merchant (modelo de shifts). Um modelo só.
- Q: Check-in QR no v1? → A: **Adiado** — fora de escopo agora (ver Out of Scope).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintain the merchant profile (Priority: P1)

An operator maintains the installation's single **merchant** profile (the enriched store) with
basic info (public name, corporate name, description, average ticket, exclusive flag, type,
status), full address (country, state, city, postal code, district, street, number,
latitude/longitude), and operations (each operation — e.g. delivery/indoor — with a sales
channel and its enabled flag). The merchant carries an external destination reference. A list
view (iFood-shaped, paginated) returns this single merchant, and a details view shows it.

**Why this priority**: The merchant profile anchors status, hours, interruptions, and the
catalog. This is the minimum viable slice and consolidates the catalog's `store`.

**Independent Test**: Edit the merchant with name, corporate name, type, address and one delivery
operation; open its details and the list; confirm all fields and the external reference (or a
"not mapped" indicator) are shown.

**Acceptance Scenarios**:

1. **Given** a fresh installation, **When** the operator fills the merchant profile (required
   fields), **Then** it appears in the merchant list and its details page shows the saved info.
2. **Given** the single merchant, **When** the operator lists with a page/size, **Then** the
   list returns that merchant with valid pagination metadata (page ≥ 1; default size 100).
3. **Given** the merchant, **When** the operator edits its address or operations, **Then** the
   details reflect the change.
4. **Given** the merchant saved without an external reference, **Then** it is flagged "not mapped
   to destination".

---

### User Story 2 - Configure opening hours (Priority: P2)

An operator defines the merchant's weekly opening hours as **shifts**: each shift has a day of
week (MONDAY..SUNDAY), a start time, and a duration in minutes; a day may have multiple shifts
or none (closed). Operators can view and replace the full set of shifts.

**Why this priority**: Opening hours determine when the merchant is offered; needed early after
the basic record.

**Independent Test**: Set a Monday lunch shift (start 11:00, duration 180) and confirm the
merchant reports that window; remove all Sunday shifts and confirm Sunday reads as closed.

**Acceptance Scenarios**:

1. **Given** a merchant, **When** the operator saves shifts for several days, **Then** the
   opening hours reflect them with day, start and duration.
2. **Given** a shift with an invalid day, start, or non-positive duration, **When** saving,
   **Then** the system rejects it with a clear message.

---

### User Story 3 - Manage interruptions (Priority: P3)

An operator schedules **interruptions** (temporary closures) for a merchant with a description,
a start and an end (both ISO-8601, start before end). They can list current and future
interruptions and delete them — except a just-created interruption that cannot be removed yet
(conflict).

**Why this priority**: Interruptions handle ad-hoc closures (out of stock, emergencies) on top
of the regular schedule.

**Independent Test**: Create an interruption for a future window, list it, attempt to delete a
just-created one (rejected with a conflict), and delete an older one successfully.

**Acceptance Scenarios**:

1. **Given** a merchant, **When** the operator creates an interruption with valid start<end,
   **Then** it is listed among current/future interruptions.
2. **Given** start ≥ end or a missing field, **When** creating, **Then** the system rejects it.
3. **Given** a recently created interruption, **When** the operator tries to delete it, **Then**
   the system blocks it with a "recently created" conflict; an older one deletes successfully.
4. **Given** an interruption overlapping an existing one, **When** creating, **Then** the system
   flags the overlap.

---

### User Story 4 - View merchant status & availability (Priority: P4)

An operator reviews a merchant's **status** per operation/sales channel: whether it is available
now, an overall state (OK | WARNING | CLOSED | ERROR), whether it is reopenable, and a list of
**validations** (id, code, state, message with title/subtitle/description) explaining why it is
or isn't open. Status can be viewed for all operations or a single operation.

**Why this priority**: Status aggregates hours + interruptions + configuration into an
at-a-glance readiness view; it depends on the prior data existing.

**Independent Test**: With a merchant outside its opening hours, the status shows
available=false, a CLOSED/relevant state, and a validation message explaining the closure.

**Acceptance Scenarios**:

1. **Given** a merchant within its hours and no interruption, **When** the operator views
   status, **Then** it shows available=true / state OK for that operation.
2. **Given** an active interruption or out-of-hours, **When** viewing status, **Then**
   available=false with a validation message and the reopenable indicator.
3. **Given** an invalid operation name, **When** requesting status by operation, **Then** the
   system returns a clear bad-request message.

---

### Edge Cases

- What happens when listing with page < 1 or an excessive size? (Clamp/validate.)
- How are merchants the operator has no access to handled (forbidden)?
- What happens when opening-hours shifts for the same day overlap?
- How is "available now" computed when opening hours and an interruption disagree?
- What happens to a merchant's catalog/store data when the merchant is removed?
- How is a duplicated external reference across two merchants handled?

## Requirements *(mandatory)*

### Functional Requirements

**Merchant registry (P1)**

- **FR-001**: System MUST let operators maintain the installation's **single merchant** with:
  public name, corporate name, description, average ticket, exclusive flag, type (e.g.
  RESTAURANT), status (e.g. AVAILABLE), and creation timestamp. The merchant **consolidates** the
  catalog's `store` (feature 005): the catalog hangs off this merchant and the store's existing
  fields (name, CNPJ, address, external code) are part of the merchant profile.
- **FR-002**: System MUST store a merchant **address**: country, state, city, postal code,
  district, street, number, latitude, longitude.
- **FR-003**: System MUST store one or more **operations** per merchant, each with an operation
  name (delivery | indoor) and a **sales channel** (name, enabled flag).
- **FR-004**: System MUST expose an iFood-shaped **list** of merchants with pagination (page ≥ 1;
  default size 100) — returning the single merchant — and a merchant **details** view by id.
- **FR-005**: System MUST allow every merchant to carry an **external destination reference**
  (the iFood `merchantId` slot), editable in the merchant editor, and flag merchants without one
  as "not mapped to destination".
- **FR-006**: Since there is exactly **one merchant per installation** (single-store), its external
  destination reference is inherently unique; the system MUST validate the field is well-formed when
  present. Cross-merchant duplicate detection is **N/A under single-store** and is reserved for a
  future multi-merchant scope.

**Opening hours (P2) — consolidates the catalog store hours**

- **FR-007**: System MUST let operators define opening-hours **shifts** for the merchant: day of
  week (MONDAY..SUNDAY), start time, and duration in minutes; multiple shifts per day allowed; a
  day with no shift is closed.
- **FR-008**: System MUST reject shifts with an invalid day, an invalid start, or a non-positive
  duration.
- **FR-009**: System MUST let operators **replace** the full set of shifts for a merchant and
  read the current set.

**Interruptions (P3)**

- **FR-010**: System MUST let operators create an interruption with a description, start, and end
  in ISO-8601, requiring start < end.
- **FR-011**: System MUST list a merchant's current and future interruptions.
- **FR-012**: System MUST let operators delete an interruption, EXCEPT a **recently created** one
  (conflict) — and MUST flag **overlapping** interruptions.

**Status & availability (P4)**

- **FR-013**: System MUST report merchant status per operation/sales channel: available (boolean),
  overall state (OK | WARNING | CLOSED | ERROR), reopenable indicator, and a list of validations
  (id, code, state, message with title/subtitle/description).
- **FR-014**: System MUST allow status retrieval for all operations and for a single operation,
  rejecting an invalid operation name.
- **FR-015**: System MUST derive "available now" from the merchant status, its opening hours, and
  any active interruption.

**Errors & access**

- **FR-016**: System MUST return standardized errors with a code and message from a **single shared
  error catalog** (e.g. InvalidMerchant, InvalidInterruption, IrremovableInterruption,
  InterruptionOverlap, InterruptionNotFound, InvalidOpeningHours, RecentlyCreatedInterruption),
  reused by every endpoint so codes are consistent and testable.
- **FR-017**: API responses MUST model the distinction between **"not authenticated" (401)** and
  **"forbidden" (403)** at the **contract level** (documented response shapes). The actual identity
  provider is **out of scope** (see Out of Scope) — no provider is implemented now; the local API
  keeps its existing optional bearer-token behavior.

### Key Entities *(include if feature involves data)*

- **Merchant**: id, name (public), corporate name, description, average ticket, exclusive, type,
  status, created-at, external destination reference. Owns one address and one or more operations.
- **Address**: country, state, city, postal code, district, street, number, latitude, longitude.
- **Operation**: name (delivery | indoor) + sales channel (name, enabled).
- **MerchantStatus**: per operation/sales channel — available (boolean), state (OK | WARNING |
  CLOSED | ERROR), reopenable (boolean), validations[].
- **StatusValidation**: id, code, state, message (title, subtitle, description).
- **Interruption**: id, description, start, end (ISO-8601).
- **OpeningHours / Shift**: shift = id, day of week (MONDAY..SUNDAY), start, duration (minutes),
  enabled, created-at; grouped per merchant.
- **External Mapping**: the destination reference (merchantId) and handoff-readiness state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can create a complete merchant (basic info + address + one operation +
  external reference) in under 5 minutes.
- **SC-002**: The iFood-shaped paginated list returns the installation's single merchant with valid
  pagination metadata (page ≥ 1; default size 100) in under 1 second of operator wait. (Single-store:
  the list always contains exactly one merchant; no multi-merchant volume target applies.)
- **SC-003**: 100% of merchants without an external reference are surfaced as "not mapped".
- **SC-004**: Opening-hours validation rejects 100% of invalid shifts (bad day, bad start,
  duration ≤ 0).
- **SC-005**: Interruption rules hold in 100% of checks: start<end enforced, recently-created
  deletion blocked, overlaps flagged.
- **SC-006**: Merchant status correctly reflects open/closed for 100% of opening-hours +
  interruption combinations tested.

## Assumptions

- The **iFood Merchant API v1.0 is the structural blueprint only**; this feature does not call
  iFood APIs. External references are plain fields reserved for a future integration.
- No synchronization (import/export) with iFood now; only the local registry + maintenance UI.
- Times/dates use ISO-8601; opening-hours start is a local time-of-day and duration is minutes.
- Average ticket and prices are stored in the smallest currency unit (BRL cents) to avoid
  rounding.
- Editing the registry is performed by operator roles (admin/supervisor).
- "Recently created" interruption window for the deletion conflict uses a short fixed threshold
  (reasonable default; exact value set during planning).

## Dependencies

- Existing C3Bot domain (feature 001) and the **catalog (feature 005)**, which introduced a
  single `store` and store-level operating hours/`availability_schedules`. **This feature
  consolidates that store into the merchant** (resolved in Clarifications): the catalog hangs off
  the merchant and store opening-hours become the merchant's shift-based opening hours. A data
  migration maps the existing `store` row into the merchant profile.
- Constitution technology boundaries (local-first persistence; adapter-based external
  integration) — informs the plan, not the requirements here.

## Out of Scope

- Any synchronization (import/export) with the iFood Merchant API — only the destination-mappable
  registry is built now.
- **Multi-merchant / multi-tenant** — exactly one merchant per installation (single-store
  enriched).
- **Check-in QR code (PDF)** — deferred to a later iteration; not in this feature's scope.
- Real authentication/authorization provider integration (the 401/403 distinction is modeled, but
  the identity provider itself is out of scope).
- Editing the merchant's catalog (covered by feature 005).
- **Merchant removal / deletion** — single-store: the installation always has exactly one merchant
  (seeded from the catalog `store`); there is no delete-merchant flow and therefore no
  catalog/store cascade to define.
- **Cross-merchant external-reference duplication** — N/A under single-store (see FR-006); reserved
  for a future multi-merchant scope.
