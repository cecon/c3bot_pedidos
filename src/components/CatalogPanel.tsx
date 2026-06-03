import { Badge, Box, Button, Group, Image, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { PackagePlus } from "./icons";
import type { Product } from "../domain/types";
import { formatCurrency } from "../domain/analytics";

interface CatalogPanelProps {
  onAddProduct: () => void;
  onProductNameChange: (value: string) => void;
  onProductPriceChange: (value: number | string) => void;
  productName: string;
  productPrice: number | string;
  products: Product[];
}

export function CatalogPanel({
  onAddProduct,
  onProductNameChange,
  onProductPriceChange,
  productName,
  productPrice,
  products,
}: CatalogPanelProps) {
  return (
    <Stack gap="md">
      <Group grow align="end">
        <TextInput
          label="Produto"
          placeholder="Nome"
          value={productName}
          onChange={(event) => onProductNameChange(event.currentTarget.value)}
        />
        <NumberInput
          label="Preco"
          decimalScale={2}
          fixedDecimalScale
          min={0}
          value={productPrice}
          onChange={onProductPriceChange}
        />
        <Button leftSection={<PackagePlus size={16} />} onClick={onAddProduct}>
          Adicionar
        </Button>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {products.map((product) => (
          <Paper className="product-item" key={product.id} radius="sm">
            <Image src={product.imageUrl} alt={product.name} className="product-image" />
            <Box p="sm">
              <Group justify="space-between" wrap="nowrap">
                <Text fw={800} size="sm" truncate>
                  {product.name}
                </Text>
                <Badge color="green">{formatCurrency(product.priceCents)}</Badge>
              </Group>
              <Text c="dimmed" size="xs" lineClamp={2}>
                {product.description}
              </Text>
            </Box>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
