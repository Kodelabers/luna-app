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
  - period: `startDate`, `endDate` (uvijek definirani; “open-ended” se ne radi preko `Application`)
  - owner: `employeeId`
  - scope: `departmentId` + `organisationId`
  - status: `status: ApplicationStatus`
  - opis/napomena: `description`
  - “workdays” (izračun): `requestedWorkdays` (opc.)
- **Audit**: `ApplicationLog` (`type: ApplicationLogType`)
- **Komentari/razlozi**: `ApplicationComment`

## Vrste odsutnosti (UnavailabilityReason)
`UnavailabilityReason` definira poslovna pravila za **vrstu odsutnosti** (UI pojam):
- **needApproval**: treba li uopće approval flow (ako false, može ići direktno na APPROVED – ovisno o pravilima)
- **needSecondApproval**: treba li 2. razina (SUBMITTED → APPROVED_FIRST_LEVEL → APPROVED)
- **hasPlanning**: troši li dane i ima li ledger entries
- **sickLeave**: označava da je razlog tipa “bolovanje” i veže se na `SickLeave`
- UI: `name`, `colorCode`

## Bolovanja (SickLeave)
- **Bolovanje**: `SickLeave`
  - status: `SickLeaveStatus` (`OPENED`, `CLOSED`, `CANCELLED`)
  - period:
    - `startDate` je uvijek definiran (UTC)
    - `endDate` je `null` dok je `OPENED`, a definiran kad je `CLOSED`
  - veza na reason: `unavailabilityReasonId` gdje `UnavailabilityReason.sickLeave=true`
  - owner/target: `employeeId`
  - scope: `departmentId` + `organisationId`

## Kalendar / plan (DaySchedule)
- **Jedan dan plana**: `DaySchedule`
- Uniqueness: `@@unique([organisationId, employeeId, date])` → implementacija mora raditi **upsert per day**
- Status dana: `EmployeeStatus`
- Razlog dana: `unavailabilityReasonId` (opc.)
- Link na zahtjev: `applicationId` (opc.)
- Link na bolovanje: `sickLeaveId` (opc.)
- Oznake: `isWeekend`, `isHoliday`, `dayCode`

Napomena (OPENED bolovanje):
- Dok je bolovanje `OPENED`, `DaySchedule` se materializira **samo za start dan**, a UI prikaz (kalendar + planning) radi “virtualni raspon” od start do danas.

## Stanje dana (internal: Ledger)
U bazi nema “Allocation” tablice; sve ide preko internal ledger mehanizma:
- **Ledger entry**: `UnavailabilityLedgerEntry`
  - ključevi za upite: `employeeId`, `unavailabilityReasonId`, `year`
  - promjena: `changeDays` (+/-)
  - tip: `LedgerEntryType` (ALLOCATION/USAGE/TRANSFER/CORRECTION)
  - veza na zahtjev: `applicationId` (opc.)

Napomena (UI):
- `UnavailabilityLedgerEntry` se u UI-u prikazuje kao **stanje dana** (Ukupno na raspolaganju/Iskorišteno/Na čekanju/Preostalo) i eventualno “povijest promjena”, bez ledger/alokacija/knjiženje terminologije (vidi `/.cursor/docs/09_terminology_glossary.md`).

## Praznici
- **Holiday**: `Holiday`
  - `repeatYearly` (ponavljanje)
  - `date` (UTC; prikaz u client TZ prema `spec.md`)


