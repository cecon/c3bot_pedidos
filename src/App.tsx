import { useEffect, useMemo, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { AdminShell } from "./components/AdminShell";
import { AppHeader } from "./components/AppHeader";
import { SidebarNav } from "./components/SidebarNav";
import { WorkspaceRoutes } from "./components/WorkspaceRoutes";
import {
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  getVisibleNavigationGroups,
  resolveDestinationFromHash,
  shouldConfirmNavigation,
  type DestinationId,
} from "./domain/navigation";
import {
  attendants,
  automationBindings,
  automationGroups,
  campaigns,
  customers,
  messages,
  orders,
  products,
  sessions,
} from "./domain/mockData";
import {
  countSessionsByStatus,
  filterSessions,
  normalizeWhatsAppNumber,
  summarizeOrders,
} from "./domain/analytics";
import type { Message, Order, Product, WhatsAppSession } from "./domain/types";
import { getDatabase, isTauriRuntime, schemaTables } from "./services/database";

function App() {
  const initialRoute = resolveDestinationFromHash(window.location.hash);
  const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>(initialRoute.destination.id);
  const [routeMessage, setRouteMessage] = useState(initialRoute.message);
  const [sessionRows, setSessionRows] = useState<WhatsAppSession[]>(sessions);
  const [messageRows, setMessageRows] = useState<Message[]>(messages);
  const [productRows, setProductRows] = useState<Product[]>(products);
  const [orderRows, setOrderRows] = useState<Order[]>(orders);
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id ?? "");
  const [sessionSearch, setSessionSearch] = useState("");
  const [newSessionNumber, setNewSessionNumber] = useState("");
  const [composer, setComposer] = useState("");
  const [channelMode, setChannelMode] = useState("human");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState<number | string>(49.9);
  const [campaignSegment, setCampaignSegment] = useState("VIP");
  const [campaignMessage, setCampaignMessage] = useState("");

  const currentSession = sessionRows.find((session) => session.id === selectedSessionId) ?? sessionRows[0];
  const visibleSessions = useMemo(() => filterSessions(sessionRows, sessionSearch), [sessionRows, sessionSearch]);
  const sessionCounts = useMemo(() => countSessionsByStatus(sessionRows), [sessionRows]);
  const currentMessages = messageRows.filter((message) => message.sessionId === currentSession?.id);
  const summary = useMemo(() => summarizeOrders(orderRows), [orderRows]);
  const currentCustomer = customers.find((customer) => customer.whatsappNumber === currentSession?.phoneNumber);
  const activeDestination = getDestinationById(activeDestinationId);
  const navigationGroups = useMemo(() => getVisibleNavigationGroups(), []);
  const dirtySectionIds = useMemo<DestinationId[]>(() => {
    const dirty: DestinationId[] = [];
    if (productName.trim()) dirty.push("catalog");
    if (campaignMessage.trim()) dirty.push("campaigns");
    return dirty;
  }, [campaignMessage, productName]);

  useEffect(() => {
    function syncRoute() {
      const resolution = resolveDestinationFromHash(window.location.hash);
      setActiveDestinationId(resolution.destination.id);
      setRouteMessage(resolution.message);

      if (resolution.wasFallback) {
        window.history.replaceState(null, "", resolution.destination.path);
        showNotification({
          title: "Destino ajustado",
          message: resolution.message,
          color: "yellow",
        });
      }
    }

    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  function navigateToDestination(destinationId: DestinationId) {
    const destination = getDestinationById(destinationId);

    if (shouldConfirmNavigation({ activeDestinationId, dirtySectionIds }, destinationId)) {
      showNotification({
        title: "Rascunho preservado",
        message: "Voce pode voltar para continuar a edicao.",
        color: "blue",
      });
    }

    setRouteMessage(undefined);
    if (window.location.hash === destination.path) {
      setActiveDestinationId(destination.id);
      return;
    }
    window.location.hash = destination.path;
  }

  function addSession() {
    const phoneNumber = normalizeWhatsAppNumber(newSessionNumber);
    if (!phoneNumber) return;

    const nextSession: WhatsAppSession = {
      id: `ses-${Date.now()}`,
      displayName: `Sessao ${sessionRows.length + 1}`,
      phoneNumber,
      status: "connecting",
      unread: 0,
      assignedAttendantId: attendants[0].id,
      automationGroupId: automationGroups[0].id,
      lastMessageAt: "agora",
    };

    setSessionRows((rows) => [nextSession, ...rows]);
    setSelectedSessionId(nextSession.id);
    setNewSessionNumber("");
    navigateToDestination("sessions");
    showNotification({ title: "Sessao adicionada", message: phoneNumber, color: "green" });
  }

  function sendMessage() {
    if (!composer.trim() || !currentSession) return;

    setMessageRows((rows) => [
      ...rows,
      {
        id: `msg-${Date.now()}`,
        sessionId: currentSession.id,
        direction: "outbound",
        author: channelMode === "agent" ? "Agente" : "Atendente",
        body: composer.trim(),
        sentAt: "agora",
      },
    ]);
    setComposer("");
  }

  function addProduct() {
    if (!productName.trim()) return;

    const price = typeof productPrice === "number" ? productPrice : Number(productPrice);
    setProductRows((rows) => [
      {
        id: `prd-${Date.now()}`,
        name: productName.trim(),
        description: "Novo item do catalogo",
        priceCents: Math.round(price * 100),
        category: "Novidades",
        imageUrl: "/products/new-item.jpg",
        active: true,
      },
      ...rows,
    ]);
    setProductName("");
    showNotification({ title: "Produto cadastrado", message: "Catalogo atualizado", color: "green" });
  }

  function scheduleOrder() {
    if (!currentSession || !currentCustomer) return;

    setOrderRows((rows) => [
      {
        id: `ord-${Date.now().toString().slice(-4)}`,
        customerId: currentCustomer.id,
        sessionId: currentSession.id,
        status: "scheduled",
        scheduledFor: "Hoje, 19:30",
        totalCents: productRows[0]?.priceCents ?? 0,
        itemCount: 1,
      },
      ...rows,
    ]);
    navigateToDestination("orders");
    showNotification({ title: "Pedido agendado", message: currentCustomer.name, color: "blue" });
  }

  async function verifyDatabase() {
    if (!isTauriRuntime()) {
      showNotification({
        title: "SQLite pronto para Tauri",
        message: "Execute pnpm tauri dev para abrir o banco local.",
        color: "yellow",
      });
      return;
    }

    await getDatabase();
    showNotification({
      title: "SQLite conectado",
      message: `${schemaTables.length} tabelas versionadas por migration.`,
      color: "green",
    });
  }

  return (
    <AdminShell
      activeDestination={activeDestination}
      fallbackMessage={routeMessage}
      header={
        <AppHeader
          activeDestination={activeDestination}
          onVerifyDatabase={verifyDatabase}
          sessionCounts={sessionCounts}
        />
      }
      navigation={
        <SidebarNav
          activeDestinationId={activeDestinationId}
          destinations={NAVIGATION_DESTINATIONS}
          groups={navigationGroups}
          onNavigate={navigateToDestination}
        />
      }
    >
      <WorkspaceRoutes
        activeDestinationId={activeDestinationId}
        attendants={attendants}
        automationBindings={automationBindings}
        automationGroups={automationGroups}
        campaignMessage={campaignMessage}
        campaignSegment={campaignSegment}
        campaigns={campaigns}
        channelMode={channelMode}
        composer={composer}
        currentCustomer={currentCustomer}
        currentMessages={currentMessages}
        currentSession={currentSession}
        customers={customers}
        navigateToDestination={navigateToDestination}
        newSessionNumber={newSessionNumber}
        onAddProduct={addProduct}
        onAddSession={addSession}
        onCampaignMessageChange={setCampaignMessage}
        onCampaignSegmentChange={setCampaignSegment}
        onChannelModeChange={setChannelMode}
        onComposerChange={setComposer}
        onNewSessionNumberChange={setNewSessionNumber}
        onProductNameChange={setProductName}
        onProductPriceChange={setProductPrice}
        onScheduleOrder={scheduleOrder}
        onSearchChange={setSessionSearch}
        onSelectSession={setSelectedSessionId}
        onSendMessage={sendMessage}
        orderRows={orderRows}
        productName={productName}
        productPrice={productPrice}
        productRows={productRows}
        search={sessionSearch}
        sessionCounts={sessionCounts}
        summary={summary}
        visibleSessions={visibleSessions}
      />
    </AdminShell>
  );
}

export default App;
