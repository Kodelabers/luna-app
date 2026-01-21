# Use Cases (HR) — Dashboard

Svi use caseovi moraju poštovati `spec.md` (SSoT Prisma schema, multitenancy, Server Actions + useActionState, UTC datumi, klijentska vremenska zona, shadcn default theme + dark/light/system, i18n).

---

## UC-DASH-01 — Dashboard kontekst i uloge (obični / manager / GM)

### Cilj
Za rutu `/:organisationAlias` odrediti što korisnik smije vidjeti:
- obični korisnik: svoje otvorene zahtjeve + svoj kalendar (DaySchedule)
- manager odjela: zahtjevi koje mora odobriti + oni koje je odobrio, ali GM još nije
- generalni manager: zahtjevi koje mora odobriti

### Akteri
- OrganisationUser (ulogiran)
- (opc.) Employee vezan na User
- Manager (department manager / general manager)

### Preduvjeti
- Tenant context: `resolveTenantContext(organisationAlias)`

### Glavni tok
1) Resolve tenant ctx (organisation + membership + user).
2) Učitaj `Employee` za usera u ovoj organizaciji:
   - `Employee where organisationId = ctx.organisationId AND userId = ctx.user.id AND active=true`
   - ako ne postoji: korisnik nema “employee profil” → dashboard može biti ograničen (npr. samo poruka “nisi povezan na zaposlenika”). (UI odluka)
3) Ako employee postoji, odredi manager stanje:
   - `isGeneralManager = exists Manager where employeeId = employee.id AND departmentId IS NULL AND active=true`
   - `managedDepartmentIds = list Manager.departmentId where employeeId = employee.id AND departmentId IS NOT NULL AND active=true`
   - `isDepartmentManager = managedDepartmentIds.length > 0`
4) Vrati serializabilan objekt:
   - `{ isGeneralManager, isDepartmentManager, managedDepartmentIds }`

### Pravila
- General manager i department manager se mogu preklapati (ako postoje oba zapisa).
- Ako korisnik ima i GM i department manager ulogu, dashboard prikazuje **oba seta widgeta** (GM widget + manager widget).
- Widgeti se prikazuju ovisno o korisnikovoj generičkoj roli (isDepartmentManager/isGeneralManager), ne isključivo.

---

## UC-DASH-02 — Kalendar: “Moj mjesec” iz DaySchedule (s vikend/praznik oznakama)

### Cilj
Obični korisnik (i manager/GM za sebe) vidi kalendar s popunjenim `DaySchedule` zapisima za odabrani mjesec.
Napomena: vikendi i praznici se prikazuju, ali **ne ulaze u izračune potrošnje** (workdays/ledger use-caseovi).

Napomena (bolovanje):
- Za `SickLeave.status=OPENED` kalendar mora prikazati “virtualni raspon” od `startDate` do “danas” u `clientTimeZone`, iako je u `DaySchedule` materializiran samo start dan (vidi `UC08-SickLeave.md`).

### Akteri
- OrganisationUser vezan na Employee

### Ruta/UI
- `/:organisationAlias` (dashboard)
- shadcn block: calendar + legenda (razlozi/boje) + “Today” highlight

### Input (Server Action)
- `month: number` (1–12)
- `year: number`
- `clientTimeZone: string` (IANA tz, npr. `Europe/Zagreb`)

### Preduvjeti
- Resolve tenant ctx
- Employee postoji za ctx.user u org-u

### Glavni tok (tz-aware)
1) Iz `year/month` i `clientTimeZone` izračunati lokalni raspon:
   - `localStart = first day of month 00:00:00`
   - `localEnd = first day of next month 00:00:00`
2) Konvertirati u UTC granice: `utcStart`, `utcEnd`
3) Dohvatiti `DaySchedule` za tog employee-a:
   - `where organisationId = ctx.organisationId`
   - `AND employeeId = employee.id`
   - `AND date >= utcStart AND date < utcEnd`
   - `AND active=true`
4) Dohvatiti `Holiday` za org za taj mjesec (radi oznaka):
   - `where organisationId = ctx.organisationId AND active=true`
   - uključiti:
     - praznike unutar raspona
     - i `repeatYearly=true` koji padaju u tom mjesecu (po dan/mjesec u client TZ)
5) Vratiti serializabilni “calendar model”:
   - lista dana s oznakama:
     - `dateISO` (u lokalnom formatu za UI prikaz) + `utcDateISO` (ako treba)
     - `isWeekend`
     - `isHoliday`
     - `status` (EmployeeStatus)
     - `unavailabilityReasonId` (ako postoji)
     - (opc.) `reasonName` + `colorCode` (ako želiš legendu bez dodatnog poziva)

### Pravila
- `DaySchedule.date` je u bazi UTC; UI prikaz mora biti u `clientTimeZone`.
- “Danas” highlight radi UI (na klijentu) ili se može vratiti kao `todayLocalISO`.
- Vikendi i praznici:
  - prikazuju se (oznaka), ali se **ne računaju kao workdays**.

### Greške
- 403 ako user nije vezan na Employee u org-u
- 422 ako month/year nevalidni

---

## UC-DASH-03 — Widgeti “otvoreni zahtjevi” i “za odobriti” (po ulozi)

### Cilj
Na dashboardu prikazati različite liste zahtjeva ovisno o ulozi.

### Akteri
- Obični korisnik (employee)
- Department manager
- General manager

### Input (Server Action)
- opcionalno: `limit`, `cursor` (ako paginacija treba)
- `clientTimeZone` (samo za prikaz datuma)

### Preduvjeti
- UC-DASH-01 (određene uloge)
- Employee postoji

---

### 3.1 Otvoreni zahtjevi — obični korisnik

#### Pravilo
- **DRAFT je vidljiv samo korisniku** (owneru).
- “Otvoreni” = aktivni zahtjevi koji nisu finalizirani:
  - `status IN (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)`

#### Query
- `Application where organisationId = ctx.organisationId`
- `AND employeeId = employee.id`
- `AND active=true`
- `AND status IN (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)`
- orderBy `createdAt desc`

---

### 3.2 Zahtjevi za odobriti — manager odjela

Manager odjela vidi:
1) zahtjeve koje mora odobriti (1. razina):
   - `status = SUBMITTED`
   - `departmentId IN managedDepartmentIds`
   - `active=true`
2) zahtjevi koje je (na 1. razini) odobrio ali GM još nije:
   - `status = APPROVED_FIRST_LEVEL`
   - `departmentId IN managedDepartmentIds`
   - `active=true`

Napomena:
- Manager **ne vidi tuđe DRAFT** zahtjeve.

---

### 3.3 Zahtjevi za odobriti — GM

GM vidi:
- `status = APPROVED_FIRST_LEVEL`
- `active=true`
- (scope: cijela organizacija)

Ako je korisnik i GM i department manager:
- prikazuju se **oba widgeta** (manager queue + GM queue).

---

### Output (serializabilno)
Za svaku listu vratiti minimalno:
- `applicationId`
- `employeeId` (+ ime zaposlenika ako treba UI)
- `departmentId` (+ naziv odjela)
- `unavailabilityReasonId` (+ naziv/boja)
- `startDate`, `endDate` (ISO za UI)
- `status`

### UI napomena (shadcn blocks)
- Obični korisnik: “Moji otvoreni zahtjevi” card + list
- Manager: “Za odobriti” (tabovi: `Čeka moje odobrenje` / `Čeka GM`) + list
- GM: “Za odobriti” list

### Greške
- 403 ako user nije vezan na Employee u org-u (za sve widgete koji ovise o employee-u)

---

## UC-DASH-04 — DM: Odobri/odbij zahtjev direktno iz dashboard widgeta

### Cilj
Department Manager može iz dashboarda brzo procesirati zahtjeve koji **čekaju 1. razinu** (`SUBMITTED`) bez odlaska na zasebnu stranicu.

### Akteri
- Department Manager (OrganisationUser vezan na Employee + Manager zapisi s `departmentId`)

### UI
- `/:organisationAlias` (dashboard)
- Widget/tab: **“Čeka moje odobrenje”**
- Actioni po itemu: **Odobri** / **Odbij**

### Input (Server Action)
- `applicationId: number`
- `decision: "APPROVE" | "REJECT"`
- `comment?: string` (obavezno kod odbijanja)

### Preduvjeti
- Resolve tenant ctx
- User mora imati Employee profil u org-u
- User mora imati DM pristup `Application.departmentId` (managedDepartmentIds)
- `Application.status = SUBMITTED` i `active=true`

### Glavni tok
1) DM klikne **Odobri** ili **Odbij** na zahtjevu.
2) Otvori se dialog s detaljima zahtjeva (employee, department, period, workdays/dani, napomena).
3) Ako postoji preklapanje s postojećim planom (`DaySchedule`) gdje je prethodni razlog imao `hasPlanning=true`:
   - prikaže se upozorenje da će **konačno odobrenje** prepisati plan i može uzrokovati korekciju/vraćanje dana.
4) DM unese komentar (opcionalno kod odobravanja, obavezno kod odbijanja).
5) Potvrda:
   - Ako DM **odbijе**: status → `REJECTED`, komentar se sprema, prikazuje se success toast.
   - Ako DM **odobri**:
     - ako zahtjev treba 2. razinu → status → `APPROVED_FIRST_LEVEL`
     - inače → status → `APPROVED`
     - prikazuje se success toast.
6) Dashboard widget se osvježi (broj i lista itema).

### Pravila
- DM **ne vidi tuđe DRAFT** zahtjeve (ne pojavljuju se u widgetima).
- DM može procesirati samo zahtjeve iz svojih odjela.
- Finalni efekti (DaySchedule/ledger) nastupaju kad zahtjev postane **konačno odobren (APPROVED)**.

### Greške
- 403 ako user nije DM za department zahtjeva
- 404 ako zahtjev ne postoji ili nije u org-u
- 409 ako status nije `SUBMITTED` (npr. već procesiran)
- 422 ako je `comment` prazan kod `REJECT`

---

## UC-DASH-05 — GM: Finalno odobri/odbij zahtjev direktno iz dashboard widgeta

### Cilj
General Manager može iz dashboarda procesirati zahtjeve koji čekaju **2. razinu** (`APPROVED_FIRST_LEVEL`).

### Akteri
- General Manager (OrganisationUser vezan na Employee + Manager zapis s `departmentId IS NULL`)

### UI
- `/:organisationAlias` (dashboard)
- GM widget: lista zahtjeva za finalno odobrenje
- Actioni po itemu: **Odobri** / **Odbij**

### Input (Server Action)
- `applicationId: number`
- `decision: "APPROVE" | "REJECT"`
- `comment?: string` (obavezno kod odbijanja)

### Preduvjeti
- Resolve tenant ctx
- User mora imati Employee profil u org-u
- User mora biti GM (manager zapis bez departmentId)
- `Application.status = APPROVED_FIRST_LEVEL` i `active=true`

### Glavni tok
1) GM klikne **Odobri** ili **Odbij**.
2) Otvori se dialog s detaljima zahtjeva + komentar DM-a (ako postoji).
3) Ako postoji preklapanje s planom gdje je prethodni razlog imao `hasPlanning=true`:
   - prikaže se upozorenje o korekciji/vraćanju dana i prepisivanju plana.
4) GM unese komentar (opcionalno kod odobravanja, obavezno kod odbijanja).
5) Potvrda:
   - Ako GM **odbijе**: status → `REJECTED`, komentar se sprema, success toast.
   - Ako GM **odobri**: status → `APPROVED`, success toast.
6) Widget se osvježi.

### Pravila
- GM može vidjeti i procesirati zahtjeve u cijeloj organizaciji (tenant-scoped).
- Finalni efekti (DaySchedule/ledger) događaju se na `APPROVED`.

### Greške
- 403 ako user nije GM u org-u
- 404 ako zahtjev ne postoji ili nije u org-u
- 409 ako status nije `APPROVED_FIRST_LEVEL`
- 422 ako je `comment` prazan kod `REJECT`

---

## UC-DASH-06 — Planning (gantt) widget po odjelu (DM/GM)

### Cilj
Na dashboardu prikazati gantt-like pregled planiranja po odjelima: zaposlenici u retcima i dani u stupcima (od danas u budućnost), s **cjelovitim prikazom plana (DaySchedule), zahtjeva (Applications) i bolovanja (SickLeave)**.

Napomena:
- Ovaj widget mora biti **funkcionalno identičan** prikazu iz `/.cursor/docs/UC03-PlaniranjeOdsutnosti.md` (UC-PLAN-01). Razlika je samo u tome što je prikazan kao widget na dashboardu umjesto (ili uz) zasebnu stranicu.

### Akteri
- Department Manager
- General Manager

### UI
- `/:organisationAlias` (dashboard)
- Widget: “Planiranje odjela”
  - default prikaz (bez odabira): DM vidi sve svoje odjele, GM vidi sve odjele
  - filter po odjelu (odabir jednog odjela)
  - brzi odabir raspona (1m/3m/6m/1g) + ručni Od/Do
  - legenda boja po statusu + legenda plana (neutralna pozadina)

### Input (Server Action)
- `departmentId?: number` (ako je postavljen → filtriraj na jedan odjel; inače default scope)
- `rangePreset?: "1m" | "3m" | "6m" | "1y"` (ili ekvivalent)
- `fromLocalISO?: string`, `toLocalISO?: string` (YYYY-MM-DD; interpretacija prema client TZ)
- `clientTimeZone: string` (IANA tz)

### Preduvjeti
- Resolve tenant ctx
- User mora imati Employee profil u org-u
- Default scope:
  - **GM**: svi odjeli u org-u
  - **DM**: svi odjeli iz `managedDepartmentIds`
- Ako je `departmentId` odabran, mora biti u scope-u usera (GM: bilo koji; DM: samo managed).

### Glavni tok
1) Widget se inicijalno učita s default rasponom: **od danas → +30 dana** (1 mjesec).
2) Sustav po defaultu učita podatke za scope odjela (DM: managed; GM: svi), a korisnik može filtrirati na jedan odjel.
3) Sustav prikaže tablicu:
   - redci: zaposlenici (s pripadajućim odjelom u scope-u prikaza)
   - stupci: dani u rasponu
4) Plan + zahtjevi:
   - **Plan (DaySchedule)** se prikazuje kao neutralna pozadina po danu.
   - **Zahtjevi (Applications)** se prikazuju kao overlay blokovi za statuse: `SUBMITTED`, `APPROVED_FIRST_LEVEL`, `APPROVED`.
   - svaki status zahtjeva ima svoju boju (legendom objašnjeno).
5) Preklapanja:
   - preklapanja su vizualno vidljiva jer se zahtjevi crtaju preko plana.
   - opcionalno: prikazati diskretan indikator/tooltip “što se preklapa s čim”.
6) Klik na blok/ćeliju otvara read-only detalje zahtjeva/plana.

### Pravila
- DRAFT se ne prikazuje managerima.
- Raspon stupaca je “od danas u budućnost” po defaultu; korisnik ga može promijeniti (preset ili Od/Do).
- Oznaka “na bolovanju” uz zaposlenika (npr. crveni križ) prikazuje se kad je zaposlenik “trenutno na bolovanju”:
  - “Trenutno na bolovanju” = postoji barem jedno `SickLeave(status=OPENED)` za zaposlenika (tenant-scoped).
  - Boja/legendu uzima iz `UnavailabilityReason` gdje je `sickLeave=true` (vidi `UC08-SickLeave.md`).

### Greške
- 403 ako user nema pravo na odabrani odjel (kada je `departmentId` postavljen)
- 404 ako odjel ne postoji ili nije u org-u
- 422 ako je raspon nevalidan