import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Power, PowerOff, Trash2 } from "./icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Attendant, AvailabilityStatus } from "../domain/types";

interface ColumnHandlers {
  onEdit: (attendant: Attendant) => void;
  onSetAvailability: (attendantId: string, status: AvailabilityStatus) => void | Promise<void>;
  onDelete: (attendantId: string) => void;
}

export function buildAttendantColumns({ onEdit, onSetAvailability, onDelete }: ColumnHandlers): ColumnDef<Attendant, unknown>[] {
  return [
    {
      id: "attendant",
      header: "Atendente",
      accessorFn: (a) => a.displayName,
      enableSorting: true,
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
              {a.displayName.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{a.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{a.name}</p>
            </div>
          </div>
        );
      },
    },
    { id: "whatsapp", header: "WhatsApp", accessorFn: (a) => a.whatsappNumber, cell: ({ row }) => <span className="text-sm">{row.original.whatsappNumber}</span> },
    {
      id: "status",
      header: "Status",
      accessorFn: (a) => a.availabilityStatus,
      enableSorting: true,
      cell: ({ row }) => {
        const online = row.original.availabilityStatus === "online";
        return <Badge variant={online ? "success" : "muted"}>{online ? "Online" : "Offline"}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original;
        const next: AvailabilityStatus = a.availabilityStatus === "online" ? "offline" : "online";
        const toggleLabel = next === "online" ? `Tornar online ${a.displayName}` : `Tornar offline ${a.displayName}`;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label={`Editar ${a.displayName}`} onClick={() => onEdit(a)}>
              <Edit size={16} />
            </Button>
            <Button variant="ghost" size="icon" aria-label={toggleLabel} onClick={() => void onSetAvailability(a.id, next)}>
              {next === "online" ? <Power size={16} /> : <PowerOff size={16} />}
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Excluir ${a.displayName}`} onClick={() => onDelete(a.id)}>
              <Trash2 size={16} />
            </Button>
          </div>
        );
      },
    },
  ];
}
