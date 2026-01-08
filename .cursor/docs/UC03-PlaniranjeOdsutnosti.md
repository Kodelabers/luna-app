# Use Cases (HR) — Planiranje odsutnosti (kalendar/resursi)

Svi use caseovi moraju poštovati `spec.md` (SSoT Prisma schema, multitenancy, Server Actions + useActionState, UTC datumi, klijentska vremenska zona, shadcn default theme + dark/light/system, i18n).

## Referentni dokumenti
- `/.cursor/docs/spec.md`
- `/.cursor/docs/09_terminology_glossary.md`
- `/.cursor/docs/03_permissions_rbac.md`
- `/.cursor/docs/07_timezones_dates.md`
- `/.cursor/docs/05_dayschedule_rules.md`
- `/.cursor/docs/04_applications_flow.md`
- `/.cursor/docs/UC08-SickLeave.md`

## Povezani user stories
- US-DASH-004, US-DM-002, US-GM-004

---

## UC-PLAN-01 — Prikaz planiranja odsutnosti (gantt/tablica: plan + zahtjevi)

### Cilj
DM/GM vidi tablični (gantt-like) prikaz zaposlenika i dana za odabrani raspon:
- **plan** (DaySchedule) kao pozadina
- **zahtjevi** (Application) kao overlay (SUBMITTED / APPROVED_FIRST_LEVEL / APPROVED)
- **bolovanja** (SickLeave) kao overlay i/ili indikator (OPENED / CLOSED)

### Akteri
- OrganisationUser (ulogiran)
- Employee (vezan na usera u organizaciji)
- Manager (DM ili GM)

### Ruta/UI (primjer)
- `/:organisationAlias/planning`

### Input (Server Action)
- `fromLocalISO: string` (YYYY-MM-DD)
- `toLocalISO: string` (YYYY-MM-DD)
- `clientTimeZone: string` (IANA tz, npr. `Europe/Zagreb`)
- (opc.) `departmentIds?: number[]` - Array odjela za filtriranje (ako prazan/undefined, prikazuje sve dostupne odjele)

### Preduvjeti
- Tenant ctx: `resolveTenantContext(organisationAlias)`
- Employee postoji u org-u (`active=true`)
- Manager pristup postoji (DM ili GM; vidi RBAC doc)

### Glavni tok (tz-aware)
1) Odredi scope odjela:
   - GM: svi odjeli u org-u ili odabrani `departmentIds` (multi-select)
   - DM: samo `managedDepartmentIds` ili odabrani `departmentIds` unutar te liste (multi-select)
2) Iz `fromLocalISO/toLocalISO` + `clientTimeZone` izračunati UTC granice raspona (vidi `07_timezones_dates.md`).
3) Dohvatiti zaposlenike u scope-u + njihove zapise za prikaz (tenant-scoped, `active=true`).
4) Dohvatiti `DaySchedule` za te zaposlenike u rasponu (tenant-scoped).
5) Dohvatiti `Application` u statusima `SUBMITTED/APPROVED_FIRST_LEVEL/APPROVED` relevantne za raspon i scope (tenant-scoped).
6) Dohvatiti `SickLeave` relevantne za raspon i scope (tenant-scoped):
   - `OPENED`: prikazati “virtualni raspon” od `startDate` do “danas” (u `clientTimeZone`)
   - `CLOSED`: prikazati raspon `startDate..endDate`
7) Vratiti serializabilni model za UI tablicu (redci: zaposlenici, stupci: dani u client TZ).

### Pravila (iz user stories)
- Default raspon: 1 mjesec od danas prema budućnosti; postoje preseti 1/3/6/12 mjeseci + ručni Od/Do.
- Preseti se računaju od današnjeg dana: danas + N mjeseci (npr. danas + 1 mjesec, danas + 3 mjeseca, itd.).
- Plan i zahtjevi moraju biti jasno razlučivi (pozadina vs overlay).
- Klik na ćeliju/blok otvara read-only detalje (plan, zahtjev ili bolovanje).
- Oznaka "na bolovanju" uz zaposlenika:
  - “Trenutno na bolovanju” = postoji barem jedno `SickLeave(status=OPENED)` za zaposlenika (tenant-scoped).
  - Boja/legendu uzima iz `UnavailabilityReason` gdje je `sickLeave=true`.

### Boje (konzistentno s "Moj kalendar" widgetom)
- **DaySchedule (NOT_AVAILABLE)**: Koristi se `unavailabilityReason.colorCode` direktno kao background color (bez opacity), bijeli tekst. Ako nema `unavailabilityReason`, koristi se `bg-muted`.
  - Zaobljeni rubovi se primjenjuju na početku i kraju raspona (start: lijevo zaobljeno, end: desno zaobljeno, middle: bez zaobljenja, single: sve strane zaobljene).
- **DaySchedule (AVAILABLE)**: `bg-background` (default pozadina).
- **DaySchedule (SELECTED_FOR_DUTY)**: `bg-blue-100 dark:bg-blue-950`.
- **Applications (overlay)**: Koriste se **border stilovi** s `unavailabilityReason.colorCode` (ne background color):
  - Border boja: `unavailabilityReason.colorCode` ili default `#fbbf24` (warning color) ako nema
  - **Svi statusi zahtjeva koriste istu boju** (ne razlikuje se po statusu)
  - Border stilovi se prilagođavaju poziciji dana u rasponu:
    - **start**: border top, bottom, left (bez right bordera), lijevo zaobljeno
    - **middle**: border top, bottom (bez side bordera), bez zaobljenja
    - **end**: border top, bottom, right (bez left bordera), desno zaobljeno
    - **single**: svi borderi (all borders), sve strane zaobljene
  - Border debljina: `2px solid`
- **Vikendi**: `bg-muted` s `text-muted-foreground`.
- **Praznici**: `bg-red-100 dark:bg-red-950` s `text-red-900 dark:text-red-100`.
- **Legenda**: Prikazuje sve unique `unavailabilityReason` s njihovim bojama:
  - DaySchedule (NOT_AVAILABLE): prikazuje se kao background color (puna boja)
  - Applications: prikazuje se kao border (2px solid)
  - Svaki razlog se prikazuje samo jednom u legendi s njegovom bojom i imenom (npr. "plavo - godišnji odmor", "crveno - bolovanje").

### Greške
- 403: korisnik nema manager pristup ili je `departmentIds` izvan scope-a
- 422: nevalidan raspon datuma/timezone ili raspon prevelik

### UI Funkcionalnosti
- **Multi-select filtriranje po odjelima**: Korisnik može odabrati više odjela odjednom
- **Date range preseti**: Brzi odabir (1, 3, 6, 12 mjeseci) računaju se od danas
- **Ručni odabir datuma**: Calendar picker za custom raspon
- **Horizontalni scroll**: Tablica ima vlastiti scroll za široke raspone
- **Sticky prva kolona**: Ime zaposlenika ostaje vidljivo pri scrollanju
- **Header format**: Prikazuje dan i mjesec (dd.MM.) za lakšu orijentaciju

