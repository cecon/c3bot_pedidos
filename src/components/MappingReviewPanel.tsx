import { Badge, List, Paper, Stack, Text } from "@mantine/core";
import type { MappingReadiness, UnmappedRef } from "../domain/catalog/mapping";

// Presentational mapping-readiness review (no IO): shows ready/not-ready and lists unmapped
// elements with their hierarchy path. FR-009..011, SC-003.
interface MappingReviewPanelProps {
  readiness: MappingReadiness;
}

const KIND_LABEL: Record<UnmappedRef["kind"], string> = {
  store: "Loja",
  catalog: "Catálogo",
  category: "Categoria",
  item: "Item",
  product: "Produto",
  option: "Opção",
  crust: "Massa",
  edge: "Borda",
  flavor: "Sabor",
  combo: "Combo",
};

export function MappingReviewPanel({ readiness }: MappingReviewPanelProps) {
  return (
    <Stack gap="xs">
      <Text fw={700} size="sm">
        Prontidão de integração
      </Text>
      <Badge color={readiness.ready ? "green" : "orange"} variant="light" size="lg">
        {readiness.ready ? "Pronto para handoff" : "Não pronto para handoff"}
      </Badge>
      {readiness.unmapped.length > 0 && (
        <Paper withBorder p="sm" radius="sm">
          <Text c="dimmed" size="sm" mb="xs">
            {readiness.unmapped.length} elemento(s) sem código externo:
          </Text>
          <List size="sm" spacing={4}>
            {readiness.unmapped.map((ref) => (
              <List.Item key={`${ref.kind}-${ref.id}`}>
                <Text component="span" fw={600}>
                  {KIND_LABEL[ref.kind]}
                </Text>{" "}
                — {ref.path}
              </List.Item>
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  );
}
