import { Stack, Text } from "@mantine/core";
import { getConfiguredCatalogApiBaseUrl } from "../services/catalogApi";

// Embeds the interactive Swagger UI (served at /api/docs) so all endpoints are browsable from
// the workspace menu. Shows a clear unavailable state when the API is not reachable. FR-034.
interface ApiDocsPanelProps {
  baseUrl?: string | null;
}

export function ApiDocsPanel({ baseUrl }: ApiDocsPanelProps) {
  const resolved = baseUrl === undefined ? (getConfiguredCatalogApiBaseUrl() ?? null) : baseUrl;

  if (!resolved) {
    return (
      <Stack gap="xs">
        <Text fw={700}>Documentação da API</Text>
        <Text c="dimmed">
          API indisponível. Inicie o app com pnpm dev ou configure VITE_C3BOT_API_BASE_URL para abrir a documentação.
        </Text>
      </Stack>
    );
  }

  return (
    <iframe
      title="Documentação da API"
      src={`${resolved}/api/docs`}
      style={{ width: "100%", height: "72vh", border: 0 }}
    />
  );
}
