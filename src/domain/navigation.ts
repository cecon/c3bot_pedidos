export type DestinationId =
  | "dashboard"
  | "sessions"
  | "catalog"
  | "orders"
  | "customers"
  | "delivery-attendants"
  | "automation-groups"
  | "campaigns"
  | "merchant"
  | "settings"
  | "api-docs";

export type NavigationGroupId = "operations" | "administration";

export type NavigationIconName =
  | "activity"
  | "book-open"
  | "bot"
  | "building-2"
  | "calendar-clock"
  | "layout-grid"
  | "megaphone"
  | "message-circle"
  | "package"
  | "settings"
  | "store"
  | "user-check"
  | "users";

export type CatalogSubPageId = "catalogo" | "grupos" | "produtos";

export interface NavigationSubDestination {
  id: CatalogSubPageId;
  label: string;
  path: `#/${string}`;
  iconName: NavigationIconName;
  description: string;
}

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
  subPageId?: CatalogSubPageId;
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
    id: "delivery-attendants",
    label: "Atendentes",
    path: "#/delivery-attendants",
    groupId: "administration",
    iconName: "user-check",
    description: "Atendentes humanos do delivery e disponibilidade",
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
    id: "merchant",
    label: "Merchant",
    path: "#/merchant",
    groupId: "administration",
    iconName: "building-2",
    description: "Perfil do restaurante, horarios, interrupcoes e status",
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
  {
    id: "api-docs",
    label: "API / Docs",
    path: "#/api-docs",
    groupId: "administration",
    iconName: "book-open",
    description: "Documentacao Swagger de todos os endpoints da API",
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
    destinationIds: ["delivery-attendants", "automation-groups", "campaigns", "merchant", "settings", "api-docs"],
  },
] as const;

// Sub-pages nested under the "catalog" destination. Each is a hash route of its own so the sidebar
// submenu and the browser history work like first-class navigation. The base "#/catalog" maps to the
// "catalogo" (registration) sub-page.
export const CATALOG_SUB_PAGES: readonly NavigationSubDestination[] = [
  {
    id: "catalogo",
    label: "Cadastro",
    path: "#/catalog",
    iconName: "store",
    description: "Crie e selecione catálogos",
  },
  {
    id: "grupos",
    label: "Grupos",
    path: "#/catalog/grupos",
    iconName: "layout-grid",
    description: "Categorias (grupos) do catálogo",
  },
  {
    id: "produtos",
    label: "Produtos",
    path: "#/catalog/produtos",
    iconName: "package",
    description: "Itens e produtos de cada grupo",
  },
] as const;

export function getCatalogSubPageById(subPageId: CatalogSubPageId): NavigationSubDestination {
  return CATALOG_SUB_PAGES.find((sub) => sub.id === subPageId) ?? CATALOG_SUB_PAGES[0];
}

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

  // Catalog sub-pages (e.g. "#/catalog/grupos"). "#/catalog" matches the "catalogo" base sub-page.
  const subPage = CATALOG_SUB_PAGES.find((sub) => sub.path === requestedPath);
  if (subPage) {
    return {
      destination: getDestinationById("catalog"),
      subPageId: subPage.id,
      requestedPath,
      wasFallback: false,
    };
  }

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
