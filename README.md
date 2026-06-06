# C3Bot

Desktop admin built with Spec Kit, Tauri 2, Vite, React, TypeScript, Tailwind CSS +
shadcn/ui (Radix primitives), TanStack Table, Lucide, SQLite, Vitest, and StrykerJS.

> **Scope (feature 008, constitution v2.0.0):** the UI was re-platformed off Mantine onto
> shadcn/ui and trimmed to a minimal base — only **Dashboard** and **Atendentes** (the attendant
> registry, the sole persisted domain). Catalog (005) and merchant (006) were removed. The shadcn
> primitives live in `src/components/ui/` (copyable/adjustable); theming is CSS-variable driven with
> a class-based light/dark/auto toggle (dark default).

## Spec Kit

- Constitution: `.specify/memory/constitution.md`
- Feature spec: `specs/001-whatsapp-commerce-agent/spec.md`
- Implementation plan: `specs/001-whatsapp-commerce-agent/plan.md`
- Tasks: `specs/001-whatsapp-commerce-agent/tasks.md`

### Como chamar

Dentro do Codex, chame os skills instalados no projeto. O formato mais confiável é
com `$`, porque a integração `codex` do Spec Kit instala skills em `.agents/skills/`
e não garante autocomplete de slash commands na sessão já aberta:

```text
$speckit
$speckit-specify descreva a nova feature
$speckit-plan
$speckit-tasks
$speckit-implement
```

Se você acabou de inicializar o Spec Kit e nada aparece no autocomplete ao digitar
`/speckit`, feche e reabra o projeto/conversa no diretório do repo. Mesmo assim,
`/speckit` sozinho não é o fluxo completo; os comandos específicos são
`speckit-specify`, `speckit-plan`, `speckit-tasks` e `speckit-implement`.

Pelo terminal, use o wrapper do projeto:

```powershell
pnpm speckit -- --help
pnpm speckit:check
pnpm speckit:workflow:list
pnpm speckit:workflow -- --input "spec=descreva a feature"
```

O wrapper executa o CLI oficial via `uvx --from git+https://github.com/github/spec-kit.git specify`
com UTF-8 habilitado para evitar falhas de encoding no Windows.

## Install

```powershell
pnpm install
```

## Development

```powershell
pnpm dev
pnpm tauri dev
```

## Docker Development

Run the Vite workspace in Docker when multiple local sessions need to access the
same development server:

```powershell
docker compose up --build -d
```

The app listens on:

```text
http://localhost:3920/#/dashboard
```

Stop the container with:

```powershell
docker compose down
```

## Validation

```powershell
pnpm typecheck
pnpm test
pnpm test:mutation
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```
