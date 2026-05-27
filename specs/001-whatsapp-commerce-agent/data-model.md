# Data Model: WhatsApp Commerce Agent Workspace

## User

- `id`: stable identifier
- `username`: unique login name
- `password_hash`: one-way password hash
- `role`: admin, supervisor, attendant
- `active`: access flag
- Relationship: may create or modify sessions, orders, catalog, campaigns, and groups

## Attendant

- `id`, `name`, `whatsapp_number`, `active`
- Relationship: assigned to WhatsApp sessions and outbound messages

## WhatsAppSession

- `id`, `display_name`, `phone_number`, `status`, `assigned_attendant_id`,
  `automation_group_id`, `last_sync_at`
- Validation: one active session per phone number
- State transitions: connecting -> connected -> paused/offline; paused/offline must not
  send automated messages

## Message

- `id`, `session_id`, `direction`, `author`, `body`, `sent_at`
- Validation: direction is inbound, outbound, or system

## Customer

- `id`, `name`, `whatsapp_number`, `document`, `tags`, `notes`
- Validation: WhatsApp number is unique
- Relationship: owns addresses and orders

## CustomerAddress

- `id`, `customer_id`, `label`, street fields, city, state, postal code, optional
  geolocation, `enrichment_status`
- State transitions: pending -> verified or failed

## Product

- `id`, `name`, `description`, `price_cents`, `category`, `image_url`, `active`
- Validation: price must be non-negative; inactive products are hidden from new orders

## Order

- `id`, `customer_id`, `whatsapp_session_id`, `status`, `scheduled_for`,
  `total_cents`, `created_at`
- State transitions: draft -> scheduled/confirmed -> preparing -> out_for_delivery ->
  done; any non-final state may become canceled

## OrderItem

- `id`, `order_id`, `product_id`, `quantity`, `unit_price_cents`, `notes`
- Validation: quantity greater than zero; unit price non-negative

## AutomationGroup

- `id`, `name`, `description`, `active`
- Relationship: linked to sessions and automation bindings

## AutomationBinding

- `id`, `group_id`, `binding_type`, `binding_ref`, `enabled`
- Validation: binding type is mcp, skill, or agent

## Campaign

- `id`, `name`, `channel`, `segment`, `status`, `scheduled_for`,
  `message_template`
- State transitions: draft -> scheduled -> running -> paused/finished
