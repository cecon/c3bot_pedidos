# Feature Specification: Product Catalog (iFood-aligned, destination-mapped)

**Feature Branch**: `005-product-catalog`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "vamos desenvolver o catalogo, o catalogo deve contemplar que nao somos o destino final, quero que se baseie na documentaçao do ifood, assim nao erramos e usamos o pensamento que já funciona — https://developer.ifood.com.br/pt-BR/docs/references?category=FOOD"

## Context & Intent

C3Bot is an **operator workspace**, not the final fulfillment destination. The catalog
maintained here is an intermediary representation: attendants browse it to assemble
orders over WhatsApp, but the order is ultimately fulfilled by an **external destination**
(the store's real ordering/fulfillment channel). To avoid translation errors when an
assembled order is handed off in the future, the catalog **data model is shaped after the
iFood Food catalog structure** — a proven domain model — and every catalog element carries
a slot for an **external reference**, so a future integration can map it unambiguously to
the destination without redesigning the model.

The immediate goal of this feature is the **catalog data model/format** (and the operator
UI to maintain it), not live integration. This means the catalog must:

- Mirror the iFood-style hierarchy (store → catalog → category → product/item →
  option groups → options; plus pizza/combo templates).
- Reserve destination reference fields on every sellable element so a later integration
  fits without schema rework.
- Make it visible when an element is **not yet mapped**, so the data stays integration-ready.

Scope notes from clarification:

- **No synchronization now.** This feature delivers only the database format that matches
  the iFood strategy plus its maintenance UI. Integrations come later.
- **Single store per installation.** This is not a multi-tenant product; one installation
  serves exactly one store, so there is no merchant-selection or tenant isolation concern.
- **Pizza pricing strategy is a configuration setting,** chosen per pizza category/catalog,
  so new strategies can be added without changing the model.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintain the core catalog hierarchy (Priority: P1)

An operator builds and maintains the catalog as a structured hierarchy: the installation's
single store has one or more catalogs (per sales context, e.g. delivery), each catalog has
ordered categories, and each category contains products with a name, description, image,
price, and availability status. Each sellable product carries an external destination
reference field so it can be matched to the real fulfillment channel by a future integration.

**Why this priority**: Without a structured, browsable catalog there is nothing for
attendants to add to orders. This is the minimum viable slice — a usable catalog that an
attendant can read while assembling an order, with destination codes already attached so
the order can be handed off.

**Independent Test**: Create one delivery catalog, two ordered categories, and several
products with prices, images, and external codes; confirm an attendant can browse the
catalog by category, see prices and availability, and that each product shows its
destination reference (or a clear "not mapped" indicator).

**Acceptance Scenarios**:

1. **Given** an empty workspace, **When** the operator creates a delivery catalog, a
   category, and a product with a price and external code, **Then** the product appears
   under that category in the catalog with its price, image, status, and external reference.
2. **Given** a category with several products, **When** the operator reorders them,
   **Then** the catalog displays the products in the new order to attendants.
3. **Given** a product with a non-negative price, **When** the operator saves it without an
   external destination code, **Then** the product is saved but flagged as "not mapped to
   destination".
4. **Given** a product priced below zero or with an empty name, **When** the operator tries
   to save, **Then** the system rejects the save with a clear validation message.

---

### User Story 2 - Configure complements / option groups (Priority: P2)

An operator attaches option groups (iFood "complementos") to a product so it can be
customized — for example "Choose your side (pick 1)", "Add extras (pick up to 3)", or
"Remove ingredients". Each option group has quantity rules (minimum and maximum
selections) and contains options, each with its own price and availability, and its own
external destination reference.

**Why this priority**: Real food ordering almost always involves customization. Without
option groups the catalog can only represent trivial products, so this is the first major
expansion after the core hierarchy.

**Independent Test**: Add an option group "Pick a side (min 1, max 1)" with three priced
options to a product; confirm the rules and option prices are stored and shown, and that
an option missing its external code is flagged.

**Acceptance Scenarios**:

1. **Given** a product, **When** the operator adds an option group with min 1 / max 1 and
   three options, **Then** the option group and its options appear attached to the product
   with their prices.
2. **Given** an option group, **When** the operator sets maximum below minimum, **Then** the
   system rejects the configuration with a clear message.
3. **Given** an option group marked required (minimum ≥ 1), **When** an attendant views the
   product, **Then** the option group is clearly indicated as mandatory.

---

### User Story 3 - Control availability, pausing, and schedules (Priority: P3)

An operator controls what is sellable right now: marking categories, products, and options
as available or unavailable, temporarily **pausing** an item that is out of stock (with an
optional automatic return time), and defining availability schedules/shifts (days and time
windows) for categories or items.

**Why this priority**: Selling something that is out of stock or outside its serving hours
creates failed handoffs and customer frustration. Availability control protects order
quality once the catalog and complements exist.

**Independent Test**: Pause a product with a return time and define a category schedule for
weekday lunch; confirm the paused product is hidden from new orders until the return time,
and the scheduled category is only offered within its window.

**Acceptance Scenarios**:

1. **Given** an available product, **When** the operator pauses it as out of stock, **Then**
   it is excluded from new orders and shown as unavailable to attendants.
2. **Given** a paused product with an automatic return time, **When** that time passes,
   **Then** the product becomes available again without manual action.
3. **Given** a category with a lunch-only schedule, **When** the current time is outside the
   window, **Then** the category and its products are not offered for new orders.

---

### User Story 4 - Configure pizza and combo templates (Priority: P4)

An operator configures category templates beyond the default: a **pizza** template with
sizes (and slice counts), crusts, edges, and selectable flavors, where the **pricing
strategy is chosen from a configuration setting** (e.g. highest-flavor price, or average of
chosen flavors) so new strategies can be added later without redesign; and a **combo**
template that bundles multiple products. Each component carries its own external reference.

**Why this priority**: Pizza and combos are common but structurally complex. They build on
the core hierarchy and complements, so they come after those are stable.

**Independent Test**: Create a pizza category with two sizes, two crusts, and four flavors
priced by "highest flavor", then confirm a two-flavor selection prices using the higher of
the two flavors plus the chosen crust/edge.

**Acceptance Scenarios**:

1. **Given** a pizza category, **When** the operator defines sizes, crusts, edges, and
   flavors with a pricing strategy, **Then** an attendant can assemble a pizza by choosing
   size, crust, edge, and flavors, and sees the resulting price computed by that strategy.
2. **Given** a combo template, **When** the operator bundles three products at a combo
   price, **Then** the combo appears as a single sellable item referencing its components.

---

### User Story 5 - Validate destination mapping before handoff (Priority: P5)

Because C3Bot is not the final destination, an operator can review the catalog's mapping
health: see which categories, products, options, and template components are missing an
external destination reference, so the data stays **integration-ready** for when a future
destination integration is built.

**Why this priority**: This is the safeguard that makes "we are not the final destination"
real in the data model. It depends on the rest of the catalog existing first, so it is
sequenced last. With no integration yet, it is a **visibility/readiness review**, not an
order-blocking gate.

**Independent Test**: With a catalog where some products lack external codes, open the
mapping review and confirm exactly the unmapped elements are listed and that the catalog
reports a clear "ready / not ready for handoff" status.

**Acceptance Scenarios**:

1. **Given** a catalog with some unmapped products and options, **When** the operator opens
   the mapping review, **Then** every unmapped element is listed with its location in the
   hierarchy.
2. **Given** a fully mapped catalog, **When** the operator opens the mapping review, **Then**
   the catalog is reported as ready for handoff.
3. **Given** an attendant assembling an order, **When** they try to add an unmapped or
   unavailable product, **Then** the system prevents or clearly warns against it.

---

### Edge Cases

- What happens when a product is referenced by an active order and the operator deletes or
  pauses it? (Existing orders must retain the item; new orders must respect the change.)
- How does the system handle an external destination code that is duplicated across two
  different products?
- What happens to option groups when their parent product is deactivated?
- How is a pizza priced when no flavor is selected, or when the chosen flavors have no
  price under the selected strategy?
- What happens when a category schedule and an item pause disagree (scheduled-on but
  paused, or scheduled-off but available)?
- How does the catalog behave when the same product appears (is reused) in more than one
  category or as an option in an option group?
- What happens when an image fails to load or is missing for a product?

## Requirements *(mandatory)*

### Functional Requirements

**Catalog hierarchy (P1)**

- **FR-001**: System MUST represent the installation's single store, which owns one or more
  catalogs. The system MUST NOT require tenant/merchant selection (one store per installation).
- **FR-002**: System MUST support catalogs scoped to a sales context (e.g. delivery), each
  containing an ordered set of categories.
- **FR-003**: System MUST let operators create, edit, reorder, activate, and deactivate
  categories within a catalog.
- **FR-004**: System MUST let operators create products with a name, optional description,
  optional image, price, and availability status, and place them in a category with an
  explicit display order.
- **FR-005**: System MUST reject products with an empty name or a negative price.
- **FR-006**: System MUST store a promotional/original price alongside the current price so
  a discount can be expressed without losing the reference price.
- **FR-007**: System MUST allow a product to be reused across more than one category and as
  an option within option groups, without duplicating its definition.

**Store profile & catalog scheduling (P1)**

- **FR-027**: System MUST let the operator maintain the store profile: name, CNPJ, full
  address (street, number, neighborhood, city, state, postal code, complement), and
  geographic coordinates (latitude/longitude).
- **FR-028**: System MUST accept a CNPJ in the **new alphanumeric format** (letters allowed,
  effective Jul/2026) as well as the legacy 14-digit format; the field MUST NOT assume
  digits-only and MUST validate the check digits per the official rule for each format.
- **FR-029**: System MUST let the operator define the **store's operating hours per day of
  week** (multiple windows per day allowed; a day may be closed).
- **FR-030**: System MUST support multiple catalogs per store, each with its own name,
  products, prices, and **operating hours per day of week** (e.g. a breakfast catalog
  available only mornings), and MUST consider the catalog's windows when determining what is
  offered now.
- **FR-031**: System MUST let the operator create, edit, and remove catalogs and switch
  between them when maintaining the catalog.

**External destination mapping (P1 + P5)**

- **FR-008**: System MUST allow every sellable element (product, option, pizza/combo
  component) — and the store and each catalog — to carry an external destination reference
  code (external code). This code is **essential for future automation/integration** and
  MUST be editable directly in each element's editor.
- **FR-009**: System MUST clearly flag any sellable element that has no external destination
  reference as "not mapped to destination".
- **FR-010**: System MUST provide a mapping review that lists all unmapped or
  not-handoff-ready elements with their location in the hierarchy.
- **FR-011**: System MUST report an overall catalog "ready / not ready for handoff" status
  based on mapping completeness and availability.
- **FR-012**: System MUST prevent an attendant from adding an **unavailable** element to a
  new order, and MUST surface a non-blocking warning for **unmapped** elements (a missing
  external reference does not block ordering while no integration exists, but must be
  visible for integration-readiness).

**Complements / option groups (P2)**

- **FR-013**: System MUST allow operators to attach option groups (complementos) to a
  product, each with a name, minimum and maximum selectable quantities, and a required flag.
- **FR-014**: System MUST reject an option group whose maximum is less than its minimum.
- **FR-015**: System MUST allow each option within a group to have its own price,
  availability status, and external destination reference.
- **FR-016**: System MUST indicate to attendants which option groups are mandatory.

**Availability, pausing, and schedules (P3)**

- **FR-017**: System MUST let operators mark categories, products, and options as available
  or unavailable.
- **FR-018**: System MUST let operators temporarily pause a product/option (out of stock),
  optionally with an automatic return time, after which it becomes available again.
- **FR-019**: System MUST exclude unavailable, paused, and out-of-schedule elements from new
  orders while keeping them in the catalog for editing.
- **FR-020**: System MUST let operators define availability schedules (days and time
  windows) for categories and items, and honor them when determining what is sellable now.

**Pizza and combo templates (P4)**

- **FR-021**: System MUST support a pizza category template with configurable sizes (and
  slice counts), crusts, edges, and selectable flavors.
- **FR-022**: System MUST let the pizza pricing strategy be selected from a configuration
  setting (at minimum: highest-flavor price and average-of-selected-flavors), and the set of
  available strategies MUST be extensible without changing the catalog data model.
- **FR-023**: System MUST compute a pizza's price from the chosen size, crust, edge, and
  flavors according to the selected pricing strategy.
- **FR-024**: System MUST support a combo template that bundles multiple products into a
  single sellable item at a combo price, referencing its component products.

**Integrity**

- **FR-025**: System MUST preserve items already captured in existing orders even when the
  underlying catalog element is later changed, paused, or removed.
- **FR-026**: System MUST keep destination reference codes unique within a destination, or
  clearly flag duplicates.

### Key Entities *(include if feature involves data)*

- **Store**: the single store of this installation; owns the catalogs. Key attributes:
  name, **CNPJ** (accepts the new alphanumeric format effective Jul/2026, not digits-only),
  **address** (street, number, neighborhood, city, state, postal code, complement) including
  **geographic coordinates** (latitude/longitude), **operating hours per day of week**,
  external destination identifier (reserved for future integration), status. There is
  exactly one store per installation (no multi-tenant collection).
- **Catalog**: a named set of categories scoped to a sales context (e.g. delivery, indoor).
  Key attributes: name, context, **operating hours per day of week** (a catalog such as
  "Café da Manhã" may have its own products, prices, and serving windows distinct from other
  catalogs), external destination identifier, status.
- **Category**: an ordered grouping of products within a catalog. Key attributes: name,
  display order, status, template type (default | pizza | combo), optional schedule.
- **Product**: a reusable base definition. Key attributes: name, description, image(s),
  external destination reference, status. Reusable across categories and as options.
- **Item / Listing**: a product placed in a category with commercial attributes. Key
  attributes: price, promotional/original price, display order, selling option (by unit or
  by weight, minimum/increment), status, external destination reference.
- **Option Group (Complemento)**: a set of selectable modifiers attached to a product. Key
  attributes: name, minimum quantity, maximum quantity, required flag, status.
- **Option**: a selectable modifier within an option group, referencing a product. Key
  attributes: price, status, external destination reference.
- **Pizza Template**: configuration for a pizza category. Key attributes: sizes (with slice
  counts), crusts, edges, flavors (each a product/item), and a **pricing strategy selected
  from a configurable setting** (extensible).
- **Combo Template**: a bundle of component products sold as one item at a combo price.
- **Availability / Schedule**: status (available, unavailable, paused) with optional return
  time, plus day/time windows (per day of week, multiple windows allowed) applied at any
  level — **store, catalog, category, or item**.
- **External Mapping**: the destination reference (code/identifier) and handoff-readiness
  state associated with a sellable element.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can create a complete basic catalog (one catalog, three categories,
  and ten products with prices, images, and external codes) in under 15 minutes.
- **SC-002**: An attendant can locate any product in a catalog of at least 200 products and
  add it to an order in under 10 seconds.
- **SC-003**: 100% of products, options, and template components that lack an external
  destination reference are surfaced in the mapping review (no unmapped element is hidden).
- **SC-004**: 0 orders can be assembled from **unavailable** catalog elements; 100% of
  **unmapped** elements added to an order trigger a visible (non-blocking) warning.
- **SC-005**: Pizza price computation matches the configured pricing strategy for 100% of
  flavor combinations tested.
- **SC-006**: A paused product with a return time becomes available again within one minute
  of that time, with no manual intervention.
- **SC-007**: The catalog's "ready / not ready for handoff" status correctly reflects
  mapping and availability completeness in 100% of validation checks.

## Assumptions

- The catalog is **authored and maintained locally** in C3Bot (local-first). The deliverable
  of this feature is the **catalog data model/format plus its maintenance UI** — shaped so a
  future integration can map it to a destination via reference fields. **No synchronization
  (import/export) with any destination provider is built now**; integrations are a later,
  separate effort.
- The **iFood Food catalog model is used only as the structural blueprint** (proven domain
  shape). This feature does not depend on calling iFood APIs; external references are plain
  fields reserved on the model.
- Prices are stored as a non-negative amount in the store's currency (BRL), expressed in the
  smallest currency unit to avoid rounding errors.
- The product is **single-store, single-tenant**: exactly one store per installation, with
  no merchant/tenant selection or isolation.
- Reuses the existing C3Bot order model: catalog elements feed order items, and existing
  order/customer/session entities are not redefined here.
- Pizza pricing strategy is chosen from a **configuration setting**; v1 ships "highest flavor"
  and "average of selected flavors", and the strategy set is extensible without model changes.
- Catalog editing is performed by operator roles (admin/supervisor); attendants consume the
  catalog when assembling orders but do not author it.

## Dependencies

- Existing C3Bot domain entities: Product (to be expanded by this feature), Order, OrderItem,
  Customer, WhatsAppSession, User/roles (from `001-whatsapp-commerce-agent`).
- Constitution technology boundaries (local-first SQLite persistence; adapter-based external
  integration) — informs the plan, not the requirements here.

## Out of Scope

- Any synchronization (import/export) with iFood or any destination provider — only the
  destination-mappable data format is built now; integrations come later.
- Multi-tenant / multi-store support (one store per installation).
- Inventory/stock-count management beyond simple available/paused state.
- Promotions/coupons engine beyond a single promotional/original price per item.
- Customer-facing catalog browsing UI (this catalog is for operators/attendants).
