export type DestinationId =
  | "dashboard"
  | "sessions"
  | "catalog"
  | "orders"
  | "customers"
  | "automation-groups"
  | "campaigns"
  | "settings";

export type NavigationGroupId = "operations" | "administration";

export type NavigationIconName =
  | "activity"
  | "bot"
  | "calendar-clock"
  | "megaphone"
  | "message-circle"
  | "settings"
  | "store"
  | "users";

export interface NavigationDestination {
  description: string;
  groupId: NavigationGroupId;
  iconName: NavigationIconName;
  id: DestinationId;
  isPrimary: boolean;
  label: string;
  path: `#/${string}`;
}

export interface NavigationGroup {
  destinationIds: DestinationId[];
  id: NavigationGroupId;
  label: string;
}

export interface RouteResolution {
  destination: NavigationDestination;
  message?: string;
  requestedPath: string;
  wasFallback: boolean;
}

export interface DirtyNavigationState {
  activeDestinationId: DestinationId;
  dirtySectionIds: readonly DestinationId[];
}

export const DEFAULT_DESTINATION_ID: DestinationId = "dashboard";

export const NAVIGATION_DESTINATIONS: readonly NavigationDestination[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "#/dashboard",
    groupId: "operations",
    iconName: "activity",
    description: "Resumo operacional e indicadores do workspace",
    isPrimary: true,
  },
  {
    id: "sessions",
    label: "Sessoes",
    path: "#/sessions",
    groupId: "operations",
    iconName: "message-circle",
    description: "Fila de sessoes, chat e contexto do cliente",
    isPrimary: true,
  },
  {
    id: "catalog",
    label: "Catalogo",
    path: "#/catalog",
    groupId: "operations",
    iconName: "store",
    description: "Produtos, precos e disponibilidade",
    isPrimary: true,
  },
  {
    id: "orders",
    label: "Pedidos",
    path: "#/orders",
    groupId: "operations",
    iconName: "calendar-clock",
    description: "Pedidos agendados, ativos e finalizados",
    isPrimary: true,
  },
  {
    id: "customers",
    label: "Clientes",
    path: "#/customers",
    groupId: "operations",
    iconName: "users",
    description: "Clientes, telefones e enderecos",
    isPrimary: true,
  },
  {
    id: "automation-groups",
    label: "Automacoes",
    path: "#/automation-groups",
    groupId: "administration",
    iconName: "bot",
    description: "Grupos, MCPs, skills e agentes",
    isPrimary: true,
  },
  {
    id: "campaigns",
    label: "Campanhas",
    path: "#/campaigns",
    groupId: "administration",
    iconName: "megaphone",
    description: "Campanhas, segmentos e mensagens",
    isPrimary: true,
  },
  {
    id: "settings",
    label: "Ajustes",
    path: "#/settings",
    groupId: "administration",
    iconName: "settings",
    description: "Configuracoes do workspace",
    isPrimary: true,
  },
] as const;

export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    id: "operations",
    label: "Operacao",
    destinationIds: ["dashboard", "sessions", "catalog", "orders", "customers"],
  },
  {
    id: "administration",
    label: "Administracao",
    destinationIds: ["automation-groups", "campaigns", "settings"],
  },
] as const;

export function getDestinationById(destinationId: DestinationId): NavigationDestination {
  const destination = NAVIGATION_DESTINATIONS.find((item) => item.id === destinationId);

  if (!destination) {
    return getDefaultDestination();
  }

  return destination;
}

export function getDefaultDestination(): NavigationDestination {
  return NAVIGATION_DESTINATIONS[0];
}

export function getVisibleNavigationGroups(
  destinations: readonly NavigationDestination[] = NAVIGATION_DESTINATIONS,
): NavigationGroup[] {
  const destinationIds = new Set(destinations.filter((destination) => destination.isPrimary).map((item) => item.id));

  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    destinationIds: group.destinationIds.filter((destinationId) => destinationIds.has(destinationId)),
  })).filter((group) => group.destinationIds.length > 0);
}

export function normalizeRouteHash(hash: string): `#/${string}` {
  const trimmed = hash.trim();

  if (!trimmed || trimmed === "#" || trimmed === "#/") {
    return getDefaultDestination().path;
  }

  const path = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  return `#/${path.replace(/^\/+/, "")}`;
}

export function resolveDestinationFromHash(hash: string): RouteResolution {
  const requestedPath = normalizeRouteHash(hash);
  const destination = NAVIGATION_DESTINATIONS.find((item) => item.path === requestedPath);

  if (destination) {
    return {
      destination,
      requestedPath,
      wasFallback: false,
    };
  }

  return {
    destination: getDefaultDestination(),
    message: `Destino "${requestedPath}" nao existe. Abrindo dashboard.`,
    requestedPath,
    wasFallback: true,
  };
}

export function shouldConfirmNavigation(
  state: DirtyNavigationState,
  nextDestinationId: DestinationId,
): boolean {
  return state.activeDestinationId !== nextDestinationId && state.dirtySectionIds.includes(state.activeDestinationId);
}
