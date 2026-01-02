# Implementation Status

## UC02 Applications - Implementirano (2024-12-23)

### ✅ UC-APP-01 — Employee: Kreiranje zahtjeva (odabir perioda + real-time validacija)
- **Service**: `validateApplicationDraft()` u `lib/services/application.ts`
- **Action**: `validateApplicationDraftAction()` u `lib/actions/application.ts`
- **API**: `/[organisationAlias]/api/applications/validate/route.ts`
- **Validacije**:
  - Datumi logički (start ≤ end)
  - Period uključuje barem jedan radni dan
  - Workdays kalkulacija (isključeni vikendi i praznici)
  - Preklapanje s aktivnim zahtjevima (blokira)
  - Preklapanje s DaySchedule (warning)
  - Validacija dostupnih dana (za hasPlanning=true)
- **Output**: ValidationResult s calendarDays, workdays, availableDays, errors, warnings

### ✅ UC-APP-02 — Employee: Spremi zahtjev kao DRAFT (create/update)
- **Service**: `saveDraftApplication()` u `lib/services/application.ts`
- **Action**: `saveDraftApplicationAction()` u `lib/actions/application.ts`
- **UI**: `ApplicationForm` komponenta
- **Funkcionalnost**:
  - Kreiranje novog DRAFT-a
  - Uređivanje postojećeg DRAFT-a
  - Server-side validacija prije spremanja
  - Audit log (CREATED)

### ✅ UC-APP-03 — Employee: Submit zahtjev (DRAFT → SUBMITTED ili auto-APPROVED)
- **Service**: `submitApplication()` u `lib/services/application.ts`
- **Action**: `submitApplicationAction()` u `lib/actions/application.ts`
- **UI**: `SubmitApplicationButton` komponenta
- **Funkcionalnost**:
  - Re-validacija prije submita
  - DRAFT → SUBMITTED (ako needApproval=true)
  - DRAFT → APPROVED (ako needApproval=false, auto-approve)
  - Izvršavanje DaySchedule + ledger efekata za auto-approve
  - Audit log (REQUESTED ili APPROVED)

### ✅ UC-APP-04 — Employee: Uređivanje i brisanje DRAFT-a
- **Service**: `deleteDraftApplication()` u `lib/services/application.ts`
- **Action**: `deleteDraftApplicationAction()` u `lib/actions/application.ts`
- **UI**: `DeleteApplicationDialog` komponenta
- **Funkcionalnost**:
  - Soft-delete (active=false)
  - Audit log (DELETED)
  - Samo za DRAFT status

### ✅ UC-APP-05 — Employee: Pregled svih vlastitih zahtjeva (lista)
- **Service**: `listMyApplications()` u `lib/services/application.ts`
- **Action**: `listMyApplicationsAction()` u `lib/actions/application.ts`
- **UI**: 
  - `ApplicationTable` - prikaz tablice
  - `ApplicationFilters` - filtriranje po statusu i razlogu
  - `ApplicationsListClient` - client wrapper
- **Ruta**: `/[organisationAlias]/applications/page.tsx`
- **Funkcionalnost**:
  - Prikaz svih zahtjeva (DRAFT..REJECTED)
  - Filtriranje po statusu i razlogu
  - Client-side pretraga
  - Akcije: View, Edit (DRAFT), Delete (DRAFT)

### ✅ UC-APP-06 — Detalji zahtjeva (read-only) + log/comment
- **Ruta**: `/[organisationAlias]/applications/[applicationId]/page.tsx`
- **Funkcionalnost**:
  - Prikaz svih detalja zahtjeva
  - Prikaz komentara (ApplicationComment)
  - Prikaz audit trail-a (ApplicationLog)
  - Submit button za DRAFT
  - Edit button za DRAFT

### ✅ UC-APP-08 — DM: Odobri/Odbij zahtjev (1. razina)
- **Service**: `decideAsDepartmentManager()` u `lib/services/application.ts`
- **Action**: `dmDecideApplicationAction()` u `lib/actions/application.ts`
- **Već implementirano u prethodnom zadatku** (UC-DASH-04)

### ✅ UC-APP-09 — GM: Finalno Odobri/Odbij zahtjev (2. razina)
- **Service**: `decideAsGeneralManager()` u `lib/services/application.ts`
- **Action**: `gmDecideApplicationAction()` u `lib/actions/application.ts`
- **Već implementirano u prethodnom zadatku** (UC-DASH-05)

## Rute i stranice

### Employee rute (Option A)
- ✅ `/[organisationAlias]/applications` - Lista svih zahtjeva
- ✅ `/[organisationAlias]/applications/new` - Kreiranje novog zahtjeva
- ✅ `/[organisationAlias]/applications/[applicationId]` - Detalji zahtjeva
- ✅ `/[organisationAlias]/applications/[applicationId]/edit` - Uređivanje DRAFT-a

### API rute
- ✅ `/[organisationAlias]/api/applications/validate` - Real-time validacija

## UI Komponente

### Kreiranje/Uređivanje
- ✅ `ApplicationForm` - Forma za kreiranje/uređivanje s real-time validacijom
  - Date picker za start/end date
  - Reason selection
  - Description textarea
  - Validation summary (workdays, available days, errors, warnings)

### Lista i prikaz
- ✅ `ApplicationTable` - Tablica zahtjeva s akcijama
- ✅ `ApplicationFilters` - Filtriranje po statusu i razlogu
- ✅ `ApplicationsListClient` - Client wrapper za listu
- ✅ `DeleteApplicationDialog` - Dialog za brisanje DRAFT-a
- ✅ `SubmitApplicationButton` - Button za submit DRAFT-a

## Validacije (Zod schemas)

- ✅ `validateApplicationDraftSchema` - Za validaciju
- ✅ `saveDraftApplicationSchema` - Za spremanje draft-a
- ✅ `submitApplicationSchema` - Za submit
- ✅ `deleteApplicationSchema` - Za brisanje

## i18n prijevodi

- ✅ Hrvatski (hr.json)
- ✅ Engleski (en.json)
- Svi ključevi pod `applications.*`

## Navigacija

- ✅ Dodano u sidebar: "Zahtjevi" link s FileText ikonom

## Što nije implementirano (TBD)

### ❌ UC-APP-07 — Korekcija "vraćanje dana"
- Osnovna logika postoji u `applyApprovalEffects()`
- Potrebno testiranje i fine-tuning prema US-EMP-012B / US-VAL-007

### ❌ UC-APP-10 — Cancel zahtjeva
- TBD prema OPEN_QUESTIONS.md (OQ-003)

## Napomene

1. **Timezone handling**: Sve funkcije koriste `clientTimeZone` parametar i `date-fns-tz` za konverzije
2. **Approval effects**: DaySchedule i ledger efekti se izvršavaju kroz `applyApprovalEffects()` servis
3. **RBAC**: Sve funkcije provjeravaju Employee profil i tenant context
4. **Soft delete**: Application koristi `active=false` za brisanje
5. **Audit trail**: Svi eventi se logiraju u ApplicationLog

## Testiranje

Korisnik može testirati:
1. Kreiranje novog zahtjeva (DRAFT)
2. Real-time validaciju (workdays, available days, overlaps)
3. Spremanje DRAFT-a
4. Uređivanje DRAFT-a
5. Brisanje DRAFT-a
6. Submit DRAFT-a (SUBMITTED ili auto-APPROVED)
7. Prikaz liste zahtjeva
8. Filtriranje i pretragu
9. Prikaz detalja zahtjeva

## Sljedeći koraci

1. Testiranje svih use caseova
2. Fine-tuning validacija
3. Implementacija korekcija (UC-APP-07)
4. Dodavanje paginacije za listu zahtjeva
5. Dodavanje export funkcionalnosti (PDF, Excel)

---

## UC03 Planiranje Odsutnosti - Implementirano (2024-12-23)

### ✅ UC-PLAN-01 — Prikaz planiranja odsutnosti (gantt/tablica: plan + zahtjevi)
- **Service**: `getPlanningData()` u `lib/services/planning.ts`
- **Action**: `getPlanningDataAction()` u `lib/actions/planning.ts`
- **Ruta**: `/[organisationAlias]/planning/page.tsx`
- **Funkcionalnost**:
  - Tablični (gantt-like) prikaz zaposlenika i dana
  - Plan (DaySchedule) kao pozadina s bojama prema `unavailabilityReason.colorCode`
  - Zahtjevi (Application) kao overlay s border stilovima
  - Timezone-aware konverzije (UTC ↔ client TZ)
  - Manager scope (GM: svi odjeli, DM: samo managed departments)
  - Multi-select filtriranje po odjelima
  - Date range picker s preset opcijama (1/3/6/12 mjeseci)
  - Default raspon: 1 mjesec od danas prema budućnosti
  - Horizontalni scroll za široke tablice
  - Sticky prva kolona (zaposlenici)
  - Klik na ćeliju otvara read-only detalje

### ✅ UI Komponente
- **PlanningFilters** (`planning-filters.tsx`):
  - Date range picker (Calendar + Popover)
  - Preset buttons (1, 3, 6, 12 mjeseci)
  - Multi-select za odjele (Popover + Checkbox)
  - "Select all" / "Deselect all" funkcionalnost
  - URL query parametri za state management
  
- **PlanningTable** (`planning-table.tsx`):
  - Split layout (fiksna lijeva kolona + scrollable desna strana)
  - Gantt-like prikaz s redcima (zaposlenici) i stupcima (dani)
  - DaySchedule pozadina s zaobljenim rubovima za consecutive dane
  - Application overlay s border stilovima (start/middle/end/single)
  - Vikendi i praznici vizualno razlučivi
  - Legenda s unique unavailability reasons
  - Header prikazuje dan i mjesec (dd.MM.)
  
- **PlanningCellDialog** (`planning-cell-dialog.tsx`):
  - Read-only prikaz detalja ćelije
  - Prikaz DaySchedule informacija
  - Prikaz Application informacija
  - Linkovi na detalje zahtjeva

### ✅ Validacije (Zod schemas)
- `getPlanningDataSchema` u `lib/validation/schemas.ts`:
  - Validacija datuma (YYYY-MM-DD format)
  - Validacija timezone (IANA format)
  - Validacija raspona (max 12 mjeseci)
  - Validacija `departmentIds` array

### ✅ i18n prijevodi
- Hrvatski (hr.json)
- Engleski (en.json)
- Svi ključevi pod `planning.*`:
  - title, description, filters, planningTable
  - presets (1month, 3months, 6months, 12months)
  - allDepartments, noDepartments, selectedDepartments
  - selectDepartments, selectAll, deselectAll
  - legend items (available, notAvailable, weekend, holiday)

### ✅ Navigacija
- Dodano u sidebar: "Planning" link s CalendarDays ikonom
- Vidljivo samo za managere (DM/GM)

### ✅ Boje i stilizacija (konzistentno s "Moj kalendar")
- **DaySchedule (NOT_AVAILABLE)**: 
  - Background color: `unavailabilityReason.colorCode` (puna boja)
  - Tekst: bijeli
  - Border radius: zaobljeni rubovi za consecutive dane (start/middle/end/single)
- **DaySchedule (AVAILABLE)**: `bg-background`
- **DaySchedule (SELECTED_FOR_DUTY)**: `bg-blue-100 dark:bg-blue-950`
- **Applications (overlay)**:
  - Border stilovi s `unavailabilityReason.colorCode`
  - Border debljina: 2px solid
  - Border radius: zaobljeni rubovi za consecutive dane
  - Svi statusi koriste istu boju (ne razlikuje se po statusu)
- **Vikendi**: `bg-muted` s `text-muted-foreground`
- **Praznici**: `bg-red-100 dark:bg-red-950` s `text-red-900 dark:text-red-100`

### ✅ Funkcionalnosti
- Multi-select filtriranje po odjelima (više odjela odjednom)
- Date range preseti (1, 3, 6, 12 mjeseci) računaju se od danas
- Ručni odabir datuma (Od/Do)
- Horizontalni scroll za široke tablice
- Sticky prva kolona za zaposlenike
- Read-only detalji na klik ćelije
- Legenda s unique unavailability reasons

### ✅ RBAC i sigurnost
- Provjera manager pristupa (DM/GM)
- GM vidi sve odjele u organizaciji
- DM vidi samo managed departments
- Validacija departmentIds prije dohvata podataka
- Tenant-scoped svi upiti

### ✅ Timezone handling
- Sve datume u bazi su UTC
- UI prikazuje u `clientTimeZone` (IANA format)
- Konverzije kroz `date-fns-tz` (`fromZonedTime`, `toZonedTime`)
- Date range se računa u client TZ, konvertira u UTC za DB upite

## Što nije implementirano (TBD)

### ❌ Oznaka "na bolovanju" uz zaposlenika
- TBD prema OPEN_QUESTIONS.md (OQ-004)

## Napomene

1. **Multi-select**: Implementirano kao Popover s Checkbox-ovima umjesto običnog Select-a
2. **URL state**: Department filter koristi comma-separated vrijednosti (`?department=1,2,3`)
3. **Default range**: 1 mjesec od danas (ne od početka mjeseca)
4. **Horizontal scroll**: Tablica ima vlastiti scroll, ne uzrokuje globalni scrollbar
5. **Layout**: Split layout s fiksnom lijevom kolonom i scrollable desnom stranom

## Testiranje

Korisnik može testirati:
1. Pristup stranici kao DM/GM
2. Filtriranje po odjelima (multi-select)
3. Odabir date range (preseti i ručni)
4. Horizontalni scroll za velike raspone
5. Klik na ćeliju za detalje
6. Prikaz plana (DaySchedule) kao pozadine
7. Prikaz zahtjeva (Application) kao overlay-a
8. Legenda s bojama

