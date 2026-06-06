import { useEffect, useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { SidebarNav } from "./components/SidebarNav";
import { AppHeader } from "./components/AppHeader";
import { DashboardPanel } from "./components/DashboardPanel";
import { AttendantsPanel } from "./components/AttendantsPanel";
import { useAppearance } from "./components/ThemeSettingsProvider";
import {
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  resolveDestinationFromHash,
  type DestinationId,
} from "./domain/navigation";
import { useAttendantManagement } from "./hooks/useAttendantManagement";
import type { WhatsAppSession } from "./domain/types";

function App() {
  const [activeId, setActiveId] = useState<DestinationId>(() => resolveDestinationFromHash(window.location.hash).destination.id);
  const { settings, update } = useAppearance();
  // Sessions are out of scope; the attendant hook stays compatible with an empty session list.
  const [sessionRows, setSessionRows] = useState<WhatsAppSession[]>([]);
  const attendants = useAttendantManagement({ sessionRows, setSessionRows });

  useEffect(() => {
    function sync() {
      setActiveId(resolveDestinationFromHash(window.location.hash).destination.id);
    }
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function navigate(id: DestinationId) {
    const dest = getDestinationById(id);
    if (window.location.hash !== dest.path) window.location.hash = dest.path;
    else setActiveId(id);
  }

  const activeDestination = getDestinationById(activeId);

  return (
    <AdminShell
      sidebar={
        <SidebarNav
          activeDestinationId={activeId}
          destinations={NAVIGATION_DESTINATIONS}
          collapsed={settings.sidebarCollapsed}
          onNavigate={navigate}
        />
      }
      header={<AppHeader activeDestination={activeDestination} onToggleSidebar={() => update("sidebarCollapsed", !settings.sidebarCollapsed)} />}
    >
      {activeId === "attendants" ? (
        <AttendantsPanel
          attendants={attendants.attendantRows}
          onCreateAttendant={attendants.createAttendant}
          onDeleteAttendant={attendants.deleteAttendant}
          onSetAvailability={attendants.setAvailability}
          onUpdateAttendant={attendants.updateExistingAttendant}
          persistenceState={attendants.persistenceState}
        />
      ) : (
        <DashboardPanel attendants={attendants.attendantRows} />
      )}
    </AdminShell>
  );
}

export default App;
