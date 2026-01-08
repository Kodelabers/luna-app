# Use Cases (HR) — Bolovanja (SickLeave)

Svi use caseovi moraju poštovati `spec.md` (SSoT Prisma schema, multitenancy, Server Actions + useActionState, UTC datumi, klijentska vremenska zona, i18n).

## Referentni dokumenti (SSoT / pravila)
- `/.cursor/docs/spec.md` (Iznimka: SickLeave jednokratna promjena sheme)
- `/.cursor/docs/02_data_model_mapping.md`
- `/.cursor/docs/03_permissions_rbac.md`
- `/.cursor/docs/05_dayschedule_rules.md`
- `/.cursor/docs/06_ledger_rules.md` (korekcije “preostali dani”)
- `/.cursor/docs/07_timezones_dates.md`
- `/.cursor/docs/01_domain_statuses.md`

## Definicije (kanonsko)
- **Bolovanje** je zaseban entitet `SickLeave` (nije `Application`).
- `UnavailabilityReason.sickLeave=true` je kanonski marker da je reason “bolovanje”.
- `SickLeaveStatus`:
  - `OPENED`: `endDate=null`
  - `CLOSED`: `endDate!=null`
  - `CANCELLED`: samo iz `OPENED` dok je `endDate=null`
- “Trenutno na bolovanju” = postoji barem jedno `SickLeave(status=OPENED)` za zaposlenika (tenant-scoped).

---

## Rute/UI (MVP)

### DM (po odjelu)
- `/:organisationAlias/department/:departmentId/sick-leaves`
  - lista bolovanja (OPENED/CLOSED/CANCELLED) za zaposlenike tog odjela
  - akcije: **Otvori bolovanje**, **Zatvori**, **Poništi (cancel)** (samo prema pravilima)
  - brze akcije dostupne i iz planning UI-a (UC03)

### GM (cijela organizacija)
- `/:organisationAlias/sick-leaves`
  - default filter: `status=OPENED` (aktivna)
  - opcionalno: filter po odjelu + prikaz povijesti (CLOSED/CANCELLED)
- Dashboard widget: “Aktivna bolovanja” (link na rutu i detalje)

---

## UC-SL-01 — DM/GM: Otvori bolovanje (OPENED)

### Cilj
Evidentirati bolovanje bez `endDate` i omogućiti UI prikaz od početka do danas.

### Input (Server Action)
- `employeeId: string`
- `unavailabilityReasonId: string` (mora imati `sickLeave=true`)
- `startDateLocalISO: string` (YYYY-MM-DD)
- `clientTimeZone: string`
- (opc.) `note?: string`

### Pravila i validacije
- Samo DM/GM.
- `startDateLocalISO` ne smije biti u budućnosti.
- Ne smije postojati overlap s drugim bolovanjem (OPENED ili CLOSED) za istog employee-a.

### Efekti
- Kreira `SickLeave(status=OPENED,endDate=null)`.
- `DaySchedule`:
  - materializira **samo start dan** s `sickLeaveId` (vidi `05_dayschedule_rules.md`).
- Korekcije (GO i ostali `hasPlanning=true`):
  - Ako bolovanje prekida već odobreni GO (ili drugi `hasPlanning=true`) koji ima `applicationId` u `DaySchedule`, primijeni korekciju po kanonskom pravilu “truncate” iz `06_ledger_rules.md`:
    - vrati sve preostale dane od `max(sickLeaveStart, applicationStart)` do `applicationEnd`
    - obriši `DaySchedule` originalnog `applicationId` za taj interval
    - upiši `ApplicationLog(POST_APPROVAL_IMPACT_CHANGED)` u originalni zahtjev s napomenom da je korekcija zbog bolovanja.

### UI prikaz (OPENED)
- Planning (gantt) i “Moj kalendar” prikazuju “virtualni raspon” **start → danas** u `clientTimeZone`, iako `DaySchedule` postoji samo za start dan.

---

## UC-SL-02 — DM/GM: Zatvori bolovanje (OPENED → CLOSED)

### Input
- `sickLeaveId: string`
- `endDateLocalISO: string` (YYYY-MM-DD)
- `clientTimeZone: string`
- (opc.) `note?: string`

### Pravila
- Samo DM/GM.
- Dozvoljeno samo iz `OPENED`.
- `endDateLocalISO` mora biti nakon `startDate`.

### Efekti
- Update `SickLeave(status=CLOSED,endDate=...)`.
- `DaySchedule`:
  - upsert za sve dane u rasponu `[startDate..endDate]` s `sickLeaveId`.
- Korekcije:
  - Obuhvatiti sve odobrene `Application` (i druge `hasPlanning=true`) koji upadaju u period bolovanja i za svaki primijeniti pravilo korekcije (truncate) iz `06_ledger_rules.md`.

---

## UC-SL-03 — DM/GM: Poništi bolovanje (OPENED → CANCELLED)

### Input
- `sickLeaveId: string`

### Pravila
- Samo DM/GM.
- Dozvoljeno samo iz `OPENED` i samo dok je `endDate=null`.
- Cancel **ne revert-a** korekcije (ledger/log ostaju).

### Efekti
- Update `SickLeave(status=CANCELLED)`.
- `DaySchedule`:
  - **obrisati** `DaySchedule` zapise koje je bolovanje kreiralo (u OPENED to je start dan).

---

## UC-SL-04 — GM: Pregled “tko je na bolovanju”

### Cilj
GM vidi listu zaposlenika koji su trenutno na bolovanju i može filtrirati po odjelu.

### Pravilo
- “Trenutno na bolovanju” = postoji `SickLeave(status=OPENED)` za zaposlenika.

---

## Napomena (MVP)
- Upload medicinske dokumentacije nije dio MVP-a; implementirati kasnije preko Supabase Storage (vidi `spec.md`).


