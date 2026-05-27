import { useMemo, useState } from "react";
import { Badge, Box, Button, Group, Text, ThemeIcon } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { Database, MessageCircle, Wifi } from "lucide-react";
import { ChatPanel } from "./components/ChatPanel";
import { OpsPanel } from "./components/OpsPanel";
import { SessionPanel } from "./components/SessionPanel";
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

  const currentSession = sessionRows.find((session) => session.id === selectedSessionId) ?? sessionRows[0];
  const visibleSessions = useMemo(() => filterSessions(sessionRows, sessionSearch), [sessionRows, sessionSearch]);
  const sessionCounts = useMemo(() => countSessionsByStatus(sessionRows), [sessionRows]);
  const currentMessages = messageRows.filter((message) => message.sessionId === currentSession?.id);
  const summary = useMemo(() => summarizeOrders(orderRows), [orderRows]);
  const currentCustomer = customers.find((customer) => customer.whatsappNumber === currentSession?.phoneNumber);

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
    <Box className="app-frame">
      <Box className="topbar">
        <Group gap="sm">
          <ThemeIcon radius="sm" size="lg" color="green">
            <MessageCircle size={20} />
          </ThemeIcon>
          <Box>
            <Text fw={800} size="lg">
              C3Bot
            </Text>
            <Text c="dimmed" size="xs">
              WhatsApp commerce agent
            </Text>
          </Box>
        </Group>
        <Group gap="xs">
          <Badge color="green" variant="light" leftSection={<Wifi size={12} />}>
            {sessionCounts.connected} online
          </Badge>
          <Badge color="yellow" variant="light">
            {sessionCounts.connecting} conectando
          </Badge>
          <Button size="xs" variant="light" leftSection={<Database size={14} />} onClick={verifyDatabase}>
            SQLite
          </Button>
        </Group>
      </Box>

      <Box className="workspace-grid">
        <SessionPanel
          attendants={attendants}
          currentSessionId={currentSession?.id}
          newSessionNumber={newSessionNumber}
          onAddSession={addSession}
          onNewSessionNumberChange={setNewSessionNumber}
          onSearchChange={setSessionSearch}
          onSelectSession={setSelectedSessionId}
          search={sessionSearch}
          sessions={visibleSessions}
        />
        <ChatPanel
          channelMode={channelMode}
          composer={composer}
          currentSession={currentSession}
          messages={currentMessages}
          onChannelModeChange={setChannelMode}
          onComposerChange={setComposer}
          onSendMessage={sendMessage}
        />
        <OpsPanel
          automationBindings={automationBindings}
          automationGroups={automationGroups}
          campaigns={campaigns}
          customers={customers}
          onAddProduct={addProduct}
          onProductNameChange={setProductName}
          onProductPriceChange={setProductPrice}
          onScheduleOrder={scheduleOrder}
          orders={orderRows}
          productName={productName}
          productPrice={productPrice}
          products={productRows}
          summary={summary}
        />
      </Box>
    </Box>
  );
}

export default App;
