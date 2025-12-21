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
