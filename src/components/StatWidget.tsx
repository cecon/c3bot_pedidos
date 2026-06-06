import type { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

interface StatWidgetProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}

export function StatWidget({ icon, label, value, hint }: StatWidgetProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
