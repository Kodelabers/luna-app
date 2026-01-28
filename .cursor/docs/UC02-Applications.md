# Use Cases (HR) — Zahtjevi (Applications)

Svi use caseovi moraju poštovati `spec.md` (SSoT Prisma schema, multitenancy, Server Actions + useActionState, UTC datumi, klijentska vremenska zona, shadcn default theme + dark/light/system, i18n).

## Referentni dokumenti (SSoT / pravila)
- `/.cursor/docs/spec.md`
- `/.cursor/docs/01_domain_statuses.md`
- `/.cursor/docs/03_permissions_rbac.md`
- `/.cursor/docs/04_applications_flow.md`
- `/.cursor/docs/05_dayschedule_rules.md`
- `/.cursor/docs/06_ledger_rules.md`
- `/.cursor/docs/07_timezones_dates.md`
- `/.cursor/docs/OPEN_QUESTIONS.md` (TBD: OQ-002, OQ-003)
- `/.cursor/docs/UC08-SickLeave.md` (bolovanje nije `Application`)

## Povezani user stories (iz `/.cursor/docs/user_stories.md`)
- Employee: US-EMP-005..012B, US-VAL-000..007
- Department Manager: US-DM-004..006
- General Manager: US-GM-002..003

---

## UC-APP-01 — Employee: Kreiranje zahtjeva (odabir perioda + real-time validacija)

### Cilj
Zaposlenik odabire period i razlog nedostupnosti, dobiva real-time validaciju (radni dani, preostali dani, preklapanja, warning o “pregazit će plan”).

### Akteri
- OrganisationUser (ulogiran)
- Employee (vezan na usera u organizaciji)

### Ruta/UI (primjer)
- `/:organisationAlias/applications/new` (ili create dialog unutar `/:organisationAlias/applications`)
- TableCalendar + summary panel (period, calendarDays, workdays) + warning/error states

### Input (Server Action)
- `unavailabilityReasonId: number`
- `startDateLocalISO: string` (npr. `2026-01-12`)
- `endDateLocalISO: string` (npr. `2026-01-20`)
- `clientTimeZone: string` (IANA tz, npr. `Europe/Zagreb`)
- (opc.) `editingApplicationId?: number` (ako validiramo postojeći draft)

### Preduvjeti
- Tenant context: `resolveTenantContext(organisationAlias)`
- Employee postoji:
  - `Employee where organisationId = ctx.organisationId AND userId = ctx.user.id AND active=true`

### Glavni tok (tz-aware)
1) UI šalje odabrani period i reason prema serveru radi validacije.
2) Service interpretira `startDateLocalISO/endDateLocalISO` u `clientTimeZone` i radi konverzije po `07_timezones_dates.md`.
3) Validacije (server-side guardrail):
   - Datumi logički (start ≤ end) + ograničenja (vidi US-VAL-004).
   - Period uključuje barem jedan radni dan (US-VAL-004).
   - Workdays kalkulacija:
     - isključiti vikende
     - isključiti praznike (uključujući `repeatYearly=true`) (US-VAL-002)
   - Preklapanje s “aktivnim” zahtjevima (blokira):
     - `status IN (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)` (US-VAL-001)
     - izuzetak: isti draft koji se uređuje (`editingApplicationId`)
   - Preklapanje s `DaySchedule` (warning; ne blokira samo po sebi):
     - vratiti info da će finalni `APPROVED` prepisati plan (US-VAL-001/007)
     - ako prebrisani plan potječe iz reason-a s `hasPlanning=true`, vratiti warning o budućoj korekciji (US-EMP-012B, US-VAL-007)
   - Validacija dostupnih dana (US-VAL-003):
     - balance iz ledger-a (SUM `changeDays`) za godinu po pravilu iz `06_ledger_rules.md`
     - ako nema ALLOCATION za godinu perioda, provjeriti prethodnu godinu (`year - 1`)
     - ako u prethodnoj godini postoje preostali dani (balance > 0) i `workdays <= balance`, dopustiti kreiranje zahtjeva
     - ako `workdays > availableDays` → error (blokira submit i spremanje nacrta)
4) Server vraća serializabilni “validation model” za UI.

### Output (serializabilno)
Minimalno:
- `calendarDays: number`
- `workdays: number`
- `availableDays: number`
- `isValid: boolean`
- `fieldErrors?: { startDate?: string[]; endDate?: string[]; unavailabilityReasonId?: string[] }`
- `blockingOverlaps?: Array<{ applicationId: number; status: ApplicationStatus; startLocalISO: string; endLocalISO: string }>`
- `dayScheduleOverlaps?: Array<{ dateLocalISO: string; previousReasonId?: number; previousHasPlanning?: boolean; previousApplicationId?: number }>`
- `warnings?: string[]`

### Pravila
- Datumi u bazi su UTC; UI radi u `clientTimeZone` (vidi `07_timezones_dates.md`).
- DRAFT je vidljiv samo owneru (RBAC).

### Greške
- 403 ako user nije vezan na Employee u org-u
- 422 za nevalidan input (parse/shape)

---

## UC-APP-02 — Employee: Spremi zahtjev kao DRAFT (create/update)

### Cilj
Spremiti zahtjev u `DRAFT` statusu (create ili update), uz audit log.

### Akteri
- OrganisationUser (ulogiran) vezan na Employee

### Input (Server Action)
- `unavailabilityReasonId: number`
- `startDateLocalISO: string`
- `endDateLocalISO: string`
- (opc.) `description?: string`
- `clientTimeZone: string`
- (opc.) `applicationId?: number` (ako je update)

### Preduvjeti
- Tenant ctx
- Employee postoji
- Ako `applicationId` postoji:
  - zahtjev je u istom tenant-u
  - `status=DRAFT`
  - owner je current employee

### Glavni tok
1) Service ponovi UC-APP-01 validacije (server-side guardrail).
2) Upsert:
   - create: `Application(status=DRAFT, employeeId, departmentId, ...)`
   - update: izmjena polja (samo DRAFT)
3) Audit:
   - create: `ApplicationLog(CREATED)`
   - update: minimalno update polja; tip loga za “edited” je trenutno TBD (pratiti `04_applications_flow.md`)

### Output
- `applicationId: number`
- `status: "DRAFT"`
- `message: string` (UI toast)

### Greške
- 403 ako nije owner ili nema Employee u org-u
- 404 ako draft ne postoji
- 409 ako status nije DRAFT
- 422 ako validacija padne

---

## UC-APP-03 — Employee: Submit zahtjev (DRAFT → SUBMITTED ili auto-APPROVED)

### Cilj
Poslati zahtjev u proces odobravanja ili ga automatski finalizirati ako `needApproval=false`.

### Input (Server Action)
- `applicationId: number`
- `clientTimeZone: string`

### Preduvjeti
- Tenant ctx
- Owner je current employee
- `status=DRAFT`

### Glavni tok
1) Re-validacija (kao UC-APP-01).
2) Ako `UnavailabilityReason.needApproval = true`:
   - status: `DRAFT → SUBMITTED`
   - log: `REQUESTED`
3) Ako `UnavailabilityReason.needApproval = false`:
   - status ide direktno u finalni state (preporuka: `APPROVED`)
   - odmah izvršiti post-approval efekte:
     - DaySchedule upsert (vidi `05_dayschedule_rules.md`)
     - ledger samo ako `hasPlanning=true` (vidi `06_ledger_rules.md`)
   - Napomena: bolovanje (SickLeave) nije dio ovog flowa; vidi `UC08-SickLeave.md`.

### Output
- `status: ApplicationStatus`
- `message: string`
- (opc.) `impactSummary?: { dayScheduleAffectedDays: number; ledgerDeltaDays?: number }`

### Greške
- 403 ako nije owner
- 404 ako ne postoji u tenant-u
- 409 ako status nije DRAFT
- 422 ako validacija padne

---

## UC-APP-04 — Employee: Uređivanje i brisanje DRAFT-a

### Cilj
Omogućiti uređivanje i brisanje isključivo DRAFT zahtjeva.

### Akteri
- Owner employee

### Operacije
- Edit DRAFT: koristi UC-APP-02 (update)
- Delete DRAFT:
  - semantika brisanja ovisi o OQ-002 (Application.active)
  - preporučeno: soft-delete (`active=false`) + `ApplicationLog(DELETED)`

### Greške
- 403 ako nije owner
- 404 ako zahtjev ne postoji u tenant-u
- 409 ako status nije DRAFT

---

## UC-APP-05 — Employee: Pregled svih vlastitih zahtjeva (lista)

### Cilj
Zaposlenik vidi listu svih svojih zahtjeva (DRAFT..REJECTED).

### Ruta/UI (primjer)
- `/:organisationAlias/applications`

### Preduvjeti
- Tenant ctx
- Employee postoji

### Query pravilo (service)
- `Application where organisationId=ctx.organisationId AND employeeId=employee.id`
- statusi: svi (uključujući DRAFT)
- sortiranje: newest-first (npr. `createdAt desc`)
- opcionalni filteri: status, year, reason

### Output (serializabilno)
- `items: Array<{ applicationId; startLocalISO; endLocalISO; status; reasonId; reasonName; workdays?; description?; createdAtISO }>`
- `total: number`

### Greške
- 403 ako employee ne postoji u org-u

---

## UC-APP-06 — Detalji zahtjeva (read-only) + log/comment

### Cilj
Prikazati detalje zahtjeva, audit trail (`ApplicationLog`) i komentare (`ApplicationComment`).

### Akteri / autorizacija
- Owner uvijek vidi svoj zahtjev
- DM/GM vide zahtjeve prema RBAC (`03_permissions_rbac.md`), s napomenom:
  - tuđe DRAFT ne vide

### Ruta/UI (primjer)
- `/:organisationAlias/applications/:applicationId`
- (opc.) dijalog iz kalendara/dashboards

### Preduvjeti
- Tenant ctx
- Autorizacija po RBAC

### Output (serializabilno)
- Osnovna polja + status + reason
- Viewer-dependent polja:
  - owner: minimalno + vlastiti podaci
  - manager: employee name + department (ako treba UI)
- `comments: Array<{ id; createdAtISO; authorRole; text }>`
- `logs: Array<{ id; createdAtISO; type; meta? }>`

### Greške
- 403 ako nema prava
- 404 ako ne postoji u tenant-u

---

## UC-APP-07 — Korekcija “vraćanje dana” kroz novi zahtjev (US-EMP-012B / US-VAL-007)

### Cilj
Kad novi zahtjev (npr. drugi event) prepisuje postojeći plan nastao iz `hasPlanning=true` reason-a, sustav:
- unaprijed upozori (na create/validate),
- na finalnom `APPROVED` izvrši korekciju u ledger-u i korigira plan (DaySchedule).

Napomena:
- Isto “truncate” pravilo korekcije koristi i `SickLeave` (bolovanje), ali bolovanje se ne vodi kroz `Application` (vidi `UC08-SickLeave.md`).

### Preduvjeti
- Kreiranje/validacija radi detekciju `DaySchedule` overlap-a (UC-APP-01).
- Finalni efekti se događaju tek kad novi zahtjev postane `APPROVED` (vidi `04_applications_flow.md`).

### Glavni tok (sažetak)
1) Kod validacije:
   - vratiti `dayScheduleOverlaps`
   - ako prebrisani plan ima `hasPlanning=true`, vratiti warning “korekcija će se dogoditi na finalnom odobrenju”.
2) Kod finalnog odobrenja (`APPROVED`):
   - prepisati `DaySchedule` u rasponu novog zahtjeva (upsert) (vidi `05_dayschedule_rules.md`)
   - ako se preklapa s planom iz `hasPlanning=true`:
     - upisati ledger `CORRECTION` koji vraća dane (vidi `06_ledger_rules.md`)
     - ako se preklopljeni plan veže na `previousApplicationId`:
       - vratiti “sve preostale dane” originalnog zahtjeva od početka novog eventa do kraja originalnog perioda (pravilo iz stories)
       - obrisati/prekucati `DaySchedule` zapise originalnog zahtjeva za te dane (konzistentno s korekcijom)
       - upisati log u originalnom zahtjevu (ako postoji tip; inače minimalno audit konzistentno s `01_domain_statuses.md`)

### Pravila
- Korekcije se rade samo kad se prepisuje plan iz reason-a s `hasPlanning=true`.
- Detaljna semantika korekcije mora biti konzistentna s `06_ledger_rules.md`.

### Greške
- 422 ako korekcija ne može biti dosljedno izračunata (edge-case; preferirati jasnu domensku poruku)

---

## UC-APP-08 — DM: Odobri/Odbij zahtjev (1. razina)

### Cilj
Department Manager procesira zahtjeve `SUBMITTED` u svojim odjelima.

### Akteri
- Department Manager (OrganisationUser vezan na Employee + Manager s `departmentId`)

### UI (primjer)
- `/:organisationAlias/department/:departmentId/applications`
- ili dashboard widget (vidi `UC01-Dashboard.md`, UC-DASH-04)
- Dialog s detaljima + comment

### Input (Server Action)
- `applicationId: number`
- `decision: "APPROVE" | "REJECT"`
- `comment?: string` (obavezno za REJECT)
- `clientTimeZone: string`
- (opc.) `requestedStartDate?: string` (ISO YYYY-MM-DD u client timezone)
- (opc.) `requestedEndDate?: string` (ISO YYYY-MM-DD u client timezone)

### Preduvjeti
- Tenant ctx
- DM pristup: `departmentId IN managedDepartmentIds`
- `Application.status = SUBMITTED` i `active=true`

### Glavni tok
1) Učitaj zahtjev (tenant-scoped).
2) Ako `decision=REJECT`:
   - validiraj comment non-empty
   - `SUBMITTED → REJECTED`
   - `ApplicationComment` + `ApplicationLog(REJECTED_ON_FIRST_APPROVAL)` (ili konzistentan tip iz `01_domain_statuses.md`)
3) Ako `decision=APPROVE`:
   - Na ekranu "Detalji zahtjeva" manager vidi **Korigiraj**, **Odobri**, **Odbij**. Klik na **Korigiraj** otključava kalendar; ostaju **Odustani** i **Odobri**. **Odustani** vraća na početno stanje.
   - **Odobri** šalje `requestedStartDate`/`requestedEndDate` iz kalendara (ili originalne ako nije mijenjao). Ako se period razlikuje od originalnog, backend tretira kao odobrenje uz korekciju (log `APPROVED_WITH_DATE_MODIFICATION`, komentar s originalnim i novim datumima, approval efekti s novim datumima); inače klasično odobrenje.
   - Ako klasično odobrenje: ako `UnavailabilityReason.needSecondApproval=true`: `SUBMITTED → APPROVED_FIRST_LEVEL`; inače: `SUBMITTED → APPROVED` (final) i izvrši DaySchedule + ledger efekte (`05`/`06`).
4) Refresh/revalidate liste.

### Greške
- 403 ako user nije DM za department
- 404 ako zahtjev ne postoji ili nije u org-u
- 409 ako status nije `SUBMITTED`
- 422 ako je `comment` prazan kod REJECT

---

## UC-APP-09 — GM: Finalno Odobri/Odbij zahtjev (2. razina)

### Cilj
General Manager procesira zahtjeve `APPROVED_FIRST_LEVEL` u cijeloj organizaciji.

### Akteri
- General Manager (Manager zapis s `departmentId IS NULL`)

### UI (primjer)
- `/:organisationAlias/applications/approvals`
- Dialog s detaljima + DM comment (ako postoji)

### Input (Server Action)
- `applicationId: number`
- `decision: "APPROVE" | "REJECT"`
- `comment?: string` (obavezno za REJECT)
- `clientTimeZone: string`
- (opc.) `requestedStartDate?: string` (ISO YYYY-MM-DD u client timezone)
- (opc.) `requestedEndDate?: string` (ISO YYYY-MM-DD u client timezone)

### Preduvjeti
- Tenant ctx
- GM role exists u org-u
- `Application.status = APPROVED_FIRST_LEVEL` i `active=true`

### Glavni tok
1) Učitaj zahtjev + DM komentar (ako postoji).
2) REJECT:
   - `APPROVED_FIRST_LEVEL → REJECTED`
   - obavezni comment + log
3) APPROVE:
   - Na ekranu "Detalji zahtjeva" manager vidi **Korigiraj**, **Odobri**, **Odbij**. Klik na **Korigiraj** otključava kalendar; ostaju **Odustani** i **Odobri**. **Odustani** vraća na početno stanje.
   - **Odobri** šalje `requestedStartDate`/`requestedEndDate` iz kalendara (ili originalne ako nije mijenjao). Ako se period razlikuje od originalnog, backend tretira kao odobrenje uz korekciju (log `APPROVED_WITH_DATE_MODIFICATION`, komentar s originalnim i novim datumima, approval efekti s novim datumima); inače klasično odobrenje.
   - Ako klasično odobrenje: `APPROVED_FIRST_LEVEL → APPROVED`, DaySchedule + ledger efekti (uključujući moguće korekcije) (vidi UC-APP-07).
4) Refresh/revalidate liste.

### Greške
- 403 ako user nije GM
- 404 ako zahtjev ne postoji ili nije u org-u
- 409 ako status nije `APPROVED_FIRST_LEVEL`
- 422 ako je `comment` prazan kod REJECT

---

## UC-APP-10 — Cancel zahtjeva (TBD)

Cancel flow je TBD i mora pratiti `OPEN_QUESTIONS.md`:
- OQ-003: tko može cancel, iz kojih statusa, posljedice na DaySchedule/ledger

Dok je TBD:
- ne implementirati implicitno ponašanje
- UI može sakriti akciju cancel

---

## Route map (Option A / Option B)

Ovo nije SSoT poslovnih pravila, nego preporuka za konzistentan raspored ruta/foldera.

### Option A — Top-level “Zahtjevi” (preporuka za MVP)
- Employee:
  - `app/[organisationAlias]/applications/page.tsx` (UC-APP-05)
  - `app/[organisationAlias]/applications/new/page.tsx` (UC-APP-01/02/03)
  - `app/[organisationAlias]/applications/[applicationId]/page.tsx` (UC-APP-06)
  - `app/[organisationAlias]/applications/[applicationId]/edit/page.tsx` (UC-APP-02/04)
- DM:
  - `app/[organisationAlias]/department/[departmentId]/applications/page.tsx` (UC-APP-08)
  - (opc.) DM actions direktno iz dashboarda: vidi `UC01-Dashboard.md` (UC-DASH-04)
- GM:
  - `app/[organisationAlias]/applications/approvals/page.tsx` (UC-APP-09)

### Option B — “Moji zahtjevi” pod `me/` ili `employee/`
- Varijanta B1 (`me`):
  - `app/[organisationAlias]/me/applications/page.tsx`
  - `app/[organisationAlias]/me/applications/new/page.tsx`
  - `app/[organisationAlias]/me/applications/[applicationId]/page.tsx`
  - `app/[organisationAlias]/me/applications/[applicationId]/edit/page.tsx`
- Varijanta B2 (`employee`):
  - `app/[organisationAlias]/employee/applications/...` (isti raspored kao B1)
- DM/GM ostaju kao u Option A (najčešće se ne “uklapaju” u `me/` segment).

---

## Naming (preporuka) — Actions i Services

### Server Actions (UI boundary)
Lokacija: `lib/actions/application.ts`
- `validateApplicationDraftAction`
- `saveDraftApplicationAction`
- `submitApplicationAction`
- `deleteDraftApplicationAction`
- `dmDecideApplicationAction`
- `gmDecideApplicationAction`

### Services (Prisma + poslovna logika)
Lokacija: `lib/services/application.ts`
- `validateApplicationDraft(ctx, input)`
- `saveDraft(ctx, input)`
- `submit(ctx, input)`
- `deleteDraft(ctx, applicationId)`
- `decideAsDepartmentManager(ctx, input)`
- `decideAsGeneralManager(ctx, input)`
- helper: `applyApprovalEffects(ctx, applicationId)` (DaySchedule + ledger, uključujući korekcije)


