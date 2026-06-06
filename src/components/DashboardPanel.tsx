import { Activity, Power, UserCheck } from "./icons";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { StatWidget } from "./StatWidget";
import type { Attendant } from "../domain/types";

interface DashboardPanelProps {
  attendants: Attendant[];
}

export function DashboardPanel({ attendants }: DashboardPanelProps) {
  const active = attendants.filter((a) => a.active);
  const online = active.filter((a) => a.availabilityStatus === "online").length;
  const offline = active.length - online;

  return (
    <div data-testid="panel-dashboard" className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatWidget icon={<UserCheck size={18} />} label="Atendentes ativos" value={active.length} />
        <StatWidget icon={<Power size={18} />} label="Online agora" value={online} />
        <StatWidget icon={<Activity size={18} />} label="Offline" value={offline} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao C3Bot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Workspace enxuto: gerencie o cadastro de atendentes em <strong className="text-foreground">Atendentes</strong>.
          Personalize a aparência pelo ícone de engrenagem no topo.
        </CardContent>
      </Card>
    </div>
  );
}
