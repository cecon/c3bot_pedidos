# Data Model: Admin Route Layout

## AdminShell

Represents the persistent workspace frame.

**Fields**:

- `activeDestinationId`: currently selected navigation destination.
- `navigationGroups`: grouped primary menu items.
- `headerTitle`: title derived from the active destination.
- `statusSummary`: global workspace indicators such as online session counts.

**Relationships**:

- Contains many `NavigationGroup` values.
- Renders one active `WorkspaceSection` at a time.

**Validation Rules**:

- Must always resolve to a valid active destination.
- Must render header and navigation for every primary section.
- Must not render all primary sections as default visible content.

## NavigationDestination

Represents a directly reachable workspace section.

**Fields**:

- `id`: stable identifier such as `dashboard`, `sessions`, or `orders`.
- `path`: hash route segment such as `#/orders`.
- `label`: display name for menu and header.
- `groupId`: owning navigation group.
- `icon`: visual identifier selected from the existing icon set.
- `description`: short operational purpose.
- `isPrimary`: whether it appears in the main navigation.

**Relationships**:

- Belongs to one `NavigationGroup`.
- Maps to one `WorkspaceSection`.

**Validation Rules**:

- `id` and `path` must be unique.
- Primary destinations must have labels and groups.
- Unknown paths must resolve to the fallback destination.

## NavigationGroup

Represents related destinations in the admin menu.

**Fields**:

- `id`: stable group identifier.
- `label`: group name visible in the menu.
- `destinationIds`: ordered destination identifiers.

**Relationships**:

- Contains one or more `NavigationDestination` values when visible.

**Validation Rules**:

- Empty groups must not be rendered.
- Daily operations must be visually separate from administration/configuration.

## WorkspaceSection

Represents focused content for a single product function.

**Fields**:

- `destinationId`: destination that activates the section.
- `title`: section title shown in the header or page.
- `primaryContent`: focused functional content.
- `pageActions`: actions scoped to this section.
- `relatedContext`: optional side context directly supporting the section.

**Relationships**:

- Is activated by one `NavigationDestination`.
- May use shared workspace state from `NavigationContext`.

**Validation Rules**:

- Must not show unrelated primary modules by default.
- Page actions must not replace global header actions.
- Content must remain readable at common desktop window sizes.

## NavigationContext

Represents recoverable in-session state used across navigation.

**Fields**:

- `selectedSessionId`: selected WhatsApp session for chat pages.
- `sessionSearch`: current session queue search.
- `selectedOrderId`: selected order when an order detail exists.
- `orderFilters`: active order filter state.
- `dirtySectionIds`: sections with unsaved edits.

**Relationships**:

- Referenced by `AdminShell` and section components.

**Validation Rules**:

- Route changes must preserve in-memory context unless the operator explicitly
  clears it.
- Navigation away from dirty sections must warn or preserve edits.
- Invalid destination requests must not clear valid existing context.

## Route Resolution States

```text
requested path -> known destination -> active section
requested path -> unknown destination -> fallback destination + message
active section + clean state -> route change allowed
active section + dirty state -> warn or preserve before route change
```
