# Data Model
## GO/Bolovanja modul - Scheduling SaaS

---

## 1. PREGLED

### 1.1 Baza podataka
- **Engine:** PostgreSQL 15+
- **ORM:** Prisma
- **Arhitektura:** Multi-tenancy (Organization-based)

### 1.2 Ključne odluke
- **Ledger model:** `UnavailabilityLedgerEntry` - accounting pristup
- **LedgerEntryType:** ALLOCATION, USAGE, TRANSFER, CORRECTION
- **hasPlanning flag:** Određuje koji razlozi imaju planning
- **Generički model:** `UnavailabilityReason` pokriva GO, bolovanja, edukacije...
- **Integracija:** `DaySchedule` za scheduling modul

---

## 2. LEDGER MODEL

### 2.1 UnavailabilityLedgerEntry
**Accounting pristup - svaka promjena dana = ledger entry.**

```prisma
model UnavailabilityLedgerEntry {
  id                     Int                  @id @default(autoincrement())
  organisationId         Int
  employeeId             Int
  unavailabilityReasonId Int
  year                   Int           // 2024, 2025...
  changeDays             Int           // + ili - broj dana
  type                   LedgerEntryType
  applicationId          Int?
  note                   String?
  createdAt              DateTime      @default(now())
  createdById            Int?

  @@index([employeeId, year, changeDays])  // Covering index
}

enum LedgerEntryType {
  ALLOCATION // dodjela za godinu (+)
  USAGE      // potrošnja (-)
  TRANSFER   // prijenos u novu godinu (+)
  CORRECTION // ručna korekcija (+/-)
}
```

**Primjer ledger zapisa:**
```
Employee ID: 123, Year: 2025, Reason: "Godišnji odmor"

ALLOCATION   | +20  | "Godišnja alokacija"
TRANSFER     | +2   | "Prijenos iz 2024"
USAGE        | -5   | "GO 10-15.01.2025"
CORRECTION   | +2   | "Vraćeno zbog bolovanja"
─────────────────────────────────────
BALANCE:       19 dana
```

**Kalkulacija balance-a:**
```typescript
const result = await prisma.unavailabilityLedgerEntry.aggregate({
  where: { employeeId, unavailabilityReasonId, year },
  _sum: { changeDays: true }
});

const balance = result._sum.changeDays || 0;  // 20 + 2 - 5 + 2 = 19
```

**Prednosti:**
- ✅ Built-in audit trail (vidiš sve korake)
- ✅ Jedna formula (SUM) za sve slučajeve
- ✅ Eksplicitan carry-over (TRANSFER entry)
- ✅ Ručne korekcije (CORRECTION)
- ✅ Generaliziran za sve s `hasPlanning=true`

---

## 3. CORE ENTITETI

### 3.1 Organisation
**Multi-tenancy osnova.**

```prisma
model Organisation {
  id         Int      @id @default(autoincrement())
  name       String
  alias      String   @unique
  logoUrl    String?
  themeColor String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  active     Boolean  @default(true)

  @@index([alias])
  @@index([active])
}
```

### 3.2 User & OrganisationUser
**Autentifikacija i multi-org pristup.**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  clerkId   String   @unique
  firstName String
  lastName  String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  active    Boolean  @default(true)

  @@index([email])
  @@index([active])
}

model OrganisationUser {
  id             Int        @id @default(autoincrement())
  organisationId Int
  userId         Int
  roles          UserRole[] // ADMIN
  joinedAt       DateTime   @default(now())
  active         Boolean    @default(true)

  @@index([organisationId])
  @@index([userId])
  @@index([active])
}

enum UserRole {
  ADMIN
}
```

**Napomena:** Uloge Department Manager i General Manager nisu u `UserRole` enum-u, već su definirane kroz `Manager` model (vidi 3.4).

---

### 3.3 Department & Employee
**Organizacijska struktura.**

```prisma
model Department {
  id             Int      @id @default(autoincrement())
  organisationId Int
  name           String
  alias          String
  description    String?
  colorCode      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  active         Boolean  @default(true)

  @@unique([organisationId, alias])
  @@index([organisationId])
  @@index([active])
}

model Employee {
  id             Int      @id @default(autoincrement())
  organisationId Int
  departmentId   Int
  userId         Int?
  title          String?
  firstName      String
  lastName       String
  email          String
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([organisationId, email])
  @@index([organisationId])
  @@index([departmentId])
  @@index([email])
  @@index([active])
}
```

---

### 3.4 Manager
**Manager sustav - Department Manager i General Manager.**

```prisma
model Manager {
  id           Int         @id @default(autoincrement())
  departmentId Int?        // NULL = General Manager, NOT NULL = Department Manager
  department   Department? @relation(fields: [departmentId], references: [id])
  employeeId   Int
  employee     Employee    @relation(fields: [employeeId], references: [id])
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  active       Boolean     @default(true)

  @@index([departmentId])
  @@index([employeeId])
  @@index([active])
}
```

**Logika:**

1. **Department Manager:**
   - `departmentId` je NOT NULL
   - Može odobravati zahtjeve zaposlenika svog odjela (prvi nivo)
   - Vidi samo svoj odjel
   - Ne može odobravati vlastite zahtjeve

2. **General Manager:**
   - `departmentId` je NULL
   - Može odobravati zahtjeve na drugom nivou (APPROVED_FIRST_LEVEL → APPROVED)
   - Vidi sve odjele u organizaciji
   - Može odobravati i vlastite zahtjeve (ako su prošli prvi nivo)

**Primjeri:**
```typescript
// Department Manager za Marketing odjel
{
  employeeId: 5,
  departmentId: 2,  // Marketing
  active: true
}

// General Manager
{
  employeeId: 1,
  departmentId: null,  // NULL = General Manager
  active: true
}
```

**Provjere:**
```typescript
// Je li zaposlenik Department Manager?
async function isDepartmentManager(employeeId: number) {
  const manager = await prisma.manager.findFirst({
    where: { 
      employeeId, 
      active: true,
      departmentId: { not: null }
    }
  });
  return manager !== null;
}

// Je li zaposlenik General Manager?
async function isGeneralManager(employeeId: number) {
  const manager = await prisma.manager.findFirst({
    where: { 
      employeeId, 
      active: true,
      departmentId: null
    }
  });
  return manager !== null;
}
```

## 4. UNAVAILABILITY MANAGEMENT

### 4.1 UnavailabilityReason
**Generički tipovi nedostupnosti.**

```prisma
model UnavailabilityReason {
  id                 Int      @id @default(autoincrement())
  organisationId     Int
  name               String   // "Godišnji odmor", "Bolovanje", "Edukacija"
  colorCode          String?
  needApproval       Boolean  @default(false)       // Treba li odobrenje?
  needSecondApproval Boolean  @default(false)       // Treba li drugi nivo odobrenja?
  hasPlanning        Boolean  @default(false)       // Ima li planning/ledger?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  active             Boolean  @default(true)

  @@index([organisationId])
  @@index([active])
}
```

**Approval flow logika:**

1. **needApproval = false:**
   - Zahtjev ide direktno u `APPROVED` status pri submitu
   - Primjer: Bolovanje

2. **needApproval = true && needSecondApproval = false:**
   - Flow: `DRAFT` → `SUBMITTED` → `APPROVED`
   - Primjer: Godišnji odmor (samo manager)

3. **needApproval = true && needSecondApproval = true:**
   - Flow: `DRAFT` → `SUBMITTED` → `APPROVED_FIRST_LEVEL` → `APPROVED`
   - Primjer: Edukacija (manager + HR)

**Primjeri konfiguracija:**
```typescript
{ 
  name: "Godišnji odmor", 
  hasPlanning: true, 
  needApproval: true, 
  needSecondApproval: true 
}
{ 
  name: "Bolovanje", 
  hasPlanning: false, 
  needApproval: false,
  needSecondApproval: false
}
{ 
  name: "Edukacija", 
  hasPlanning: true, 
  needApproval: true, 
  needSecondApproval: true 
}
{ 
  name: "Slobodni dan", 
  hasPlanning: true, 
  needApproval: true,
  needSecondApproval: true
}
```

**hasPlanning = true:** Razlog ima ledger entries, troši dane, ima planning.
**hasPlanning = false:** Razlog nema ledger, samo evidencija.

---

### 4.2 Application
**Zahtjevi za nedostupnost.**

```prisma
model Application {
  id                     Int                  @id @default(autoincrement())
  organisationId         Int
  departmentId           Int
  employeeId             Int
  unavailabilityReasonId Int
  description            String?
  startDate              DateTime
  endDate                DateTime
  requestedWorkdays      Int?                 // Broj radnih dana
  status                 ApplicationStatus    @default(DRAFT)
  active                 Boolean              @default(true)
  
  // Audit tracking
  createdAt              DateTime             @default(now())
  createdById            Int
  createdBy              OrganisationUser
  updatedAt              DateTime             @updatedAt
  lastUpdatedById        Int?
  lastUpdatedBy          OrganisationUser?
  
  applicationLogs             ApplicationLog[]
  daySchedules                DaySchedule[]
  comments                    ApplicationComment[]
  unavailabilityLedgerEntries UnavailabilityLedgerEntry[]

  @@index([organisationId])
  @@index([employeeId])
  @@index([status])
  @@index([active])
}

enum ApplicationStatus {
  DRAFT
  SUBMITTED                // Poslan na odobrenje
  APPROVED_FIRST_LEVEL     // Odobren prvi nivo
  APPROVED                 // Potpuno odobren
  REJECTED
  CANCELLED
}
```

**Workflow:**
```
DRAFT → submit() → SUBMITTED → approve() → APPROVED
                             ↓ reject()  ↓ cancel()
                          REJECTED    CANCELLED
```

---

### 4.3 ApplicationLog
**Audit trail.**

```prisma
model ApplicationLog {
  id             Int                @id @default(autoincrement())
  organisationId Int
  applicationId  Int
  type           ApplicationLogType
  createdAt      DateTime           @default(now())
  createdById    Int
  createdBy      OrganisationUser

  @@index([organisationId])
  @@index([applicationId])
  @@index([createdById])
}

enum ApplicationLogType {
  CREATED
  DELETED
  REQUESTED
  REJECTED
  REJECTED_ON_FIRST_APPROVAL
  APPROVED
  POST_APPROVAL_IMPACT_CHANGED  // Za post-approval izmjene
}
```

---

### 4.4 ApplicationComment
**Business komentari.**

```prisma
model ApplicationComment {
  id            Int              @id @default(autoincrement())
  applicationId Int
  comment       String
  createdAt     DateTime         @default(now())
  createdById   Int
  createdBy     OrganisationUser

  @@index([applicationId])
  @@index([createdById])
}
```

**Razlika:** ApplicationLog je technical, ApplicationComment je business.

---

## 5. SCHEDULING

### 5.1 DaySchedule
**Dnevno stanje zaposlenika.**

```prisma
model DaySchedule {
  id                     Int            @id @default(autoincrement())
  organisationId         Int
  employeeId             Int
  applicationId          Int?
  unavailabilityReasonId Int?
  date                   DateTime
  dayCode                DayCode
  isWeekend              Boolean        @default(false)
  isHoliday              Boolean        @default(false)
  status                 EmployeeStatus @default(AVAILABLE)
  active                 Boolean        @default(true)
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt

  @@unique([organisationId, employeeId, date])
  @@index([employeeId])
  @@index([date])
  @@index([status])
}

enum DayCode {
  MON, TUE, WED, THU, FRI, SAT, SUN
}

enum EmployeeStatus {
  AVAILABLE
  NOT_AVAILABLE
  SELECTED_FOR_DUTY
}
```

---

### 5.2 Holiday
**Praznici.**

```prisma
model Holiday {
  id             Int      @id @default(autoincrement())
  organisationId Int
  name           String
  date           DateTime
  repeatYearly   Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  active         Boolean  @default(true)

  @@index([organisationId])
  @@index([active])
}
```

---

## 6. BUSINESS LOGIKA

### 6.1 Submit zahtjeva

```typescript
async function submitApplication(applicationId: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // Određi status ovisno o needApproval
    let newStatus: ApplicationStatus;
    
    if (!application.unavailabilityReason.needApproval) {
      // Direktno odobren (npr. bolovanje)
      newStatus = 'APPROVED';
    } else {
      // Čeka odobrenje
      newStatus = 'SUBMITTED';
    }
    
    // Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { status: newStatus, lastUpdatedById: userId }
    });
    
    // Ako direktno odobren, kreiraj ledger i DaySchedule
    if (newStatus === 'APPROVED') {
      await processApproval(tx, application, userId);
    }
    
    // Logiraj
    await tx.applicationLog.create({
      data: {
        applicationId: application.id,
        type: newStatus === 'APPROVED' ? 'APPROVED' : 'REQUESTED',
        createdById: userId
      }
    });
  });
}
```

---

### 6.2 Prvo odobrenje (Department Manager)

**Pravilo:** Department Manager odobrava zahtjeve zaposlenika svog odjela.

```typescript
async function approveApplication(applicationId: number, managerId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Provjeri je li manager Department Manager
    const manager = await tx.manager.findFirst({
      where: { 
        employeeId: managerId, 
        active: true,
        departmentId: { not: null }  // Department Manager
      }
    });
    
    if (!manager) {
      throw new Error('Korisnik nije Department Manager');
    }
    
    // 2. Dohvati Application
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // 3. Provjeri je li iz istog odjela
    if (application.departmentId !== manager.departmentId) {
      throw new Error('Zahtjev nije iz vašeg odjela');
    }
    
    // 4. Provjeri status
    if (application.status !== 'SUBMITTED') {
      throw new Error('Zahtjev nije u statusu SUBMITTED');
    }
    
    // 5. Ne može odobravati vlastite zahtjeve
    if (application.employeeId === managerId) {
      throw new Error('Ne možete odobravati vlastite zahtjeve');
    }
    
    // 6. Određi novi status
    let newStatus: ApplicationStatus;
    
    if (application.unavailabilityReason.needSecondApproval) {
      // Treba drugi nivo (General Manager)
      newStatus = 'APPROVED_FIRST_LEVEL';
    } else {
      // Ne treba drugi nivo - konačno odobren
      newStatus = 'APPROVED';
    }
    
    // 7. Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { status: newStatus, lastUpdatedById: managerId }
    });
    
    // 8. Ako konačno odobren, kreiraj ledger i DaySchedule
    if (newStatus === 'APPROVED') {
      await processApproval(tx, application, managerId);
    }
    
    // 9. Logiraj
    await tx.applicationLog.create({
      data: {
        organisationId: application.organisationId,
        applicationId: application.id,
        type: 'APPROVED',
        createdById: managerId
      }
    });
  });
}
```

---

### 6.3 Drugo odobrenje (General Manager)

**Pravilo:** General Manager odobrava zahtjeve koji su u statusu APPROVED_FIRST_LEVEL.

```typescript
async function approveSecondLevel(applicationId: number, managerId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Provjeri je li manager General Manager
    const manager = await tx.manager.findFirst({
      where: { 
        employeeId: managerId, 
        active: true,
        departmentId: null  // General Manager
      }
    });
    
    if (!manager) {
      throw new Error('Korisnik nije General Manager');
    }
    
    // 2. Dohvati Application
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // 3. Provjeri status
    if (application.status !== 'APPROVED_FIRST_LEVEL') {
      throw new Error('Zahtjev nije u statusu APPROVED_FIRST_LEVEL');
    }
    
    // 4. Ažuriraj status na konačno odobren
    await tx.application.update({
      where: { id: applicationId },
      data: { 
        status: 'APPROVED',
        lastUpdatedById: managerId 
      }
    });
    
    // 5. Kreiraj ledger entry i DaySchedule
    await processApproval(tx, application, managerId);
    
    // 6. Logiraj
    await tx.applicationLog.create({
      data: {
        organisationId: application.organisationId,
        applicationId: application.id,
        type: 'APPROVED',
        createdById: managerId
      }
    });
  });
}
```

---

### 6.4 Helper: processApproval

```typescript
async function processApproval(
  tx: Transaction, 
  application: Application, 
  approverId: number
) {
  // Ako reason ima hasPlanning, kreiraj ledger entry
  if (application.unavailabilityReason.hasPlanning) {
    await tx.unavailabilityLedgerEntry.create({
      data: {
        organisationId: application.organisationId,
        employeeId: application.employeeId,
        unavailabilityReasonId: application.unavailabilityReasonId,
        year: extractYear(application.startDate),
        changeDays: -application.requestedWorkdays,
        type: 'USAGE',
        applicationId: application.id,
        createdById: approverId
      }
    });
  }
  
  // Kreiraj DaySchedule zapise
  await createDaySchedules(tx, application);
}
```

---

### 6.5 Odobravanje zahtjeva

```typescript
async function approveApplication(applicationId: number, approverId: number) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { status: 'APPROVED', lastUpdatedById: approverId }
    });
    
    // Ako reason ima hasPlanning, kreiraj ledger entry
    if (application.unavailabilityReason.hasPlanning) {
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId: application.organisationId,
          employeeId: application.employeeId,
          unavailabilityReasonId: application.unavailabilityReasonId,
          year: extractYear(application.startDate),
          changeDays: -application.requestedWorkdays,  // Negativan = potrošnja
          type: 'USAGE',
          applicationId: application.id,
          createdById: approverId
        }
      });
    }
    
    // Kreiraj DaySchedule zapise
    await createDaySchedules(tx, application);
    
    // Logiraj
    await tx.applicationLog.create({
      data: {
        organisationId: application.organisationId,
        applicationId: application.id,
        type: 'APPROVED',
        createdById: approverId
      }
    });
  });
}
```

---

### 6.5 Otkazivanje zahtjeva

```typescript
async function cancelApplication(applicationId: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { status: 'CANCELLED', lastUpdatedById: userId }
    });
    
    // Ako ima ledger, kreiraj CORRECTION za vraćanje
    if (application.unavailabilityReason.hasPlanning) {
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId: application.organisationId,
          employeeId: application.employeeId,
          unavailabilityReasonId: application.unavailabilityReasonId,
          year: extractYear(application.startDate),
          changeDays: +application.requestedWorkdays,  // Pozitivan = vraćanje
          type: 'CORRECTION',
          applicationId: application.id,
          note: 'Otkazano',
          createdById: userId
        }
      });
    }
    
    // Obriši DaySchedule
    await tx.daySchedule.deleteMany({
      where: { applicationId: application.id }
    });
  });
}
```

---

### 6.6 Automatska prilagodba GO pri bolovanju

```typescript
async function handleSickLeaveOverlap(sickLeave: Application) {
  return await prisma.$transaction(async (tx) => {
    const overlappingVacations = await findOverlappingApprovedVacations(
      tx, sickLeave.employeeId, sickLeave.startDate, sickLeave.endDate
    );

    for (const vacation of overlappingVacations) {
      const adjustment = calculateAdjustment(sickLeave, vacation);
      
      // Ažuriraj Application
      await tx.application.update({
        where: { id: vacation.id },
        data: {
          status: adjustment.type === 'CANCEL' ? 'CANCELLED' : 'APPROVED',
          startDate: adjustment.newStartDate,
          endDate: adjustment.newEndDate,
          requestedWorkdays: adjustment.newWorkDays,
          lastUpdatedById: sickLeave.createdById
        }
      });
      
      // Kreiraj CORRECTION ledger entry
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId: vacation.organisationId,
          employeeId: vacation.employeeId,
          unavailabilityReasonId: vacation.unavailabilityReasonId,
          year: extractYear(vacation.startDate),
          changeDays: +adjustment.daysReturned,
          type: 'CORRECTION',
          applicationId: vacation.id,
          note: `Vraćeno zbog bolovanja`,
          createdById: sickLeave.createdById
        }
      });
      
      // Dodaj komentar
      await tx.applicationComment.create({
        data: {
          applicationId: vacation.id,
          comment: `Prilagođeno zbog bolovanja: ${adjustment.daysReturned} dana vraćeno`,
          createdById: sickLeave.createdById
        }
      });
      
      // Ažuriraj DaySchedule
      await updateDaySchedules(tx, vacation.id, adjustment);
    }
  });
}
```

---

### 6.4 Godišnji transfer (carry-over) - Automatska obrada 1.1.

**Scheduled job:** Pokreće se 1. siječnja u 00:00.

```typescript
// Cron job: '0 0 1 1 *' (1.1. u 00:00)
async function yearEndTransferJob() {
  const newYear = new Date().getFullYear();
  const oldYear = newYear - 1;
  
  // Dohvati sve reasons s hasPlanning
  const planningReasons = await prisma.unavailabilityReason.findMany({
    where: { hasPlanning: true, active: true }
  });
  
  // Dohvati sve aktivne zaposlenike
  const employees = await prisma.employee.findMany({
    where: { active: true }
  });
  
  for (const employee of employees) {
    for (const reason of planningReasons) {
      await performYearEndTransfer(
        employee.id,
        reason.id,
        oldYear,
        1  // System user ID
      );
    }
  }
}

async function performYearEndTransfer(
  employeeId: number, 
  unavailabilityReasonId: number,
  year: number, 
  managerId: number
) {
  return await prisma.$transaction(async (tx) => {
    // Kalkuliraj balance za staru godinu
    const currentBalance = await tx.unavailabilityLedgerEntry.aggregate({
      where: { employeeId, unavailabilityReasonId, year },
      _sum: { changeDays: true }
    });
    
    const balance = currentBalance._sum.changeDays || 0;
    
    if (balance > 0) {
      // Maksimalno 5 dana prenosa (business rule)
      const transferDays = Math.min(balance, 5);
      
      // Kreiraj TRANSFER entry za novu godinu
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId,
          employeeId,
          unavailabilityReasonId,
          year: year + 1,
          changeDays: +transferDays,
          type: 'TRANSFER',
          note: `Automatski prijenos iz ${year}`,
          createdById: managerId
        }
      });
    }
  });
}
```

---

## 7. VALIDACIJE

### 7.1 Validacija dostupnih dana

```typescript
async function validateBalance(
  employeeId: number, 
  unavailabilityReasonId: number,
  year: number, 
  requestedDays: number
) {
  const result = await prisma.unavailabilityLedgerEntry.aggregate({
    where: { employeeId, unavailabilityReasonId, year },
    _sum: { changeDays: true }
  });
  
  const balance = result._sum.changeDays || 0;
  
  if (requestedDays > balance) {
    throw new Error(
      `Nedovoljno dana. Dostupno: ${balance}, traženo: ${requestedDays}`
    );
  }
}
```

---

## 8. INDEKSI

```sql
-- UnavailabilityLedgerEntry
CREATE INDEX idx_ledger_employee_year ON unavailability_ledger_entry(employee_id, year);
CREATE INDEX idx_ledger_reason_year ON unavailability_ledger_entry(unavailability_reason_id, year);
CREATE INDEX idx_ledger_employee_reason_year ON unavailability_ledger_entry(employee_id, unavailability_reason_id, year);
CREATE INDEX idx_ledger_covering ON unavailability_ledger_entry(employee_id, year, change_days);

-- Application
CREATE INDEX idx_applications_employee ON applications(employee_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_dates ON applications(start_date, end_date);

-- DaySchedule
CREATE UNIQUE INDEX idx_day_schedule_unique ON day_schedules(organisation_id, employee_id, date);
CREATE INDEX idx_day_schedule_employee_date ON day_schedules(employee_id, date);

-- ApplicationLog
CREATE INDEX idx_application_logs_app ON application_logs(application_id);
```

---

## 9. ZAKLJUČAK

### Ključne odluke
- ✅ **Ledger model** - accounting best practice
- ✅ **LedgerEntryType** - ALLOCATION, USAGE, TRANSFER, CORRECTION
- ✅ **hasPlanning** - određuje koji razlozi imaju planning
- ✅ **ApplicationComment** - business komentari odvojeni od log-ova
- ✅ **Audit tracking** - createdBy/lastUpdatedBy na Application
- ✅ **Unique constraints** - sprječavanje duplikata

### Model je spreman za:
1. MVP GO modula
2. Bolovanja modul
3. Budući scheduling modul
4. Proširenja (edukacije, putovanja)
