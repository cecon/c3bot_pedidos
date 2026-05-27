import { Badge, Box, Button, Divider, Group, Paper, Select, Stack, Text, Textarea } from "@mantine/core";
import { CheckCircle2, Megaphone, Send } from "lucide-react";
import type { Campaign } from "../domain/types";
import { Metric } from "./Metric";

interface CampaignsPanelProps {
  campaigns: Campaign[];
}

export function CampaignsPanel({ campaigns }: CampaignsPanelProps) {
  return (
    <Stack gap="md">
      {campaigns.map((campaign) => (
        <Paper className="campaign-item" key={campaign.id} radius="sm">
          <Group justify="space-between">
            <Box>
              <Text fw={800}>{campaign.name}</Text>
              <Text c="dimmed" size="sm">
                {campaign.segment} - {campaign.scheduledFor}
              </Text>
            </Box>
            <Badge color={campaign.status === "running" ? "green" : "blue"} variant="light">
              {campaign.status}
            </Badge>
          </Group>
          <Divider my="sm" />
          <Group grow>
            <Metric label="Enviadas" value={campaign.sent} icon={<Send size={16} />} />
            <Metric label="Conversoes" value={campaign.conversions} icon={<CheckCircle2 size={16} />} />
          </Group>
        </Paper>
      ))}
      <Select
        label="Segmento"
        data={["VIP", "Clientes Centro", "Retirada", "Sem pedido em 30 dias"]}
        defaultValue="VIP"
      />
      <Textarea label="Mensagem" minRows={3} placeholder="Template da campanha" />
      <Button leftSection={<Megaphone size={16} />}>Criar campanha</Button>
    </Stack>
  );
}
