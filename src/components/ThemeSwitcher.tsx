import { ActionIcon, Menu, SegmentedControl, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";

// Tabler-style theme settings control: a menu with a light / dark / auto color-scheme selector.
// Dark stays the app default (Constitution V); operators can switch via this panel.
export function ThemeSwitcher() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "auto" ? IconDeviceDesktop : IconMoon;

  return (
    <Menu position="bottom-end" shadow="md" width={240} closeOnItemClick={false}>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="Configurações de tema">
          <Icon size={18} stroke={1.5} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Stack gap="xs" p="xs">
          <Text fw={600} size="sm">
            Tema
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
      </Menu.Dropdown>
    </Menu>
  );
}
