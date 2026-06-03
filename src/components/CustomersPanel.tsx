import { Badge, Group, Paper, ScrollArea, Stack, Table, Text } from "@mantine/core";
import { MapPin, Users } from "./icons";
import type { Customer } from "../domain/types";
import { Metric } from "./Metric";

interface CustomersPanelProps {
  customers: Customer[];
}

const enrichmentColor: Record<Customer["address"]["enrichmentStatus"], string> = {
  failed: "red",
  pending: "yellow",
  verified: "green",
};

export function CustomersPanel({ customers }: CustomersPanelProps) {
  const verified = customers.filter((customer) => customer.address.enrichmentStatus === "verified").length;

  return (
    <Stack gap="md">
      <Group grow align="stretch">
        <Metric label="Clientes" value={customers.length} icon={<Users size={16} />} />
        <Metric label="Enderecos verificados" value={verified} icon={<MapPin size={16} />} />
      </Group>
      <Paper className="page-card" radius="sm">
        <ScrollArea h={420}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>WhatsApp</Table.Th>
                <Table.Th>Endereco</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Tags</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customers.map((customer) => (
                <Table.Tr key={customer.id}>
                  <Table.Td>
                    <Text fw={700}>{customer.name}</Text>
                  </Table.Td>
                  <Table.Td>{customer.whatsappNumber}</Table.Td>
                  <Table.Td>
                    {customer.address.label}, {customer.address.city}/{customer.address.state}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={enrichmentColor[customer.address.enrichmentStatus]} variant="light">
                      {customer.address.enrichmentStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {customer.tags.map((tag) => (
                        <Badge color="gray" key={tag} size="xs" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
