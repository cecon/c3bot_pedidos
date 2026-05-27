# Feature Specification: WhatsApp Commerce Agent Workspace

**Feature Branch**: `001-whatsapp-commerce-agent`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Desktop workspace for WhatsApp attendants with sessions, chat, catalog, customers, scheduled orders, automation groups, dashboard, and campaigns."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure WhatsApp Session Chat (Priority: P1)

An administrator creates system users and attendants, signs in, adds WhatsApp
sessions by phone number, assigns attendants, and opens a dark chat workspace that
behaves like a WhatsApp operations queue.

**Why this priority**: Without authenticated access, session registration, and chat
operations, the product cannot serve its primary attendant workflow.

**Independent Test**: A tester can create a user, sign in, add a session by phone
number, select the session, send a message, and see it appended to the chat.

**Acceptance Scenarios**:

1. **Given** an administrator is authenticated, **When** they add a valid WhatsApp
   number, **Then** the session appears in the queue with status, attendant, and
   automation group fields.
2. **Given** an attendant opens a session, **When** they send a message, **Then** the
   message appears in the chat history with author, direction, and timestamp.
3. **Given** a user enters invalid credentials, **When** they try to access the
   workspace, **Then** the system blocks access and records the failed attempt.

---

### User Story 2 - Catalog and Scheduled Order Capture (Priority: P2)

An attendant uses a product catalog with photos, categories, descriptions, and prices
to assemble or schedule an order directly from the current customer conversation.

**Why this priority**: The WhatsApp agent must turn conversations into orders, not
only answer messages.

**Independent Test**: A tester can add a product with photo and price, open a chat,
create an order from that chat, schedule it, and see the order total.

**Acceptance Scenarios**:

1. **Given** products are active in the catalog, **When** an attendant selects items
   for a customer, **Then** the order contains item quantities, prices, and total.
2. **Given** a customer asks for later delivery, **When** the attendant chooses a
   schedule time, **Then** the order is marked scheduled and appears in the dashboard.
3. **Given** a product is inactive, **When** a new order is created, **Then** the
   inactive product is not offered for selection.

---

### User Story 3 - Customers, Addresses, and Orders Dashboard (Priority: P3)

Supervisors and attendants maintain customer records enriched by WhatsApp number,
manage addresses, and monitor scheduled and active orders from a dashboard.

**Why this priority**: Customer and address data reduce repeated questions and make
scheduled order operations reliable.

**Independent Test**: A tester can open a customer from a WhatsApp number, update
address enrichment state, and verify dashboard counts for scheduled, active, done,
and canceled orders.

**Acceptance Scenarios**:

1. **Given** a customer sends a message from a known number, **When** the session is
   opened, **Then** the customer profile and address enrichment state are visible.
2. **Given** an address enrichment provider returns a match, **When** the operator
   accepts it, **Then** the address is marked verified and linked to the customer.
3. **Given** orders change status, **When** the dashboard refreshes, **Then** the
   counts and revenue reflect the current order states.

---

### User Story 4 - Automation Groups for MCPs, Skills, and Agents (Priority: P4)

An administrator creates automation groups and links MCPs, skills, and agents to
each group so different WhatsApp sessions can use different automation behavior.

**Why this priority**: The agent platform needs controlled automation per session
or business group, not one global configuration.

**Independent Test**: A tester can create a group, attach one MCP, one skill, and one
agent, link a WhatsApp session to it, and confirm the group bindings are visible.

**Acceptance Scenarios**:

1. **Given** a group exists, **When** an administrator links a skill, **Then** the
   binding records type, name, enabled state, and group.
2. **Given** a session is assigned to a group, **When** automation decisions are
   evaluated, **Then** only enabled bindings from that group are eligible.

---

### User Story 5 - WhatsApp Campaigns (Priority: P5)

Marketing users create segmented WhatsApp campaigns, schedule messages, and monitor
sent and conversion counts while respecting session and customer data.

**Why this priority**: Campaigns are valuable after the core attendance and order
workflow is available.

**Independent Test**: A tester can create a campaign for a customer segment, schedule
it, and see status, sent count, and conversion count.

**Acceptance Scenarios**:

1. **Given** a customer segment exists, **When** a user schedules a campaign, **Then**
   the campaign is saved with segment, status, schedule, and template.
2. **Given** a campaign is running, **When** delivery events arrive, **Then** sent and
   conversion counts are updated.

### Edge Cases

- Duplicate WhatsApp numbers must not create duplicate sessions or customers.
- Offline or paused sessions must remain visible but must not send automated messages.
- Customers without verified addresses must be flagged before scheduled delivery.
- Password reset and user deactivation must prevent stale user access.
- Campaigns must not run outside allowed sending windows.
- Automation bindings disabled in a group must not be used by agent execution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require a username and password before workspace access.
- **FR-002**: System MUST allow administrators to create, update, deactivate, and
  list users.
- **FR-003**: System MUST allow administrators to create and manage attendants.
- **FR-004**: System MUST allow users to add WhatsApp sessions by phone number.
- **FR-005**: System MUST prevent duplicate active sessions for the same WhatsApp
  number.
- **FR-006**: System MUST show session status, assigned attendant, unread count, and
  last message time in the session queue.
- **FR-007**: System MUST show a chat timeline with inbound, outbound, and system
  messages for the selected session.
- **FR-008**: System MUST allow attendants to send outbound messages from a selected
  session.
- **FR-009**: System MUST maintain customers keyed by WhatsApp number.
- **FR-010**: System MUST store customer addresses with enrichment state.
- **FR-011**: System MUST allow products to have name, description, price, category,
  active state, and photo.
- **FR-012**: System MUST support creating orders from a current chat session.
- **FR-013**: System MUST support scheduled orders with date and time.
- **FR-014**: System MUST track order statuses from draft through completion or
  cancellation.
- **FR-015**: System MUST provide dashboard counts for scheduled, active, done, and
  canceled orders.
- **FR-016**: System MUST allow creation of automation groups.
- **FR-017**: System MUST allow MCPs, skills, and agents to be linked to automation
  groups with enabled or disabled state.
- **FR-018**: System MUST allow WhatsApp sessions to be linked to one automation group.
- **FR-019**: System MUST allow campaign creation by segment, schedule, status, and
  message template.
- **FR-020**: System MUST store all core workspace data locally.
- **FR-021**: System MUST keep session credentials and passwords out of plain logs and
  user-facing diagnostics.
- **FR-022**: System MUST expose enough testable domain behavior to support unit and
  mutation tests for formatting, normalization, status summaries, and routing rules.

### Key Entities

- **User**: Person allowed to access the system with username, password credential,
  role, and active state.
- **Attendant**: Operator who handles chats and may be assigned to sessions.
- **WhatsAppSession**: Phone-number-based session with status, assigned attendant,
  automation group, and message timeline.
- **Message**: Chat record with direction, author, body, timestamp, and session.
- **Customer**: Person or business identified by WhatsApp number, tags, notes, and
  addresses.
- **Address**: Customer delivery address with enrichment status and optional
  geolocation.
- **Product**: Catalog item with photo, category, price, and active state.
- **Order**: Customer purchase created from a session with status, schedule, total,
  and items.
- **AutomationGroup**: Group that contains enabled MCP, skill, and agent bindings.
- **Campaign**: Segmented outbound WhatsApp message workflow with schedule and status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A trained attendant can add a session and send a first message in under
  90 seconds.
- **SC-002**: A trained attendant can create a scheduled order from an active chat in
  under 3 minutes.
- **SC-003**: Dashboard totals match the order list for 100% of tested status changes.
- **SC-004**: Duplicate WhatsApp numbers are rejected in 100% of tested session and
  customer creation attempts.
- **SC-005**: Unit tests pass and mutation score for covered domain behavior remains
  at or above 85%.
- **SC-006**: The first workspace screen exposes sessions, chat, catalog, orders,
  automation groups, and campaigns without requiring navigation through a landing page.

## Assumptions

- The initial product is a desktop back-office application for attendants and
  supervisors.
- External WhatsApp session API behavior will be represented by an adapter boundary
  until real provider credentials are supplied.
- Address enrichment will be adapter-based and can start with manual verification.
- Local SQLite is the source of truth for the first release.
- Campaign compliance windows and opt-in rules will be configurable before production
  delivery.
