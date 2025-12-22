# Mapping: koncept → Prisma (SSoT)

Ovo je “brzi prevoditelj” između user stories termina i stvarnog Prisma modela (`prisma/schema.prisma`).

## Tenant / organizacija
- **Organizacija (tenant)**: `Organisation` (`alias` je u URL-u)
- **Članstvo**: `OrganisationUser` (veza `Organisation` ↔ `User`)
- **Admin rola**: `OrganisationUser.roles[]` sadrži `ADMIN`

## Korisnik i zaposlenik
- **Clerk user**: mapiran na lokalni `User` preko `User.clerkId`
- **Employee profil**: `Employee.userId` (opc.) veže user na employee u organizaciji
- **Odjel zaposlenika**: `Employee.departmentId` (pravilo/UX oko “bez odjela” mora biti konzistentan sa schemom)

## Uloge managera (DM / GM)
- **Manager zapis**: `Manager.employeeId`
- **Department manager (DM)**: `Manager.departmentId != null`
- **General manager (GM)**: `Manager.departmentId == null`

## Zahtjevi (Applications)
- **Zahtjev**: `Application`
  - period: `startDate`, `endDate` (semantika za “open-ended” je TBD u `OPEN_QUESTIONS.md`)
  - owner: `employeeId`
  - scope: `departmentId` + `organisationId`
  - status: `status: ApplicationStatus`
  - opis/napomena: `description`
  - “workdays” (izračun): `requestedWorkdays` (opc.)
- **Audit**: `ApplicationLog` (`type: ApplicationLogType`)
- **Komentari/razlozi**: `ApplicationComment`

## Razlozi nedostupnosti (UnavailabilityReason)
`UnavailabilityReason` definira poslovna pravila:
- **needApproval**: treba li uopće approval flow (ako false, može ići direktno na APPROVED – ovisno o pravilima)
- **needSecondApproval**: treba li 2. razina (SUBMITTED → APPROVED_FIRST_LEVEL → APPROVED)
- **hasPlanning**: troši li dane i ima li ledger entries
- UI: `name`, `colorCode`

## Kalendar / plan (DaySchedule)
- **Jedan dan plana**: `DaySchedule`
- Uniqueness: `@@unique([organisationId, employeeId, date])` → implementacija mora raditi **upsert per day**
- Status dana: `EmployeeStatus`
- Razlog dana: `unavailabilityReasonId` (opc.)
- Link na zahtjev: `applicationId` (opc.)
- Oznake: `isWeekend`, `isHoliday`, `dayCode`

## Alokacije i potrošnja dana (Ledger)
Nema “Allocation” tablice; sve ide preko:
- **Ledger entry**: `UnavailabilityLedgerEntry`
  - ključevi za upite: `employeeId`, `unavailabilityReasonId`, `year`
  - promjena: `changeDays` (+/-)
  - tip: `LedgerEntryType` (ALLOCATION/USAGE/TRANSFER/CORRECTION)
  - veza na zahtjev: `applicationId` (opc.)

## Praznici
- **Holiday**: `Holiday`
  - `repeatYearly` (ponavljanje)
  - `date` (UTC; prikaz u client TZ prema `spec.md`)


