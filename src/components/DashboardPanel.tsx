import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { Bot, CalendarClock, CheckCircle2, Megaphone, MessageCircle, Store } from "lucide-react";
import type { DestinationId } from "../domain/navigation";
import type { OrderSummary } from "../domain/analytics";
import { formatCurrency } from "../domain/analytics";
import type { AutomationGroup, Campaign, SessionStatus } from "../domain/types";
import { Metric } from "./Metric";

interface DashboardPanelProps {
  automationGroups: AutomationGroup[];
  campaigns: Campaign[];
  onNavigate: (destinationId: DestinationId) => void;
  sessionCounts: Record<SessionStatus, number>;
  summary: OrderSummary;
}

export function DashboardPanel({
  automationGroups,
  campaigns,
  onNavigate,
  sessionCounts,
  summary,
}: DashboardPanelProps) {
  const runningCampaigns = campaigns.filter((campaign) => campaign.status === "running").length;

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
        <Metric label="Sessoes online" value={sessionCounts.connected} icon={<MessageCircle size={16} />} />
        <Metric label="Agendados" value={summary.scheduled} icon={<CalendarClock size={16} />} />
        <Metric label="Concluidos" value={summary.done} icon={<CheckCircle2 size={16} />} />
        <Metric label="Receita" value={formatCurrency(summary.revenueCents)} icon={<Store size={16} />} />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
        <Paper className="page-card" radius="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text fw={800}>Operacao WhatsApp</Text>
              <Text c="dimmed" size="sm">
                Acompanhe sessoes, pedidos e atendimento em paginas focadas.
              </Text>
            </Stack>
            <Badge color="green" variant="light">
              {sessionCounts.connected + sessionCounts.connecting} ativas
            </Badge>
          </Group>
          <Group mt="md">
            <Button leftSection={<MessageCircle size={16} />} onClick={() => onNavigate("sessions")}>
              Abrir sessoes
            </Button>
            <Button variant="light" leftSection={<CalendarClock size={16} />} onClick={() => onNavigate("orders")}>
              Ver pedidos
            </Button>
          </Group>
        </Paper>
        <Paper className="page-card" radius="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text fw={800}>Automacao e campanhas</Text>
              <Text c="dimmed" size="sm">
                Revise grupos, bindings e campanhas sem misturar com o chat.
              </Text>
            </Stack>
            <Badge color="blue" variant="light">
              {runningCampaigns} campanha ativa
            </Badge>
          </Group>
          <Group mt="md">
            <Button leftSection={<Bot size={16} />} onClick={() => onNavigate("automation-groups")}>
              Automacoes
            </Button>
            <Button variant="light" leftSection={<Megaphone size={16} />} onClick={() => onNavigate("campaigns")}>
              Campanhas
            </Button>
          </Group>
          <Text c="dimmed" mt="sm" size="xs">
            {automationGroups.length} grupos configurados
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
