import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "../../lib/utils";

// Lightweight toast store + Radix renderer. Replaces Mantine notifications.
export type ToastVariant = "default" | "success" | "danger";
export interface ToastItem {
  id: number;
  title?: string;
  message: string;
  variant: ToastVariant;
}

let counter = 0;
const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

function emit() {
  for (const l of listeners) l([...items]);
}

export function toast(input: { title?: string; message: string; variant?: ToastVariant }) {
  const item: ToastItem = { id: ++counter, variant: "default", ...input };
  items = [...items, item];
  emit();
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: "border-border bg-popover text-popover-foreground",
  success: "border-success/40 bg-popover text-foreground",
  danger: "border-destructive/50 bg-popover text-foreground",
};

export function Toaster() {
  const [list, setList] = React.useState<ToastItem[]>([]);
  React.useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
      {list.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            "pointer-events-auto flex w-80 items-start gap-2 rounded-md border p-3 shadow-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
            VARIANT_CLASS[t.variant],
          )}
        >
          <div className="flex-1">
            {t.title && <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>}
            <ToastPrimitive.Description className="text-sm text-muted-foreground">{t.message}</ToastPrimitive.Description>
          </div>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm" />
    </ToastPrimitive.Provider>
  );
}
