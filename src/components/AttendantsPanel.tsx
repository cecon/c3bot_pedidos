import { useMemo, useState } from "react";
import { UserPlus } from "./icons";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { DataTable } from "./ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { AttendantForm, type AttendantFormMode } from "./AttendantForm";
import { buildAttendantColumns } from "./attendant-columns";
import { canMutatePersistedAttendants, getAttendantPersistenceLabel } from "../domain/attendantPersistence";
import type {
  Attendant,
  AttendantDeleteHandler,
  AttendantMutationHandler,
  AttendantPersistenceState,
  AttendantUpdateHandler,
  AvailabilityStatus,
} from "../domain/types";

interface AttendantsPanelProps {
  attendants: Attendant[];
  onCreateAttendant: AttendantMutationHandler;
  onDeleteAttendant: AttendantDeleteHandler;
  onSetAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void | Promise<void>;
  onUpdateAttendant: AttendantUpdateHandler;
  persistenceState: AttendantPersistenceState;
}

export function AttendantsPanel({
  attendants,
  onCreateAttendant,
  onDeleteAttendant,
  onSetAvailability,
  onUpdateAttendant,
  persistenceState,
}: AttendantsPanelProps) {
  const activeAttendants = attendants.filter((a) => a.active);
  const canMutate = canMutatePersistedAttendants(persistenceState);
  const persistenceLabel = getAttendantPersistenceLabel(persistenceState);
  const [formMode, setFormMode] = useState<AttendantFormMode>("closed");
  const [editing, setEditing] = useState<Attendant | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Attendant | undefined>();

  const columns = useMemo(
    () =>
      buildAttendantColumns({
        onEdit: (a) => {
          if (!canMutate) return;
          setEditing(a);
          setFormMode("edit");
        },
        onSetAvailability,
        onDelete: (id) => setPendingDelete(activeAttendants.find((a) => a.id === id)),
      }),
    [canMutate, onSetAvailability, activeAttendants],
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    const result = await onDeleteAttendant(pendingDelete.id);
    if (result.ok) setPendingDelete(undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Atendentes</h2>
          <p className="text-sm text-muted-foreground">Funcionários humanos que podem receber atendimentos.</p>
        </div>
        <Button
          disabled={!canMutate}
          onClick={() => {
            setEditing(undefined);
            setFormMode("create");
          }}
        >
          <UserPlus size={16} /> Adicionar atendente
        </Button>
      </div>

      {persistenceLabel && (
        <Card role="alert">
          <CardContent className="p-3 text-sm text-muted-foreground">{persistenceLabel}</CardContent>
        </Card>
      )}

      {formMode !== "closed" && canMutate && (
        <AttendantForm
          attendants={attendants}
          editingAttendant={editing}
          mode={formMode}
          onClose={() => setFormMode("closed")}
          onCreateAttendant={onCreateAttendant}
          onUpdateAttendant={onUpdateAttendant}
        />
      )}

      <DataTable
        columns={columns}
        data={activeAttendants}
        getRowId={(a) => a.id}
        empty="Nenhum atendente cadastrado. Adicione o primeiro funcionário."
      />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir atendente</DialogTitle>
            <DialogDescription>
              Remover {pendingDelete?.displayName}? Esta ação desativa o atendente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingDelete(undefined)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>Confirmar exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
