# Contracts: UI and Adapter Boundaries

## Workspace UI Contract

- The first rendered screen MUST expose session queue, active chat, and operations
  tabs for catalog, orders, automation groups, and campaigns.
- Selecting a session MUST update chat messages and customer context without leaving
  the workspace.
- Creating a session MUST require a WhatsApp number and MUST normalize common
  Brazilian phone input.
- Creating a scheduled order from chat MUST link order, customer, and session.
- Catalog products MUST include a visual image, name, description, category, price,
  and active state.

## Session API Adapter Contract

```ts
interface SessionApiAdapter {
  connect(phoneNumber: string): Promise<{ sessionId: string; status: "connecting" | "connected" }>;
  disconnect(sessionId: string): Promise<void>;
  sendMessage(sessionId: string, body: string): Promise<{ providerMessageId: string; sentAt: string }>;
  getStatus(sessionId: string): Promise<"connected" | "connecting" | "paused" | "offline">;
}
```

## Address Enrichment Adapter Contract

```ts
interface AddressEnrichmentAdapter {
  enrich(input: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }): Promise<{
    status: "verified" | "failed";
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
  }>;
}
```

## Automation Registry Contract

```ts
interface AutomationRegistry {
  listMcpServers(): Promise<Array<{ id: string; name: string; enabled: boolean }>>;
  listSkills(): Promise<Array<{ id: string; name: string; enabled: boolean }>>;
  listAgents(): Promise<Array<{ id: string; name: string; enabled: boolean }>>;
  resolveGroup(groupId: string): Promise<Array<{ type: "mcp" | "skill" | "agent"; ref: string }>>;
}
```

## Campaign Adapter Contract

```ts
interface CampaignAdapter {
  schedule(campaignId: string): Promise<{ status: "scheduled" }>;
  pause(campaignId: string): Promise<{ status: "paused" }>;
  metrics(campaignId: string): Promise<{ sent: number; conversions: number }>;
}
```
