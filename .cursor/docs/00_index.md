# Dokumentacija (Cursor AI) — Index

Ovaj folder (`.cursor/docs/`) je **operativna dokumentacija** za razvoj u Cursor AI.

## Single Source of Truth (SSoT)
- **Prisma model**: `prisma/schema.prisma` (SSoT za domenu i polja)
- **Arhitekturna pravila**: `/.cursor/docs/spec.md` (layering, server actions, multitenancy, timezone)

## Kako razvijamo (kratko)
- UI (app/components) → **Server Actions** (`lib/actions/*`) → **Services** (`lib/services/*`) → Prisma
- Validacija: **zod**
- Forme: **useActionState** (vidi `spec.md`)
- Sve tenant-scoped po `/:organisationAlias/*`

## Ključni dokumenti
- **Terminologija (UI)**: `/.cursor/docs/09_terminology_glossary.md`
- **Otvorena pitanja / odluke**: `/.cursor/docs/OPEN_QUESTIONS.md`
- **Statusi i prijelazi**: `/.cursor/docs/01_domain_statuses.md`
- **Mapping: koncept → Prisma**: `/.cursor/docs/02_data_model_mapping.md`
- **RBAC i vidljivost podataka**: `/.cursor/docs/03_permissions_rbac.md`
- **Flow zahtjeva (Application)**: `/.cursor/docs/04_applications_flow.md`
- **DaySchedule pravila**: `/.cursor/docs/05_dayschedule_rules.md`
- **Ledger pravila (alokacije/potrošnja/korekcije)**: `/.cursor/docs/06_ledger_rules.md`
- **Datumi i timezone**: `/.cursor/docs/07_timezones_dates.md`
- **MVP scope**: `/.cursor/docs/08_mvp_scope.md`

## Postojeći use-case docovi
- Dashboard: `/.cursor/docs/UC01-Dashboard.md`
- Zahtjevi: `/.cursor/docs/UC02-Applications.md`
- Planiranje odsutnosti: `/.cursor/docs/UC03-PlaniranjeOdsutnosti.md`
- Stanje dana i dodjele: `/.cursor/docs/UC04-StanjeDanaDodjele.md`
- Bolovanja: `/.cursor/docs/UC08-SickLeave.md`


