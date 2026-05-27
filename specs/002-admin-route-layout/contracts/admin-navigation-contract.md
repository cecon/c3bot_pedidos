# Contract: Admin Navigation

## Purpose

Define the user-facing route and shell behavior for the admin workspace.

## Primary Destinations

| Destination | Route | Group | Required Content |
|-------------|-------|-------|------------------|
| Dashboard | `#/dashboard` | Operations | Operational summary and status metrics |
| Sessions | `#/sessions` | Operations | Session queue, chat, composer, customer context |
| Catalog | `#/catalog` | Operations | Product list and product creation controls |
| Orders | `#/orders` | Operations | Order summaries, filters, schedule action, order list |
| Customers | `#/customers` | Operations | Customer list or summary with address state |
| Automation Groups | `#/automation-groups` | Administration | Group list and MCP/skill/agent bindings |
| Campaigns | `#/campaigns` | Administration | Campaign list, message draft, segment controls |
| Settings | `#/settings` | Administration | Workspace/admin placeholders or settings summary |

## Shell Regions

- Sidebar navigation is visible for all destinations.
- Header is visible for all destinations.
- Header shows current destination label and global workspace indicators.
- Main content shows exactly one primary destination by default.
- Page-specific actions live inside the active destination content.

## Route Behavior

- Opening an empty or root route resolves to `#/dashboard`.
- Opening a known route activates the matching destination.
- Opening an unknown route resolves to `#/dashboard` and shows a clear message.
- Active navigation item must be visually distinct.
- Route switching must not reset selected session, search, filters, or form values
  unless the operator takes a clearing action.

## Accessibility And Keyboard Behavior

- Primary navigation items are reachable by keyboard.
- Navigation items expose readable labels.
- Active state is available visually and through semantic state.
- Focus must not become trapped after route changes.

## Acceptance Checks

- From any destination, every other primary destination is reachable in no more than
  two interactions.
- No destination renders the full set of unrelated primary modules by default.
- Header, sidebar, and content do not overlap at common desktop window sizes.
