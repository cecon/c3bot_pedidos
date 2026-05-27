import { Paper, Tabs } from "@mantine/core";
import { Bot, CalendarClock, Megaphone, Store } from "lucide-react";
import type { AutomationBinding, AutomationGroup, Campaign, Customer, Order, Product } from "../domain/types";
import type { OrderSummary } from "../domain/analytics";
import { AutomationGroupsPanel } from "./AutomationGroupsPanel";
import { CampaignsPanel } from "./CampaignsPanel";
import { CatalogPanel } from "./CatalogPanel";
import { OrdersPanel } from "./OrdersPanel";

interface OpsPanelProps {
  automationBindings: AutomationBinding[];
  automationGroups: AutomationGroup[];
  campaigns: Campaign[];
  customers: Customer[];
  onAddProduct: () => void;
  onProductNameChange: (value: string) => void;
  onProductPriceChange: (value: number | string) => void;
  onScheduleOrder: () => void;
  orders: Order[];
  productName: string;
  productPrice: number | string;
  products: Product[];
  summary: OrderSummary;
}

export function OpsPanel(props: OpsPanelProps) {
  return (
    <Paper className="ops-panel" radius="sm">
      <Tabs defaultValue="catalog" keepMounted={false}>
        <Tabs.List grow>
          <Tabs.Tab value="catalog" leftSection={<Store size={15} />}>
            Catalogo
          </Tabs.Tab>
          <Tabs.Tab value="orders" leftSection={<CalendarClock size={15} />}>
            Pedidos
          </Tabs.Tab>
          <Tabs.Tab value="groups" leftSection={<Bot size={15} />}>
            Grupos
          </Tabs.Tab>
          <Tabs.Tab value="campaigns" leftSection={<Megaphone size={15} />}>
            Campanhas
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="catalog" pt="md">
          <CatalogPanel
            onAddProduct={props.onAddProduct}
            onProductNameChange={props.onProductNameChange}
            onProductPriceChange={props.onProductPriceChange}
            productName={props.productName}
            productPrice={props.productPrice}
            products={props.products}
          />
        </Tabs.Panel>
        <Tabs.Panel value="orders" pt="md">
          <OrdersPanel
            customers={props.customers}
            onScheduleOrder={props.onScheduleOrder}
            orders={props.orders}
            summary={props.summary}
          />
        </Tabs.Panel>
        <Tabs.Panel value="groups" pt="md">
          <AutomationGroupsPanel bindings={props.automationBindings} groups={props.automationGroups} />
        </Tabs.Panel>
        <Tabs.Panel value="campaigns" pt="md">
          <CampaignsPanel campaigns={props.campaigns} />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
