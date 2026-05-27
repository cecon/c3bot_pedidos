# Contract: Workspace Sections

## Purpose

Define how existing functions are separated into focused admin pages while preserving
the current workspace capabilities.

## Section Responsibilities

### Dashboard

- Shows operational metrics derived from sessions and orders.
- Provides quick orientation, not a marketing landing page.
- May link to sessions, orders, campaigns, and automation groups.

### Sessions

- Shows the session queue and selected chat as the primary workflow.
- Includes message composer and channel mode controls.
- May show customer context only when it supports the selected chat.

### Catalog

- Shows product creation and product list.
- Does not show chat, campaigns, or automation controls by default.

### Orders

- Shows order metrics, schedule action, filters, and order list.
- May use the currently selected chat/customer to schedule an order.

### Customers

- Shows customer records and address enrichment state.
- May link back to sessions or orders for a selected customer.

### Automation Groups

- Shows group cards and MCP/skill/agent bindings.
- Does not show catalog, order, or campaign editing by default.

### Campaigns

- Shows campaign list, segment selection, message template, and campaign creation
  controls.
- Does not show chat or order workflow by default.

### Settings

- Shows workspace/admin configuration entry points that do not belong to daily
  operations pages.

## Shared State Contract

- Existing mock data remains the source for initial UI content.
- Selected session survives route switches during the same app session.
- Session search survives route switches during the same app session.
- Product and campaign draft inputs are preserved unless submitted or cleared.
- Order summary remains derived from the current order list.

## Error And Empty States

- Empty lists show a focused empty state for that section.
- Unknown destinations use the admin shell fallback.
- Missing selected entities choose the first available valid entity where reasonable.
- No section may render a blank primary content area for a valid route.
