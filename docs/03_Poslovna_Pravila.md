# Poslovna pravila
## GO/Bolovanja modul

---

## 1. VALIDACIJSKA PRAVILA

### BR-VAL-001: Validacija datuma zahtjeva
**Pravilo:**
- Datum početka mora biti prije ili jednak datumu završetka
- Datum početka smije biti u prošlosti (za evidenciju naknadnih događaja)
- Datum završetka ne smije biti više od 365 dana u budućnosti

**Error poruke:**
- "Datum početka mora biti prije datuma završetka"
- "Zahtjev ne može biti duži od 365 dana"

**Napomena:** Za detalje o ograničenjima datuma u prošlosti vidi docs/otvorena_pitanja.md

---

### BR-VAL-002: Validacija preklapanja zahtjeva
**Pravilo:**
- Zahtjev se ne smije preklapati s zahtjevima u statusu: SUBMITTED, APPROVED_FIRST_LEVEL
- DRAFT, REJECTED i CANCELLED zahtjevi se ne uzimaju u obzir

**Logika preklapanja:**
```
Novi: [StartNew, EndNew]
Postojeći: [StartExist, EndExist]

PREKLAPANJE: (StartNew <= EndExist) AND (EndNew >= StartExist)
```

**Error poruka:**
- "Postoji preklapanje s postojećim zahtjevom (razdoblje: {datum1} - {datum2})"

---

### BR-VAL-003: Validacija dostupnih dana
**Pravilo:**
- Broj traženih radnih dana ne smije prelaziti dostupne dane
- Dostupni dani = SUM(changeDays) iz ledger entry-ja

**Formula:**
```typescript
const result = await prisma.unavailabilityLedgerEntry.aggregate({
  where: { 
    employeeId, 
    unavailabilityReasonId,  // Npr. "Godišnji odmor"
    year 
  },
  _sum: { changeDays: true }
});

const balance = result._sum.changeDays || 0;
const requestedWorkingDays = calculateWorkingDays(startDate, endDate);

VALID IF: requestedWorkingDays <= balance
```

**Error poruka:**
- "Nemate dovoljno preostalih dana. Preostalo: {X} dana, traženo: {Y} dana"

---

### BR-VAL-004: Validacija minimalne duljine zahtjeva
**Pravilo:**
- Zahtjev mora uključivati barem jedan radni dan
- Zahtjev samo za vikend/praznike nije validan

**Error poruka:**
- "Zahtjev mora uključivati barem jedan radni dan"

---

### BR-VAL-005: Validacija statusa za uređivanje
**Pravilo:**
- DRAFT zahtjevi: Mogu se uređivati i brisati
- SUBMITTED zahtjevi: Ne mogu se uređivati
- APPROVED zahtjevi: Ne mogu se uređivati
- REJECTED zahtjevi: Ne mogu se uređivati
- CANCELLED zahtjevi: Ne mogu se uređivati

**Error poruka:**
- "Ne možete uređivati zahtjev u statusu: {status}"

---

### BR-VAL-006: Validacija emaila zaposlenika
**Pravilo:**
- Email mora biti u validnom formatu: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Email mora biti jedinstven unutar organizacije (case-insensitive)

**Error poruke:**
- "Email nije u validnom formatu"
- "Email već postoji u sustavu"

---

### BR-VAL-007: Validacija alokacije dana
**Pravilo:**
- Minimalno: 1 dan
- Maksimalno: 50 dana
- Mora biti cijeli broj

**Formula:**
```
VALID IF: 1 <= allocatedDays <= 50
```

**Error poruka:**
- "Broj dana mora biti između 1 i 50"

---

### BR-VAL-008: Razlikovanje needApproval i hasPlanning flagova

**Pravilo:**
- **needApproval** i **hasPlanning** su dva odvojena koncepta s različitim funkcijama

**needApproval (proces odobrenja):**
- Određuje treba li zahtjev proći kroz proces odobrenja
- `needApproval = false`: Zahtjev ide direktno u APPROVED status (npr. bolovanje)
- `needApproval = true`: Zahtjev ide u SUBMITTED status i čeka odobrenje

**hasPlanning (potrošnja dana):**
- Određuje troši li zahtjev alocirane dane
- `hasPlanning = true`: Zahtjev kreira ledger entries, troši dane iz alokacije
- `hasPlanning = false`: Zahtjev ne troši dane, samo evidencija (npr. bolovanje)

**Korekcija dana:**
- Korekcija se izvršava kada novi zahtjev prekriva DaySchedule zapis nastao iz zahtjeva s `hasPlanning=true`
- Vraćaju se SVI preostali dani originalnog zahtjeva (od datuma početka novog zahtjeva do datuma završetka originalnog)
- Kreira se CORRECTION ledger entry s pozitivnim changeDays (vraćanje)

**Primjer kombinacija:**
```
| Tip             | needApproval | hasPlanning | Opis                              |
|-----------------|--------------|-------------|-----------------------------------|
| Godišnji odmor  | true         | true        | Treba odobrenje, troši dane       |
| Slobodni dan    | true         | true        | Treba odobrenje, troši dane       |
| Edukacija       | true         | true        | Treba odobrenje, troši dane       |
| Bolovanje       | false        | false       | Ne treba odobrenje, ne troši dane |
```

---

## 2. RAČUNSKA PRAVILA

### BR-CALC-001: Kalkulacija radnih dana
**Pravilo:**
- Isključi vikende (subota, nedjelja)
- Isključi praznike iz `Holiday` tablice

**Funkcija:**
```typescript
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let workingDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isHoliday = await checkIfHoliday(currentDate);
    
    if (!isWeekend && !isHoliday) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}
```

---

### BR-CALC-002: Kalkulacija balance-a (ledger SUM)
**Pravilo:**
- Balance = SUM svih changeDays za employee/reason/year

**Logika:**
```typescript
async function getBalance(
  employeeId: number, 
  unavailabilityReasonId: number, 
  year: number
): Promise<number> {
  const result = await prisma.unavailabilityLedgerEntry.aggregate({
    where: { employeeId, unavailabilityReasonId, year },
    _sum: { changeDays: true }
  });
  
  return result._sum.changeDays || 0;
}
```

**Primjer:**
```
Ledger entries za 2025:
ALLOCATION   | +20
TRANSFER     | +2
USAGE        | -5
USAGE        | -8
CORRECTION   | +3
─────────────────
BALANCE:       12 dana
```

---

### BR-CALC-003: Batch query za dashboard
**Pravilo:**
- Za dashboard više zaposlenika, koristi batch query

**Optimizacija:**
```typescript
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

---

## 3. AUTORIZACIJSKA PRAVILA

### BR-AUTH-001: Kreiranje zahtjeva
**Tko:**
- Zaposlenik (Employee) - vlastiti zahtjevi
- Department Manager - vlastiti + zahtjevi zaposlenika svog odjela
- General Manager - vlastiti + zahtjevi svih zaposlenika
- Admin (ADMIN) - svi zahtjevi

---

### BR-AUTH-002: Odobravanje zahtjeva - Prvi nivo

**Tko:**
- **Department Manager** - zahtjevi zaposlenika svog odjela

**Pravilo:**
- Department Manager ne može odobravati vlastite zahtjeve
- Department Manager vidi samo zahtjeve svog odjela
- Ako `needSecondApproval = false`: Status ide u `APPROVED` (konačno)
- Ako `needSecondApproval = true`: Status ide u `APPROVED_FIRST_LEVEL`

**Provjera:**
```typescript
async function canApproveFirstLevel(managerId: number, applicationId: number) {
  const manager = await prisma.manager.findFirst({
    where: { 
      employeeId: managerId, 
      active: true,
      departmentId: { not: null }  // Department Manager ima departmentId
    }
  });
  
  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  });
  
  // Ne može odobravati vlastite zahtjeve
  if (application.employeeId === managerId) {
    return false;
  }
  
  // Mora biti iz istog odjela
  return manager.departmentId === application.departmentId;
}
```

---

### BR-AUTH-003: Odobravanje zahtjeva - Drugi nivo

**Tko:**
- **General Manager** - svi zahtjevi u organizaciji u statusu APPROVED_FIRST_LEVEL

**Pravilo:**
- General Manager vidi sve odjele u organizaciji
- General Manager može odobravati i vlastite zahtjeve (ako su prošli prvi nivo)
- Radi finalno odobrenje: APPROVED_FIRST_LEVEL → APPROVED

**Provjera:**
```typescript
async function canApproveSecondLevel(managerId: number, applicationId: number) {
  const manager = await prisma.manager.findFirst({
    where: { 
      employeeId: managerId, 
      active: true,
      departmentId: null  // General Manager nema departmentId
    }
  });
  
  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  });
  
  // General Manager može odobravati samo ako je status APPROVED_FIRST_LEVEL
  return manager !== null && application.status === 'APPROVED_FIRST_LEVEL';
}
```

---

### BR-AUTH-004: Evidencija bolovanja
**Tko:**
- Department Manager (evidencija za svoje zaposlenike)
- General Manager (evidencija za sve)
- Admin (ADMIN) - evidencija za sve

**Pravilo:**
- Zaposlenik NE MOŽE sam evidentirati bolovanje
- Bolovanje evidentira manager/admin

---

### BR-AUTH-005: Kreiranje ledger entry-ja
**Tko:**
- **ALLOCATION:**
  - Admin (ADMIN) - za sve zaposlenike
  - General Manager - za sve zaposlenike
  - Department Manager - za zaposlenike svog odjela
- **USAGE:** Automatski sustav pri odobrenju zahtjeva
- **TRANSFER:** Automatski sustav (scheduled job 1.1.)
- **CORRECTION:**
  - Admin (ADMIN) - za sve zaposlenike
  - General Manager - za sve zaposlenike
  - Department Manager - za zaposlenike svog odjela

---

### BR-AUTH-006: Pristup podacima

**Department Manager:**
- Vidi samo zaposlenike svog odjela
- Vidi samo zahtjeve svog odjela
- Vidi samo ledger entries svog odjela
- Može kreirati alokacije samo za svoj odjel

**General Manager:**
- Vidi sve zaposlenike u organizaciji
- Vidi sve zahtjeve u organizaciji
- Vidi sve ledger entries u organizaciji
- Može kreirati alokacije za sve zaposlenike

**Admin (ADMIN):**
- Vidi sve u organizaciji
- Potpuni pristup svim podacima i funkcijama

---

## 4. WORKFLOW PRAVILA

### BR-WF-001: Životni ciklus zahtjeva (ovisno o needApproval flagovima)

**Flow 1: Bez odobrenja (needApproval = false)**
```
DRAFT → submit() → APPROVED (konačno)
                       ↓
                   CANCELLED
```
*Primjer: Bolovanje - ne treba odobrenje, direktno se odobrava.*

**Flow 2: Jednostruko odobrenje (needApproval = true, needSecondApproval = false)**
```
DRAFT → submit() → SUBMITTED → approve() → APPROVED (konačno)
                            ↓                  ↓
                        REJECTED          CANCELLED
```
*Primjer: Godišnji odmor - treba odobrenje managera.*

**Flow 3: Dvostuko odobrenje (needApproval = true, needSecondApproval = true)**
```
DRAFT → submit() → SUBMITTED → approve1() → APPROVED_FIRST_LEVEL → approve2() → APPROVED (konačno)
                            ↓                          ↓                             ↓
                        REJECTED              REJECTED_ON_FIRST_APPROVAL        CANCELLED
```
*Primjer: Edukacija - treba odobrenje managera i HR-a.*

**Pravila:**
- `needApproval = false`: Zahtjev ide direktno u `APPROVED` status pri submitu
- `needApproval = true && needSecondApproval = false`: Zahtjev ide u `SUBMITTED`, pa u `APPROVED`
- `needApproval = true && needSecondApproval = true`: Zahtjev ide u `SUBMITTED` → `APPROVED_FIRST_LEVEL` → `APPROVED`

---

### BR-WF-002: Submit zahtjeva

**Akcije pri submitu:**

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
      // Direktno odobren
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

---

### BR-WF-003: Prvo odobrenje (SUBMITTED → APPROVED ili APPROVED_FIRST_LEVEL)

**Akcije pri odobrenju:**

```typescript
async function approveApplication(applicationId: number, approverId: number) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // Provjeri trenutni status
    if (application.status !== 'SUBMITTED') {
      throw new Error('Zahtjev nije u statusu SUBMITTED');
    }
    
    // Određi novi status
    let newStatus: ApplicationStatus;
    
    if (application.unavailabilityReason.needSecondApproval) {
      // Treba drugi nivo
      newStatus = 'APPROVED_FIRST_LEVEL';
    } else {
      // Ne treba drugi nivo - konačno odobren
      newStatus = 'APPROVED';
    }
    
    // Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { 
        status: newStatus,
        lastUpdatedById: approverId 
      }
    });
    
    // Ako konačno odobren, kreiraj ledger i DaySchedule
    if (newStatus === 'APPROVED') {
      await processApproval(tx, application, approverId);
    }
    
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

### BR-WF-004: Drugo odobrenje (APPROVED_FIRST_LEVEL → APPROVED)

**Akcije pri drugom odobrenju:**

```typescript
async function approveSecondLevel(applicationId: number, approverId: number) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId },
      include: { unavailabilityReason: true }
    });
    
    // Provjeri trenutni status
    if (application.status !== 'APPROVED_FIRST_LEVEL') {
      throw new Error('Zahtjev nije u statusu APPROVED_FIRST_LEVEL');
    }
    
    // Ažuriraj status na konačno odobren
    await tx.application.update({
      where: { id: applicationId },
      data: { 
        status: 'APPROVED',
        lastUpdatedById: approverId 
      }
    });
    
    // Kreiraj ledger entry i DaySchedule
    await processApproval(tx, application, approverId);
    
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

### BR-WF-005: Helper funkcija - processApproval

**Zajednička logika za kreiranje ledger-a i DaySchedule:**

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
        changeDays: -application.requestedWorkdays,  // Negativan = potrošnja
        type: 'USAGE',
        applicationId: application.id,
        note: `${application.unavailabilityReason.name} ${formatDate(application.startDate)} - ${formatDate(application.endDate)}`,
        createdById: approverId
      }
    });
  }
  
  // Kreiraj DaySchedule zapise
  await createDaySchedules(tx, application);
}
```

---

### BR-WF-006: Odbijanje zahtjeva

**Akcije pri odbijanju:**
1. Postavi status na `REJECTED` (ako je SUBMITTED)
2. Postavi status na `REJECTED_ON_FIRST_APPROVAL` (ako je APPROVED_FIRST_LEVEL)
3. Ne kreira se ledger entry (dani nisu potrošeni)
4. Logiraj u `ApplicationLog`

```typescript
async function rejectApplication(applicationId: number, approverId: number) {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: applicationId }
    });
    
    // Određi tip odbijanja
    const newStatus = application.status === 'APPROVED_FIRST_LEVEL' 
      ? 'REJECTED' 
      : 'REJECTED';
    
    const logType = application.status === 'APPROVED_FIRST_LEVEL'
      ? 'REJECTED_ON_FIRST_APPROVAL'
      : 'REJECTED';
    
    // Ažuriraj status
    await tx.application.update({
      where: { id: applicationId },
      data: { status: newStatus, lastUpdatedById: approverId }
    });
    
    // Logiraj
    await tx.applicationLog.create({
      data: {
        organisationId: application.organisationId,
        applicationId: application.id,
        type: logType,
        createdById: approverId
      }
    });
  });
}
```

---

### BR-WF-007: Otkazivanje zahtjeva
**Akcije pri otkazivanju:**
1. Postavi status na `CANCELLED`
2. Ako postoji ledger entry:
   - Kreiraj CORRECTION entry (changeDays: pozitivan = vraćanje)
3. Obriši `DaySchedule` zapise
4. Logiraj u `ApplicationLog` (type: `DELETED`)

**Transakcija:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update status
  await tx.application.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
  
  // 2. CORRECTION ledger entry (vraćanje dana)
  if (reason.hasPlanning) {
    await tx.unavailabilityLedgerEntry.create({
      data: {
        employeeId,
        unavailabilityReasonId,
        year: extractYear(startDate),
        changeDays: +requestedWorkdays,  // Pozitivan = vraćanje
        type: 'CORRECTION',
        applicationId: id,
        note: 'Otkazano'
      }
    });
  }
  
  // 3. Delete DaySchedule
  await tx.daySchedule.deleteMany({ where: { applicationId: id } });
});
```

---

## 5. PRAVILA AUTOMATIZACIJE

### BR-AUTO-001: Automatska prilagodba GO pri bolovanju
**Pravilo:**
- Kada se evidentira bolovanje koje se preklapa s odobrenim GO:
  1. **Potpuno preklapanje** → Otkazati GO, vratiti sve dane
  2. **Djelomično preklapanje** → Skratiti GO, vratiti preklopljene dane
  3. **Preklapanje u sredini** → Skratiti GO na prvi dio, vratiti ostatak

**DaySchedule kreiranje:**
- **Otvoreno bolovanje (bez datuma završetka):**
  - Kreira se DaySchedule zapis samo za datum početka bolovanja
  - Ostali dani se ne popunjavaju u DaySchedule-u
  - UI prikazuje sve dane od datuma početka do danas s oznakom "Aktivno bolovanje - u tijeku"
  
- **Zatvoreno bolovanje (s datumom završetka):**
  - Pri spremanju ili zatvaranju bolovanja kreiraju se DaySchedule zapisi za sve dane
  - Postojeći DaySchedule zapis za prvi dan se ažurira (update)

**Logika:**
```typescript
async function handleSickLeaveOverlap(sickLeave: Application) {
  return await prisma.$transaction(async (tx) => {
    // Odredi koje dane provjeriti
    const checkDates = sickLeave.endDate 
      ? generateDateRange(sickLeave.startDate, sickLeave.endDate)  // Zatvoreno bolovanje
      : [sickLeave.startDate];  // Otvoreno bolovanje - samo prvi dan
    
    const overlappingVacations = await findOverlappingApprovedVacations(
      tx, sickLeave.employeeId, checkDates
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
      
      // Kreiraj CORRECTION ledger entry za vraćanje
      await tx.unavailabilityLedgerEntry.create({
        data: {
          employeeId: vacation.employeeId,
          unavailabilityReasonId: vacation.unavailabilityReasonId,
          year: extractYear(vacation.startDate),
          changeDays: +adjustment.daysReturned,  // Pozitivan
          type: 'CORRECTION',
          applicationId: vacation.id,
          note: `Vraćeno zbog bolovanja`
        }
      });
      
      // Dodaj komentar
      await tx.applicationComment.create({
        data: {
          applicationId: vacation.id,
          comment: `Prilagođeno zbog bolovanja: ${adjustment.daysReturned} dana vraćeno`
        }
      });
      
      // Ažuriraj DaySchedule
      await updateDaySchedules(tx, vacation.id, adjustment);
      
      // Logiraj
      await tx.applicationLog.create({
        data: {
          applicationId: vacation.id,
          type: 'POST_APPROVAL_IMPACT_CHANGED'
        }
      });
    }
    
    // Kreiraj DaySchedule zapise za bolovanje
    if (sickLeave.endDate) {
      // Zatvoreno bolovanje - kreiraj sve zapise
      await createDaySchedules(tx, sickLeave);
    } else {
      // Otvoreno bolovanje - kreiraj samo prvi dan
      await createSingleDaySchedule(tx, sickLeave, sickLeave.startDate);
    }
  });
}
```

---

### BR-AUTO-002: Zatvaranje otvorenog bolovanja i kreiranje DaySchedule zapisa

**Pravilo:**
- Pri zatvaranju otvorenog bolovanja (dodavanje datuma završetka), kreiraju se DaySchedule zapisi za cijelo razdoblje
- Manager ručno zatvara bolovanja, nema automatskog zatvaranja

**Logika:**
```typescript
async function closeSickLeave(sickLeaveId: number, endDate: Date, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const sickLeave = await tx.application.findUnique({
      where: { id: sickLeaveId },
      include: { unavailabilityReason: true }
    });
    
    // Ažuriraj Application s datumom završetka
    await tx.application.update({
      where: { id: sickLeaveId },
      data: { 
        endDate: endDate,
        lastUpdatedById: userId
      }
    });
    
    // Kreiraj DaySchedule zapise za sve dane između startDate i endDate
    const allDays = generateDateRange(sickLeave.startDate, endDate);
    
    for (const day of allDays) {
      await tx.daySchedule.upsert({
        where: {
          organisationId_employeeId_date: {
            organisationId: sickLeave.organisationId,
            employeeId: sickLeave.employeeId,
            date: day
          }
        },
        create: {
          organisationId: sickLeave.organisationId,
          employeeId: sickLeave.employeeId,
          applicationId: sickLeave.id,
          unavailabilityReasonId: sickLeave.unavailabilityReasonId,
          date: day,
          dayCode: getDayCode(day),
          isWeekend: isWeekend(day),
          isHoliday: await isHoliday(day),
          status: 'NOT_AVAILABLE'
        },
        update: {
          // Ažuriraj ako već postoji (npr. prvi dan)
          applicationId: sickLeave.id,
          unavailabilityReasonId: sickLeave.unavailabilityReasonId,
          status: 'NOT_AVAILABLE'
        }
      });
    }
    
    // Provjeri preklapanje i izvršava korekciju za cijelo razdoblje
    await handleSickLeaveOverlap(tx, sickLeave);
  });
}
```

---

### BR-AUTO-003: Kreiranje DaySchedule zapisa
**Pravilo:**
- Prilikom odobravanja zahtjeva, automatski kreiraj `DaySchedule` za svaki dan

**Logika:**
```typescript
async function createDaySchedules(tx: Transaction, application: Application) {
  const days = generateDateRange(application.startDate, application.endDate);
  
  for (const date of days) {
    await tx.daySchedule.upsert({
      where: {
        organisationId_employeeId_date: {
          organisationId: application.organisationId,
          employeeId: application.employeeId,
          date: date
        }
      },
      create: {
        organisationId: application.organisationId,
        employeeId: application.employeeId,
        applicationId: application.id,
        unavailabilityReasonId: application.unavailabilityReasonId,
        date: date,
        dayCode: getDayCode(date),
        isWeekend: isWeekend(date),
        isHoliday: await isHoliday(date),
        status: 'NOT_AVAILABLE'
      },
      update: {
        applicationId: application.id,
        unavailabilityReasonId: application.unavailabilityReasonId,
        status: 'NOT_AVAILABLE'
      }
    });
  }
}
```

---

### BR-AUTO-004: Godišnji transfer (carry-over) - Automatska obrada 1.1.

**Pravilo:**
- **Automatska obrada:** 1. siječnja u 00:00 (noćni job)
- Maksimalno 5 dana može biti transferirano (business rule)
- Transfer se kreira samo za reasons s `hasPlanning = true`

**Scheduled job:**
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
    // Kalkuliraj balance za staru godinu
    const result = await tx.unavailabilityLedgerEntry.aggregate({
      where: { employeeId, unavailabilityReasonId, year },
      _sum: { changeDays: true }
    });
    
    const balance = result._sum.changeDays || 0;
    
    if (balance > 0) {
      const transferDays = Math.min(balance, 5);  // Max 5 dana
      
      // Kreiraj TRANSFER entry za novu godinu
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

**Napomena:** Job bi trebao biti idempotent (može se pokrenuti više puta bez dupliciranja).

---

### BR-AUTO-005: Godišnja alokacija
**Pravilo:**
- Na početku godine (ili pri zapošljavanju), admin/manager dodjeljuje dane

**Logika:**
```typescript
async function allocateDays(
  employeeId: number,
  unavailabilityReasonId: number,
  year: number,
  days: number,
  adminId: number
) {
  await prisma.unavailabilityLedgerEntry.create({
    data: {
      organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
      changeDays: +days,  // Pozitivan
      type: 'ALLOCATION',
      note: `Godišnja alokacija za ${year}`,
      createdById: adminId
    }
  });
}
```

---

## 6. LEDGER PRAVILA

### BR-LEDGER-001: Tipovi ledger entry-ja
**ALLOCATION:**
- Dodjela dana za godinu
- changeDays: pozitivan (+)
- Kreira: Admin/Manager

**USAGE:**
- Potrošnja dana (odobren zahtjev)
- changeDays: negativan (-)
- Kreira: Automatski pri odobrenju

**TRANSFER:**
- Prijenos iz prošle u novu godinu
- changeDays: pozitivan (+)
- Kreira: Admin/Manager

**CORRECTION:**
- Ručna korekcija (vraćanje, bonus...)
- changeDays: pozitivan ili negativan (+/-)
- Kreira: Admin/Manager

---

### BR-LEDGER-002: Immutability
**Pravilo:**
- Ledger entry se nikada ne mijenja nakon kreiranja
- Za ispravak, kreiraj novi CORRECTION entry

---

### BR-LEDGER-003: Balance ne smije biti negativan
**Pravilo:**
- Validacija prije kreiranja USAGE entry-ja
- Balance = SUM(changeDays) mora biti >= requestedDays

```typescript
const balance = await getBalance(employeeId, unavailabilityReasonId, year);

if (requestedDays > balance) {
  throw new Error('Nedovoljno dana');
}
```

---

## 7. ZAKLJUČAK

### Ključna pravila:
1. ✅ **Ledger accounting** - immutable entries, SUM za balance
2. ✅ **hasPlanning flag** - određuje koji razlozi imaju ledger
3. ✅ **Transakcije** - atomicity svih operacija
4. ✅ **Automatske prilagodbe** - bolovanje vraća GO dane
5. ✅ **Audit trail** - ApplicationLog + ApplicationComment

### Status flow:
- DRAFT → SUBMITTED → APPROVED / REJECTED
- APPROVED → CANCELLED (uz CORRECTION entry)

### Ledger types:
- ALLOCATION (+) - Dodjela
- USAGE (-) - Potrošnja
- TRANSFER (+) - Prijenos
- CORRECTION (+/-) - Ispravak
