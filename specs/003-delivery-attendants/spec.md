# Feature Specification: Delivery Attendants

**Feature Branch**: `003-delivery-attendants`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "Create a new menu and employee table for human delivery attendants. The employee record must include name, display name, required WhatsApp phone, online/offline status, and an optional photo stored as Base64 image data. Offline employees cannot receive transferred sessions. The first view must show the employee list with an add button and row actions to edit, delete, set online, and set offline."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Delivery Attendants (Priority: P1)

An administrator opens the delivery attendants menu and sees a focused employee list
as the first page, with a clear action to add a new attendant and per-row controls for
managing each existing attendant.

**Why this priority**: The team needs a dedicated operational area before attendants
can be managed or used as human transfer targets.

**Independent Test**: A tester can open the new menu, confirm that the first view is
the attendants list, and verify that each listed attendant exposes edit, delete, set
online, and set offline actions as appropriate for the current status.

**Acceptance Scenarios**:

1. **Given** the administrator is in the admin workspace, **When** they open the
   delivery attendants menu, **Then** the first view shows a table of attendants and
   an action to add a new attendant.
2. **Given** attendants already exist, **When** the list is displayed, **Then** each
   row shows the attendant identity, WhatsApp phone, availability status, photo when
   available, and row actions.
3. **Given** no attendants exist, **When** the page opens, **Then** the administrator
   sees an empty state with a clear option to add the first attendant.

---

### User Story 2 - Create and Edit Attendants (Priority: P2)

An administrator creates or updates a human delivery attendant by providing the
required identity and contact information, choosing a display name used in operational
screens, and optionally adding a profile photo.

**Why this priority**: Accurate attendant identity and contact data are required before
sessions can be assigned to humans.

**Independent Test**: A tester can add a new attendant with name, display name,
WhatsApp phone, and photo, save it, and confirm that the saved record appears in the
list and can be edited later.

**Acceptance Scenarios**:

1. **Given** the administrator starts adding a new attendant, **When** they submit a
   valid name, display name, required WhatsApp phone, and optional photo, **Then** the
   attendant is saved and appears in the list.
2. **Given** required fields are missing or invalid, **When** the administrator tries
   to save, **Then** the system blocks the save and identifies the fields that need
   correction.
3. **Given** an existing attendant is edited, **When** the administrator saves valid
   changes, **Then** the list and any attendant selection labels reflect the updated
   information.

---

### User Story 3 - Control Transfer Availability (Priority: P3)

An administrator or operator manages whether each human attendant is online or
offline, and the system prevents delivery sessions from being transferred to offline
attendants.

**Why this priority**: Availability is a business rule for safe session transfer; an
offline attendant must not receive work.

**Independent Test**: A tester can switch an attendant offline, attempt to transfer a
session, and confirm that the offline attendant is not available as a valid transfer
target.

**Acceptance Scenarios**:

1. **Given** an attendant is online, **When** the administrator selects the set offline
   action, **Then** the attendant status changes to offline and the row offers the set
   online action.
2. **Given** an attendant is offline, **When** the administrator selects the set online
   action, **Then** the attendant status changes to online and the row offers the set
   offline action.
3. **Given** a delivery session is being transferred, **When** an attendant is offline,
   **Then** that attendant cannot be selected as the transfer destination.

### Edge Cases

- The list must remain usable when there are no attendants yet.
- Required fields must not be accepted when blank, whitespace-only, or visibly invalid.
- Two active attendant records must not share the same WhatsApp phone number.
- A profile photo that cannot be read as an image must be rejected with a clear message.
- A saved attendant without a photo must still appear in the list with a usable visual
  placeholder.
- Deleting an attendant with active assigned sessions must not leave those sessions
  without an accountable human owner.
- Setting an attendant offline must not remove their existing session history, but it
  must block new transfers to that attendant.
- The status action shown for a row must match the current state, so online attendants
  offer an offline action and offline attendants offer an online action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated admin navigation destination for human
  delivery attendants.
- **FR-002**: System MUST make the attendants list the first view shown when the
  delivery attendants destination is opened.
- **FR-003**: System MUST provide a clear action from the list view to add a new
  attendant.
- **FR-004**: System MUST show attendants in a table or equivalent structured list
  that includes name, display name, WhatsApp phone, online/offline status, and photo
  or photo placeholder.
- **FR-005**: System MUST provide per-attendant actions to edit, delete, set online,
  and set offline, using recognizable icons with accessible labels.
- **FR-006**: System MUST request name, display name, and WhatsApp phone when creating
  or editing an attendant.
- **FR-007**: System MUST require name, display name, and WhatsApp phone before an
  attendant can be saved.
- **FR-008**: System MUST validate that the WhatsApp phone value is usable for contact
  and is not already assigned to another active attendant.
- **FR-009**: System MUST allow an administrator to attach or replace an attendant
  photo.
- **FR-010**: System MUST persist an attached attendant photo as Base64-encoded image
  data on the attendant record.
- **FR-011**: System MUST show the saved attendant photo in the list and edit view
  when a photo exists.
- **FR-012**: System MUST assign every attendant an online or offline status.
- **FR-013**: System MUST create new attendants as offline until an administrator
  explicitly marks them online.
- **FR-014**: System MUST update an attendant status from the list without requiring
  the administrator to open the edit form.
- **FR-015**: System MUST prevent offline attendants from being selected as valid
  transfer destinations for delivery sessions.
- **FR-016**: System MUST show a clear explanation when a transfer cannot proceed
  because no eligible online attendant is available.
- **FR-017**: System MUST ask for confirmation before deleting an attendant.
- **FR-018**: System MUST prevent deletion when it would leave active assigned
  sessions without an accountable attendant, and MUST explain what must be resolved
  first.
- **FR-019**: System MUST use the display name as the primary operational label for
  attendant selection and session transfer screens.
- **FR-020**: System MUST keep the page aligned with the existing admin navigation
  layout so the header, menu, and content remain consistent with the rest of the
  workspace.

### Key Entities

- **Delivery Attendant**: A human employee who can receive delivery session transfers;
  has a name, display name, WhatsApp phone, optional profile photo, and availability
  status.
- **Availability Status**: The current online or offline state that determines whether
  the attendant is eligible to receive transferred sessions.
- **Attendant Photo**: The profile image associated with a delivery attendant and
  retained as Base64-encoded image data when provided.
- **Session Transfer Target**: An attendant shown as eligible during delivery session
  transfer only when their availability status is online.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can reach the delivery attendants list from any primary
  admin section in no more than two interactions.
- **SC-002**: 100% of saved attendants appear in the list with display name, WhatsApp
  phone, and current availability status visible.
- **SC-003**: An administrator can create a valid attendant record, including a photo
  when desired, in under 2 minutes.
- **SC-004**: In transfer eligibility checks, 0 offline attendants can be selected as
  successful transfer destinations.
- **SC-005**: At least 95% of invalid save attempts identify the missing or invalid
  field that prevented saving.
- **SC-006**: In a usability review, at least 90% of testers can identify whether an
  attendant is online or offline within 5 seconds of viewing the list.

## Assumptions

- "Employee" in this feature means a human delivery attendant, not a full HR employee
  management module.
- Existing workspace permissions determine who can manage attendants.
- Employee photos are optional unless a later requirement makes them mandatory.
- WhatsApp phone numbers are unique across active attendants.
- Deleting an attendant removes them from the active management list, while historical
  session records may keep the attendant identity needed for audit or support.
- Taking an attendant offline affects future transfer eligibility and does not
  automatically close or reassign already active sessions.
