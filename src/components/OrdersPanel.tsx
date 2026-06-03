import { Badge, Button, ScrollArea, SimpleGrid, Stack, Table } from "@mantine/core";
import { CalendarClock, CheckCircle2, Sparkles, Store } from "./icons";
import type { Customer, Order } from "../domain/types";
import type { OrderSummary } from "../domain/analytics";
import { formatCurrency } from "../domain/analytics";
import { orderStatusColor } from "../ui/status";
import { Metric } from "./Metric";

interface OrdersPanelProps {
  customers: Customer[];
  onScheduleOrder: () => void;
  orders: Order[];
  summary: OrderSummary;
}

export function OrdersPanel({ customers, onScheduleOrder, orders, summary }: OrdersPanelProps) {
  return (
    <Stack gap="md">
      <SimpleGrid cols={4} spacing="xs">
        <Metric label="Agendados" value={summary.scheduled} icon={<CalendarClock size={16} />} />
        <Metric label="Em preparo" value={summary.inProgress} icon={<Sparkles size={16} />} />
        <Metric label="Concluidos" value={summary.done} icon={<CheckCircle2 size={16} />} />
        <Metric label="Receita" value={formatCurrency(summary.revenueCents)} icon={<Store size={16} />} />
      </SimpleGrid>
      <Button leftSection={<CalendarClock size={16} />} onClick={onScheduleOrder}>
        Agendar pedido do chat
      </Button>
      <ScrollArea h={310}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Pedido</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Horario</Table.Th>
              <Table.Th>Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((order) => {
              const customer = customers.find((item) => item.id === order.customerId);
              return (
                <Table.Tr key={order.id}>
                  <Table.Td>{order.id}</Table.Td>
                  <Table.Td>{customer?.name ?? "Cliente"}</Table.Td>
                  <Table.Td>
                    <Badge color={orderStatusColor[order.status]} variant="light">
                      {order.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{order.scheduledFor}</Table.Td>
                  <Table.Td>{formatCurrency(order.totalCents)}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
}
