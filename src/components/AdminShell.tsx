import type { ReactNode } from "react";

interface AdminShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

// App frame: flush sidebar + a full-height content column with a sticky header.
export function AdminShell({ sidebar, header, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="mx-auto w-full max-w-[1320px] flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
