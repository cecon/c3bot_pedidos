import { Badge, Box, Button, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { KeyRound, Settings, ShieldCheck, UserCheck } from "./icons";
import type { CatalogSubPageId, DestinationId } from "../domain/navigation";
import type { OrderSummary } from "../domain/analytics";
import type {
  Attendant,
  AttendantDeleteHandler,
  AttendantMutationHandler,
  AttendantPersistenceState,
  AttendantUpdateHandler,
  AutomationBinding,
  AutomationGroup,
  AvailabilityStatus,
  Campaign,
  Customer,
  Message,
  Order,
  Product,
  SessionStatus,
  SessionTransferTarget,
  WhatsAppSession,
} from "../domain/types";
import { AttendantsPanel } from "./AttendantsPanel";
import { AutomationGroupsPanel } from "./AutomationGroupsPanel";
import { CampaignsPanel } from "./CampaignsPanel";
import { CatalogWorkspace } from "./CatalogWorkspace";
import { MerchantWorkspace } from "./MerchantWorkspace";
import { ApiDocsPanel } from "./ApiDocsPanel";
import { ChatPanel } from "./ChatPanel";
import { CustomersPanel } from "./CustomersPanel";
import { DashboardPanel } from "./DashboardPanel";
import { OrdersPanel } from "./OrdersPanel";
import { SessionPanel } from "./SessionPanel";

export interface WorkspaceRoutesProps {
  activeDestinationId: DestinationId;
  activeSubPageId?: CatalogSubPageId;
  activeSessionCountByAttendant: Record<string, number>;
  attendantPersistenceState: AttendantPersistenceState;
  attendants: Attendant[];
  automationBindings: AutomationBinding[];
  automationGroups: AutomationGroup[];
  campaignMessage: string;
  campaignSegment: string;
  campaigns: Campaign[];
  channelMode: string;
  composer: string;
  currentCustomer?: Customer;
  currentMessages: Message[];
  currentSession?: WhatsAppSession;
  customers: Customer[];
  navigateToDestination: (destinationId: DestinationId) => void;
  newSessionNumber: string;
  onCreateAttendant: AttendantMutationHandler;
  onDeleteAttendant: AttendantDeleteHandler;
  onAddProduct: () => void;
  onAddSession: () => void;
  onCampaignMessageChange: (value: string) => void;
  onCampaignSegmentChange: (value: string) => void;
  onChannelModeChange: (value: string) => void;
  onComposerChange: (value: string) => void;
  onNewSessionNumberChange: (value: string) => void;
  onProductNameChange: (value: string) => void;
  onProductPriceChange: (value: number | string) => void;
  onScheduleOrder: () => void;
  onSearchChange: (value: string) => void;
  onSetAttendantAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void | Promise<void>;
  onSelectSession: (sessionId: string) => void;
  onSendMessage: () => void;
  onTransferSession: (sessionId: string, attendantId: string) => void;
  onUpdateAttendant: AttendantUpdateHandler;
  orderRows: Order[];
  productName: string;
  productPrice: number | string;
  productRows: Product[];
  search: string;
  sessionCounts: Record<SessionStatus, number>;
  summary: OrderSummary;
  transferBlockedReason?: string;
  transferTargets: SessionTransferTarget[];
  visibleSessions: WhatsAppSession[];
}

export function WorkspaceRoutes(props: WorkspaceRoutesProps) {
  if (props.activeDestinationId === "dashboard") {
    return (
      <DashboardPanel
        automationGroups={props.automationGroups}
        campaigns={props.campaigns}
        onNavigate={props.navigateToDestination}
        sessionCounts={props.sessionCounts}
        summary={props.summary}
      />
    );
  }

  if (props.activeDestinationId === "sessions") {
    return (
      <Box className="route-sessions">
        <SessionPanel
          attendants={props.attendants}
          currentSessionId={props.currentSession?.id}
          newSessionNumber={props.newSessionNumber}
          onAddSession={props.onAddSession}
          onNewSessionNumberChange={props.onNewSessionNumberChange}
          onSearchChange={props.onSearchChange}
          onSelectSession={props.onSelectSession}
          onTransferSession={props.onTransferSession}
          search={props.search}
          sessions={props.visibleSessions}
          transferBlockedReason={props.transferBlockedReason}
          transferTargets={props.transferTargets}
        />
        <ChatPanel
          channelMode={props.channelMode}
          composer={props.composer}
          currentSession={props.currentSession}
          messages={props.currentMessages}
          onChannelModeChange={props.onChannelModeChange}
          onComposerChange={props.onComposerChange}
          onSendMessage={props.onSendMessage}
        />
        <Paper className="page-card customer-context" radius="sm">
          {props.currentCustomer ? (
            <Stack gap="sm">
              <Text fw={800}>Contexto do cliente</Text>
              <Text>{props.currentCustomer.name}</Text>
              <Text c="dimmed" size="sm">
                {props.currentCustomer.address.label}, {props.currentCustomer.address.city}/
                {props.currentCustomer.address.state}
              </Text>
              <Group gap="xs">
                <Badge color="green" variant="light">
                  {props.currentCustomer.address.enrichmentStatus}
                </Badge>
                {props.currentCustomer.tags.map((tag) => (
                  <Badge color="gray" key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </Group>
              <Button variant="light" onClick={props.onScheduleOrder}>
                Agendar pedido
              </Button>
            </Stack>
          ) : (
            <Text c="dimmed">Selecione uma sessao para ver o cliente.</Text>
          )}
        </Paper>
      </Box>
    );
  }

  if (props.activeDestinationId === "catalog") {
    return (
      <Paper className="page-card" radius="sm">
        <CatalogWorkspace subPage={props.activeSubPageId ?? "catalogo"} />
      </Paper>
    );
  }

  if (props.activeDestinationId === "merchant") {
    return (
      <Paper className="page-card" radius="sm">
        <MerchantWorkspace />
      </Paper>
    );
  }

  if (props.activeDestinationId === "api-docs") {
    return (
      <Paper className="page-card" radius="sm">
        <ApiDocsPanel />
      </Paper>
    );
  }

  if (props.activeDestinationId === "orders") {
    return (
      <Paper className="page-card" radius="sm">
        <OrdersPanel
          customers={props.customers}
          onScheduleOrder={props.onScheduleOrder}
          orders={props.orderRows}
          summary={props.summary}
        />
      </Paper>
    );
  }

  if (props.activeDestinationId === "customers") {
    return <CustomersPanel customers={props.customers} />;
  }

  if (props.activeDestinationId === "delivery-attendants") {
    return (
      <AttendantsPanel
        activeSessionCountByAttendant={props.activeSessionCountByAttendant}
        attendants={props.attendants}
        onCreateAttendant={props.onCreateAttendant}
        onDeleteAttendant={props.onDeleteAttendant}
        onSetAvailability={props.onSetAttendantAvailability}
        onUpdateAttendant={props.onUpdateAttendant}
        persistenceState={props.attendantPersistenceState}
      />
    );
  }

  if (props.activeDestinationId === "automation-groups") {
    return (
      <Paper className="page-card" radius="sm">
        <AutomationGroupsPanel bindings={props.automationBindings} groups={props.automationGroups} />
      </Paper>
    );
  }

  if (props.activeDestinationId === "campaigns") {
    return (
      <Paper className="page-card" radius="sm">
        <CampaignsPanel
          campaignMessage={props.campaignMessage}
          campaignSegment={props.campaignSegment}
          campaigns={props.campaigns}
          onCampaignMessageChange={props.onCampaignMessageChange}
          onCampaignSegmentChange={props.onCampaignSegmentChange}
        />
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper className="page-card" radius="sm">
        <Group align="flex-start" gap="md">
          <ThemeIcon color="green" radius="sm" size="lg" variant="light">
            <Settings size={20} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={800}>Ajustes do workspace</Text>
            <Text c="dimmed" size="sm">
              Entradas administrativas para credenciais, usuarios e regras globais.
            </Text>
          </Stack>
        </Group>
      </Paper>
      <Group grow align="stretch">
        <Paper className="page-card" radius="sm">
          <Group gap="sm">
            <KeyRound size={18} />
            <Text fw={700}>Credenciais protegidas</Text>
          </Group>
          <Text c="dimmed" mt="xs" size="sm">
            Tokens e senhas devem permanecer fora de logs e diagnosticos.
          </Text>
        </Paper>
        <Paper className="page-card" radius="sm">
          <Group gap="sm">
            <UserCheck size={18} />
            <Text fw={700}>Usuarios e atendentes</Text>
          </Group>
          <Text c="dimmed" mt="xs" size="sm">
            Administracao futura de papeis sem misturar com a operacao diaria.
          </Text>
        </Paper>
        <Paper className="page-card" radius="sm">
          <Group gap="sm">
            <ShieldCheck size={18} />
            <Text fw={700}>Conformidade</Text>
          </Group>
          <Text c="dimmed" mt="xs" size="sm">
            Regras globais ficam separadas das acoes especificas de cada pagina.
          </Text>
        </Paper>
      </Group>
    </Stack>
  );
}
