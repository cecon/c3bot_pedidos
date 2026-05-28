# Research: Delivery Attendants

## Decision: Extend The Existing Attendant Model

**Rationale**: The product already has `Attendant` in the domain, an `attendants`
SQLite table, and WhatsApp sessions referencing `assigned_attendant_id`. Extending
that model keeps traceability from session to human owner and avoids a duplicate
employee concept.

**Alternatives considered**:

- Create a separate employee module and map employees to attendants. Rejected because
  the requested users are specifically human delivery attendants, not a broader HR
  model.
- Store attendants only in frontend state for this slice. Rejected because the
  requirement explicitly includes database persistence for the photo.

## Decision: Add A Dedicated Administration Route

**Rationale**: The first screen must be the attendants list and the existing admin
shell already supports focused destinations. Adding `#/delivery-attendants` keeps the
page directly reachable and separates staff administration from sessions, orders, and
settings.

**Alternatives considered**:

- Put the table inside Settings. Rejected because the user asked for a new menu and a
  first-view list.
- Put the table inside Sessions. Rejected because managing attendants is a staff
  administration workflow, while sessions should stay focused on chat operations.

## Decision: Keep Availability Separate From Active/Deleted State

**Rationale**: Online/offline answers whether an attendant can receive new transfers.
Active/inactive answers whether the record remains manageable and selectable in new
workflows. Keeping them separate allows historical session references to remain
accountable while preventing transfers to unavailable people.

**Alternatives considered**:

- Reuse the existing `active` flag as online/offline. Rejected because deleting or
  deactivating a record has different meaning from being offline for the moment.
- Infer availability from recent activity. Rejected because the requirement asks for
  explicit online/offline row actions.

## Decision: Store Local Photos As Base64 Image Data With Guardrails

**Rationale**: The requirement states that employee photos must be stored in the
database as Base64. Keeping this local and validating image type/size lets the UI show
the photo without external file paths while limiting database growth.

**Alternatives considered**:

- Store only a filesystem path. Rejected because it does not satisfy the Base64
  database requirement.
- Upload photos to an external object store. Rejected because the constitution favors
  local-first storage and no external photo dependency is required.

## Decision: Centralize Transfer Eligibility In A Domain Helper

**Rationale**: "Offline attendants cannot receive transferred sessions" is a shared
business rule. A tested helper can be reused by the session transfer UI, list actions,
and future repository-backed flows without duplicating filter logic.

**Alternatives considered**:

- Filter offline attendants inline in the transfer component only. Rejected because
  the rule would be easy to bypass from another transfer surface.
- Let the repository return only online attendants everywhere. Rejected because the
  management list still needs to show offline attendants.

## Decision: Use Soft Deletion For Attendants With History

**Rationale**: WhatsApp sessions and historical messages/orders must remain traceable
to the human who handled them. A delete action can remove an attendant from active
management while preserving historical identity, and it can be blocked when active
sessions still require an accountable owner.

**Alternatives considered**:

- Physically delete attendant rows unconditionally. Rejected because assigned session
  history would lose its human reference.
- Forbid all deletion forever. Rejected because administrators need a way to clean up
  the active management list.
