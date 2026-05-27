import type { ReactNode } from "react";
import { Alert, Box } from "@mantine/core";
import { AlertTriangle } from "lucide-react";
import type { NavigationDestination } from "../domain/navigation";

interface AdminShellProps {
  activeDestination: NavigationDestination;
  children: ReactNode;
  fallbackMessage?: string;
  header: ReactNode;
  navigation: ReactNode;
}

export function AdminShell({
  activeDestination,
  children,
  fallbackMessage,
  header,
  navigation,
}: AdminShellProps) {
  return (
    <Box className="admin-shell" data-testid="admin-shell">
      {navigation}
      <Box className="admin-main">
        {header}
        {fallbackMessage && (
          <Alert
            className="route-alert"
            color="yellow"
            icon={<AlertTriangle size={16} />}
            radius="sm"
            variant="light"
          >
            {fallbackMessage}
          </Alert>
        )}
        <Box
          aria-label={activeDestination.label}
          className="admin-content"
          component="main"
          data-destination={activeDestination.id}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
