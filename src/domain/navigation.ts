// Minimal hash-based navigation: only two destinations (Dashboard + Attendants) after the trim.

export type DestinationId = "dashboard" | "attendants";

export type NavigationIconName = "activity" | "user-check";

export interface NavigationDestination {
  id: DestinationId;
  label: string;
  path: `#/${string}`;
  iconName: NavigationIconName;
  description: string;
}

export interface RouteResolution {
  destination: NavigationDestination;
  message?: string;
  requestedPath: string;
  wasFallback: boolean;
}

export const DEFAULT_DESTINATION_ID: DestinationId = "dashboard";

export const NAVIGATION_DESTINATIONS: readonly NavigationDestination[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "#/dashboard",
    iconName: "activity",
    description: "Resumo do workspace",
  },
  {
    id: "attendants",
    label: "Atendentes",
    path: "#/attendants",
    iconName: "user-check",
    description: "Cadastro de atendentes",
  },
] as const;

export function getDefaultDestination(): NavigationDestination {
  return NAVIGATION_DESTINATIONS[0];
}

export function getDestinationById(destinationId: DestinationId): NavigationDestination {
  return NAVIGATION_DESTINATIONS.find((item) => item.id === destinationId) ?? getDefaultDestination();
}

export function normalizeRouteHash(hash: string): `#/${string}` {
  const trimmed = hash.trim();
  if (!trimmed || trimmed === "#" || trimmed === "#/") return getDefaultDestination().path;
  const path = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  return `#/${path.replace(/^\/+/, "")}`;
}

// Any hash that does not match a current destination resolves to the dashboard (removed pages).
export function resolveDestinationFromHash(hash: string): RouteResolution {
  const requestedPath = normalizeRouteHash(hash);
  const destination = NAVIGATION_DESTINATIONS.find((item) => item.path === requestedPath);
  if (destination) return { destination, requestedPath, wasFallback: false };
  return {
    destination: getDefaultDestination(),
    message: `Destino "${requestedPath}" não existe. Abrindo o dashboard.`,
    requestedPath,
    wasFallback: true,
  };
}
