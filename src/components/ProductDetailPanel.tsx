import { useCallback, useEffect, useState } from "react";
import { Button, Divider, Group, NumberInput, Paper, Stack, Text, TextInput } from "@mantine/core";
import type { AvailabilityState } from "../domain/types";
import type { CatalogApiClient } from "../services/catalogApi";
import { emptyPizzaConfigData, savePizzaConfig, toPizzaConfigData } from "../services/pizzaConfigSync";
import { AvailabilityControl } from "./AvailabilityControl";
import { OptionGroupEditor, type OptionView } from "./OptionGroupEditor";
import { PizzaConfigEditor, type PizzaConfigData } from "./PizzaConfigEditor";
import { ComboEditor, type ComboComponentValue, type ComboProduct } from "./ComboEditor";

interface GroupRow {
  id: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
}
interface OptionRow extends OptionView {
  optionGroupId: string;
}
interface LoadedGroup {
  group: GroupRow;
  options: OptionView[];
}

interface ProductDetailPanelProps {
  client: CatalogApiClient;
  productId: string;
  productName: string;
  categoryId: string;
  categoryTemplate?: "default" | "pizza" | "combo";
  itemId: string;
  products: ComboProduct[];
  onClose: () => void;
}

export function ProductDetailPanel(props: ProductDetailPanelProps) {
  const { client, productId, categoryId, categoryTemplate, itemId } = props;
  const [status, setStatus] = useState<AvailabilityState>("available");
  const [pauseUntil, setPauseUntil] = useState<string | null>(null);
  const [groups, setGroups] = useState<LoadedGroup[]>([]);
  const [pizza, setPizza] = useState<PizzaConfigData | null>(null);
  const [combo, setCombo] = useState<ComboComponentValue[] | null>(null);
  const [groupName, setGroupName] = useState("");
  const [min, setMin] = useState<number | string>(0);
  const [max, setMax] = useState<number | string>(1);

  const loadGroups = useCallback(async (): Promise<LoadedGroup[]> => {
    const rows = await client.listOptionGroups<GroupRow[]>(productId);
    return Promise.all(
      rows.map(async (group) => ({ group, options: await client.listOptions<OptionRow[]>(group.id) })),
    );
  }, [client, productId]);

  useEffect(() => {
    let active = true;
    client
      .getProduct<{ status: AvailabilityState; pauseUntil: string | null }>(productId)
      .then((product) => {
        if (!active) return;
        setStatus(product.status);
        setPauseUntil(product.pauseUntil);
      })
      .catch(() => undefined);
    loadGroups()
      .then((loaded) => active && setGroups(loaded))
      .catch(() => active && setGroups([]));
    return () => {
      active = false;
    };
  }, [client, productId, loadGroups]);

  useEffect(() => {
    if (categoryTemplate !== "pizza") return;
    let active = true;
    client
      .getPizzaConfig<Parameters<typeof toPizzaConfigData>[0]>(categoryId)
      .then((readback) => active && setPizza(toPizzaConfigData(readback)))
      .catch(() => active && setPizza(emptyPizzaConfigData()));
    return () => {
      active = false;
    };
  }, [client, categoryId, categoryTemplate]);

  useEffect(() => {
    if (categoryTemplate !== "combo") return;
    let active = true;
    client
      .listComboComponents<ComboComponentValue[]>(itemId)
      .then((rows) => active && setCombo(rows))
      .catch(() => active && setCombo([]));
    return () => {
      active = false;
    };
  }, [client, itemId, categoryTemplate]);

  return (
    <Paper withBorder p="md" radius="sm">
      <Group justify="space-between" mb="sm">
        <Text fw={800}>{props.productName}</Text>
        <Button variant="subtle" size="compact-sm" onClick={props.onClose}>
          Fechar
        </Button>
      </Group>

      <AvailabilityControl
        status={status}
        pauseUntil={pauseUntil}
        onChange={async (nextStatus, nextPause) => {
          await client.setProductStatus(productId, nextStatus, nextPause);
          setStatus(nextStatus);
          setPauseUntil(nextPause);
        }}
      />

      <Divider my="sm" />
      <Text fw={700} size="sm" mb="xs">
        Complementos
      </Text>
      <Stack gap="md">
        {groups.map(({ group, options }) => (
          <OptionGroupEditor
            key={group.id}
            group={{ name: group.name, minQuantity: group.minQuantity, maxQuantity: group.maxQuantity }}
            options={options}
            onSaveGroup={async (settings) => {
              await client.updateOptionGroup(group.id, settings);
              setGroups(await loadGroups());
            }}
            onAddOption={async ({ name, priceReais }) => {
              await client.createOption(group.id, {
                name,
                priceCents: typeof priceReais === "number" ? Math.round(priceReais * 100) : 0,
              });
              setGroups(await loadGroups());
            }}
          />
        ))}
        <Group gap="xs" align="end">
          <TextInput label="Novo grupo" value={groupName} onChange={(event) => setGroupName(event.currentTarget.value)} />
          <NumberInput label="Mín." w={80} min={0} value={min} onChange={setMin} />
          <NumberInput label="Máx." w={80} min={1} value={max} onChange={setMax} />
          <Button
            disabled={groupName.trim() === ""}
            onClick={async () => {
              await client.createOptionGroup(productId, {
                name: groupName.trim(),
                minQuantity: typeof min === "number" ? min : 0,
                maxQuantity: typeof max === "number" ? max : 1,
              });
              setGroupName("");
              setGroups(await loadGroups());
            }}
          >
            Criar grupo
          </Button>
        </Group>
      </Stack>

      {categoryTemplate === "pizza" && pizza && (
        <>
          <Divider my="sm" />
          <PizzaConfigEditor
            initial={pizza}
            onSave={async (data) => {
              await savePizzaConfig(client, categoryId, data);
              setPizza(toPizzaConfigData(await client.getPizzaConfig<Parameters<typeof toPizzaConfigData>[0]>(categoryId)));
            }}
          />
        </>
      )}

      {categoryTemplate === "combo" && combo && (
        <>
          <Divider my="sm" />
          <ComboEditor
            products={props.products}
            initial={combo}
            onSave={async (components) => {
              await client.setComboComponents(itemId, components);
              setCombo(components);
            }}
          />
        </>
      )}
    </Paper>
  );
}
