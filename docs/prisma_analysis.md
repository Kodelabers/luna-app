# Prisma Model Analiza - GO/Bolovanja Modul

## 📋 IZVRŠNI SAŽETAK

**Postojeći model** je odlična osnova za GO/bolovanja modul. Multi-tenancy arhitektura, generički `UnavailabilityReason` pristup i `DaySchedule` za scheduling su perfektno dizajnirani.

**Ključna odluka: Ledger model**
- **UnavailabilityLedgerEntry** - accounting pristup za tracking dana
- **LedgerEntryType** (ALLOCATION, USAGE, TRANSFER, CORRECTION)
- **hasPlanning** flag određuje koji razlogi imaju planning
- Built-in audit trail kroz ledger

---

## 🔄 LEDGER PRISTUP

### Princip accounting ledger-a

**Svaka promjena broja dana = zaseban ledger entry.**

```prisma
model UnavailabilityLedgerEntry {
  id                     Int                  @id @default(autoincrement())
  organisationId         Int
  employeeId             Int
  unavailabilityReasonId Int
  year                   Int
  changeDays             Int                  // + ili -
  type                   LedgerEntryType
  applicationId          Int?
  note                   String?
  createdAt              DateTime             @default(now())
  createdById            Int?

  @@index([employeeId, year, changeDays])  // Covering index za performance
}

enum LedgerEntryType {
  ALLOCATION // dodjela za godinu (+)
  USAGE      // potrošnja (-)
  TRANSFER   // prijenos u novu godinu (+)
  CORRECTION // ručna korekcija (+/-)
}
```

### Primjer ledger zapisa

```typescript
// Zaposlenik Ivan za 2025:
[
  { 
    type: 'ALLOCATION', 
    changeDays: +20, 
    year: 2025,
    note: 'Godišnja alokacija za 2025' 
  },
  { 
    type: 'TRANSFER', 
    changeDays: +2, 
    year: 2025,
    note: 'Prijenos iz 2024' 
  },
  { 
    type: 'USAGE', 
    changeDays: -5, 
    year: 2025,
    applicationId: 123,
    note: 'GO 10-15.01.2025' 
  },
  { 
    type: 'CORRECTION', 
    changeDays: +2, 
    year: 2025,
    note: 'Vraćeno zbog bolovanja' 
  }
]

// Balance = 20 + 2 - 5 + 2 = 19 dana
```

### Kalkulacija balance-a

```typescript
async function getBalance(employeeId: number, unavailabilityReasonId: number, year: number) {
  const result = await prisma.unavailabilityLedgerEntry.aggregate({
    where: { 
      employeeId, 
      unavailabilityReasonId,
      year 
    },
    _sum: { changeDays: true }
  });
  
  return result._sum.changeDays || 0;
}

// Batch query za dashboard (svi zaposlenici):
const balances = await prisma.$queryRaw`
  SELECT 
    employee_id,
    unavailability_reason_id,
    year,
    SUM(change_days) as balance
  FROM unavailability_ledger_entry
  WHERE employee_id IN (${employeeIds})
    AND year = ${year}
  GROUP BY employee_id, unavailability_reason_id, year
`;
```

### Prednosti ledger pristupa

1. ✅ **Built-in audit trail** - vidiš sve korake, ne samo finalno stanje
2. ✅ **Jednostavna formula** - uvijek SUM, nema posebnih slučajeva
3. ✅ **Eksplicitan carry-over** - TRANSFER entry jasno pokazuje prijenos
4. ✅ **Ručne korekcije** - CORRECTION omogućava flex ibilnost
5. ✅ **Generalizacija** - radi za GO, bolovanja, bilo što s `hasPlanning=true`

---

## 🔧 IZMJENE U MODELU

### 1. DODATI UnavailabilityLedgerEntry

```prisma
model UnavailabilityLedgerEntry {
  id                     Int                  @id @default(autoincrement())
  organisationId         Int
  organisation           Organisation         @relation(fields: [organisationId], references: [id])
  employeeId             Int
  employee               Employee             @relation(fields: [employeeId], references: [id])
  unavailabilityReasonId Int
  unavailabilityReason   UnavailabilityReason @relation(fields: [unavailabilityReasonId], references: [id])
  
  year                   Int
  changeDays             Int
  type                   LedgerEntryType
  
  applicationId          Int?
  application            Application?         @relation(fields: [applicationId], references: [id])
  
  note                   String?
  
  createdAt              DateTime             @default(now())
  createdById            Int?
  createdBy              OrganisationUser?    @relation(fields: [createdById], references: [id])

  @@index([organisationId])
  @@index([employeeId, year])
  @@index([unavailabilityReasonId, year])
  @@index([employeeId, unavailabilityReasonId, year])
  @@index([employeeId, year, changeDays])  // Covering index
}

enum LedgerEntryType {
  ALLOCATION // dodjela za godinu
  USAGE      // potrošnja (-)
  TRANSFER   // prijenos u novu godinu (+)
  CORRECTION // ručna korekcija (+/-)
}
```

**Zašto:** Accounting pristup za tracking svih promjena dana.

---

### 2. DODATI hasPlanning na UnavailabilityReason

```prisma
model UnavailabilityReason {
  id                 Int      @id @default(autoincrement())
  organisationId     Int
  name               String
  colorCode          String?
  needApproval       Boolean  @default(false)       // Treba li odobrenje?
  needSecondApproval Boolean  @default(false)       // Treba li drugi nivo odobrenja?
  hasPlanning        Boolean  @default(false)       // ⭐ Ima li planning/ledger?
  active             Boolean  @default(true)
  
  applications                Application[]
  daySchedules                DaySchedule[]
  unavailabilityLedgerEntries UnavailabilityLedgerEntry[]
}
```

**Zašto:** Određuje koji razlozi imaju planning i ledger entries.

**Approval flow logika:**

1. **needApproval = false:**
   - Zahtjev ide direktno u `APPROVED` status
   - Primjer: Bolovanje

2. **needApproval = true && needSecondApproval = false:**
   - Flow: `DRAFT` → `SUBMITTED` → `APPROVED`
   - Odobrava: Department Manager
   - Primjer: Godišnji odmor

3. **needApproval = true && needSecondApproval = true:**
   - Flow: `DRAFT` → `SUBMITTED` → `APPROVED_FIRST_LEVEL` → `APPROVED`
   - Prvi nivo: Department Manager
   - Drugi nivo: General Manager
   - Primjer: Edukacija, Slobodni dan

**Primjeri konfiguracija:**
```typescript
{ 
  name: "Godišnji odmor", 
  hasPlanning: true, 
  needApproval: true, 
  needSecondApproval: true  // Department Manager + General Manager
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
  needSecondApproval: true  // Department Manager + General Manager
}
{ 
  name: "Slobodni dan", 
  hasPlanning: true, 
  needApproval: true,
  needSecondApproval: true  // Department Manager + General Manager
}
```

---

### 3. DODATI Manager model

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

**Zašto:** Fleksibilan sustav za Department Manager i General Manager.

**Logika:**
- **Department Manager** (`departmentId != NULL`):
  - Odobrava zahtjeve prvog nivoa za svoj odjel
  - Vidi samo svoj odjel
  - Ne može odobravati vlastite zahtjeve
  
- **General Manager** (`departmentId = NULL`):
  - Odobrava zahtjeve drugog nivoa za sve odjele
  - Vidi sve odjele u organizaciji
  - Može odobravati i vlastite zahtjeve (ako su prošli prvi nivo)

**Primjeri:**
```typescript
// Department Manager za Marketing
{ employeeId: 5, departmentId: 2, active: true }

// General Manager
{ employeeId: 1, departmentId: null, active: true }
```

---

### 4. DODATI ApplicationComment

```prisma
model ApplicationComment {
  id            Int              @id @default(autoincrement())
  applicationId Int
  application   Application      @relation(fields: [applicationId], references: [id])
  comment       String
  createdAt     DateTime         @default(now())
  createdById   Int
  createdBy     OrganisationUser @relation(fields: [createdById], references: [id])

  @@index([applicationId])
  @@index([createdById])
}
```

**Zašto:** Odvajanje komentara od log-ova. Komentari su business data.

---

### 5. PROŠIRITI Application

```prisma
model Application {
  id                     Int                  @id @default(autoincrement())
  organisationId         Int
  description            String?
  startDate              DateTime
  endDate                DateTime
  requestedWorkdays      Int?                 // ⭐ NOVO: broj radnih dana
  departmentId           Int
  employeeId             Int
  unavailabilityReasonId Int
  status                 ApplicationStatus    @default(DRAFT)
  active                 Boolean              @default(true)
  
  // ⭐ NOVO: Audit tracking
  createdAt              DateTime             @default(now())
  createdById            Int
  createdBy              OrganisationUser     @relation("createdByApplications", fields: [createdById], references: [id])
  updatedAt              DateTime             @updatedAt
  lastUpdatedById        Int?
  lastUpdatedBy          OrganisationUser?    @relation("lastUpdatedByApplications", fields: [lastUpdatedById], references: [id])
  
  applicationLogs             ApplicationLog[]
  daySchedules                DaySchedule[]
  comments                    ApplicationComment[]  // ⭐ NOVO
  unavailabilityLedgerEntries UnavailabilityLedgerEntry[]
}
```

**Zašto:** 
- `requestedWorkdays` - brži pristup broju dana
- `createdBy/lastUpdatedBy` - audit na razini modela
- `comments` - business komentari odvojeni od log-ova

---

### 6. AŽURIRATI ApplicationStatus

```prisma
enum ApplicationStatus {
  DRAFT
  SUBMITTED                // ⭐ PROMJENA: bilo PENDING
  APPROVED_FIRST_LEVEL     // ⭐ PROMJENA: bilo NEEDS_MANAGER_APPROVAL
  APPROVED
  REJECTED
  CANCELLED
}
```

**Zašto:** Konzistentnija nomenklatura, jasnije označavanje nivoa.

---

### 7. AŽURIRATI ApplicationLogType

```prisma
enum ApplicationLogType {
  CREATED
  DELETED
  REQUESTED                         // ⭐ FIX: bilo REQUSTED (typo)
  REJECTED
  REJECTED_ON_FIRST_APPROVAL        // ⭐ PROMJENA: bilo REJECTED_ON_SECOND_APPROVAL
  APPROVED
  POST_APPROVAL_IMPACT_CHANGED      // ⭐ NOVO: bilo ADJUSTED_AFTER_APPROVED
}
```

**Zašto:** 
- Fix typo
- Konzistentnost s prvim nivoom
- Jasniji naziv za post-approval izmjene

---

### 8. AŽURIRATI UserRole

```prisma
enum UserRole {
  ADMIN
}
```

**Zašto:** 
- Samo ADMIN u `UserRole` enum-u
- Department Manager i General Manager su definirani kroz `Manager` model
- `Manager.departmentId = NULL` → General Manager
- `Manager.departmentId != NULL` → Department Manager

---

### 9. DODATI indekse na Department i Employee

```prisma
model Department {
  alias String
  
  @@unique([organisationId, alias])  // ⭐ NOVO
}

model Employee {
  @@unique([organisationId, email])  // ⭐ NOVO
}
```

**Zašto:** Osigurava jedinstvene aliase i emailove unutar organizacije.

---

## 📊 BUSINESS LOGIKA

### Workflow: Submit zahtjeva

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
      data: { 
        status: newStatus,
        lastUpdatedById: userId 
      }
    });
    
    // Ako direktno odobren, kreiraj ledger i DaySchedule
    if (newStatus === 'APPROVED') {
      await processApproval(tx, application, userId);
    }
    
    // Logiraj
    await tx.applicationLog.create({
      data: {
        organisationId: application.organisationId,
        applicationId: application.id,
        type: newStatus === 'APPROVED' ? 'APPROVED' : 'REQUESTED',
        createdById: userId
      }
    });
  });
}
```

### Workflow: Prvo odobrenje (Department Manager)

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
      // Ne treba drugi nivo - IDE U APPROVED (konačno)
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

### Workflow: Drugo odobrenje (General Manager)

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

### Helper: processApproval

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

### Workflow: Odobravanje zahtjeva

```typescript
async function approveApplication(applicationId: number, approverId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Dohvati Application
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // 2. Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { 
        status: 'APPROVED',
        lastUpdatedById: approverId
      }
    });
    
    // 3. Ako reason ima hasPlanning, kreiraj ledger entry
    if (application.unavailabilityReason.hasPlanning) {
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId: application.organisationId,
          employeeId: application.employeeId,
          unavailabilityReasonId: application.unavailabilityReasonId,
          year: extractYear(application.startDate),
          changeDays: -application.requestedWorkdays,  // Negativan broj = potrošnja
          type: 'USAGE',
          applicationId: application.id,
          note: `${application.unavailabilityReason.name} ${formatDate(application.startDate)} - ${formatDate(application.endDate)}`,
          createdById: approverId
        }
      });
    }
    
    // 4. Kreiraj DaySchedule zapise
    await createDaySchedules(tx, application);
    
    // 5. Logiraj
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

### Workflow: Otkazivanje zahtjeva

```typescript
async function cancelApplication(applicationId: number, userId: number, reason: string) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // 1. Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { 
        status: 'CANCELLED',
        lastUpdatedById: userId
      }
    });
    
    // 2. Ako ima ledger entry, kreiraj CORRECTION za vraćanje
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
          note: `Otkazano: ${reason}`,
          createdById: userId
        }
      });
    }
    
    // 3. Obriši DaySchedule zapise
    await tx.daySchedule.deleteMany({
      where: { applicationId: application.id }
    });
    
    // 4. Logiraj
    await tx.applicationLog.create({
      data: {
        organisationId: application.organisationId,
        applicationId: application.id,
        type: 'DELETED',
        createdById: userId
      }
    });
  });
}
```

### Automatska prilagodba GO pri bolovanju

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
          requestedWorkdays: adjustment.newWorkDays
        }
      });
      
      // Kreiraj CORRECTION ledger entry za vraćene dane
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId: vacation.organisationId,
          employeeId: vacation.employeeId,
          unavailabilityReasonId: vacation.unavailabilityReasonId,
          year: extractYear(vacation.startDate),
          changeDays: +adjustment.daysReturned,  // Pozitivan = vraćanje
          type: 'CORRECTION',
          applicationId: vacation.id,
          note: `Vraćeno zbog bolovanja (${formatDate(sickLeave.startDate)} - ${formatDate(sickLeave.endDate)})`,
          createdById: sickLeave.createdById
        }
      });
      
      // Ažuriraj DaySchedule
      await updateDaySchedules(tx, vacation.id, adjustment);
      
      // Dodaj komentar
      await tx.applicationComment.create({
        data: {
          applicationId: vacation.id,
          comment: `Prilagođeno zbog bolovanja: ${adjustment.daysReturned} dana vraćeno`,
          createdById: sickLeave.createdById
        }
      });
      
      // Logiraj
      await tx.applicationLog.create({
        data: {
          organisationId: vacation.organisationId,
          applicationId: vacation.id,
          type: 'POST_APPROVAL_IMPACT_CHANGED',
          createdById: sickLeave.createdById
        }
      });
    }
  });
}
```

### Godišnji transfer (carry-over) - Automatska obrada 1.1.

**Pravilo:** 
- Automatska obrada: 1. siječnja u 00:00 (scheduled job)
- Maksimalno 5 dana prenosa
- Samo za reasons s `hasPlanning = true`

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
  systemUserId: number
) {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.unavailabilityLedgerEntry.aggregate({
      where: { employeeId, unavailabilityReasonId, year },
      _sum: { changeDays: true }
    });
    
    const balance = result._sum.changeDays || 0;
    
    if (balance > 0) {
      const transferDays = Math.min(balance, 5);
      
      await tx.unavailabilityLedgerEntry.create({
        data: {
          organisationId: employee.organisationId,
          employeeId,
          unavailabilityReasonId,
          year: year + 1,
          changeDays: +transferDays,
          type: 'TRANSFER',
          note: `Automatski prijenos iz ${year}`,
          createdById: systemUserId
        }
      });
    }
  });
}
```

---

## 📝 KOMPLETAN PRISMA SCHEMA

Vidi: `luna-app_new.prisma`

---

## 📅 IMPLEMENTACIJSKI PLAN

### FAZA 1: MVP GO modula (2-3 tjedna)

**Sprint 1: Database & Core API**
- Kreirati migration za nove modele
- `UnavailabilityLedgerEntry` CRUD API
- Prošireni `Application` API
- Seed default `UnavailabilityReason` (GO s `hasPlanning=true`)

**Sprint 2: Business logika**
- Kalkulacija radnih dana
- Ledger entry kreiranje pri odobrenju
- Validacija dostupnih dana (SUM ledger-a)
- Workflow: Draft → Submitted → Approved/Rejected

**Sprint 3: UI & Testing**
- Forme za GO zahtjeve
- Dashboard za zaposlenike (balance iz ledger-a)
- Dashboard za managere (pending zahtjevi)
- Testovi

### FAZA 2: Bolovanja modul (1-2 tjedna)

**Sprint 4: Bolovanja & Prilagodbe**
- Automatska prilagodba GO
- CORRECTION ledger entries za vraćanje dana
- Ažuriranje `DaySchedule`
- `ApplicationComment` za prilagodbe

**Sprint 5: Audit & Reporting**
- History prikaz (ledger entries)
- Reporting funkcije
- Export izvještaja

### FAZA 3: Integracija sa Scheduling (buduće)

- API za scheduling modul
- Webhook/event system
- Dodatni `UnavailabilityReason` tipovi (edukacije, putovanja)
- Advanced scheduling features

---

## ✅ CHECKLIST

### 🔴 KRITIČNO
- [ ] `Manager` model (departmentId NULL/NOT NULL logic)
- [ ] `UnavailabilityLedgerEntry` model
- [ ] `LedgerEntryType` enum
- [ ] `Application.requestedWorkdays`
- [ ] `Application.createdBy` / `lastUpdatedBy`
- [ ] `UnavailabilityReason.hasPlanning`
- [ ] `ApplicationComment` model

### 🟠 VAŽNO
- [ ] `ApplicationStatus` update (SUBMITTED, APPROVED_FIRST_LEVEL)
- [ ] `ApplicationLogType` update (fix typo, POST_APPROVAL_IMPACT_CHANGED)
- [ ] `UserRole` - samo ADMIN (bez MANAGER/EMPLOYEE)
- [ ] Covering index na ledger
- [ ] `Department.alias` unique constraint
- [ ] `Employee.email` unique constraint per org
- [ ] Autorizacijske provjere za Department Manager / General Manager

### 🟡 PREPORUČENO
- [ ] Indeksi za performance
- [ ] Transakcije za atomicity
- [ ] Batch query-i za dashboard

---

## 🎯 ZAKLJUČAK

**Ledger model je odličan izbor:**
- Built-in audit trail
- Jednostavna formula (SUM)
- Eksplicitan carry-over (TRANSFER)
- Ručne korekcije (CORRECTION)
- Generaliziran (hasPlanning flag)
- Production-ready accounting pristup

**Model je spreman za:**
1. MVP GO modula
2. Bolovanja modul
3. Budući scheduling modul
4. Proširenja (edukacije, putovanja)
