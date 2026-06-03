import { useState } from "react";
import { Button, Group, NumberInput, Select, Stack, Table, Text, TextInput } from "@mantine/core";
import { Plus } from "./icons";
import type { PizzaPricingStrategy } from "../domain/types";

// Presentational pizza-config editor (no IO). Configures strategy, sizes, crusts, edges,
// flavors and the per-size flavor price grid; emits the full structure via onSave (the
// container creates rows then sets flavor prices). FR-021..023.
interface NamedPrice {
  name: string;
  priceReais: number | string;
}
interface SizeInput {
  name: string;
  maxFlavors: number | string;
}

export interface PizzaConfigData {
  pricingStrategy: PizzaPricingStrategy;
  sizes: SizeInput[];
  crusts: NamedPrice[];
  edges: NamedPrice[];
  flavors: string[];
  prices: Array<{ flavorIndex: number; sizeIndex: number; priceReais: number | string }>;
}

interface PizzaConfigEditorProps {
  initial: PizzaConfigData;
  onSave: (data: PizzaConfigData) => void;
}

export function PizzaConfigEditor({ initial, onSave }: PizzaConfigEditorProps) {
  const [strategy, setStrategy] = useState<PizzaPricingStrategy>(initial.pricingStrategy);
  const [sizes, setSizes] = useState<SizeInput[]>(initial.sizes);
  const [crusts, setCrusts] = useState<NamedPrice[]>(initial.crusts);
  const [edges, setEdges] = useState<NamedPrice[]>(initial.edges);
  const [flavors, setFlavors] = useState<string[]>(initial.flavors);
  const [prices, setPrices] = useState<Record<string, number | string>>(
    Object.fromEntries(initial.prices.map((p) => [`${p.flavorIndex}-${p.sizeIndex}`, p.priceReais])),
  );
  const [sizeName, setSizeName] = useState("");
  const [flavorName, setFlavorName] = useState("");
  const [crustName, setCrustName] = useState("");
  const [edgeName, setEdgeName] = useState("");

  const save = () =>
    onSave({
      pricingStrategy: strategy,
      sizes,
      crusts,
      edges,
      flavors,
      prices: Object.entries(prices).map(([key, priceReais]) => {
        const [flavorIndex, sizeIndex] = key.split("-").map(Number);
        return { flavorIndex, sizeIndex, priceReais };
      }),
    });

  return (
    <Stack gap="sm">
      <Group gap="sm" align="end">
        <Select
          label="Estratégia de preço"
          data={[
            { value: "highest", label: "Maior sabor" },
            { value: "average", label: "Média dos sabores" },
          ]}
          value={strategy}
          onChange={(value) => setStrategy((value as PizzaPricingStrategy) ?? "highest")}
        />
      </Group>

      <Group gap="xs" align="end">
        <TextInput label="Novo tamanho" value={sizeName} onChange={(event) => setSizeName(event.currentTarget.value)} />
        <Button
          leftSection={<Plus size={14} />}
          disabled={sizeName.trim() === ""}
          onClick={() => {
            setSizes((current) => [...current, { name: sizeName.trim(), maxFlavors: 1 }]);
            setSizeName("");
          }}
        >
          Tamanho
        </Button>
        <TextInput label="Novo sabor" value={flavorName} onChange={(event) => setFlavorName(event.currentTarget.value)} />
        <Button
          leftSection={<Plus size={14} />}
          disabled={flavorName.trim() === ""}
          onClick={() => {
            setFlavors((current) => [...current, flavorName.trim()]);
            setFlavorName("");
          }}
        >
          Sabor
        </Button>
      </Group>

      <Group gap="xs" align="end">
        <TextInput label="Nova massa" value={crustName} onChange={(event) => setCrustName(event.currentTarget.value)} />
        <Button
          variant="light"
          leftSection={<Plus size={14} />}
          disabled={crustName.trim() === ""}
          onClick={() => {
            setCrusts((current) => [...current, { name: crustName.trim(), priceReais: 0 }]);
            setCrustName("");
          }}
        >
          Massa
        </Button>
        <TextInput label="Nova borda" value={edgeName} onChange={(event) => setEdgeName(event.currentTarget.value)} />
        <Button
          variant="light"
          leftSection={<Plus size={14} />}
          disabled={edgeName.trim() === ""}
          onClick={() => {
            setEdges((current) => [...current, { name: edgeName.trim(), priceReais: 0 }]);
            setEdgeName("");
          }}
        >
          Borda
        </Button>
      </Group>

      {flavors.length > 0 && sizes.length > 0 && (
        <Table withTableBorder withColumnBorders aria-label="Grade de preços por tamanho">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Sabor \ Tamanho</Table.Th>
              {sizes.map((size, sizeIndex) => (
                <Table.Th key={sizeIndex}>{size.name}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {flavors.map((flavor, flavorIndex) => (
              <Table.Tr key={flavorIndex}>
                <Table.Td>{flavor}</Table.Td>
                {sizes.map((_, sizeIndex) => {
                  const key = `${flavorIndex}-${sizeIndex}`;
                  return (
                    <Table.Td key={sizeIndex}>
                      <NumberInput
                        aria-label={`Preço ${flavor} ${sizes[sizeIndex].name}`}
                        size="xs"
                        min={0}
                        decimalScale={2}
                        value={prices[key] ?? ""}
                        onChange={(value) => setPrices((current) => ({ ...current, [key]: value }))}
                      />
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Group justify="space-between">
        <Text c="dimmed" size="xs">
          {sizes.length} tamanho(s) · {flavors.length} sabor(es) · {crusts.length} massa(s) · {edges.length} borda(s)
        </Text>
        <Button onClick={save}>Salvar pizza</Button>
      </Group>
    </Stack>
  );
}
