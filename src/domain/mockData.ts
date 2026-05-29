import type {
  AutomationBinding,
  AutomationGroup,
  Campaign,
  Customer,
  Message,
  Order,
  Product,
  WhatsAppSession,
} from "./types";

export const sessions: WhatsAppSession[] = [
  {
    id: "ses-delivery",
    displayName: "Delivery Centro",
    phoneNumber: "+55 11 98888-1040",
    status: "connected",
    unread: 4,
    assignedAttendantId: "",
    automationGroupId: "grp-delivery",
    lastMessageAt: "10:42",
  },
  {
    id: "ses-balcao",
    displayName: "Balcao e Retirada",
    phoneNumber: "+55 11 97777-2030",
    status: "connecting",
    unread: 1,
    assignedAttendantId: "",
    automationGroupId: "grp-retention",
    lastMessageAt: "10:35",
  },
  {
    id: "ses-campanhas",
    displayName: "Campanhas",
    phoneNumber: "+55 11 96666-9988",
    status: "paused",
    unread: 0,
    assignedAttendantId: "",
    automationGroupId: "grp-campaign",
    lastMessageAt: "09:58",
  },
];

export const messages: Message[] = [
  {
    id: "msg-1",
    sessionId: "ses-delivery",
    direction: "inbound",
    author: "Renata",
    body: "Bom dia, queria montar um pedido para entregar as 19h.",
    sentAt: "10:38",
  },
  {
    id: "msg-2",
    sessionId: "ses-delivery",
    direction: "outbound",
    author: "Ana Paula",
    body: "Bom dia, Renata. Ja tenho seu endereco salvo. Vou te mandar as opcoes mais pedidas.",
    sentAt: "10:39",
  },
  {
    id: "msg-3",
    sessionId: "ses-delivery",
    direction: "system",
    author: "C3Bot",
    body: "Catalogo enviado: Combos da semana.",
    sentAt: "10:40",
  },
  {
    id: "msg-4",
    sessionId: "ses-delivery",
    direction: "inbound",
    author: "Renata",
    body: "Pode ser o combo familia e uma sobremesa.",
    sentAt: "10:42",
  },
  {
    id: "msg-5",
    sessionId: "ses-balcao",
    direction: "inbound",
    author: "Carlos",
    body: "Consigo retirar em 20 minutos?",
    sentAt: "10:35",
  },
  {
    id: "msg-6",
    sessionId: "ses-campanhas",
    direction: "system",
    author: "C3Bot",
    body: "Campanha pausada por limite de horario.",
    sentAt: "09:58",
  },
];

export const customers: Customer[] = [
  {
    id: "cus-renata",
    name: "Renata Souza",
    whatsappNumber: "+55 11 98888-1040",
    tags: ["VIP", "Centro"],
    address: {
      label: "Casa",
      city: "Sao Paulo",
      state: "SP",
      enrichmentStatus: "verified",
    },
  },
  {
    id: "cus-carlos",
    name: "Carlos Lima",
    whatsappNumber: "+55 11 97777-2030",
    tags: ["Retirada"],
    address: {
      label: "Trabalho",
      city: "Sao Paulo",
      state: "SP",
      enrichmentStatus: "pending",
    },
  },
];

export const products: Product[] = [
  {
    id: "prd-combo-familia",
    name: "Combo Familia",
    description: "Burger artesanal, batata rustica, nuggets e bebidas.",
    priceCents: 8990,
    category: "Combos",
    imageUrl: "/products/burger.jpg",
    active: true,
  },
  {
    id: "prd-poke",
    name: "Poke Salmao",
    description: "Salmao, arroz gohan, manga, pepino e molho taro.",
    priceCents: 4590,
    category: "Pratos",
    imageUrl: "/products/poke.jpg",
    active: true,
  },
  {
    id: "prd-brownie",
    name: "Brownie da Casa",
    description: "Brownie quente com calda de chocolate.",
    priceCents: 1690,
    category: "Sobremesas",
    imageUrl: "/products/brownie.jpg",
    active: true,
  },
];

export const orders: Order[] = [
  {
    id: "ord-1042",
    customerId: "cus-renata",
    sessionId: "ses-delivery",
    status: "scheduled",
    scheduledFor: "Hoje, 19:00",
    totalCents: 10680,
    itemCount: 2,
  },
  {
    id: "ord-1038",
    customerId: "cus-carlos",
    sessionId: "ses-balcao",
    status: "preparing",
    scheduledFor: "Hoje, 11:10",
    totalCents: 4590,
    itemCount: 1,
  },
  {
    id: "ord-1035",
    customerId: "cus-renata",
    sessionId: "ses-delivery",
    status: "done",
    scheduledFor: "Ontem, 20:30",
    totalCents: 8990,
    itemCount: 1,
  },
];

export const automationGroups: AutomationGroup[] = [
  {
    id: "grp-delivery",
    name: "Delivery assistido",
    description: "Triagem, cardapio e sugestao de pedido.",
    sessionCount: 1,
  },
  {
    id: "grp-retention",
    name: "Retencao e retirada",
    description: "Perguntas frequentes, status e retirada no balcao.",
    sessionCount: 1,
  },
  {
    id: "grp-campaign",
    name: "Campanhas",
    description: "Segmentos, disparos e controle de janela.",
    sessionCount: 1,
  },
];

export const automationBindings: AutomationBinding[] = [
  { id: "bind-mcp-menu", groupId: "grp-delivery", type: "mcp", name: "catalog-mcp", enabled: true },
  { id: "bind-skill-order", groupId: "grp-delivery", type: "skill", name: "order-builder", enabled: true },
  { id: "bind-agent-sales", groupId: "grp-delivery", type: "agent", name: "sales-agent", enabled: true },
  { id: "bind-skill-faq", groupId: "grp-retention", type: "skill", name: "faq-retirada", enabled: true },
  { id: "bind-mcp-campaign", groupId: "grp-campaign", type: "mcp", name: "campaign-mcp", enabled: false },
];

export const campaigns: Campaign[] = [
  {
    id: "cmp-almoco",
    name: "Almoco executivo",
    segment: "Clientes Centro",
    status: "scheduled",
    scheduledFor: "Amanha, 10:30",
    sent: 0,
    conversions: 0,
  },
  {
    id: "cmp-vip",
    name: "VIP fim de semana",
    segment: "VIP",
    status: "running",
    scheduledFor: "Hoje, 09:00",
    sent: 186,
    conversions: 21,
  },
];
