import {
  ActionIcon,
  Drawer,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconSettings } from "@tabler/icons-react";
import { FONT_OPTIONS, PRIMARY_OPTIONS, RADIUS_OPTIONS, type FontKey } from "../theme";
import { useThemeSettings } from "./ThemeSettingsProvider";

// Tabler-style theme settings offcanvas: color mode, primary color, border radius and font —
// mirroring Tabler's settings panel. All changes apply live and persist via the provider.
export function ThemeSettingsDrawer() {
  const [opened, { open, close }] = useDisclosure(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { settings, setPrimary, setRadius, setFont } = useThemeSettings();

  return (
    <>
      <ActionIcon variant="default" size="lg" aria-label="Configurações de tema" onClick={open}>
        <IconSettings size={18} stroke={1.5} />
      </ActionIcon>

      <Drawer opened={opened} onClose={close} position="right" size={320} title="Tema" padding="md">
        <Stack gap="lg">
          <Stack gap="xs">
            <Text fw={600} size="sm">
              Modo de cor
            </Text>
            <SegmentedControl
              fullWidth
              value={colorScheme}
              onChange={(value) => setColorScheme(value as "light" | "dark" | "auto")}
              data={[
                { value: "light", label: "Claro" },
                { value: "dark", label: "Escuro" },
                { value: "auto", label: "Auto" },
              ]}
            />
            <Text c="dimmed" size="xs">
              Escuro é o padrão do workspace.
            </Text>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Cor primária
            </Text>
            <SimpleGrid cols={6} spacing="xs">
              {PRIMARY_OPTIONS.map((option) => {
                const selected = settings.primary === option.value;
                return (
                  <Tooltip key={option.value} label={option.label} withArrow>
                    <UnstyledButton
                      aria-label={option.label}
                      aria-pressed={selected}
                      onClick={() => setPrimary(option.value)}
                      style={{
                        backgroundColor: option.hex,
                        height: 32,
                        borderRadius: "var(--app-radius, 4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--mantine-color-white)",
                      }}
                    >
                      {selected && <IconCheck size={16} stroke={3} />}
                    </UnstyledButton>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Raio das bordas
            </Text>
            <SegmentedControl
              fullWidth
              value={String(settings.radius)}
              onChange={(value) => setRadius(Number(value))}
              data={RADIUS_OPTIONS.map((r) => ({ value: String(r.value), label: r.label }))}
            />
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm">
              Fonte
            </Text>
            <SegmentedControl
              fullWidth
              value={settings.font}
              onChange={(value) => setFont(value as FontKey)}
              data={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
            />
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}
