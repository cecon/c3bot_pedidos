import { Badge, Box, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { ShieldCheck, Users } from "./icons";
import type { AutomationBinding, AutomationGroup } from "../domain/types";

interface AutomationGroupsPanelProps {
  bindings: AutomationBinding[];
  groups: AutomationGroup[];
}

export function AutomationGroupsPanel({ bindings, groups }: AutomationGroupsPanelProps) {
  return (
    <Stack gap="sm">
      {groups.map((group) => (
        <Paper className="automation-group" key={group.id} radius="sm">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text fw={800}>{group.name}</Text>
              <Text c="dimmed" size="sm">
                {group.description}
              </Text>
            </Box>
            <Badge variant="light" leftSection={<Users size={12} />}>
              {group.sessionCount} sessao
            </Badge>
          </Group>
          <Divider my="sm" />
          <Group gap="xs">
            {bindings
              .filter((binding) => binding.groupId === group.id)
              .map((binding) => (
                <Badge
                  color={binding.enabled ? "green" : "gray"}
                  key={binding.id}
                  leftSection={<ShieldCheck size={12} />}
                  variant={binding.enabled ? "light" : "outline"}
                >
                  {binding.type}:{binding.name}
                </Badge>
              ))}
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
