import type { ReactNode } from "react";
import { Box, Group, Paper, Text, ThemeIcon } from "@mantine/core";

interface MetricProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function Metric({ icon, label, value }: MetricProps) {
  return (
    <Paper className="metric" radius="sm">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon variant="light" color="green" radius="sm">
          {icon}
        </ThemeIcon>
        <Box>
          <Text c="dimmed" size="xs">
            {label}
          </Text>
          <Text fw={800} size="sm">
            {value}
          </Text>
        </Box>
      </Group>
    </Paper>
  );
}
