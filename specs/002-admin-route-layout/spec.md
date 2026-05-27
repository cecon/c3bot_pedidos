# Feature Specification: Admin Route Layout

**Feature Branch**: `002-admin-route-layout`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "The UI is currently concentrated in a single window. It needs an admin-style model with menus, a header, and route-based navigation so each function is separated more clearly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate an Admin Workspace (Priority: P1)

An operator opens the workspace and uses a persistent admin menu and header to move
between the main functions without scanning one crowded all-in-one screen.

**Why this priority**: The current layout mixes too many functions in one view, making
the product harder to operate as the number of modules grows.

**Independent Test**: A tester can open the workspace, see the persistent navigation,
select each primary function, and confirm that the selected section becomes the only
primary content area shown.

**Acceptance Scenarios**:

1. **Given** the operator opens the workspace, **When** the first screen loads,
   **Then** a persistent header, navigation menu, and focused work area are visible.
2. **Given** the operator is in any section, **When** they select another primary menu
   item, **Then** the main content changes to that function and the active menu item is
   clearly highlighted.
3. **Given** the operator needs to access sessions, catalog, orders, customers,
   automation groups, or campaigns, **When** they use the menu, **Then** each function
   is reachable without scrolling through unrelated panels.

---

### User Story 2 - Work in Focused Function Pages (Priority: P2)

An attendant or supervisor works inside one function at a time, with page-specific
actions and information instead of every module competing for attention.

**Why this priority**: Separating functions reduces visual noise and makes repeated
operational work faster and less error-prone.

**Independent Test**: A tester can open chat, catalog, orders, automation groups, and
campaigns and verify that each page contains only the controls and summaries relevant
to that function by default.

**Acceptance Scenarios**:

1. **Given** an attendant opens the chat section, **When** they select a session,
   **Then** the page focuses on the session queue, conversation, and related customer
   context without showing unrelated catalog or campaign management panels by default.
2. **Given** a supervisor opens the orders section, **When** they review scheduled and
   active orders, **Then** order filters, status summaries, and order actions are
   available without unrelated chat or automation configuration panels.
3. **Given** an administrator opens automation groups, **When** they manage bindings,
   **Then** the page focuses on groups, MCPs, skills, and agents without unrelated
   order or campaign editing controls.

---

### User Story 3 - Keep Navigation Context Stable (Priority: P3)

An operator can move across sections while the workspace preserves useful context,
handles invalid destinations safely, and avoids accidental loss of in-progress work.

**Why this priority**: Admin navigation must feel predictable; operators should not
lose their place or work when switching between operational sections.

**Independent Test**: A tester can navigate between sections, return to a previously
visited section, and confirm that active selection or filters are retained where
appropriate.

**Acceptance Scenarios**:

1. **Given** an operator selected a session or applied order filters, **When** they
   visit another section and return during the same work session, **Then** the relevant
   selection or filters are restored.
2. **Given** the operator has unsaved edits, **When** they try to leave the section,
   **Then** the workspace warns them or keeps the edits safe before navigation.
3. **Given** an unavailable or unknown destination is opened, **When** the workspace
   resolves it, **Then** the operator is sent to a safe workspace section with a clear
   message.

---

### User Story 4 - Scale the Admin Menu (Priority: P4)

An administrator can see a navigation model that is ready for additional modules and
does not become cluttered as the product grows.

**Why this priority**: C3Bot already contains several operational domains, and the
navigation must stay understandable as new admin modules are added.

**Independent Test**: A tester can review the menu organization and confirm that
primary functions are grouped consistently, with room for future admin settings.

**Acceptance Scenarios**:

1. **Given** the workspace has multiple modules, **When** the operator reviews the
   menu, **Then** related functions are grouped with clear labels.
2. **Given** the window is narrower than usual, **When** the operator continues using
   the workspace, **Then** navigation remains accessible without content overlap.
3. **Given** the operator needs global account or workspace actions, **When** they use
   the header, **Then** those actions are separate from page-specific actions.

### Edge Cases

- Unknown or unavailable destinations must not leave the workspace blank.
- Navigation must not discard unsaved form edits without warning or preservation.
- A focused page may show related side context, but it must not default to showing all
  primary modules at once.
- Smaller desktop window sizes must not cause header, menu, or content text to overlap.
- The active destination must remain clear after refresh, restart, or returning from a
  secondary detail view.
- Menu groups with no available items for the current user must not create empty or
  confusing navigation sections.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the all-in-one workspace presentation with an
  admin-style shell containing persistent primary navigation, a header, and a focused
  main content area.
- **FR-002**: System MUST provide separate navigation destinations for dashboard,
  sessions and chat, catalog, orders, customers, automation groups, campaigns, and
  workspace settings or administration.
- **FR-003**: System MUST show the current section name and clearly indicate the active
  navigation item.
- **FR-004**: System MUST keep the header and primary navigation available when moving
  between workspace sections.
- **FR-005**: System MUST show only the selected primary function as the default main
  content, while allowing related detail or side context when it directly supports that
  function.
- **FR-006**: System MUST support direct navigation to each primary function so an
  operator can open or return to a specific workspace destination.
- **FR-007**: System MUST preserve useful in-session context, such as selected session,
  selected order, or active filters, when the operator leaves and returns to a section.
- **FR-008**: System MUST warn the operator or preserve changes when navigation would
  otherwise discard unsaved edits.
- **FR-009**: System MUST handle unknown, unavailable, or restricted destinations by
  sending the operator to a safe workspace section with an understandable message.
- **FR-010**: System MUST group navigation items in a way that separates daily
  operations from configuration or administration.
- **FR-011**: System MUST keep global actions in the header separate from page-specific
  actions inside each section.
- **FR-012**: System MUST remain usable at common desktop window sizes without
  overlapping header, menu, or content text.
- **FR-013**: System MUST support keyboard-accessible navigation between primary
  sections.
- **FR-014**: System MUST keep the first screen as an operational workspace view, not a
  marketing, onboarding, or decorative landing page.
- **FR-015**: System MUST retain the existing workspace functions while changing how
  they are organized and reached.

### Key Entities

- **Admin Shell**: The persistent workspace frame that contains the header, primary
  navigation, and main content area.
- **Navigation Destination**: A primary workspace section that can be opened directly,
  highlighted, and returned to.
- **Navigation Group**: A labeled set of related destinations, such as operations or
  administration.
- **Workspace Section**: The focused page for one product function, including its
  summaries, actions, lists, and detail context.
- **Navigation Context**: The active destination and recoverable state such as selected
  item, filters, and in-progress edits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A trained operator can reach any primary function from any other primary
  function in no more than two interactions.
- **SC-002**: 100% of primary functions have a distinct navigation destination with a
  visible active state.
- **SC-003**: In a usability review, at least 90% of testers can identify the current
  section within 5 seconds.
- **SC-004**: At common desktop window sizes, no header, menu, or primary content text
  overlaps during navigation checks.
- **SC-005**: Switching between primary sections presents the requested content in
  under 1 second during local workspace use.
- **SC-006**: No primary function page shows all other primary modules by default.

## Assumptions

- The existing workspace functions remain in scope and are reorganized rather than
  removed.
- Dashboard or operations overview is an acceptable first workspace destination as long
  as it is useful for daily work.
- Role-based access rules are not expanded by this feature; navigation visibility
  follows the access model already available to the workspace.
- Direct navigation destinations apply inside the desktop workspace and do not imply
  public sharing links.
- Detailed visual styling will follow the existing dark operator-grade direction from
  the project constitution.
