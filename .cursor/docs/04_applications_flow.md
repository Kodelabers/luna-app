# Application flow (zahtjevi za odsutnost) — create/submit/approve/reject/cancel

Ovaj dokument opisuje operativni flow za `Application` u skladu s:
- `spec.md` (layering, multitenancy, timezone)
- `schema.prisma` (SSoT)
- `01_domain_statuses.md` (status machine)

## 1) Kreiranje zahtjeva (DRAFT)
### Ulaz (UI)
- `employeeId` (implicitno iz ctx user→employee)
- `departmentId` (iz employee profila)
- `unavailabilityReasonId` (UI: **vrsta odsutnosti**)
- `startDate`, `endDate` (UTC; semantika “open-ended” TBD u `OPEN_QUESTIONS.md`)
- `description` (opc.)

### Validacije (service)
- Datumi logički (start ≤ end; dodatna pravila iz `user_stories.md` / `validation`)
- Preklapanje s aktivnim zahtjevima:
  - blokirati overlap sa statusima `DRAFT`, `SUBMITTED`, `APPROVED_FIRST_LEVEL` (osim ako je to isti draft koji uređujemo)
- Preklapanje s `DaySchedule`:
  - vratiti info/warning (korekcija i “pregazit će plan” pravila se primjenjuju tek na APPROVED)

### Efekt
- kreirati `Application` u `DRAFT`
- upisati `ApplicationLog(CREATED)`

## 2) Uređivanje zahtjeva (samo DRAFT)
- dozvoljeno samo vlasniku
- update polja + `Application.lastUpdatedById`
- log (preporuka): `ApplicationLog(CREATED)` se ne ponavlja; može se dodati novi log tip u budućnosti, ali schema je SSoT pa trenutno minimalno: bez loga ili koristiti postojeće tipove konzistentno

## 3) Brisanje zahtjeva (samo DRAFT)
Semantika “brisanja” ovisi o odluci za `Application.active` (vidi `OPEN_QUESTIONS.md`):
- hard delete (nije preporuka jer gubite audit), ili
- soft-delete (`active=false`) + log `DELETED`

## 4) Slanje na odobrenje (DRAFT → SUBMITTED)
- samo vlasnik
- status: `SUBMITTED`
- log: `REQUESTED`

Napomena:
- Ako `UnavailabilityReason.needApproval = false`, moguće je imati “auto-approve” ponašanje, ali to mora biti eksplicitno definirano u business pravilima (preporuka: dokumentirati po reasonu).

## 5) Odobravanje — 1. razina (DM)
### Preduvjeti
- DM ima pristup departmentu zahtjeva
- zahtjev je `SUBMITTED`

### Pravilo 2. razine
Ako `UnavailabilityReason.needSecondApproval = true`:
- `SUBMITTED → APPROVED_FIRST_LEVEL`
Inače:
- `SUBMITTED → APPROVED`

### Komentar
- opcionalan; ako postoji, spremiti u `ApplicationComment`

### Efekt kod finalnog APPROVED
Kad zahtjev dođe u `APPROVED`:
- generirati/upsertati `DaySchedule` za dane u razdoblju (prema `05_dayschedule_rules.md`)
- ako `UnavailabilityReason.hasPlanning = true` (UI: vrsta odsutnosti “prati stanje dana”):
  - sustav ažurira **stanje dana** (internal: kreira `UnavailabilityLedgerEntry` tipa `USAGE` s negativnim `changeDays`)
  - napraviti korekcije ako se preklapa s postojećim planom nastalim iz reason-a s `hasPlanning=true` (pravila u `06_ledger_rules.md`)

## 6) Odobravanje — 2. razina (GM)
### Preduvjeti
- GM (departmentId null manager) u istoj org
- zahtjev je `APPROVED_FIRST_LEVEL`

### Efekt
- `APPROVED_FIRST_LEVEL → APPROVED`
- log: `APPROVED`
- izvršiti DaySchedule + ledger efekte kao gore

## 7) Odbijanje (DM ili GM)
- DM odbija `SUBMITTED` (u scope-u departmenta)
- GM odbija `APPROVED_FIRST_LEVEL`
- komentar: preporuka da je obavezan (vidi `01_domain_statuses.md`)
- status: `REJECTED`
- log: `REJECTED` ili `REJECTED_ON_FIRST_APPROVAL` (ovisno o razini)

## 8) Cancel (TBD)
Cancel pravila i efekti su TBD u `OPEN_QUESTIONS.md`:
- tko smije cancel
- iz kojih statusa
- kako se ponaša DaySchedule/ledger


