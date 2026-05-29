# Quickstart: Attendant Database Persistence and ORM Governance

## Goal

Validate that delivery attendants come from the local database, not runtime mocks, and
that future database changes have an ORM and command-generated migration workflow.

## Preparation

1. Install dependencies after the implementation tasks add ORM tooling:

   ```powershell
   pnpm install
   ```

2. Start the desktop runtime when validating persistence:

   ```powershell
   pnpm tauri dev
   ```

3. Use Vite browser preview only for layout checks. Browser-only runtime must not
   create mock attendants as a persistence fallback.

## Scenario 1: Clean Workspace Shows No Mock Attendants

1. Open the delivery attendants destination.
2. Confirm the list does not show Ana, Lucas, Maria, or any other seeded employee.
3. Confirm the empty state and add action are visible.
4. Open session transfer controls and confirm no mock attendant is offered.

## Scenario 2: Create a Real Attendant

1. Add a new attendant with name, display name, WhatsApp, and optional photo.
2. Save the form.
3. Confirm the attendant appears offline in the list.
4. Restart the Tauri application.
5. Confirm the same attendant remains in the list with the saved fields.

## Scenario 3: Transfer Uses Only Persisted Online Attendants

1. Mark the saved attendant online.
2. Open a session transfer control.
3. Confirm only saved online attendants appear as valid targets.
4. Mark the attendant offline.
5. Confirm they disappear from valid transfer targets.

## Scenario 4: Migration Governance

1. For any future schema change, generate the migration from the accepted terminal
   command, for example:

   ```powershell
   pnpm db:generate -- --name descriptive-change
   ```

2. Record the exact command in the implementation notes or PR description.
3. Review the generated SQL before commit.
4. Register generated SQL with the Tauri migration list when it must run at startup.
5. Run the migration check command added by implementation tasks:

   ```powershell
   pnpm db:check
   ```

## Required Validation

```powershell
pnpm lint
pnpm max-lines
pnpm typecheck
pnpm test
pnpm test:mutation
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```
