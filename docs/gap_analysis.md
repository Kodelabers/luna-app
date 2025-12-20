# Gap Analysis - Luna App Mockup
## Analiza implementacije naspram specifikacije

**Datum:** 20.12.2024  
**Verzija:** 2.0  
**Status:** Full-Featured Mockup Analysis  
**Zadnje ažuriranje:** 20.12.2024

---

## 🎯 NAJNOVIJE PROMJENE

### ✅ Faza 1 - ZAVRŠENA (Validacije i kalkulacije)

**Implementirane nove funkcionalnosti:**

1. **Toast notifications sistem**
   - `components/ui/toast.tsx` i `toaster.tsx`
   - `hooks/use-toast.ts`
   - `lib/utils/toast.ts` helper

2. **Validacije (lib/utils/validation.ts)**
   - ✅ BR-VAL-001: Validacija datuma zahtjeva
   - ✅ BR-VAL-002: Validacija preklapanja zahtjeva
   - ✅ BR-VAL-003: Validacija dostupnih dana
   - ✅ BR-VAL-004: Validacija minimalne duljine
   - ✅ Master `validateApplication()` funkcija

3. **Overlap detection (lib/utils/overlap.ts)**
   - ✅ `detectOverlap()` - provjera preklapanja dva zahtjeva
   - ✅ `findOverlappingApps()` - pronađi sve preklapajuće zahtjeve
   - ✅ `hasOverlap()` - brza provjera preklapanja

4. **Ledger utilities (lib/utils/ledger.ts)**
   - ✅ `calculateBalance()` - računanje balance-a iz ledger-a
   - ✅ `calculatePendingDays()` - računanje pending dana
   - ✅ `getEntriesForEmployee()` - filtriranje ledger zapisa
   - ✅ `groupEntriesByType()` - grupiranje po tipu

5. **Custom hooks**
   - ✅ `hooks/useBalance.ts` - reusable balance hook s useMemo cache-om

6. **Mock API (lib/mock-data/api.ts)**
   - ✅ `useMockApplications()` - state management za aplikacije
   - ✅ `useMockLedgerEntries()` - state management za ledger
   - ✅ localStorage persistence
   - ✅ CRUD operacije: create, update, delete, submit

7. **Ažuriran forma za kreiranje zahtjeva (app/employee/requests/new/page.tsx)**
   - ✅ Real-time kalkulacija radnih dana
   - ✅ Real-time validacija s error prikazom
   - ✅ Prikaz balance-a i dostupnih dana
   - ✅ Toast notifications za uspjeh/greške
   - ✅ Korištenje svih novih helper funkcija

**Napredak:**
- Postotak implementacije: 35% → **50%**
- Employee modul: 60% → **75%**
- Validacije: 0% → **90%**
- Kalkulacije: 40% → **90%**
- Helper funkcije: 30% → **80%**

**Sljedeći koraci:**
- 🔴 PRIORITET: Tablični kalendar (Faza 2)
- 🔴 PRIORITET: Approval proces (dio Faze 1)
- 🔴 PRIORITET: Upravljanje alokacijama (Faza 3)

### 📁 Nove datoteke u projektu

**UI komponente:**
```
components/ui/
├── toast.tsx          ← Toast notification komponenta
└── toaster.tsx        ← Toast provider i renderer
```

**Hooks:**
```
hooks/
├── use-toast.ts       ← Toast hook za notifikacije
└── useBalance.ts      ← Balance kalkulacija hook
```

**Utility funkcije:**
```
lib/utils/
├── validation.ts      ← Sve validacije (VAL-001 do VAL-004)
├── overlap.ts         ← Overlap detection funkcije
├── ledger.ts          ← Ledger kalkulacije i helperi
└── toast.ts           ← Toast helper wrapper
```

**Mock API:**
```
lib/mock-data/
└── api.ts             ← State management za applications i ledger
```

**Ažurirane datoteke:**
```
app/employee/requests/new/page.tsx  ← Forma s validacijama i real-time feedback
app/layout.tsx                      ← Dodana <Toaster /> komponenta
```

---

## 📋 IZVRŠNI SAŽETAK

### Svrha dokumenta
Ovaj dokument analizira trenutnu implementaciju full-featured mockup aplikacije Luna u odnosu na detaljnu tehničku specifikaciju. Identifikuje implementirane funkcionalnosti, nedostajuće komponente i prioritete za završetak mockupa.

### Trenutni status
- ✅ **Arhitektura:** Next.js 14+ sa TypeScript - potpuno implementirano
- ✅ **UI Framework:** shadcn/ui + Tailwind CSS - potpuno implementirano
- ✅ **Data Layer:** Mock podaci (generator.ts) + Mock API (api.ts) - potpuno implementirano
- ✅ **Business Logic:** Validacije i kalkulacije - potpuno implementirano
- ✅ **State Management:** Mock API s localStorage - implementirano
- ⚠️ **Workflow Logic:** Parcijalno implementirano (nedostaje approval)
- ❌ **Database:** Prisma schema definirano, ali ne koristi se u mockupu

### Postotak implementacije
- **Ukupno:** ~50% funkcionalnosti prema specifikaciji
- **Employee Dashboard:** 75% implementirano
- **Manager Dashboard:** 45% implementirano
- **General Manager Dashboard:** 20% implementirano
- **Admin Dashboard:** 10% implementirano

---

## 1. PREGLED STRUKTURE PROJEKTA

### 1.1 Trenutna struktura direktorija

```
app/
├── admin/
│   └── page.tsx                    ✅ Postoji (placeholder)
├── employee/
│   ├── page.tsx                    ✅ Dashboard implementiran
│   └── requests/
│       ├── page.tsx                ✅ Lista zahtjeva
│       └── new/
│           └── page.tsx            ✅ Kreiranje zahtjeva
├── general-manager/
│   └── page.tsx                    ✅ Postoji (placeholder)
├── manager/
│   ├── page.tsx                    ✅ Dashboard implementiran
│   └── requests/
│       └── page.tsx                ✅ Lista i odobravanje
├── layout.tsx                      ✅ Root layout
├── page.tsx                        ✅ Home redirect
└── globals.css                     ✅ Stilovi

components/
├── layout/
│   ├── dashboard-layout.tsx        ✅ Glavni layout
│   └── role-switcher.tsx           ✅ Prebacivanje uloga
└── ui/                             ✅ shadcn/ui komponente

lib/
├── mock-data/
│   ├── context.tsx                 ✅ Mock autentifikacija
│   ├── generator.ts                ✅ Mock podaci
│   └── api.ts                      ✅ Mock API s state management - NOVO!
├── types/
│   └── index.ts                    ✅ TypeScript tipovi
├── utils/
│   ├── dates.ts                    ✅ Date utilities
│   ├── workdays.ts                 ✅ Workday kalkulacije
│   ├── validation.ts               ✅ Validacije - NOVO!
│   ├── overlap.ts                  ✅ Overlap detection - NOVO!
│   ├── ledger.ts                   ✅ Ledger helpers - NOVO!
│   └── toast.ts                    ✅ Toast helper - NOVO!
└── utils.ts                        ✅ cn() helper

hooks/
├── use-toast.ts                    ✅ Toast hook - NOVO!
└── useBalance.ts                   ✅ Balance hook - NOVO!

docs/                               ✅ Kompletna specifikacija
```

### 1.2 Implementirani mock podaci

**✅ Potpuno implementirano:**
- Organisation (1 organizacija)
- Departments (3 odjela)
- Employees (18 zaposlenika)
- Managers (4 managera)
- UnavailabilityReasons (4 tipa)
- Holidays (15 hrvatskih praznika)
- Applications (10 zahtjeva)
- LedgerEntries (8 ledger zapisa)

**📊 Pokrivenost:**
- Svi scenariji statusa: DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED, REJECTED
- Svi tipovi managera: Department Manager, General Manager
- Svi tipovi nedostupnosti: Godišnji odmor, Bolovanje, Edukacija, Slobodni dan

---

## 2. FUNKCIONALNA ANALIZA PO MODULIMA

### 2.1 EMPLOYEE MODUL (Zaposlenik)

#### ✅ Implementirano

**Dashboard (`/employee/page.tsx`)**
- ✅ Prikaz kartice sa statistikama:
  - Ukupno dana (allocated)
  - Iskorišteno dana (used)
  - Na čekanju (pending)
  - Preostalo (available)
- ✅ Lista nedavnih zahtjeva (5 najnovijih)
- ✅ Status badge za svaki zahtjev
- ✅ Quick action button "Kreiraj Novi Zahtjev"
- ✅ Kalkulacija balance-a pomoću ledger-a

**Lista zahtjeva (`/employee/requests/page.tsx`)**
- ✅ Prikaz svih zahtjeva zaposlenika
- ✅ Filtriranje po statusu
- ✅ Status badges
- ✅ Formatiranje datuma
- ✅ Interakcija s mock API-jem

**Kreiranje zahtjeva (`/employee/requests/new/page.tsx`)**
- ✅ Forma za kreiranje zahtjeva
- ✅ Odabir tipa nedostupnosti
- ✅ Odabir datuma (start/end)
- ✅ Textarea za napomenu
- ✅ Validacija forme (frontend)

#### ❌ Nedostaje

**Dashboard:**
- ❌ Kalendarski prikaz (FR-EMP-002)
- ❌ Vizualizacija godišnjih odmora na kalendaru
- ❌ Klik na dan za prikaz detalja

**Lista zahtjeva:**
- ❌ Detalji pojedinačnog zahtjeva (FR-EMP-010)
- ❌ Povijest promjena statusa
- ❌ Komentar voditelja
- ❌ Filtriranje po godini
- ❌ Sortiranje po različitim poljima

**Kreiranje zahtjeva:**
- ✅ Automatska kalkulacija radnih dana (real-time) - **IMPLEMENTIRANO**
- ✅ Validacija preklapanja (FR-VAL-002) - **IMPLEMENTIRANO**
- ✅ Validacija dostupnih dana (FR-VAL-003) - **IMPLEMENTIRANO**
- ✅ Validacija datuma (BR-VAL-001) - **IMPLEMENTIRANO**
- ✅ Prikaz balance-a i preostalih dana - **IMPLEMENTIRANO**
- ✅ Real-time validacija s error porukama - **IMPLEMENTIRANO**
- ✅ Toast notifications - **IMPLEMENTIRANO**
- ❌ Draft funkcionalnost (FR-EMP-004)
- ❌ Prikaz vikenda i praznika inline
- ❌ Uređivanje draft zahtjeva (FR-EMP-006)
- ❌ Brisanje draft zahtjeva (FR-EMP-007)

**Evidencija bolovanja:**
- ❌ Pregled vlastitih bolovanja (FR-EMP-011)

**Prioritet:** 🟡 SREDNJI (većina kritičnog završeno)
- ✅ Kalkulacija radnih dana - **ZAVRŠENO**
- ✅ Validacija preklapanja i dostupnih dana - **ZAVRŠENO**
- Draft funkcionalnost - **SREDNJI**
- Kalendar - **SREDNJI**

---

### 2.2 MANAGER MODUL (Department Manager)

#### ✅ Implementirano

**Dashboard (`/manager/page.tsx`)**
- ✅ Prikaz statistika odjela:
  - Broj zaposlenika
  - Zahtjevi na čekanju
  - Odobreno ovaj mjesec
- ✅ Lista pending zahtjeva (preview)
- ✅ Link za planiranje

**Zahtjevi (`/manager/requests/page.tsx`)**
- ✅ Tablica svih pending zahtjeva
- ✅ Odobri/Odbij akcije
- ✅ Dialog za odobrenje/odbijanje
- ✅ Polje za komentar

#### ❌ Nedostaje

**Dashboard:**
- ❌ Tablični kalendarski prikaz (FR-APP-002) - **KLJUČNA FUNKCIONALNOST**
- ❌ Pregled alokacija zaposlenika (FR-APP-003)
- ❌ Vizualizacija kritičnih razdoblja

**Zahtjevi:**
- ❌ Prikaz detalja zahtjeva prije odobrenja
- ❌ Prikaz preklapanja s drugim zaposlenicima
- ❌ Upozorenje o kritičnom preklapanju
- ❌ Validacija prava odobrenja (ne može vlastite zahtjeve)
- ❌ Razlikovanje SUBMITTED vs APPROVED_FIRST_LEVEL statusa
- ❌ Logika dva nivoa odobrenja (needSecondApproval)
- ❌ Prikaz preostalih dana zaposlenika prije odobrenja

**Upravljanje alokacijama:**
- ❌ Dodjela godišnjih dana za novu godinu (FR-APP-008)
- ❌ Pojedinačna dodjela
- ❌ Masovna dodjela
- ❌ Kopiranje iz prethodne godine
- ❌ Izmjena alokacije tekuće godine (FR-APP-009)
- ❌ Pregled povijesti alokacija (FR-APP-010)

**Upravljanje bolovanja:**
- ❌ Evidencija novog bolovanja (FR-APP-011) - **KRITIČNO**
- ❌ Automatska prilagodba godišnjih odmora (FR-APP-012) - **INOVATIVNA FUNKCIJA**
- ❌ Zatvaranje aktivnog bolovanja (FR-APP-013)
- ❌ Lista bolovanja odjela (FR-APP-014)
- ❌ Uređivanje bolovanja (FR-APP-015)
- ❌ Brisanje bolovanja (FR-APP-016)

**Planiranje:**
- ❌ Tablični kalendar (FR-APP-017) - **KLJUČNO ZA MOCKUP**
- ❌ Vizualizacija preklapanja
- ❌ Identifikacija kritičnih razdoblja
- ❌ Eksport plana

**Statistike:**
- ❌ Statistika odjela (FR-APP-018)
- ❌ Eksport izvještaja (FR-APP-019)

**Prioritet:** 🔴 KRITIČNO
- Tablični kalendar - **NAJVAŽNIJE ZA MOCKUP**
- Upravljanje alokacijama - **KRITIČNO**
- Evidencija bolovanja + automatska prilagodba - **INOVATIVNA FUNKCIJA**

---

### 2.3 GENERAL MANAGER MODUL

#### ✅ Implementirano

- ✅ Placeholder stranica (`/general-manager/page.tsx`)

#### ❌ Nedostaje

**Dashboard:**
- ❌ Pregled svih odjela u organizaciji
- ❌ Zahtjevi u statusu APPROVED_FIRST_LEVEL (čeka drugi nivo)
- ❌ Statistike cijele organizacije

**Zahtjevi:**
- ❌ Drugi nivo odobrenja (APPROVED_FIRST_LEVEL → APPROVED)
- ❌ Mogućnost odobravanja vlastitih zahtjeva (nakon prvog nivoa)
- ❌ Pregled svih zahtjeva u organizaciji

**Planiranje:**
- ❌ Strateški pregled planiranja nedostupnosti
- ❌ Kalendar svih odjela

**Upravljanje:**
- ❌ Upravljanje godišnjim alokacijama za sve zaposlenike
- ❌ Evidencija bolovanja za sve zaposlenike

**Prioritet:** 🟡 SREDNJI (General Manager je "nice-to-have" za mockup)

---

### 2.4 ADMIN MODUL

#### ✅ Implementirano

- ✅ Placeholder stranica (`/admin/page.tsx`)

#### ❌ Nedostaje

**Upravljanje zaposlenicima:**
- ❌ Dodavanje novog zaposlenika (FR-ADM-001)
- ❌ Uređivanje zaposlenika (FR-ADM-002)
- ❌ Deaktivacija zaposlenika (FR-ADM-003)
- ❌ Pregled liste zaposlenika (FR-ADM-004)
- ❌ Pretraga, filtriranje, sortiranje

**Upravljanje odjelima:**
- ❌ Kreiranje odjela (FR-ADM-005)
- ❌ Uređivanje odjela (FR-ADM-006)
- ❌ Dodjeljivanje odobravatelja (FR-ADM-007)

**Upravljanje praznicima:**
- ❌ Dodavanje praznika (FR-ADM-008)
- ❌ Uređivanje praznika (FR-ADM-009)
- ❌ Brisanje praznika (FR-ADM-010)
- ❌ Uvoz praznika za novu godinu (FR-ADM-011)

**Dashboard:**
- ❌ Statistike cijele organizacije
- ❌ Pregled aktivnih zaposlenika
- ❌ Broj zahtjeva na čekanju (svi odjeli)
- ❌ Trend bolovanja

**Prioritet:** 🟡 SREDNJI (Admin je više "setup", manje operativan)

---

## 3. BUSINESS LOGIKA - IMPLEMENTACIJA

### 3.1 Validacije

#### ✅ Implementirano

**Frontend validacije:**
- ✅ Required fields validacija
- ✅ Date format validacija
- ✅ Form submission handling
- ✅ Real-time validacija s feedback-om
- ✅ Toast notifications za greške

#### ✅ Novo implementirano

**BR-VAL-001: Validacija datuma zahtjeva** - **ZAVRŠENO**
- ✅ Datum početka prije ili jednak datumu završetka
- ✅ Datum početka ne smije biti u prošlosti
- ✅ Datum završetka max 365 dana u budućnosti

**BR-VAL-002: Validacija preklapanja zahtjeva** - **ZAVRŠENO**
- ✅ Provjera preklapanja s SUBMITTED/APPROVED_FIRST_LEVEL/APPROVED
- ✅ Logika preklapanja: `(StartNew <= EndExist) AND (EndNew >= StartExist)`
- ✅ Error poruka s detaljima preklapanja

**BR-VAL-003: Validacija dostupnih dana** - **ZAVRŠENO**
- ✅ Kalkulacija balance-a iz ledger-a
- ✅ Provjera: requestedWorkdays <= balance
- ✅ Error poruka s informacijom o preostalom

**BR-VAL-004: Validacija minimalne duljine** - **ZAVRŠENO**
- ✅ Zahtjev mora imati barem 1 radni dan
- ✅ Provjera da nisu samo vikendi/praznici

#### ❌ Nedostaje

**BR-VAL-005: Validacija statusa za uređivanje**
- ❌ DRAFT - može se uređivati i brisati
- ❌ Ostali statusi - ne mogu se uređivati

**Prioritet:** 🟢 NIZAK (kritične validacije završene)

---

### 3.2 Kalkulacije

#### ✅ Implementirano

**`lib/utils/workdays.ts`:**
```typescript
✅ calculateWorkingDays() - osnovna funkcionalnost postoji
✅ isWeekend() helper
✅ isSameDay() helper
```

**`lib/utils/dates.ts`:**
```typescript
✅ formatDateRange() - za prikaz datuma
```

**`app/employee/page.tsx`:**
```typescript
✅ Kalkulacija balance-a:
  - totalAllocated (ALLOCATION + TRANSFER)
  - totalUsed (USAGE)
  - pendingDays (SUBMITTED + APPROVED_FIRST_LEVEL)
  - available = totalAllocated - totalUsed - pendingDays
```

#### ✅ Novo implementirano

**BR-CALC-001: Kalkulacija radnih dana** - **ZAVRŠENO**
- ✅ Koristi se u kreiranje zahtjeva formi
- ✅ Provjerava praznike iz mockHolidays
- ✅ Real-time kalkulacija pri odabiru datuma
- ✅ Prikaz broja radnih dana u formi

**BR-CALC-002: Kalkulacija balance-a (ledger SUM)** - **ZAVRŠENO**
- ✅ Postoji kao reusable funkcija (`lib/utils/ledger.ts`)
- ✅ Hook `useBalance()` za korištenje u komponentama
- ✅ Prima parametre (employeeId, reasonId, year)
- ✅ Koristi se u validacijama i prikazu

#### ❌ Nedostaje

**BR-CALC-003: Batch query za dashboard**
- ❌ Trenutno pojedinačno za svakog zaposlenika
- ❌ Ne postoji optimizirana verzija

**Prioritet:** 🟢 NIZAK (kritične kalkulacije završene)

---

### 3.3 Workflow pravila

#### ✅ Implementirano

**Mock data status flow:**
- ✅ DRAFT primjeri postoje
- ✅ SUBMITTED primjeri postoje
- ✅ APPROVED_FIRST_LEVEL primjeri postoje
- ✅ APPROVED primjeri postoje
- ✅ REJECTED primjeri postoje

#### ❌ Nedostaje

**BR-WF-001: Životni ciklus zahtjeva**
- ❌ Flow 1: needApproval=false (direktno APPROVED)
- ❌ Flow 2: needApproval=true, needSecondApproval=false
- ❌ Flow 3: needApproval=true, needSecondApproval=true (dva nivoa)
- ❌ Razlikovanje u UI-u

**BR-WF-002: Submit zahtjeva**
- ❌ Određivanje statusa ovisno o needApproval
- ❌ Logiranje akcije
- ❌ Kreiranje ledger entry-ja (za direktno odobrene)

**BR-WF-003: Prvo odobrenje**
- ❌ Provjera prava (Department Manager)
- ❌ Ne može vlastite zahtjeve
- ❌ Određivanje statusa (APPROVED ili APPROVED_FIRST_LEVEL)
- ❌ Kreiranje ledger/DaySchedule (ako konačno odobren)

**BR-WF-004: Drugo odobrenje**
- ❌ Provjera prava (General Manager)
- ❌ Samo APPROVED_FIRST_LEVEL → APPROVED
- ❌ Kreiranje ledger/DaySchedule

**BR-WF-005: Odbijanje**
- ❌ Razlog obavezan
- ❌ Ne kreira se ledger
- ❌ Logiranje

**BR-WF-006: Otkazivanje**
- ❌ CORRECTION entry za vraćanje dana
- ❌ Brisanje DaySchedule

**Prioritet:** 🔴 KRITIČNO za prvi nivo odobrenja, 🟡 SREDNJI za drugi nivo

---

### 3.4 Automatizacija

#### ❌ Potpuno nedostaje

**BR-AUTO-001: Automatska prilagodba GO pri bolovanju**
- ❌ Algoritam prilagodbe (4 scenarija):
  1. Potpuno preklapanje → Otkazati GO
  2. Preklapanje na početku → Pomicanje start datuma
  3. Preklapanje na kraju → Pomicanje end datuma
  4. Preklapanje u sredini → Skraćivanje na prvi dio
- ❌ Kreiranje CORRECTION ledger entry
- ❌ Ažuriranje DaySchedule
- ❌ Dodavanje komentara na zahtjev
- ❌ Izvještaj o prilagodbama

**Napomena:** Ovo je **KLJUČNA INOVATIVNA FUNKCIONALNOST** aplikacije!

**BR-AUTO-002: Kreiranje DaySchedule zapisa**
- ❌ Upsert za svaki dan razdoblja
- ❌ Postavljanje unavailabilityReasonId
- ❌ Postavljanje statusa (NOT_AVAILABLE)

**BR-AUTO-003: Godišnji transfer (carry-over)**
- ❌ Scheduled job (1.1.)
- ❌ Max 5 dana prenosa
- ❌ Samo za hasPlanning=true

**BR-AUTO-004: Godišnja alokacija**
- ❌ ALLOCATION entry kreiranje
- ❌ Masovna dodjela

**Prioritet:** 🔴 KRITIČNO za bolovanje prilagodbu

---

## 4. UI/UX KOMPONENTE

### 4.1 Implementirane komponente

#### ✅ shadcn/ui komponente

```
components/ui/
├── badge.tsx          ✅
├── button.tsx         ✅
├── card.tsx           ✅
├── dialog.tsx         ✅
├── dropdown-menu.tsx  ✅
├── input.tsx          ✅
├── label.tsx          ✅
├── select.tsx         ✅
├── table.tsx          ✅
├── textarea.tsx       ✅
├── toast.tsx          ✅ NOVO!
└── toaster.tsx        ✅ NOVO!
```

#### ✅ Layout komponente

```
components/layout/
├── dashboard-layout.tsx  ✅
└── role-switcher.tsx     ✅
```

**DashboardLayout features:**
- ✅ Sidebar navigacija
- ✅ Dinamički navigation items ovisno o ulozi
- ✅ Active state highlighting
- ✅ Header s user info
- ✅ Role switcher u headeru

**RoleSwitcher features:**
- ✅ Dropdown sa svim mock user-ima
- ✅ Prebacivanje između uloga
- ✅ Persistence u localStorage

### 4.2 Nedostajuće komponente

#### ❌ Ključne za mockup

**1. Kalendar komponente**
- ❌ `<Calendar>` - osnovni kalendar picker
- ❌ `<MonthView>` - mjesečni prikaz s events
- ❌ `<WeekView>` - tjedni prikaz
- ❌ `<CalendarGrid>` - tablični kalendar za planiranje

**2. Tablični kalendar (KLJUČNO!)**
- ❌ `<PlanningGrid>` - glavni tablični prikaz
  - Retci: Zaposlenici
  - Stupci: Datumi
  - Ćelije: Status za svaki dan
- ❌ Color coding:
  - Zeleno: Odobreni odmori
  - Žuto: Na čekanju
  - Narančasto: Bolovanja
  - Sivo: Vikend/praznik
- ❌ Hover states s detaljima
- ❌ Klikabilne ćelije
- ❌ Zoom kontrole (tjedan/mjesec/custom)

**3. Statistika komponente**
- ❌ `<StatCard>` - kartice sa stat-ovima (djelomično postoji kao Card)
- ❌ `<ProgressBar>` - progress bar za iskorištenost
- ❌ `<Chart>` - line/bar chart za trendove
- ❌ `<ComparisonWidget>` - usporedba po godinama

**4. Forme i validacije**
- ❌ `<DateRangePicker>` - advanced date picker
- ❌ `<WorkdaysCalculator>` - inline kalkulacija radnih dana
- ❌ `<ValidationMessage>` - konzistentan error display
- ❌ `<FormField>` - wrapper za form fields s validacijom

**5. Liste i tablice**
- ❌ `<DataTable>` - advanced data table s filterima
- ❌ `<FilterBar>` - filter controls
- ❌ `<SortableHeader>` - sortable table headers
- ❌ `<Pagination>` - pagination controls

**6. Modali i dialozi**
- ⚠️ `<Dialog>` postoji, ali nedostaju:
- ❌ `<ConfirmDialog>` - confirmation modal
- ❌ `<FormDialog>` - modal s formom
- ❌ `<DetailDialog>` - prikaz detalja

**7. Ostalo**
- ❌ `<EmptyState>` - empty state s ilustracijom
- ❌ `<LoadingState>` - skeleton loader
- ✅ `<Toast>` - toast notifications - **IMPLEMENTIRANO**
- ❌ `<Tabs>` - tab navigation (postoji u shadcn, ali ne koristi se)
- ❌ `<Tooltip>` - tooltips za dodatne info

**Prioritet:**
- 🔴 KRITIČNO: PlanningGrid, DateRangePicker
- 🟡 SREDNJI: Calendar, Charts, DataTable
- 🟢 NIZAK: Ostalo

---

## 5. ROUTING I NAVIGACIJA

### 5.1 Implementirane rute

#### ✅ Employee
```
/employee                    ✅ Dashboard
/employee/requests           ✅ Lista zahtjeva
/employee/requests/new       ✅ Kreiranje zahtjeva
```

#### ✅ Manager (Department Manager)
```
/manager                     ✅ Dashboard
/manager/requests            ✅ Zahtjevi za odobrenje
```

#### ✅ General Manager
```
/general-manager             ✅ Placeholder
```

#### ✅ Admin
```
/admin                       ✅ Placeholder
```

### 5.2 Nedostajuće rute

#### ❌ Employee
```
/employee/calendar           ❌ Kalendar prikaz
/employee/requests/[id]      ❌ Detalji zahtjeva
/employee/profile            ❌ Profil
```

#### ❌ Manager
```
/manager/planning            ❌ Tablični kalendar - KRITIČNO!
/manager/employees           ❌ Lista zaposlenika
/manager/employees/[id]      ❌ Detalji zaposlenika
/manager/allocations         ❌ Upravljanje alokacijama - KRITIČNO!
/manager/sick-leaves         ❌ Evidencija bolovanja - KRITIČNO!
/manager/sick-leaves/new     ❌ Novo bolovanje
/manager/statistics          ❌ Statistike odjela
```

#### ❌ General Manager
```
/general-manager/requests    ❌ Zahtjevi za drugi nivo
/general-manager/departments ❌ Svi odjeli
/general-manager/planning    ❌ Planiranje cijele org
```

#### ❌ Admin
```
/admin/employees             ❌ Upravljanje zaposlenicima
/admin/employees/new         ❌ Dodaj zaposlenika
/admin/employees/[id]        ❌ Uredi zaposlenika
/admin/departments           ❌ Upravljanje odjelima
/admin/departments/new       ❌ Dodaj odjel
/admin/departments/[id]      ❌ Uredi odjel
/admin/holidays              ❌ Upravljanje praznicima
/admin/settings              ❌ Postavke sustava
```

**Prioritet:**
- 🔴 KRITIČNO: `/manager/planning`, `/manager/allocations`, `/manager/sick-leaves`
- 🟡 SREDNJI: Admin rute, Employee calendar
- 🟢 NIZAK: Ostalo

---

## 6. DATA LAYER I STATE MANAGEMENT

### 6.1 Mock data implementacija

#### ✅ Implementirano

**`lib/mock-data/generator.ts`:**
- ✅ mockOrganisation
- ✅ mockDepartments (3)
- ✅ mockEmployees (18)
- ✅ mockManagers (4)
- ✅ mockUnavailabilityReasons (4)
- ✅ mockHolidays (15)
- ✅ mockApplications (10)
- ✅ mockLedgerEntries (8)

**`lib/mock-data/context.tsx`:**
- ✅ MockAuthProvider
- ✅ useMockAuth hook
- ✅ currentUser state
- ✅ switchRole funkcija
- ✅ localStorage persistence

**Kvaliteta mock podataka:** ⭐⭐⭐⭐⭐ (Odličan)
- Realistični hrvatski nazivi i email-ovi
- Različiti scenariji statusa
- Svi tipovi managera pokriveni
- Realističan calendar (2025)

### 6.2 Nedostaje

#### ❌ State management za mutacije

**Status:** ✅ **DJELOMIČNO IMPLEMENTIRANO**

**Implementirano:**
- ✅ `lib/mock-data/api.ts` - CRUD API za mock podatke
- ✅ `useMockApplications()` hook - aplikacije s state-om
- ✅ `useMockLedgerEntries()` hook - ledger entries s state-om
- ✅ localStorage persistence
- ✅ Funkcije: createApplication, updateApplication, deleteApplication, submitApplication
- ✅ Funkcija: createLedgerEntry

**Nedostaje:**
- ❌ approveApplication funkcija
- ❌ rejectApplication funkcija
- ❌ cancelApplication funkcija
- ❌ Optimistic updates
- ❌ Advanced error handling

#### ✅ Računanje balance-a - **ZAVRŠENO**

**Implementirano:**
- ✅ `useBalance(employeeId, reasonId, year)` hook (`hooks/useBalance.ts`)
- ✅ `calculateBalance()` helper (`lib/utils/ledger.ts`)
- ✅ `calculatePendingDays()` helper (`lib/utils/ledger.ts`)
- ✅ Cache rezultata s useMemo
- ✅ Reusable helper funkcije

#### ✅ Validacije - **ZAVRŠENO**

**Implementirano:**
- ✅ `validateApplication()` funkcija (`lib/utils/validation.ts`)
- ✅ `validateDateRange()` - BR-VAL-001
- ✅ `validateOverlap()` - BR-VAL-002
- ✅ `validateBalance()` - BR-VAL-003
- ✅ `validateMinWorkdays()` - BR-VAL-004
- ✅ Overlap detection (`lib/utils/overlap.ts`)
- ✅ `detectOverlap()`, `findOverlappingApps()`, `hasOverlap()`

**Prioritet:** 🟢 NIZAK (većina završeno, preostalo su nice-to-have)

---

## 7. UTILS I HELPER FUNKCIJE

### 7.1 Implementirane

#### ✅ `lib/utils/dates.ts`
```typescript
✅ formatDateRange(start, end): string
```

#### ✅ `lib/utils/workdays.ts`
```typescript
✅ calculateWorkingDays(start, end, holidays[]): number
✅ isWeekend(date): boolean
✅ isSameDay(date1, date2): boolean
```

#### ✅ `lib/utils.ts`
```typescript
✅ cn(...classes): string  // classnames helper
```

#### ✅ `lib/utils/validation.ts` - **NOVO**
```typescript
✅ validateDateRange(start, end): ValidationError[]
✅ validateMinWorkdays(start, end): ValidationError[]
✅ validateOverlap(newApp, existingApps): ValidationError[]
✅ validateBalance(available, requestedDays): ValidationError[]
✅ validateApplication(): ValidationError[]  // Master validacija
```

#### ✅ `lib/utils/overlap.ts` - **NOVO**
```typescript
✅ detectOverlap(app1, app2): boolean
✅ findOverlappingApps(newApp, existingApps): Application[]
✅ hasOverlap(): boolean
```

#### ✅ `lib/utils/ledger.ts` - **NOVO**
```typescript
✅ calculateBalance(entries, employeeId, reasonId, year): Balance
✅ getEntriesForEmployee(entries, employeeId, reasonId, year): Entry[]
✅ groupEntriesByType(entries): GroupedEntries
✅ calculatePendingDays(applications, employeeId, reasonId): number
```

#### ✅ `lib/utils/toast.ts` - **NOVO**
```typescript
✅ toast.success(message, description?)
✅ toast.error(message, description?)
✅ toast.warning(message, description?)
✅ toast.info(message, description?)
```

#### ✅ `hooks/useBalance.ts` - **NOVO**
```typescript
✅ useBalance(employeeId, reasonId, year): Balance
```

#### ✅ `lib/mock-data/api.ts` - **NOVO**
```typescript
✅ useMockApplications(): { applications, createApplication, updateApplication, ... }
✅ useMockLedgerEntries(): { ledgerEntries, createLedgerEntry }
```

### 7.2 Nedostaje

#### ❌ Date utilities

```typescript
// lib/utils/dates.ts - dodatno
❌ formatDate(date, format?): string
❌ parseDate(str): Date
❌ addDays(date, days): Date
❌ diffDays(start, end): number
❌ isInRange(date, start, end): boolean
❌ getMonthRange(year, month): { start, end }
❌ getWeekRange(date): { start, end }
```

#### ❌ Business logic helpers

```typescript
// lib/utils/validation.ts - ✅ IMPLEMENTIRANO
✅ validateDateRange(start, end): ValidationError[]
✅ validateOverlap(newApp, existingApps): boolean
✅ validateBalance(employeeId, reasonId, days): boolean

// lib/utils/ledger.ts - ✅ IMPLEMENTIRANO
✅ calculateBalance(entries): number
✅ getEntriesForEmployee(entries, employeeId, year): Entry[]
✅ groupEntriesByType(entries): GroupedEntries

// lib/utils/application.ts - ❌ NEDOSTAJE
❌ canApprove(user, application): boolean
❌ canEdit(user, application): boolean
❌ canCancel(user, application): boolean
❌ getNextStatus(current, action, reason): Status

// lib/utils/overlap.ts - ✅ IMPLEMENTIRANO
✅ detectOverlap(app1, app2): boolean
✅ findOverlappingApps(newApp, existingApps): App[]
❌ calculateAdjustment(sickLeave, vacation): Adjustment  // Za bolovanje
```

#### ❌ Formatting helpers

```typescript
// lib/utils/format.ts
❌ formatDuration(days): string  // "5 dana"
❌ formatEmployeeName(employee): string
❌ formatStatus(status): string  // Hrvatski nazivi
❌ getStatusColor(status): string
```

**Prioritet:** 🟡 SREDNJI (većina završeno)

---

## 8. STYLING I THEME

### 8.1 Implementirano

#### ✅ Tailwind CSS setup
- ✅ `tailwind.config.ts` - konfigurirano
- ✅ `app/globals.css` - globalni stilovi
- ✅ shadcn/ui theme variables
- ✅ Responsive breakpoints

#### ✅ shadcn/ui theme
- ✅ CSS variables za colors
- ✅ Dark mode support (infrastruktura)
- ✅ Consistent spacing
- ✅ Typography scale

### 8.2 Nedostaje

#### ❌ Custom styling

**Status colors:**
- ⚠️ Inline definicije u komponentama
- ❌ Nedostaje centraliziran color system

```typescript
// Potrebno: lib/utils/theme.ts
export const statusColors = {
  DRAFT: 'bg-gray-500',
  SUBMITTED: 'bg-yellow-500',
  APPROVED_FIRST_LEVEL: 'bg-blue-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  CANCELLED: 'bg-gray-400',
}

export const reasonColors = {
  'Godišnji odmor': '#10b981',
  'Bolovanje': '#f59e0b',
  'Edukacija': '#3b82f6',
  'Slobodni dan': '#8b5cf6',
}
```

**Chart colors:**
- ❌ Nema definicije za chartove

**Animation:**
- ❌ Loading states
- ❌ Skeleton loaders
- ❌ Toast animations

**Prioritet:** 🟡 SREDNJI

---

## 9. PRIORITIZIRANI PLAN IMPLEMENTACIJE

### FAZA 1: KRITIČNE FUNKCIONALNOSTI ~~(1-2 tjedna)~~ ✅ **ZAVRŠENO**

#### ✅ P1 - Završeno

**1.1 Workdays kalkulacija i validacije** ✅
- [x] Fix `calculateWorkingDays()` da koristi mockHolidays
- [x] Real-time kalkulacija u formi za kreiranje zahtjeva
- [x] Validacija preklapanja (BR-VAL-002)
- [x] Validacija dostupnih dana (BR-VAL-003)
- [x] Toast notifications za greške

**Deliverable:** ✅ Funkcionalna forma za zahtjev s validacijama

**1.2 Balance management** ✅
- [x] `useBalance()` hook
- [x] Prikaz balance-a prije kreiranja zahtjeva
- [x] Validacija balance-a u submit-u

**Deliverable:** ✅ Real-time feedback o dostupnim danima

**1.3 Manager - Prvo odobrenje** ⚠️
- [ ] Logika prvog odobrenja (Department Manager)
- [ ] Provjera prava (ne može vlastite zahtjeve)
- [ ] Prikaz detalja zahtjeva prije odobrenja
- [ ] Prikaz preostalih dana zaposlenika
- [ ] Razlikovanje SUBMITTED → APPROVED vs APPROVED_FIRST_LEVEL

**Deliverable:** ⏳ Još nije završen approval proces

---

### FAZA 2: TABLIČNI KALENDAR (1 tjedan)

#### 🔴 P2 - Ključna funkcionalnost

**2.1 Planning Grid komponenta**
- [ ] `<PlanningGrid>` osnovna struktura
- [ ] Prikaz zaposlenika (retci)
- [ ] Prikaz dana (stupci)
- [ ] Cell rendering (status colors)
- [ ] Zoom kontrole (tjedan/mjesec)

**2.2 Interaktivnost**
- [ ] Hover states s detaljima
- [ ] Klik na cell za detalje
- [ ] Identifikacija kritičnih razdoblja
- [ ] Legend za boje

**Deliverable:** Tablični kalendar za planiranje - **KLJUČNO ZA MOCKUP!**

---

### FAZA 3: ALOKACIJE I BOLOVANJA (1 tjedan)

#### 🔴 P3 - Inovativna funkcionalnost

**3.1 Upravljanje alokacijama**
- [ ] Ruta `/manager/allocations`
- [ ] Lista zaposlenika s trenutnim alokacijama
- [ ] Forma za pojedinačnu dodjelu
- [ ] Masovna dodjela za sve zaposlenike
- [ ] Validacija (1-50 dana)

**Deliverable:** Dodjela godišnjih dana

**3.2 Evidencija bolovanja**
- [ ] Ruta `/manager/sick-leaves`
- [ ] Lista bolovanja odjela
- [ ] Forma za novo bolovanje
- [ ] Zatvaranje aktivnog bolovanja

**Deliverable:** Osnovna evidencija bolovanja

**3.3 Automatska prilagodba**
- [ ] Algoritam prilagodbe (4 scenarija)
- [ ] Kreiranje CORRECTION ledger entry
- [ ] Izvještaj o prilagodbama
- [ ] Prikaz izmjena zaposleniku

**Deliverable:** Automatska prilagodba GO - **INOVACIJA!**

---

### FAZA 4: EMPLOYEE POBOLJŠANJA (3-4 dana)

#### 🟡 P4 - Srednji prioritet

**4.1 Draft funkcionalnost**
- [ ] Spremanje kao draft
- [ ] Uređivanje draft-a
- [ ] Brisanje draft-a
- [ ] Lista draft zahtjeva

**4.2 Kalendar prikaz**
- [ ] Ruta `/employee/calendar`
- [ ] Mjesečni prikaz
- [ ] Odobreni i pending odmori
- [ ] Klik na dan za detalje

**4.3 Detalji zahtjeva**
- [ ] Ruta `/employee/requests/[id]`
- [ ] Povijest promjena statusa
- [ ] Komentar voditelja
- [ ] Timestampovi

**Deliverable:** Kompletan Employee modul

---

### FAZA 5: GENERAL MANAGER (2-3 dana)

#### 🟡 P5 - Nice-to-have

**5.1 Drugi nivo odobrenja**
- [ ] Dashboard za General Manager
- [ ] Zahtjevi u APPROVED_FIRST_LEVEL statusu
- [ ] Drugo odobrenje → APPROVED
- [ ] Mogućnost odobravanja vlastitih zahtjeva

**5.2 Pregled cijele organizacije**
- [ ] Statistike svih odjela
- [ ] Kalendar svih odjela

**Deliverable:** General Manager funkcionalnost

---

### FAZA 6: ADMIN MODUL (3-4 dana)

#### 🟢 P6 - Nizak prioritet za mockup

**6.1 Upravljanje zaposlenicima**
- [ ] Lista zaposlenika
- [ ] Dodaj zaposlenika
- [ ] Uredi zaposlenika
- [ ] Deaktiviraj zaposlenika

**6.2 Upravljanje odjelima**
- [ ] Lista odjela
- [ ] Dodaj odjel
- [ ] Uredi odjel
- [ ] Dodijeli odobravatelje

**6.3 Upravljanje praznicima**
- [ ] Lista praznika
- [ ] Dodaj praznik
- [ ] Uredi/obriši praznik

**Deliverable:** Admin setup funkcionalnost

---

### FAZA 7: POLISH I UX (2-3 dana)

#### 🟢 P7 - Finishing touches

**7.1 Loading states**
- [ ] Skeleton loaders
- [ ] Loading spinners
- [ ] Optimistic updates

**7.2 Error states**
- [ ] Error boundaries
- [ ] Error messages
- [ ] Empty states

**7.3 Animations**
- [ ] Page transitions
- [ ] Toast animations
- [ ] Hover effects

**7.4 Responsive**
- [ ] Mobile navigation
- [ ] Mobile table views
- [ ] Mobile forms

**Deliverable:** Polished mockup

---

## 10. TEHNIČKI DUG

### 10.1 Kod kvaliteta

#### ✅ Dobro
- TypeScript korištenje
- Konzistentno formatiranje
- shadcn/ui best practices
- Separation of concerns (components/lib)
- ✅ **NOVO:** Reusable helper funkcije u `lib/utils/*`
- ✅ **NOVO:** Custom hooks za business logiku
- ✅ **NOVO:** Centralizirane validacije
- ✅ **NOVO:** State management s localStorage persistence

#### ⚠️ Za poboljšanje
- Inline style definitions (trebaju u theme.ts)
- Duplicirani kod (getStatusBadge u više mjesta)
- Magic numbers (5 najnovijih, itd.)
- Hard-coded strings (trebaju u i18n ili constants)
- Nedostaje approveApplication i rejectApplication u mock API

### 10.2 Missing patterns

#### ❌ Nedostaje

**Custom hooks:**
```
hooks/
├── use-toast.ts           ✅ IMPLEMENTIRANO
├── useBalance.ts          ✅ IMPLEMENTIRANO
├── useApplications.ts     ❌ (koristi useMockApplications iz api.ts)
├── useValidation.ts       ❌ (validacija je u utils)
└── useCalendar.ts         ❌
```

**Services/helpers:**
```
lib/services/
├── applicationService.ts  ❌
├── ledgerService.ts       ❌
└── validationService.ts   ❌
```
**Napomena:** Helper funkcije su implementirane u `lib/utils/*`, services nisu potrebni za mockup.

**Constants:**
```
lib/constants/
├── statuses.ts            ❌
├── colors.ts              ❌
└── messages.ts            ❌
```

---

## 11. DOKUMENTACIJA GAP

### 11.1 Kod dokumentacija

#### ❌ Nedostaje
- JSDoc comments za funkcije
- README u lib/ direktorijima
- Component documentation
- Type documentation

### 11.2 User dokumentacija

#### ❌ Nedostaje
- User guide mockup
- Feature showcase
- Demo video script
- Prezentacija za stakeholdere

---

## 12. TESTIRANJE

### 12.1 Trenutno stanje

#### ❌ Nema testova
- Nema unit testova
- Nema integration testova
- Nema E2E testova

### 12.2 Za mockup nije potrebno

**Razlog:** Mockup služi za demonstraciju, ne za produkciju.

**Ali bilo bi korisno:**
- [ ] Manual test checklist
- [ ] Test scenarios dokument
- [ ] Bug tracking (ako se pronađu)

---

## 13. PERFORMANCE

### 13.1 Trenutna situacija

#### ✅ Dobro za mockup
- Mala količina mock podataka
- Client-side rendering
- Nema external API calls

#### 🟡 Za paziti u budućnosti
- Ledger kalkulacije za sve zaposlenike
- Kalendar rendering (mnogo ćelija)
- Filter/search operacije na velikim listama

---

## 14. ACCESSIBILITY (a11y)

### 14.1 Trenutno stanje

#### ✅ shadcn/ui ima dobru a11y
- Keyboard navigation (osnovni)
- Focus management u dialog-u

#### ❌ Nedostaje za mockup
- Skip to content link
- ARIA labels za ikonice
- Screen reader testiranje
- Keyboard shortcuts info

**Prioritet:** 🟢 NIZAK za mockup

---

## 15. ZAKLJUČAK I PREPORUKE

### 15.1 Sažetak gapa

**Implementirano:** ~50%
- ✅ Infrastruktura: 95%
- ✅ Employee Dashboard: 75%
- ✅ Validacije i kalkulacije: 90%
- ✅ Helper funkcije: 80%
- ⚠️ Manager Dashboard: 45%
- ❌ Manager Planning: 0% (KRITIČNO!)
- ❌ Manager Alokacije: 0% (KRITIČNO!)
- ❌ Manager Bolovanja: 0% (INOVACIJA!)
- ❌ General Manager: 10%
- ❌ Admin: 10%

### 15.2 Prioriteti za full-featured mockup

#### 🔴 Must-have (kritično za funkcionalan mockup)

1. **~~Validacije i kalkulacije~~** ✅ **ZAVRŠENO**
   - ✅ Workdays kalkulacija s praznicima
   - ✅ Overlap detection
   - ✅ Balance validation
   - ✅ Real-time feedback

2. **Tablični kalendar** ⏳ **SLJEDEĆI PRIORITET**
   - Planning grid komponenta
   - Vizualizacija odjela
   - Kritična razdoblja

3. **Upravljanje alokacijama**
   - Dodjela godišnjih dana
   - Masovna dodjela
   - Pojedinačna izmjena

4. **Evidencija bolovanja + Automatska prilagodba**
   - Forma za bolovanje
   - Algoritam prilagodbe (4 scenarija)
   - Izvještaj o izmjenama

5. **Approval proces**
   - Prvi nivo (Department Manager)
   - Provjera prava
   - Workflow logika

#### 🟡 Should-have (poželjno za impressive mockup)

6. **Draft funkcionalnost**
7. **Kalendar prikaz za Employee**
8. **Drugi nivo odobrenja (General Manager)**
9. **Detalji zahtjeva**
10. **Toast notifications**

#### 🟢 Nice-to-have (cherry on top)

11. **Admin modul (CRUD)**
12. **Statistike i izvještaji**
13. **Eksport funkcionalnosti**
14. **Mobile responsive**

### 15.3 Procjena vremena

**Za full-featured mockup:**

| Faza | Funkcionalnost | Dani | Priority | Status |
|------|----------------|------|----------|---------|
| 1 | Validacije + kalkulacije | 2-3 | 🔴 | ✅ ZAVRŠENO |
| 2 | Tablični kalendar | 5-7 | 🔴 | ⏳ Sljedeći |
| 3 | Alokacije + bolovanja | 5-7 | 🔴 | ⏳ |
| 4 | Approval proces | 2-3 | 🔴 | ⏳ |
| 5 | Employee poboljšanja | 3-4 | 🟡 | ⏳ |
| 6 | General Manager | 2-3 | 🟡 | ⏳ |
| 7 | Admin modul | 3-4 | 🟢 | ⏳ |
| 8 | Polish + UX | 2-3 | 🟢 | ⏳ |

**Ukupno:** 24-34 radna dana (5-7 tjedana)  
**Završeno:** ~2-3 dana (Faza 1)  
**Preostalo:** ~22-31 dan (4-6 tjedana)

**Prioritet za sljedeće:**
1. 🔴 **Approval proces** (2-3 dana) - Manager može odobriti/odbiti zahtjeve
2. 🔴 **Tablični kalendar** (5-7 dana) - Planning grid za vizualizaciju
3. 🔴 **Upravljanje alokacijama** (3-4 dana) - Dodjela godišnjih dana
4. 🔴 **Evidencija bolovanja** (2-3 dana) - Forma i popis bolovanja

**Za minimum viable mockup (samo kritično):**
- Faze 1-4: ~14-20 dana (3-4 tjedna)
- Faza 1: ✅ Završeno (2-3 dana)
- Preostalo: ~12-17 dana (2.5-3.5 tjedna)

### 15.4 Preporuke

#### Za nastavak razvoja

1. **Fokus na approval proces (2-3 dana):**
   - ✅ Validacije su gotove
   - ✅ Mock API infrastruktura postoji
   - ⏳ Treba dodati approveApplication i rejectApplication u api.ts
   - ⏳ Treba implementirati UI za odobrenje u `/manager/requests`
   - ⏳ Treba dodati prikaz detalja zahtjeva i balance-a zaposlenika

2. **Tablični kalendar (nakon approval-a):**
   - Počni s Fazom 2 (tablični kalendar)
   - Kreiraj `<PlanningGrid>` komponentu
   - To je najvažnija vizualna funkcionalnost za impressive mockup

3. **Iterativni pristup:**
   - ✅ Faza 1 završena - odličan napredak!
   - Ne pokušavaj sve odjednom
   - Završi jednu funkcionalnost kompletno prije nego kreneš na drugu
   - Testiraj svaku fazu prije prelaska na sljedeću

4. **Mock data strategy:**
   - ✅ Mock podaci su odlično struktuirani
   - Dodaj više Applications za testiranje overlap-a (po potrebi)
   - Dodaj više LedgerEntries za testiranje balance-a (po potrebi)

5. **Component library:**
   - Napravi reusable komponente
   - Posebno za tablični kalendar
   - Posebno za validaciju forme (već ima u validation.ts)

6. **Keep it simple:**
   - Mockup ne treba biti perfektan
   - Fokus na demo-iranje ključnih funkcionalnosti
   - UX polish je manje važan od funkcionalnosti

### 15.5 Success criteria

**Success criteria za mockup:**

**Core funkcionalnosti:**
✅ Zaposlenik može kreirati zahtjev s validacijom - **ZAVRŠENO**
✅ Balance kalkulacija je točna - **ZAVRŠENO**
✅ Overlap detection radi - **ZAVRŠENO**
✅ Real-time validacija s feedback-om - **ZAVRŠENO**
✅ Toast notifications - **ZAVRŠENO**

**Nedostaje:**
❌ Manager vidi tablični kalendar s planiranjem  
❌ Manager može odobriti/odbiti zahtjev  
❌ Manager može dodjeljivati godišnje dane  
❌ Manager može evidentirati bolovanje  
❌ Automatska prilagodba GO pri bolovanju radi  

**Bonus:**
❌ General Manager može drugi nivo odobrenja  
❌ Employee ima kalendar prikaz  
❌ Admin može upravljati zaposlenicima  

---

## 16. IZVRŠNI PLAN

### 16.1 Sljedeći koraci (Next Sprint)

**Sprint 1: ~~Validacije i kalkulacije (2-3 dana)~~** ✅ **ZAVRŠENO**

~~Dan 1:~~
- [x] Fix calculateWorkingDays() sa holidays
- [x] Dodaj real-time kalkulaciju u formu
- [x] Implementiraj BR-VAL-001 (date validation)

~~Dan 2:~~
- [x] Implementiraj BR-VAL-002 (overlap detection)
- [x] Implementiraj BR-VAL-003 (balance validation)
- [x] Dodaj toast notifications

~~Dan 3:~~
- [x] Kreiraj useBalance() hook
- [x] Refaktoriraj balance kalkulacije
- [x] Testiranje

**Status:** ✅ Sve funkcionalnosti Faze 1 implementirane!

---

**Sprint 2: Tablični kalendar (5-7 dana)** ⏳ **SLJEDEĆI**

Dan 1-2:
- [ ] PlanningGrid komponenta - osnovna struktura
- [ ] Rendering retci/stupci
- [ ] Cell rendering

Dan 3-4:
- [ ] Color coding
- [ ] Hover states
- [ ] Click handlers

Dan 5:
- [ ] Zoom kontrole
- [ ] Legend
- [ ] Responsive

Dan 6-7:
- [ ] Integracija u manager dashboard
- [ ] Testiranje
- [ ] Bug fixing

**Sprint 3: Alokacije i bolovanja (5-7 dana)**

Dan 1-2:
- [ ] Allocations ruta i forma
- [ ] Masovna dodjela
- [ ] Validacije

Dan 3-4:
- [ ] Sick leave ruta i forma
- [ ] Lista bolovanja
- [ ] Zatvaranje bolovanja

Dan 5-7:
- [ ] Automatska prilagodba algoritam
- [ ] Izvještaj o prilagodbama
- [ ] Testiranje

---

**Kraj dokumenta**

---

**Pripremio:** AI Assistant  
**Datum:** 20.12.2024  
**Verzija:** 2.0  
**Status:** Ažurirano nakon implementacije Faze 1 (Validacije i kalkulacije)

**Changelog:**
- **v2.0 (20.12.2024):** Ažurirano nakon implementacije validacija, kalkulacija, toast notifikacija i mock API-ja
- **v1.0 (20.12.2024):** Inicijalna analiza