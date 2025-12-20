# Gap Analysis - Luna App Mockup
## Analiza implementacije naspram specifikacije i User Stories

**Datum:** 20.12.2024  
**Verzija:** 4.2  
**Status:** **🎉 Sprint 3 VEĆINA ZAVRŠENA!** - Approval proces implementiran + Pronađene greške  
**Zadnje ažuriranje:** 20.12.2024 - Approval proces (prvi nivo) implementiran - VEĆINA GOTOVA!
**User Stories:** 76 User Stories analizirano (25% implementirano ✅, 15% djelomično **s greškama**, 60% nije implementirano)

**🎉 ODLIČNE VIJESTI:** Approval proces (prvi nivo) je implementiran! Manager može odobravati i odbijati zahtjeve!

**⚠️ VAŽNO:** Još uvijek postoje greške u validacijama (Sprint 0) i nedostaje DaySchedule preklapanja (Sprint 3.1).

---

## 🎯 NAJNOVIJE PROMJENE

### ✅ **Sprint 3 - DJELOMIČNO ZAVRŠEN (Approval proces - Prvi nivo)** 🎉

**Implementirane nove funkcionalnosti:**

1. **Approval Actions Hook (`lib/mock-data/api.ts`)** - **KLJUČNO!**
   - ✅ `useApprovalActions()` hook - centralizirana logika za approval/rejection
   - ✅ `approveApplication()` - odobri zahtjev s permissions check
   - ✅ `rejectApplication()` - odbij zahtjev s obaveznim komentarom
   - ✅ Integracija s `canApprove()` i `canReject()` permissions funkcijama
   - ✅ Automatsko kreiranje USAGE ledger entry pri odobrenju
   - ✅ Automatsko kreiranje DaySchedule zapisa pri konačnom odobrenju (APPROVED)
   - ✅ Razlikovanje APPROVED vs APPROVED_FIRST_LEVEL statusa
   - ✅ Podrška za needSecondApproval flag

2. **Application Permissions (`lib/utils/application.ts`)** - **NOVO!**
   - ✅ `canApprove()` - provjera prava odobrenja
     - Department Manager: samo SUBMITTED status, isti odjel, ne vlastite zahtjeve
     - General Manager: samo APPROVED_FIRST_LEVEL status
   - ✅ `canReject()` - provjera prava odbijanja
     - Department Manager: samo SUBMITTED status
     - General Manager: SUBMITTED ili APPROVED_FIRST_LEVEL status
   - ✅ `getNextStatus()` - određivanje sljedećeg statusa
     - Ako needSecondApproval=true → APPROVED_FIRST_LEVEL
     - Ako needSecondApproval=false → APPROVED
   - ✅ `shouldCreateLedgerEntry()` - odluka o ledger entry kreiranju
     - Samo za APPROVED status s hasPlanning=true

3. **DaySchedule Management (`lib/mock-data/api.ts`)** - **NOVO!**
   - ✅ `useMockDaySchedules()` hook - state management za DaySchedule
   - ✅ `createDaySchedule()` - kreiranje pojedinačnog DaySchedule zapisa
   - ✅ `createDaySchedulesForApplication()` - kreiranje DaySchedule za cijelo razdoblje
   - ✅ `deleteDaySchedulesForApplication()` - brisanje DaySchedule za zahtjev
   - ✅ `findOverlappingDaySchedules()` - pronalaženje preklapanja s DaySchedule-om
   - ✅ localStorage persistence za DaySchedule

4. **Manager Requests UI (`app/manager/requests/page.tsx`)** - **POTPUNO REFAKTORIRANO!**
   - ✅ Koristi nove `useApprovalActions` hook
   - ✅ Dialog za odobrenje s prikazom:
     - Detalji zaposlenika
     - Razdoblje i broj dana
     - Balance zaposlenika (preostali dani)
     - Preklapanja s drugim zahtjevima
     - Preklapanja s DaySchedule-om (odobreni zahtjevi)
     - Upozorenje o drugom nivou odobrenja (ako je potrebno)
   - ✅ Dialog za odbijanje s obaveznim komentarom
   - ✅ Toast notifications za uspjeh/grešku
   - ✅ Real-time prikaz statusa (SUBMITTED, APPROVED_FIRST_LEVEL)

5. **Employee Requests UI (`app/employee/requests/page.tsx`)**
   - ✅ Prikaz razloga odbijanja (rejectionComment) za REJECTED zahtjeve
   - ✅ Italic formatiranje razloga odbijanja

6. **Types (`lib/types/index.ts`)**
   - ✅ Dodano polje `managerComment?: string` u Application interface
   - ✅ Dodano polje `rejectionComment?: string` u Application interface

**Napredak:**
- Postotak implementacije: 65% → **75%** 🎉
- Manager modul - Approval: 20% → **85%** ✅
- Workflow logic: Parcijalno → **70%** ✅
- DaySchedule management: 0% → **60%** ✅

**Status:** ✅ **DJELOMIČNO ZAVRŠENO** - Prva razina odobrenja je implementirana!

**Još nedostaje (za potpun Sprint 3):**
- ❌ Provjera preklapanja s DaySchedule-om **PRIJE** odobrenja (upozorenje)
- ❌ Korekcija vraćanja dana pri odobrenju (CORRECTION ledger entry)
- ❌ Prikaz DaySchedule preklapanja u approval dialogu
- ❌ Validacija: Ne mogu se odobravati zahtjevi s nedovoljno dana

**Preostalo kritično za Sprint 3:**
- ⏳ **Sprint 3.1:** Provjera DaySchedule preklapanja i upozorenje (1 dan)
- ⏳ **Sprint 3.2:** Validacija dostupnih dana prije odobrenja (0.5 dana)

---

### ⚠️ PRONAĐENE GREŠKE U IMPLEMENTACIJI - **TREBA ISPRAVITI**

**Faza 0: Ispravljanje trenutne implementacije (1 dan)** 🔴 **KRITIČNO - prije nego nastavimo dalje!**

1. **BR-VAL-001: Validacija datuma - Parcijalno krivo implementirano**
   - **Lokacija:** `lib/utils/validation.ts` (linija 26-31)
   - **Problem:** Trenutno validacija **ne dopušta datum početka u prošlosti** za SVE zahtjeve
   - **Ispravak:** Treba razlikovati:
     - **Regularni zahtjevi** (godišnji odmor, slobodni dani): datum početka NE smije biti u prošlosti ✅ (trenutno OK)
     - **Bolovanje**: datum početka **SMIJE biti u prošlosti** (evidencija naknadnih događaja) ❌ (treba ispraviti)
   - **Rješenje:** Dodati parametar `unavailabilityReasonType` u `validateDateRange()` i prilagoditi logiku
   - **Povezano:** US-VAL-004 (regularni), US-VAL-005 (bolovanje)
   - **Prioritet:** 🔴 KRITIČNO - blokira evidenciju bolovanja

2. **BR-VAL-002: Validacija preklapanja - Djelomično krivo**
   - **Lokacija:** `lib/utils/overlap.ts` + `validation.ts`
   - **Problem:** Trenutno se **ne provjerava preklapanje s DaySchedule-om** (stvarni plan)
   - **Dokument kaže:** Treba provjeriti i aktivne zahtjeve (SUBMITTED, APPROVED_FIRST_LEVEL) **I** DaySchedule (APPROVED zahtjevi)
   - **Trenutno:** Provjerava samo aktivne zahtjeve (Application), ne provjerava DaySchedule
   - **Rješenje:** Dodati `validateDayScheduleOverlap()` funkciju
   - **Povezano:** US-VAL-001, US-VAL-007
   - **Prioritet:** 🔴 KRITIČNO - nedostaje validacija s odobrenim zahtjevima

3. **BR-VAL-003: Validacija dostupnih dana - Nedostaje filtriranje po tipu**
   - **Lokacija:** `lib/utils/ledger.ts`, `hooks/useBalance.ts`
   - **Problem:** Implementacija je OK, ali treba provjeriti da se **uvijek filtrira po `unavailabilityReasonId`**
   - **Dokument kaže:** "Stanje se računa PO unavailabilityReason-u (svaki tip odvojeno)"
   - **Provjera:** Pregledati sve pozive `calculateBalance()` i osigurati da se uvijek prosleđuje `reasonId`
   - **Prioritet:** 🟡 SREDNJI - provjera konzistentnosti

4. **Nedostaje validacija statusa za uređivanje (US-VAL-006)**
   - **Problem:** UI ne sprječava uređivanje zahtjeva u statusima koji se ne mogu uređivati
   - **Treba:** Samo DRAFT zahtjevi mogu se uređivati, ostali ne
   - **Prioritet:** 🟡 SREDNJI - UX poboljšanje

**Plan ispravljanja (Dan 0 - prije Sprint 3):**
1. ✅ Ispravi `validateDateRange()` da prima `unavailabilityReasonType` i dopusti prošlost za bolovanje (1-2h)
2. ✅ Dodaj `validateDayScheduleOverlap()` za provjeru preklapanja s odobrenim zahtjevima (2-3h)
3. ✅ Pregledaj sve pozive `calculateBalance()` i osiguraj filtriranje po reasonId (1h)
4. ✅ Dodaj UI validaciju statusa za uređivanje (1h)
5. ✅ Testiraj sve scenarije (1-2h)

**Procjena:** 6-9 sati (1 radni dan)

---

### ✅ Faza 2 - ZAVRŠENA (Tablični kalendar za planiranje)

**Implementirane nove funkcionalnosti:**

1. **Planning Grid komponenta - KLJUČNA FUNKCIONALNOST!**
   - `components/planning/planning-grid.tsx` - glavna tablična komponenta
   - `components/planning/calendar-controls.tsx` - kontrole za navigaciju
   - `components/planning/calendar-legend.tsx` - legenda s objašnjenjima
   - **Puni tjedni/mjesečni prikaz s navigacijom**
   - **Interaktivne ćelije s hover states**
   - **Klik na ćeliju za detalje**
   - **Color coding za sve statuse**
   - **Tooltip s informacijama**
   - **Dialog za prikaz detalja**

2. **Planning utilities (lib/utils/planning.ts)**
   - ✅ `getCellStatus()` - određivanje statusa za svaki dan/zaposlenik
   - ✅ `getCellTooltip()` - tooltip tekst s informacijama
   - ✅ `findCriticalPeriods()` - identifikacija kritičnih razdoblja (3+ odsutnih)
   - ✅ `markCriticalCells()` - označavanje kritičnih ćelija
   - ✅ Podrška za vikende, praznike, odobrene i pending zahtjeve

3. **Color system (lib/utils/colors.ts)**
   - ✅ `CellStatus` enum (AVAILABLE, APPROVED, PENDING, SICK_LEAVE, CRITICAL)
   - ✅ `getCellColor()` - boje za svaki status
   - ✅ `getCellHoverColor()` - hover boje
   - ✅ `getCellTextColor()` - text boje
   - ✅ `getCellBorderColor()` - border boje
   - **Konzistentan color system kroz cijelu aplikaciju**

4. **Calendar utilities (lib/utils/calendar.ts)**
   - ✅ `getDateRange()` - generiranje datuma za prikaz
   - ✅ `getWeekRange()`, `getMonthRange()` - range funkcije
   - ✅ `getStartOfWeek()`, `getEndOfWeek()` - week boundaries
   - ✅ `getStartOfMonth()`, `getEndOfMonth()` - month boundaries
   - ✅ `formatDateHeader()`, `formatMonthHeader()` - formatiranje headera
   - ✅ `isDateInRange()` - provjera je li datum u rangu

5. **Application permissions (lib/utils/application.ts)**
   - ✅ `canApprove()` - provjera prava odobrenja
   - ✅ `canReject()` - provjera prava odbijanja
   - ✅ `getNextStatus()` - određivanje sljedećeg statusa
   - ✅ `shouldCreateLedgerEntry()` - odluka o ledger entry kreiranju
   - **Potpuna implementacija business pravila za approval**

6. **Ažurirane date utilities (lib/utils/dates.ts)**
   - ✅ `addDays()` - dodavanje dana
   - ✅ `getDaysBetween()` - razlika između datuma
   - ✅ `generateDateRange()` - generiranje niza datuma
   - ✅ `isDateInRange()` - provjera ranga
   - ✅ Korištenje date-fns biblioteke za bolji i18n

7. **Nove UI komponente**
   - ✅ `components/ui/tooltip.tsx` - Tooltip komponenta
   - ✅ `components/ui/separator.tsx` - Separator komponenta

8. **Nova ruta: `/manager/planning`**
   - ✅ Tablični kalendar s popisom zaposlenika
   - ✅ Zoom kontrole (tjedan/mjesec)
   - ✅ Navigacija (prethodni/sljedeći/danas)
   - ✅ Legenda sa svim statusima
   - ✅ Vizualizacija kritičnih razdoblja
   - ✅ Filtriranje po odjelu managera

**Napredak:**
- Postotak implementacije: 50% → **65%**
- Manager modul: 45% → **70%**
- Planning funkcionalnost: 0% → **90%** ✅
- UI komponente: 60% → **80%** ✅
- Helper funkcije: 80% → **95%** ✅

---

### ✅ Faza 1 - ZAVRŠENA (Validacije i kalkulacije)

**Implementirane funkcionalnosti:**

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

**Sljedeći koraci:**
- 🔴 PRIORITET: Approval proces - Manager odobrava/odbija zahtjeve (Faza 1.3)
- 🔴 PRIORITET: Upravljanje alokacijama (Faza 3)
- 🔴 PRIORITET: Evidencija bolovanja + automatska prilagodba (Faza 3)

### 📁 Nove datoteke u projektu

**Rute:**
```
app/manager/
└── planning/
    └── page.tsx           ← Tablični kalendar za planiranje - NOVO!
```

**Planning komponente:**
```
components/planning/
├── planning-grid.tsx      ← Glavna tablična grid komponenta - NOVO!
├── calendar-controls.tsx  ← Navigacija i zoom kontrole - NOVO!
└── calendar-legend.tsx    ← Legenda s objašnjenjima - NOVO!
```

**UI komponente:**
```
components/ui/
├── toast.tsx          ← Toast notification komponenta
├── toaster.tsx        ← Toast provider i renderer
├── tooltip.tsx        ← Tooltip komponenta - NOVO!
└── separator.tsx      ← Separator komponenta - NOVO!
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
├── toast.ts           ← Toast helper wrapper
├── planning.ts        ← Planning grid helperi - NOVO!
├── calendar.ts        ← Calendar utilities i date ranges - NOVO!
├── colors.ts          ← Color system za sve statuse - NOVO!
├── application.ts     ← Application permissions i workflow - NOVO!
└── dates.ts           ← Date utilities (ažurirano s novim funkcijama)
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
Ovaj dokument analizira trenutnu implementaciju full-featured mockup aplikacije Luna u odnosu na detaljnu tehničku specifikaciju i **76 User Stories** iz dokumenta `user_stories.md`. Identifikuje implementirane funkcionalnosti, nedostajuće komponente i prioritete za završetak mockupa.

### Trenutni status
- ✅ **Arhitektura:** Next.js 14+ sa TypeScript - potpuno implementirano
- ✅ **UI Framework:** shadcn/ui + Tailwind CSS - potpuno implementirano
- ✅ **Data Layer:** Mock podaci (generator.ts) + Mock API (api.ts) - potpuno implementirano
- ✅ **Business Logic:** Validacije i kalkulacije - potpuno implementirano
- ✅ **State Management:** Mock API s localStorage - implementirano
- ⚠️ **Workflow Logic:** Parcijalno implementirano (nedostaje approval i korekcija)
- ❌ **Database:** Prisma schema definirano, ali ne koristi se u mockupu

### Postotak implementacije
- **Ukupno:** ~65% funkcionalnosti prema specifikaciji
- **User Stories:** 20% potpuno, 13% djelomično, 67% nije implementirano
- **Employee Dashboard:** 75% implementirano (US-EMP-001, 004, 006, 007 ✅)
- **Manager Dashboard:** 70% implementirano (US-DM-001, 002 ✅)
- **Manager Planning:** 90% implementirano (US-DM-002 ✅)
- **Manager Approval:** 20% implementirano (logika postoji, UI nedostaje)
- **Manager Alokacije:** 0% implementirano (US-MGR-001-004 ❌)
- **Manager Bolovanja:** 0% implementirano (US-MGR-005-011 ❌)
- **General Manager Dashboard:** 20% implementirano (US-GM-001-006 ❌)
- **Admin Dashboard:** 10% implementirano (US-ADM-001-013 ❌)

### Ključni gap-ovi
**🔴 KRITIČNO za funkcionalan mockup:**
1. **Approval proces** - Prvi nivo odobrenja (US-DM-004, US-DM-005)
2. **Korekcija vraćanja dana** - INOVACIJA! (US-EMP-012B, US-VAL-007, US-MGR-008, BR-AUTO-001)
3. **Upravljanje alokacijama** - Dodjela godišnjih dana (US-MGR-001, 002, 003, 004)
4. **Evidencija bolovanja** - Forma i popis (US-MGR-005, 006, 007)
5. **DaySchedule management** - Kreiranje i ažuriranje (BR-AUTO-002)

**🟡 Poželjno za impressive mockup:**
- Draft funkcionalnost (US-EMP-008, 010, 011)
- Employee kalendar prikaz (US-EMP-003)
- Drugi nivo odobrenja - General Manager (US-GM-001, 002, 003)
- Detalji zahtjeva (US-EMP-012, US-DM-006)

**🟢 Nice-to-have:**
- Admin modul - CRUD operacije (US-ADM-001-013)
- Masovno odobravanje (US-DM-007)
- Eksport izvještaja (US-DM-008)
- Email notifikacije (US-CMN-007)

### User Stories Mapping - Quick Reference

| Modul | User Stories | Status | Prioritet |
|-------|--------------|--------|-----------|
| **Autentifikacija** | US-AUTH-001, 002 | ❌ | 🟢 NIZAK (mock dovoljan) |
| **Employee - Pregled** | US-EMP-001 ✅, 002 ❌, 003 ❌, 004 ✅ | 50% | 🟡 SREDNJI |
| **Employee - Kreiranje** | US-EMP-005 ⚠️, 006 ✅, 007 ✅, 008-011 ❌, 012 ❌, 012B ⚠️, 013 ❌ | 30% | 🔴 KRITIČNO (012B) |
| **Manager - Pregled** | US-DM-001 ✅, 002 ✅, 003 ⚠️ | 80% | ✅ ZAVRŠENO |
| **Manager - Approval** | US-DM-004 ⚠️, 005 ⚠️, 006 ❌, 007 ❌, 008 ❌ | 20% | 🔴 KRITIČNO |
| **Manager - Alokacije** | US-MGR-001, 002, 003, 004 | 0% | 🔴 KRITIČNO |
| **Manager - Bolovanja** | US-MGR-005, 006, 007, 008, 009, 010, 011 | 0% | 🔴 KRITIČNO (008 INOVACIJA!) |
| **General Manager** | US-GM-001, 002, 003, 004, 005 ⚠️, 006 | 0% | 🟡 SREDNJI |
| **Administrator** | US-ADM-001 do 013 | 0% | 🟢 NIZAK |
| **Zajedničke** | US-CMN-001 ⚠️, 002 ✅, 003 ⚠️, 004-005 ⚠️, 006 ✅, 007 ❌ | 40% | 🟢 NIZAK |
| **Validacije** | US-VAL-000 ⚠️, 001 ⚠️, 002-004 ✅, 005-007 ❌ | 50% | 🔴 KRITIČNO (007) |

**Legenda:**
- ✅ Potpuno implementirano
- ⚠️ Djelomično implementirano
- ❌ Nije implementirano

---

## 0. AUTENTIFIKACIJA I SESSION MANAGEMENT

### 0.1 Trenutno stanje

#### ✅ Implementirano

**Mock autentifikacija (`lib/mock-data/context.tsx`):**
- ✅ MockAuthProvider - context provider
- ✅ useMockAuth hook
- ✅ currentUser state
- ✅ switchRole funkcija (za prebacivanje između mock korisnika)
- ✅ localStorage persistence
- ✅ Dropdown s unaprijed definiranim korisnicima

**Role switching (`components/layout/role-switcher.tsx`):**
- ✅ Dropdown lista svih mock korisnika
- ✅ Prebacivanje uloge klikom
- ✅ Prikaz trenutnog korisnika

#### ❌ Nedostaje

**US-AUTH-001: Prijava u sustav**
- ❌ Email i password input
- ❌ "Prikaži/sakrij lozinku" funkcionalnost
- ❌ Validacija email formata
- ❌ Login forma s error handling-om
- ❌ Stvarna autentifikacija (samo mock)

**US-AUTH-002: Odjava iz sustava**
- ❌ Logout gumb u headeru
- ❌ Brisanje session-a
- ❌ Redirect na login nakon odjave

**Prioritet:** 🟢 NIZAK za mockup (mock auth je dovoljan)

**Napomena:** Za mockup je dovoljan RoleSwitcher, ali za produkciju treba prava autentifikacija.

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
├── planning/                       ✅ NOVO!
│   ├── planning-grid.tsx           ✅ Tablični kalendar
│   ├── calendar-controls.tsx       ✅ Navigacija
│   └── calendar-legend.tsx         ✅ Legenda
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
- ✅ US-EMP-001: Prikaz stanja dana PO tipu nedostupnosti (odvojeno)
  - ✅ Svaki tip nedostupnosti ima vlastitu karticu
  - ✅ Ukupno dana (allocated)
  - ✅ Iskorišteno dana (used)
  - ✅ Na čekanju (pending)
  - ✅ Preostalo (available)
  - ✅ Ikona i boja za svaki tip
- ✅ US-EMP-004: Lista aktivnih zahtjeva
  - ✅ Prikaz svih statusa: DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED, REJECTED
  - ✅ Status badge za svaki zahtjev
  - ✅ Lista nedavnih zahtjeva (5 najnovijih)
- ✅ Quick action button "Kreiraj Novi Zahtjev"
- ✅ Kalkulacija balance-a pomoću ledger-a

**Lista zahtjeva (`/employee/requests/page.tsx`)**
- ✅ US-EMP-004: Prikaz svih zahtjeva zaposlenika
  - ✅ Svi statusi: DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED, REJECTED
- ✅ Filtriranje po statusu
- ✅ Status badges
- ✅ Formatiranje datuma
- ✅ Interakcija s mock API-jem

**Kreiranje zahtjeva (`/employee/requests/new/page.tsx`)**
- ✅ US-EMP-005: Odabir razdoblja (date picker)
- ✅ US-EMP-006: Real-time validacija zahtjeva
  - ✅ Automatska kalkulacija radnih dana
  - ✅ Prikaz preostalih dana
  - ✅ Zeleni/crveni okvir s porukama
  - ✅ Provjera preklapanja s aktivnim zahtjevima
  - ✅ Provjera preklapanja s DaySchedule-om (US-VAL-007)
  - ✅ Upozorenje o korekciji (vraćanje dana) kod preklapanja
  - ✅ Upozorenje o pregazivanju postojećeg plana
- ✅ US-EMP-007: Dodavanje napomene (textarea)
- ✅ Forma za kreiranje zahtjeva
- ✅ Odabir tipa nedostupnosti
- ✅ Odabir datuma (start/end)
- ✅ Textarea za napomenu
- ✅ Validacija forme (frontend)

#### ❌ Nedostaje

**Dashboard:**
- ❌ US-EMP-002: Pregled stanja po godinama
  - ❌ Tablica po godinama za svaki tip nedostupnosti
  - ❌ Klik na info ikonu kod kartice za prikaz tablice
  - ❌ Prikaz negativnih dana crvenom bojom
- ❌ US-EMP-003: Kalendarski prikaz godišnjih odmora
  - ❌ 12 mini kalendara za sve mjesece
  - ❌ Color coding za statuse (zeleno=APPROVED, plavo=APPROVED_FIRST_LEVEL, žuto=SUBMITTED)
  - ❌ Siva boja za vikende
  - ❌ Crvena/narančasta za praznike
  - ❌ Mijenjanje godine pomoću strelica
  - ❌ Auto-pozicioniranje na trenutni mjesec

**Lista zahtjeva:**
- ❌ US-EMP-012: Pregled detalja odobrenog zahtjeva
  - ❌ Detalji pojedinačnog zahtjeva (FR-EMP-010)
  - ❌ Povijest promjena statusa
  - ❌ Komentar voditelja (odobravatelja)
  - ❌ Timestampovi (datum odobrenja, odobravatelj)
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
- ❌ US-EMP-008: Spremanje zahtjeva kao nacrt (DRAFT)
  - ❌ Gumb "Spremi nacrt"
  - ❌ Onemogućen ako zahtjev nije valjan
  - ❌ Nacrt nije vidljiv voditelju
  - ❌ Ne rezervira dane
- ❌ US-EMP-009: Slanje zahtjeva na odobrenje
  - ❌ Gumb "Pošalji zahtjev"
  - ❌ Upozorenje o budućoj korekciji kod preklapanja
  - ❌ Status postaje SUBMITTED (ili APPROVED ako needApproval=false)
- ❌ US-EMP-005: Vizualni pregled odabranog razdoblja u kalendaru
  - ❌ Interaktivni kalendar (TableCalendar stil)
  - ❌ Klikom i povlačenjem za odabir raspona
  - ❌ Crveni vikendi
  - ❌ Narančaste točkice za praznike
  - ❌ Prikaz broja kalendarskih dana
- ❌ Prikaz vikenda i praznika inline
- ❌ US-EMP-010: Uređivanje draft zahtjeva (FR-EMP-006)
  - ❌ Gumb "Uredi" kod DRAFT zahtjeva
  - ❌ Popunjavanje postojećih podataka
  - ❌ Spremanje promjena
- ❌ US-EMP-011: Brisanje draft zahtjeva (FR-EMP-007)
  - ❌ Gumb "Obriši" kod DRAFT zahtjeva
  - ❌ Potvrda prije brisanja
  - ❌ Trajno brisanje iz sustava

**US-EMP-012B: Korekcija vraćanja dana kroz novi zahtjev**
- ⚠️ Djelomično u validaciji, ali ne potpuno implementirano:
  - ✅ Detekcija preklapanja s DaySchedule-om
  - ✅ Provjera hasPlanning flag-a
  - ✅ Upozorenje o korekciji kod preklapanja
  - ❌ Stvarno izvršavanje korekcije pri odobrenju (APPROVED)
  - ❌ Vraćanje SVIH preostalih dana iz originalnog zahtjeva (ne samo preklopljenih)
  - ❌ Brisanje DaySchedule zapisa originalnog zahtjeva
  - ❌ Dodavanje zapisa u log originalnog zahtjeva
  - ❌ Kreiranje CORRECTION ledger entry
  - ❌ Pregazivanje postojećeg plana u DaySchedule-u

**Evidencija bolovanja:**
- ❌ US-EMP-013: Pregled vlastitih bolovanja (FR-EMP-011)
  - ❌ Lista bolovanja zaposlenika
  - ❌ Status (aktivno/završeno)
  - ❌ Trajanje
  - ❌ Utjecaj na godišnje odmore

**Prioritet:** 
- 🔴 KRITIČNO: US-EMP-012B - Korekcija vraćanja dana (inovativna funkcionalnost)
- 🟡 SREDNJI: Draft funkcionalnost (US-EMP-008, 010, 011)
- 🟡 SREDNJI: Kalendar prikaz (US-EMP-003)
- 🟡 SREDNJI: Detalji zahtjeva (US-EMP-012)
- 🟢 NIZAK: Pregled stanja po godinama (US-EMP-002)

---

### 2.2 MANAGER MODUL (Department Manager)

#### ✅ Implementirano

**Dashboard (`/manager/page.tsx`)**
- ✅ US-DM-001: Pregled zahtjeva na čekanju (djelomično)
  - ✅ Prikaz statistika odjela
  - ✅ Broj zaposlenika
  - ✅ Zahtjevi na čekanju
  - ✅ Odobreno ovaj mjesec
- ✅ Lista pending zahtjeva (preview)
- ✅ Link za planiranje

**Planning (`/manager/planning`)**
- ✅ US-DM-002: Tablični pregled godišnjih odmora
  - ✅ Tablica s zaposlenicima u retcima i danima u stupcima
  - ✅ Color coding:
    - Zeleno: APPROVED
    - Plavo: APPROVED_FIRST_LEVEL
    - Žuto: SUBMITTED
    - Narančasto: Bolovanje
    - Sivo: Vikendi/praznici
  - ✅ Odabir razdoblja prikaza
  - ✅ Zaglavlja mjeseci
  - ✅ Klik na obojani dan za pregled detalja
- ✅ US-DM-003: Kombiniran prikaz (djelomično)
  - ✅ Kalendar prikazan (planning grid)
  - ⚠️ Sidebar s pending zahtjevima - nije implementiran kao sidebar
- ✅ Tablični kalendar s popisom zaposlenika
- ✅ Zoom kontrole (tjedan/mjesec)
- ✅ Navigacija (prethodni/sljedeći/danas)
- ✅ Legenda sa svim statusima
- ✅ Vizualizacija kritičnih razdoblja
- ✅ Filtriranje po odjelu managera

**Zahtjevi (`/manager/requests/page.tsx`)**
- ✅ US-DM-004: Odobravanje zahtjeva - Prvi nivo **IMPLEMENTIRANO!**
  - ✅ Gumb "Odobri" kod SUBMITTED zahtjeva
  - ✅ Dialog s detaljima zahtjeva
  - ✅ Prikaz svih informacija (zaposlenik, razdoblje, dani, napomena)
  - ✅ Prikaz balance-a zaposlenika
  - ✅ Prikaz preklapanja s drugim zahtjevima
  - ✅ Polje za komentar (opcionalno)
  - ✅ Razlikovanje: needSecondApproval false → APPROVED, true → APPROVED_FIRST_LEVEL
  - ✅ Kreiranje USAGE ledger entry pri konačnom odobrenju
  - ✅ Kreiranje DaySchedule zapisa pri konačnom odobrenju
  - ⚠️ Provjera prava: canApprove() - implementirano, ali ne sprječava vlastite zahtjeve u UI
  - ❌ Upozorenje o preklapanju s DaySchedule-om (treba dodati)
  - ❌ Izvršavanje korekcije pri odobrenju (treba dodati)
- ✅ US-DM-005: Odbijanje zahtjeva - Prvi nivo **IMPLEMENTIRANO!**
  - ✅ Gumb "Odbij" kod SUBMITTED zahtjeva
  - ✅ Obavezno polje za razlog odbijanja
  - ✅ Status postaje REJECTED
  - ✅ Zaposlenik vidi razlog odbijanja
  - ✅ canReject() provjera prava
- ✅ Tablica svih pending zahtjeva
- ✅ Odobri/Odbij akcije (gumbi)
- ✅ Dialog za odobrenje/odbijanje
- ✅ Polje za komentar

#### ❌ Nedostaje

**Dashboard:**
- ✅ US-DM-002: Tablični kalendarski prikaz (FR-APP-002) - **IMPLEMENTIRANO**
- ✅ Vizualizacija kritičnih razdoblja - **IMPLEMENTIRANO**

**US-DM-003: Kombiniran prikaz kalendara i zahtjeva**
- ⚠️ Djelomično implementirano:
  - ✅ Kalendar je prikazan (planning grid)
  - ❌ Sidebar s desne strane (25% širine)
  - ❌ Prikaz broja zahtjeva na čekanju u sidebaru
  - ❌ Direktno odobravanje iz sidebara

**US-DM-004: Odobravanje zahtjeva - Prvi nivo**
- ✅ **VEĆINA IMPLEMENTIRANA!** - Sprint 3 djelomično završen
  - ✅ Gumb "Odobri" kod SUBMITTED zahtjeva
  - ✅ Dialog s detaljima zahtjeva
  - ✅ Prikaz svih informacija (zaposlenik, razdoblje, dani, napomena)
  - ✅ Prikaz balance-a zaposlenika (preostali dani)
  - ✅ Prikaz preklapanja s drugim zahtjevima (Applications)
  - ✅ Polje za komentar (opcionalno)
  - ✅ canApprove() provjera prava - potpuno implementirana
  - ✅ Razlikovanje: needSecondApproval false → APPROVED, true → APPROVED_FIRST_LEVEL
  - ✅ Kreiranje USAGE ledger entry pri konačnom odobrenju (APPROVED)
  - ✅ Kreiranje DaySchedule zapisa pri konačnom odobrenju (APPROVED)
  - ✅ Toast notifications za uspjeh/grešku
  - ❌ Upozorenje o preklapanju s DaySchedule-om (hasPlanning=true) - **SLJEDEĆI KORAK**
  - ❌ Detalji o preklapanju (koji dani, razlog nedostupnosti)
  - ❌ Izvršavanje korekcije pri odobrenju (CORRECTION ledger entry)
  - ❌ Vraćanje SVIH preostalih dana ako postoji applicationId
  - ❌ Brisanje DaySchedule zapisa originalnog zahtjeva

**US-DM-005: Odbijanje zahtjeva - Prvi nivo**
- ✅ **POTPUNO IMPLEMENTIRANO!** ✅
  - ✅ Gumb "Odbij" kod SUBMITTED zahtjeva
  - ✅ Obavezno polje za razlog odbijanja (validacija)
  - ✅ canReject() provjera prava
  - ✅ Status postaje REJECTED
  - ✅ Zaposlenik vidi razlog odbijanja (rejectionComment)
  - ✅ Toast notifications

**US-DM-006: Pregled detalja odobrenog zahtjeva**
- ❌ Klik na zeleni (APPROVED) ili plavi (APPROVED_FIRST_LEVEL) dan u kalendaru
- ❌ Read-only dialog s detaljima
- ❌ Prikaz: zaposlenika, razdoblja, dana, statusa, odobravatelja, datuma odobrenja
- ❌ Prikaz napomene zaposlenika i komentara managera
- ❌ Oznaka za APPROVED_FIRST_LEVEL (čeka drugi nivo)

**US-DM-007: Masovno odobravanje zahtjeva**
- ❌ Checkbox za selekciju više zahtjeva
- ❌ Gumb "Masovno odobri"
- ❌ Zajednički komentar za sve zahtjeve
- ❌ Validacija za svaki zahtjev
- ❌ Prikaz liste grešaka za neuspješne zahtjeve
- ❌ Sažetak rezultata (X odobreno, Y odbijeno)

**US-DM-008: Eksport izvještaja**
- ❌ Eksport tabličnog prikaza u Excel i PDF
- ❌ Eksport liste zahtjeva u Excel, PDF, CSV
- ❌ Eksport pregleda alokacija u Excel i PDF
- ❌ Eksport statistike odjela u PDF
- ❌ Logo organizacije, datum, ime korisnika u eksportu
- ❌ Formatiranje za PDF (headeri, footeri)
- ❌ Excel s zamrznutim headerima i filterima
- ❌ CSV u UTF-8 formatu

**Zahtjevi:**
- ✅ Prikaz detalja zahtjeva prije odobrenja - **IMPLEMENTIRANO!**
- ✅ Prikaz preklapanja s drugim zahtjevima - **IMPLEMENTIRANO!**
- ✅ Upozorenje o kritičnom preklapanju - **IMPLEMENTIRANO u planning grid**
- ✅ Validacija prava odobrenja (canApprove) - **IMPLEMENTIRANO!**
- ✅ Razlikovanje SUBMITTED vs APPROVED_FIRST_LEVEL statusa - **IMPLEMENTIRANO!**
- ✅ Logika dva nivoa odobrenja (needSecondApproval) - **IMPLEMENTIRANO!**
- ✅ Prikaz preostalih dana zaposlenika prije odobrenja - **IMPLEMENTIRANO!**
- ❌ Prikaz preklapanja s DaySchedule-om (odobreni zahtjevi) - **SLJEDEĆI KORAK**

**Prioritet:** 
- ✅ **US-DM-004, US-DM-005 - Approval proces** - **VEĆINA ZAVRŠENA!** 🎉
- ⏳ **Sprint 3.1:** Provjera DaySchedule preklapanja (1 dan)
- 🔴 **KRITIČNO:** US-MGR-002, US-MGR-003 - Upravljanje alokacijama (sljedeći nakon 3.1)
- 🔴 **KRITIČNO:** US-MGR-005, US-MGR-007, US-MGR-008 - Evidencija bolovanja + automatska prilagodba (INOVACIJA!)
**Upravljanje alokacijama:**
- ❌ US-MGR-001: Pregled stanja dana zaposlenika
  - ❌ Lista zaposlenika s stanjem dana
  - ❌ PO tipu nedostupnosti (odvojeno za svaki tip)
  - ❌ Za svaki tip: dodijeljeno, iskorišteno, na čekanju, preostalo
  - ❌ Vizualni chipovi s bojama za svaki tip
  - ❌ Tablica po godinama za svaki tip
  - ❌ Gumb "Uredi dodjele" (po tipu)
- ❌ US-MGR-002: Dodjela godišnjih dana za novu godinu (FR-APP-008)
  - ❌ Dialog za upravljanje danima
  - ❌ Odabir tipa nedostupnosti
  - ❌ Prikaz trenutnog stanja za odabrani tip
  - ❌ Gumb "Dodaj novu godinu"
  - ❌ Odabir godine
  - ❌ Unos broja dana (1-50)
  - ❌ Kreiranje ALLOCATION ledger entry
- ❌ US-MGR-003: Izmjena postojeće dodjele dana (FR-APP-009)
  - ❌ Gumb "Uredi" kod godine u tablici
  - ❌ Mijenjanje broja dana
  - ❌ Validacija: ne može ispod iskorištenih
  - ❌ Kreiranje CORRECTION ledger entry
  - ❌ Preračunavanje preostalih dana
  - ❌ Upozorenje pri pokušaju smanjenja ispod iskorištenih
- ❌ US-MGR-004: Pregled povijesti ledger-a zaposlenika (FR-APP-010)
  - ❌ Odabir tipa nedostupnosti
  - ❌ Tablica povijesti svih ledger entries po godinama
  - ❌ Za svaku godinu: početna dodjela, transfer, korekcije, potrošnja, preostalo
  - ❌ Timestamp i korisnik koji je kreirao entry
  - ❌ Filtriranje po godini i tipu entry-ja
  - ❌ Poveznica na zahtjev (applicationId) ako postoji
  - ❌ Eksport povijesti u Excel/PDF

**Upravljanje bolovanja:**
- ❌ US-MGR-005: Evidentiranje novog bolovanja (FR-APP-011) - **KRITIČNO**
  - ❌ Odabir zaposlenika iz liste
  - ❌ Unos datuma početka (obavezno)
  - ❌ Datum završetka (opcionalno za aktivna bolovanja)
  - ❌ Napomena
  - ❌ Upload medicinske dokumentacije
  - ❌ Status "Završeno" ili "Aktivno"
  - ❌ Za otvorena bolovanja: DaySchedule samo za datum početka
  - ❌ Za zatvorena bolovanja: DaySchedule za sve dane
  - ❌ Vizualni prikaz "Aktivno bolovanje - u tijeku" u kalendaru
- ❌ US-MGR-006: Pregled aktivnih bolovanja (FR-APP-014)
  - ❌ Lista zaposlenika s aktivnim bolovanja
  - ❌ Označeni zaposlenici s aktivnim bolovanjem
  - ❌ Datum početka, trajanje (od početka do danas)
  - ❌ Crvena oznaka za aktivno bolovanje
  - ❌ Prikaz u kalendaru (svi dani od početka do danas)
  - ❌ Gumb za zatvaranje bolovanja
- ❌ US-MGR-007: Zatvaranje aktivnog bolovanja (FR-APP-013)
  - ❌ Gumb "Zatvori bolovanje"
  - ❌ Unos datuma završetka (mora biti nakon početka)
  - ❌ Dodatna napomena
  - ❌ Upload dodatne dokumentacije
  - ❌ Status "Završeno"
  - ❌ Kreiranje DaySchedule zapisa za sve dane
  - ❌ Ažuriranje prvog dana (update umjesto create)
  - ❌ Automatska prilagodba godišnjih odmora (korekcija)
- ❌ US-MGR-008: Automatska prilagodba GO pri bolovanju (FR-APP-012) - **INOVATIVNA FUNKCIJA**
  - ❌ Algoritam prilagodbe (4 scenarija - vidi user stories)
  - ❌ Za otvorena bolovanja: provjera preklapanja samo za datum početka
  - ❌ Za zatvorena bolovanja: provjera preklapanja za cijelo razdoblje
  - ❌ Provjera hasPlanning=true u DaySchedule-u
  - ❌ Vraćanje SVIH preostalih dana ako postoji applicationId
  - ❌ Brisanje DaySchedule zapisa originalnog zahtjeva
  - ❌ Kreiranje CORRECTION ledger entry
  - ❌ Dodavanje zapisa u log originalnog zahtjeva
  - ❌ Izvještaj o prilagodbama
  - ❌ Ažuriranje DaySchedule zapisa
- ❌ US-MGR-009: Pregled izvještaja o prilagodbama
  - ❌ Dialog s izvještajem nakon spremanja bolovanja
  - ❌ Za svaku prilagodbu: ID zahtjeva, staro razdoblje, novo razdoblje, vraćeni dani
  - ❌ Oznaka za otkazane zahtjeve
  - ❌ Ukupan broj vraćenih dana
- ❌ US-MGR-010: Upload medicinske dokumentacije
  - ❌ Gumb "Upload dokumenta"
  - ❌ Odabir datoteke (PDF, JPG, PNG)
  - ❌ Maksimalna veličina: 5MB
  - ❌ Višestruki dokumenti
  - ❌ Spremanje uz bolovanje
  - ❌ Lista uploadanih dokumenata
- ❌ US-MGR-011: Pregled povijesti bolovanja (FR-APP-015)
  - ❌ Gumb "Prikaži povijest"
  - ❌ Lista svih bolovanja (aktivnih i završenih)
  - ❌ Za svako: razdoblje, trajanje, status, napomena, dokumentacija
  - ❌ Filtriranje po statusu
  - ❌ Preuzimanje medicinske dokumentacije
- ❌ Uređivanje bolovanja (FR-APP-015)
- ❌ Brisanje bolovanja (FR-APP-016)

**Planiranje:**
- ✅ US-DM-002: Tablični kalendar (FR-APP-017) - **KLJUČNO ZA MOCKUP - ZAVRŠENO!**
- ✅ Vizualizacija preklapanja - **IMPLEMENTIRANO**
- ✅ Identifikacija kritičnih razdoblja - **IMPLEMENTIRANO**
- ❌ Eksport plana (vidi US-DM-008)

**Statistike:**
- ❌ Statistika odjela (FR-APP-018)
- ❌ Eksport izvještaja (FR-APP-019) - vidi US-DM-008

**Prioritet:** 
- 🔴 KRITIČNO: US-DM-004, US-DM-005 - Approval proces (prvi nivo)
- 🔴 KRITIČNO: US-MGR-002, US-MGR-003 - Upravljanje alokacijama
- 🔴 KRITIČNO: US-MGR-005, US-MGR-007, US-MGR-008 - Evidencija bolovanja + automatska prilagodba (INOVACIJA!)
- 🟡 SREDNJI: US-MGR-001, US-MGR-004 - Pregled stanja i povijesti
- 🟡 SREDNJI: US-DM-006 - Detalji odobrenog zahtjeva
- 🟢 NIZAK: US-DM-007, US-DM-008 - Masovno odobravanje i eksport (nice-to-have)

---

### 2.3 GENERAL MANAGER MODUL

#### ✅ Implementirano

- ✅ Placeholder stranica (`/general-manager/page.tsx`)

#### ❌ Nedostaje

**US-GM-001: Pregled zahtjeva za drugi nivo odobrenja**
- ❌ Lista svih zahtjeva sa statusom APPROVED_FIRST_LEVEL
- ❌ Za svaki zahtjev: ime zaposlenika, odjel, razdoblje, broj dana, napomena
- ❌ Tko je odobrio na prvom nivou (Department Manager)
- ❌ Broj zahtjeva na čekanju za drugi nivo
- ❌ Klik na zahtjev za finalno odobrenje

**US-GM-002: Finalno odobravanje zahtjeva (drugi nivo)**
- ❌ Gumb "Odobri" kod APPROVED_FIRST_LEVEL zahtjeva
- ❌ Dialog s detaljima zahtjeva
- ❌ Prikaz svih informacija: zaposlenik, odjel, razdoblje, dani, napomena
- ❌ Prikaz komentara Department Managera
- ❌ Upozorenje o preklapanju s DaySchedule-om (hasPlanning=true)
- ❌ Detalji o preklapanju (koji dani, razlog nedostupnosti)
- ❌ Polje za vlastiti komentar (opcionalno)
- ❌ Status postaje APPROVED (konačno)
- ❌ Oduzimanje dana od alokacije (USAGE ledger entry)
- ❌ Izvršavanje korekcije ako postoji preklapanje (CORRECTION ledger entry)
- ❌ Vraćanje SVIH preostalih dana ako postoji applicationId
- ❌ Brisanje DaySchedule zapisa originalnog zahtjeva
- ❌ Kreiranje novih DaySchedule zapisa

**US-GM-003: Odbijanje zahtjeva - Drugi nivo**
- ❌ Gumb "Odbij" kod APPROVED_FIRST_LEVEL zahtjeva
- ❌ Obavezno polje za razlog odbijanja
- ❌ Status postaje REJECTED
- ❌ Oslobađanje dana (ako su bili rezervirani)
- ❌ Zaposlenik i Department Manager vide razlog odbijanja

**US-GM-004: Pregled svih zahtjeva u organizaciji**
- ❌ Lista svih zahtjeva iz svih odjela
- ❌ Filtriranje po odjelu, statusu, zaposleniku
- ❌ Prikaz statusa svakog zahtjeva
- ❌ Pregled detalja bilo kojeg zahtjeva
- ❌ Tablični prikaz planiranja za sve odjele

**US-GM-005: Kreiranje vlastitih zahtjeva General Managera**
- ⚠️ Djelomično implementirano:
  - ✅ General Manager može koristiti employee modul za kreiranje zahtjeva
  - ❌ Specifičan flow za General Managera nije implementiran

**US-GM-006: Odobravanje vlastitih zahtjeva**
- ❌ Mogućnost odobrenja vlastitih zahtjeva na prvom nivou (kao Department Manager)
- ❌ Mogućnost odobrenja vlastitih zahtjeva na drugom nivou (kao General Manager)
- ❌ Sustav ne blokira odobravanje vlastitih zahtjeva za General Managera
- ❌ Logiranje u log-u da je General Manager sam odobrio vlastiti zahtjev
- ❌ Upozorenje da odobrava vlastiti zahtjev

**Dashboard:**
- ❌ Pregled svih odjela u organizaciji
- ❌ Zahtjevi u statusu APPROVED_FIRST_LEVEL (čeka drugi nivo)
- ❌ Statistike cijele organizacije

**Planiranje:**
- ❌ Strateški pregled planiranja nedostupnosti
- ❌ Kalendar svih odjela

**Upravljanje:**
- ❌ Upravljanje godišnjim alokacijama za sve zaposlenike (vidi US-MGR-001 do US-MGR-004)
- ❌ Evidencija bolovanja za sve zaposlenike (vidi US-MGR-005 do US-MGR-011)

**Prioritet:** 🟡 SREDNJI 
- 🔴 KRITIČNO za produkciju: US-GM-002, US-GM-003 - Drugi nivo odobrenja
- 🟡 SREDNJI za mockup: General Manager je "nice-to-have", može se testirati s Department Manager modulom
- 🟢 NIZAK: US-GM-004, US-GM-006 - Dodatne funkcionalnosti

---

### 2.4 ADMIN MODUL

#### ✅ Implementirano

- ✅ Placeholder stranica (`/admin/page.tsx`)

#### ❌ Nedostaje

**Upravljanje zaposlenicima:**
- ❌ US-ADM-001: Dodavanje novog zaposlenika (FR-ADM-001)
  - ❌ Gumb "Dodaj zaposlenika"
  - ❌ Unos imena (obavezno)
  - ❌ Unos prezimena (obavezno)
  - ❌ Unos email-a (obavezno, jedinstveno)
  - ❌ Odabir odjela (opcionalno)
  - ❌ Unos broja dana godišnjeg odmora (default: 20)
  - ❌ Automatsko kreiranje alokacije za tekuću godinu
  - ❌ Status "Aktivan"
- ❌ US-ADM-002: Pregled liste zaposlenika (FR-ADM-004)
  - ❌ Tablica s zaposlenicima
  - ❌ Za svakog: ime i prezime, email, odjel
  - ❌ Pretraživanje po imenu i emailu
  - ❌ Avatar s inicijalima
  - ❌ Razlikovanje aktivnih/neaktivnih
  - ❌ Klik za uređivanje
- ❌ US-ADM-003: Uređivanje zaposlenika (FR-ADM-002)
  - ❌ Gumb "Uredi" ili klik na red
  - ❌ Form s postojećim podacima
  - ❌ Promjena imena, prezimena, email-a, odjela
  - ❌ Validacija jedinstvenog email-a
  - ❌ Spremanje promjena
- ❌ US-ADM-004: Deaktivacija zaposlenika (FR-ADM-003)
  - ❌ Menu "..." kod zaposlenika
  - ❌ Opcija "Deaktiviraj"
  - ❌ Status "Neaktivan"
  - ❌ Zaposlenik ne može pristupiti sustavu
  - ❌ Postojeći podaci ostaju vidljivi
  - ❌ Mogućnost ponovne aktivacije
- ❌ US-ADM-005: Brisanje zaposlenika
  - ❌ Menu "..." kod zaposlenika
  - ❌ Opcija "Obriši"
  - ❌ Potvrda brisanja
  - ❌ Trajno brisanje iz sustava

**Upravljanje odjelima:**
- ❌ US-ADM-006: Kreiranje novog odjela (FR-ADM-005)
  - ❌ Gumb "Dodaj odjel"
  - ❌ Unos naziva odjela (obavezno, jedinstveno)
  - ❌ Unos opisa (opcionalno)
  - ❌ Dodavanje Department Managera iz liste
  - ❌ Dodavanje zaposlenika koji pripadaju odjelu
  - ❌ Spremanje odjela
- ❌ US-ADM-007: Uređivanje odjela (FR-ADM-006)
  - ❌ Gumb "Uredi" kod odjela
  - ❌ Promjena naziva i opisa
  - ❌ Dodavanje/uklanjanje Department Managera
  - ❌ Dodavanje/uklanjanje zaposlenika
  - ❌ Spremanje promjena
- ❌ US-ADM-008: Dodjeljivanje Department Managera odjelu (FR-ADM-007)
  - ❌ Popis mogućih Department Managera u formi odjela
  - ❌ Odabir jednog ili više Department Managera
  - ❌ Department Manager mora biti aktivni zaposlenik
  - ❌ Automatsko dobivanje pristupa funkcijama odobravanja prvog nivoa
  - ❌ Jedan zaposlenik može biti DM za više odjela
- ❌ US-ADM-008B: Dodjeljivanje General Managera
  - ❌ Popis mogućih General Managera u postavkama organizacije
  - ❌ Odabir jednog ili više General Managera
  - ❌ General Manager mora biti aktivni zaposlenik
  - ❌ Automatsko dobivanje pristupa funkcijama odobravanja drugog nivoa
  - ❌ Pristup svim odjelima u organizaciji
- ❌ US-ADM-009: Pregled odjela
  - ❌ Lista svih odjela
  - ❌ Za svaki odjel: naziv, opis, broj zaposlenika, broj DM-ova
  - ❌ Filtriranje aktivnih/neaktivnih
  - ❌ Klik za uređivanje

**Upravljanje praznicima:**
- ❌ US-ADM-010: Dodavanje novog praznika (FR-ADM-008)
  - ❌ Gumb "Dodaj praznik"
  - ❌ Unos naziva (obavezno)
  - ❌ Odabir datuma (obavezno)
  - ❌ Odabir tipa: ponavljajući ili jednokratni
  - ❌ Ako jednokratni: unos godine
  - ❌ Spremanje praznika
  - ❌ Prikaz u kalendaru zaposlenika
- ❌ US-ADM-011: Pregled liste praznika
  - ❌ Lista svih praznika
  - ❌ Za svaki: naziv, datum, tip (ponavljajući/jednokratni)
  - ❌ Sortiranje po datumu
  - ❌ Filtriranje po godini
  - ❌ Mogućnost uređivanja i brisanja
- ❌ US-ADM-012: Uređivanje praznika (FR-ADM-009)
  - ❌ Gumb "Uredi" kod praznika
  - ❌ Promjena naziva i datuma
  - ❌ Promjena tipa (ponavljajući/jednokratni)
  - ❌ Zabrana uređivanja praznika iz prošlosti
  - ❌ Spremanje promjena
- ❌ US-ADM-013: Brisanje praznika (FR-ADM-010)
  - ❌ Gumb "Obriši" kod praznika
  - ❌ Potvrda brisanja
  - ❌ Brisanje iz kalendara
  - ❌ Postojeći zahtjevi se ne mijenjaju retroaktivno
- ❌ Uvoz praznika za novu godinu (FR-ADM-011)

**Dashboard:**
- ❌ Statistike cijele organizacije
- ❌ Pregled aktivnih zaposlenika
- ❌ Broj zahtjeva na čekanju (svi odjeli)
- ❌ Trend bolovanja

**Prioritet:** 🟡 SREDNJI 
- 🟢 NIZAK za mockup: Admin je više "setup", manje operativan
- 🟡 SREDNJI za produkciju: US-ADM-001 do US-ADM-005 - Upravljanje zaposlenicima
- 🟢 NIZAK: US-ADM-006 do US-ADM-013 - Upravljanje odjelima i praznicima

---

## 2.5 ZAJEDNIČKE FUNKCIONALNOSTI (US-CMN)

### 2.5.1 Trenutno stanje

#### ✅ Implementirano

**US-CMN-002: Navigacija između modula**
- ✅ Navigacijski meni (sidebar u DashboardLayout)
- ✅ Meni prikazuje samo opcije dostupne za ulogu
- ✅ Klik na stavku menija za prijelaz
- ✅ Trenutna stranica označena u meniju

**US-CMN-003: Prikaz trenutno prijavljenog korisnika**
- ✅ Prikaz imena korisnika (u role-switcher)
- ✅ Prikaz uloge
- ⚠️ Gumb za odjavu (nedostaje)

**US-CMN-006: Prikaz potvrda uspješnih akcija**
- ✅ Toast notifications (zelene potvrde)
- ✅ Automatsko zatvaranje nakon 3-5 sekundi
- ✅ Ručno zatvaranje

#### ❌ Nedostaje

**US-CMN-001: Responsive dizajn**
- ⚠️ Djelomično implementirano:
  - ✅ Tailwind CSS responsive utilities
  - ❌ Testiranje na manjim ekranima (tablet, mobitel)
  - ❌ Vertikalno slaganje elemenata na manjim ekranima
  - ❌ Mobile navigation
  - ❌ Mobile table views
  - ❌ Mobile forms
  - ❌ Minimalna podržana rezolucija: 1024x768

**US-CMN-003: Prikaz trenutno prijavljenog korisnika**
- ✅ Prikaz imena i uloge - **IMPLEMENTIRANO**
- ❌ Gumb za odjavu

**US-CMN-004: Brzo osvježavanje podataka**
- ❌ Ikona za osvježavanje
- ❌ Ponovno učitavanje podataka s backend-a
- ❌ Spinner tijekom učitavanja

**US-CMN-005: Prikaz grešaka**
- ⚠️ Djelomično implementirano:
  - ✅ Toast notifications za greške (crvene)
  - ✅ Automatsko zatvaranje nakon 3-5 sekundi
  - ✅ Ručno zatvaranje
  - ❌ Snackbar pozicioniran na dnu ekrana (trenutno u gornjem desnom kutu)

**US-CMN-007: Email notifikacije**
- ❌ Email notifikacije za zaposlenika:
  - ❌ Zahtjev odobren (APPROVED)
  - ❌ Zahtjev odbijen (REJECTED)
  - ❌ Zahtjev odobren na prvom nivou (APPROVED_FIRST_LEVEL)
  - ❌ Alokacija dana promijenjena
- ❌ Email notifikacije za Department Managera:
  - ❌ Novi zahtjev na čekanju (SUBMITTED)
  - ❌ Zahtjev otkazan od strane zaposlenika
- ❌ Email notifikacije za General Managera:
  - ❌ Zahtjev čeka drugo odobrenje (APPROVED_FIRST_LEVEL)
- ❌ Email sadrži: tip događaja, zaposlenik, razdoblje, broj dana, link za pregled
- ❌ Isključivanje notifikacija u postavkama profila
- ❌ Asinkrono slanje (queue/background job)

**Prioritet:** 
- 🟢 NIZAK za mockup: US-CMN-001 (responsive), US-CMN-004 (refresh), US-CMN-007 (email)
- 🟡 SREDNJI za produkciju: US-CMN-007 (email notifikacije)

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

**US-VAL-000: Razlikovanje needApproval i hasPlanning flagova**
- ⚠️ Djelomično implementirano:
  - ✅ needApproval flag postoji u tipovima
  - ✅ hasPlanning flag postoji u tipovima
  - ✅ Mock podaci koriste oba flaga
  - ❌ UI jasno razlikuje tipove nedostupnosti s needApproval=false
  - ❌ Direktno APPROVED status za needApproval=false nije implementiran u workflow-u
  - ❌ Korekcija dana temelji se na hasPlanning=true (logika postoji u validacijama, ali nije izvršena u workflow-u)

**US-VAL-001: Validacija preklapanja zahtjeva**
- ✅ BR-VAL-002: Provjera preklapanja s aktivnim zahtjevima (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)
- ✅ APPROVED i REJECTED zahtjevi se ne uzimaju u obzir (provjerava se DaySchedule)
- ⚠️ US-VAL-007: Provjera preklapanja s DaySchedule-om:
  - ✅ Detektiranje preklapanja
  - ✅ Provjera hasPlanning=true u unavailability reason
  - ✅ Upozorenje o budućoj korekciji
  - ✅ Upozorenje o vraćanju SVIH preostalih dana ako postoji applicationId
  - ✅ Upozorenje o pregazivanju postojećeg plana
  - ❌ Stvarno izvršavanje korekcije pri odobrenju (APPROVED)
  - ❌ Kreiranje CORRECTION ledger entry
  - ❌ Vraćanje dana
  - ❌ Brisanje DaySchedule zapisa
  - ❌ Dodavanje u log originalnog zahtjeva
- ✅ Greška jasno navodi razdoblje i status postojećeg zahtjeva

**US-VAL-002: Kalkulacija radnih dana**
- ✅ BR-CALC-001: Kalkulacija radnih dana - **ZAVRŠENO**
- ✅ Isključivanje subota i nedjelja
- ✅ Isključivanje praznika iz tablice
- ✅ Ponavljajući praznici za sve godine
- ✅ Jednokratni praznici samo za specifičnu godinu
- ✅ Prikaz točnog broja radnih dana

**US-VAL-003: Validacija dostupnih dana**
- ✅ BR-VAL-003: Validacija dostupnih dana - **ZAVRŠENO**
- ✅ Kalkulacija: Dodijeljeno - Odobreno (APPROVED) - Na čekanju (SUBMITTED, APPROVED_FIRST_LEVEL)
- ✅ Greška ako traženi dani prelaze dostupne
- ✅ Prikaz koliko je dostupno i koliko se traži
- ✅ Validacija za godinu u kojoj POČINJE zahtjev
- ✅ Balance se računa iz ledger entries (SUM changeDays)

**US-VAL-004: Validacija datuma zahtjeva**
- ✅ BR-VAL-001: Validacija datuma zahtjeva - **ZAVRŠENO**
- ✅ Datum početka prije ili jednak datumu završetka
- ✅ Datum početka smije biti u prošlosti (evidencija naknadnih događaja)
- ✅ Datum završetka max 365 dana u budućnosti
- ✅ Zahtjev mora uključivati barem 1 radni dan (BR-VAL-004)

**BR-VAL-004: Validacija minimalne duljine** - **ZAVRŠENO**
- ✅ Zahtjev mora imati barem 1 radni dan
- ✅ Provjera da nisu samo vikendi/praznici

#### ❌ Nedostaje

**US-VAL-005: Validacija bolovanja**
- ❌ Provjera preklapanja s aktivnim bolovanjima
- ❌ Greška pri preklapanju
- ❌ Datum početka ne smije biti u budućnosti
- ❌ Datum završetka mora biti nakon datuma početka

**US-VAL-006: Validacija statusa za uređivanje zahtjeva**
- ⚠️ Djelomično u logici, ali ne u UI-u:
  - ✅ Pravila postoje u tipovima i dokumentaciji
  - ❌ UI sprječavanje uređivanja SUBMITTED zahtjeva
  - ❌ UI sprječavanje uređivanja APPROVED_FIRST_LEVEL zahtjeva
  - ❌ UI sprječavanje uređivanja APPROVED zahtjeva
  - ❌ UI sprječavanje uređivanja REJECTED zahtjeva
  - ❌ Error poruka: "Ne možete uređivati zahtjev u statusu: {status}"
  - ✅ DRAFT zahtjevi mogu se uređivati i brisati (logika postoji)

**BR-VAL-005: Validacija statusa za uređivanje**
- ❌ DRAFT - može se uređivati i brisati
- ❌ Ostali statusi - ne mogu se uređivati

**US-VAL-007: Provjera preklapanja s DaySchedule-om i korekcija pri odobrenju**
- ⚠️ Djelomično implementirano (vidi gore pod US-VAL-001)
- ❌ **KRITIČNO:** Stvarno izvršavanje korekcije pri odobrenju nije implementirano
- ❌ Kreiranje CORRECTION ledger entry
- ❌ Vraćanje dana (changeDays pozitivan)
- ❌ Brisanje DaySchedule zapisa originalnog zahtjeva
- ❌ Kreiranje novih DaySchedule zapisa za novi zahtjev
- ❌ Dodavanje zapisa u log originalnog zahtjeva
- ❌ Automatsko mijenjanje DaySchedule-a pri odobrenju (APPROVED)

**Prioritet:** 
- 🔴 KRITIČNO: US-VAL-007 - Izvršavanje korekcije pri odobrenju (INOVACIJA!)
- 🟡 SREDNJI: US-VAL-006 - Validacija statusa za uređivanje
- 🟡 SREDNJI: US-VAL-005 - Validacija bolovanja
- 🟢 NIZAK: BR-VAL-005 (pokriveno s US-VAL-006)

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
- ⚠️ Djelomično implementirano:
  - ✅ Statusi postoje u tipovima (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED, REJECTED)
  - ✅ Mock podaci pokrivaju sve statuse
  - ✅ needApproval flag postoji
  - ✅ needSecondApproval flag postoji
  - ❌ Flow 1: needApproval=false (direktno APPROVED) - nije implementiran u workflow-u
  - ❌ Flow 2: needApproval=true, needSecondApproval=false (SUBMITTED → APPROVED)
  - ❌ Flow 3: needApproval=true, needSecondApproval=true (SUBMITTED → APPROVED_FIRST_LEVEL → APPROVED)
  - ❌ UI razlikovanje različitih flow-ova

**BR-WF-002: Submit zahtjeva**
- ⚠️ Djelomično implementirano:
  - ✅ Mock API funkcija submitApplication postoji
  - ❌ Određivanje statusa ovisno o needApproval
  - ❌ Logiranje akcije
  - ❌ Kreiranje ledger entry-ja (za direktno odobrene, needApproval=false)
  - ❌ Kreiranje DaySchedule entry-ja (za direktno odobrene)

**BR-WF-003: Prvo odobrenje**
- ✅ **VEĆINA IMPLEMENTIRANA!** - Sprint 3 djelomično završen
  - ✅ canApprove() funkcija za provjeru prava - **IMPLEMENTIRANO!**
  - ✅ getNextStatus() za određivanje statusa - **IMPLEMENTIRANO!**
  - ✅ approveApplication() funkcija - **IMPLEMENTIRANO!**
  - ✅ UI implementacija prvog odobrenja - **IMPLEMENTIRANO!**
  - ✅ Provjera: Ne može vlastite zahtjeve (canApprove vrača false) - **IMPLEMENTIRANO!**
  - ✅ Određivanje statusa: APPROVED ili APPROVED_FIRST_LEVEL - **IMPLEMENTIRANO!**
  - ✅ Kreiranje USAGE ledger entry (oduzimanje dana) - **IMPLEMENTIRANO!**
  - ✅ Kreiranje DaySchedule zapisa (ako konačno odobren) - **IMPLEMENTIRANO!**
  - ❌ Izvršavanje korekcije (ako postoji preklapanje s DaySchedule-om) - **SLJEDEĆI KORAK**

**BR-WF-004: Drugo odobrenje**
- ❌ Potpuno nedostaje:
  - ❌ Provjera prava (General Manager)
  - ❌ Samo APPROVED_FIRST_LEVEL → APPROVED
  - ❌ Kreiranje USAGE ledger entry
  - ❌ Kreiranje DaySchedule zapisa
  - ❌ Izvršavanje korekcije (ako postoji preklapanje)

**BR-WF-005: Odbijanje**
- ✅ **POTPUNO IMPLEMENTIRANO!** ✅
  - ✅ canReject() funkcija - **IMPLEMENTIRANO!**
  - ✅ rejectApplication() funkcija - **IMPLEMENTIRANO!**
  - ✅ UI implementacija odbijanja - **IMPLEMENTIRANO!**
  - ✅ Razlog obavezan (validacija u UI) - **IMPLEMENTIRANO!**
  - ✅ Ne kreira se ledger - **IMPLEMENTIRANO!**
  - ✅ Status postaje REJECTED - **IMPLEMENTIRANO!**
  - ✅ Zaposlenik vidi razlog (rejectionComment) - **IMPLEMENTIRANO!**

**BR-WF-006: Otkazivanje**
- ❌ Potpuno nedostaje:
  - ❌ Funkcionalnost otkazivanja APPROVED zahtjeva
  - ❌ CORRECTION entry za vraćanje dana
  - ❌ Brisanje DaySchedule zapisa

**Prioritet:** 
- ✅ **BR-WF-003, BR-WF-005 - Prvi nivo odobrenja i odbijanja** - **VEĆINA ZAVRŠENA!** 🎉
- ⏳ **Sprint 3.1:** Korekcija pri odobrenju (dio BR-WF-003) - **SLJEDEĆI KORAK**
- 🔴 KRITIČNO: Izvršavanje korekcije pri odobrenju (dio BR-WF-003 i BR-WF-004)
- 🟡 SREDNJI: BR-WF-004 - Drugi nivo odobrenja
- 🟢 NIZAK: BR-WF-006 - Otkazivanje (nice-to-have)

---

### 3.4 Automatizacija

#### ❌ Potpuno nedostaje

**BR-AUTO-001: Automatska prilagodba GO pri bolovanju** - **INOVATIVNA FUNKCIONALNOST!**
- ❌ Algoritam prilagodbe (4 scenarija prema user stories):
  1. ❌ Potpuno preklapanje → Otkazati GO
  2. ❌ Preklapanje na početku → Pomicanje start datuma
  3. ❌ Preklapanje na kraju → Pomicanje end datuma
  4. ❌ Preklapanje u sredini → Skraćivanje na prvi dio
- ❌ **KLJUČNO:** Vraćanje SVIH preostalih dana iz originalnog zahtjeva (ne samo preklopljenih)
  - ❌ Ako bolovanje počinje 15.1., a GO je 1.1.-31.1.
  - ❌ Vraćaju se SVI dani od 15.1. do 31.1., ne samo preklopljeni dani
  - ❌ Razlog: Bolovanje prekida GO, često bez poznatog kraja
- ❌ Kreiranje CORRECTION ledger entry
- ❌ Ažuriranje DaySchedule zapisa:
  - ❌ Brisanje DaySchedule zapisa originalnog zahtjeva (od datuma početka novog zahtjeva)
  - ❌ Kreiranje novih DaySchedule zapisa za novi zahtjev (bolovanje)
- ❌ Dodavanje komentara na zahtjev
- ❌ Izvještaj o prilagodbama (US-MGR-009)
- ❌ Za otvorena bolovanja (bez datuma završetka):
  - ❌ DaySchedule zapis samo za datum početka
  - ❌ Vizualni prikaz "Aktivno bolovanje - u tijeku" od početka do danas
  - ❌ Provjera preklapanja samo za datum početka
  - ❌ Pri zatvaranju: kreiranje DaySchedule za sve dane

**Napomena:** Ovo je **KLJUČNA INOVATIVNA FUNKCIONALNOST** aplikacije!

**BR-AUTO-002: Kreiranje DaySchedule zapisa**
- ❌ Upsert za svaki dan razdoblja
- ❌ Postavljanje unavailabilityReasonId
- ❌ Postavljanje applicationId (povezivanje s zahtjevom)
- ❌ Postavljanje statusa (NOT_AVAILABLE)
- ❌ Pregazivanje postojećih DaySchedule zapisa pri odobrenju

**BR-AUTO-003: Godišnji transfer (carry-over)**
- ❌ Scheduled job (1.1.)
- ❌ Max 5 dana prenosa
- ❌ Samo za hasPlanning=true
- ❌ Kreiranje TRANSFER ledger entry

**BR-AUTO-004: Godišnja alokacija**
- ❌ ALLOCATION entry kreiranje
- ❌ Masovna dodjela
- ❌ Pojedinačna dodjela

**Prioritet:** 🔴 KRITIČNO 
- 🔴 KRITIČNO: BR-AUTO-001 - Automatska prilagodba (INOVACIJA!)
- 🔴 KRITIČNO: BR-AUTO-002 - Kreiranje DaySchedule zapisa
- 🟢 NIZAK za mockup: BR-AUTO-003, BR-AUTO-004 (background jobs)

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
- ✅ `<Calendar>` - osnovni kalendar picker (postoji inline u forms)
- ✅ `<MonthView>` - mjesečni prikaz s events - **IMPLEMENTIRANO (PlanningGrid)**
- ✅ `<WeekView>` - tjedni prikaz - **IMPLEMENTIRANO (PlanningGrid)**
- ❌ `<CalendarGrid>` - možda nije potrebno, PlanningGrid pokriva

**2. Tablični kalendar (KLJUČNO!)** ✅ **ZAVRŠENO!**
- ✅ `<PlanningGrid>` - glavni tablični prikaz - **IMPLEMENTIRANO**
  - Retci: Zaposlenici ✅
  - Stupci: Datumi ✅
  - Ćelije: Status za svaki dan ✅
- ✅ Color coding: **IMPLEMENTIRANO**
  - Zeleno: Odobreni odmori ✅
  - Žuto: Na čekanju ✅
  - Narančasto: Bolovanja ✅
  - Crveno: Kritično razdoblje (3+) ✅
  - Sivo: Vikend/praznik ✅
- ✅ Hover states s detaljima - **IMPLEMENTIRANO (Tooltip)**
- ✅ Klikabilne ćelije - **IMPLEMENTIRANO (Dialog)**
- ✅ Zoom kontrole (tjedan/mjesec) - **IMPLEMENTIRANO (CalendarControls)**

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
- ✅ `<Dialog>` postoji i koristi se
- ❌ `<ConfirmDialog>` - confirmation modal
- ❌ `<FormDialog>` - modal s formom
- ✅ `<DetailDialog>` - prikaz detalja - **IMPLEMENTIRANO (u PlanningGrid)**

**7. Ostalo**
- ❌ `<EmptyState>` - empty state s ilustracijom
- ❌ `<LoadingState>` - skeleton loader
- ✅ `<Toast>` - toast notifications - **IMPLEMENTIRANO**
- ❌ `<Tabs>` - tab navigation (postoji u shadcn, ali ne koristi se)
- ✅ `<Tooltip>` - tooltips za dodatne info - **IMPLEMENTIRANO**

**Prioritet:**
- ✅ PlanningGrid - **ZAVRŠENO**
- 🟡 SREDNJI: Calendar, Charts, DataTable, DateRangePicker
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
/manager/planning            ✅ Tablični kalendar - IMPLEMENTIRANO!
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
- ✅ `/manager/planning` - **ZAVRŠENO**
- 🔴 KRITIČNO: `/manager/allocations`, `/manager/sick-leaves`
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

### FAZA 2: ~~TABLIČNI KALENDAR (1 tjedan)~~ ✅ **ZAVRŠENO**

#### ✅ P2 - Završeno

**2.1 Planning Grid komponenta** ✅
- [x] `<PlanningGrid>` osnovna struktura
- [x] Prikaz zaposlenika (retci)
- [x] Prikaz dana (stupci)
- [x] Cell rendering (status colors)
- [x] Zoom kontrole (tjedan/mjesec)

**2.2 Interaktivnost** ✅
- [x] Hover states s detaljima
- [x] Klik na cell za detalje
- [x] Identifikacija kritičnih razdoblja
- [x] Legend za boje

**Deliverable:** ✅ Tablični kalendar za planiranje - **KLJUČNO ZA MOCKUP - ZAVRŠENO!**

---

### FAZA 3: ALOKACIJE I BOLOVANJA (1 tjedan) ⏳ **SLJEDEĆI**

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

**Implementirano:** ~65%
- ✅ Infrastruktura: 98%
- ✅ Employee Dashboard: 75%
- ✅ Validacije i kalkulacije: 95%
- ✅ Helper funkcije: 95%
- ✅ Planning Grid: 90%
- ⚠️ Manager Dashboard: 70%
- ⚠️ Manager Requests (Approval): 20% (logika postoji, UI nedostaje)
- ❌ Manager Alokacije: 0% (KRITIČNO!)
- ❌ Manager Bolovanja: 0% (INOVACIJA!)
- ❌ Automatska prilagodba GO: 0% (INOVACIJA!)
- ❌ General Manager: 10%
- ❌ Admin: 10%

**Pokrivenost User Stories:**

**Autentifikacija (2 US):**
- US-AUTH-001: ❌ Login forma (mock auth je dovoljan za mockup)
- US-AUTH-002: ❌ Logout (mock auth je dovoljan)

**Zaposlenik - Pregled (4 US):**
- US-EMP-001: ✅ Pregled stanja dana PO tipu nedostupnosti
- US-EMP-002: ❌ Pregled stanja po godinama
- US-EMP-003: ❌ Kalendarski prikaz godišnjih odmora
- US-EMP-004: ✅ Pregled aktivnih zahtjeva

**Zaposlenik - Kreiranje (10 US):**
- US-EMP-005: ⚠️ Odabir razdoblja (djelomično - nedostaje TableCalendar)
- US-EMP-006: ✅ Real-time validacija
- US-EMP-007: ✅ Dodavanje napomene
- US-EMP-008: ❌ Spremanje kao draft
- US-EMP-009: ⚠️ Slanje na odobrenje (gumb postoji, workflow nedostaje)
- US-EMP-010: ❌ Uređivanje DRAFT zahtjeva
- US-EMP-011: ❌ Brisanje DRAFT zahtjeva
- US-EMP-012: ❌ Pregled detalja odobrenog zahtjeva
- US-EMP-012B: ⚠️ Korekcija vraćanja dana (upozorenje postoji, izvršavanje nedostaje)
- US-EMP-013: ❌ Pregled vlastitih bolovanja

**Department Manager - Pregled (3 US):**
- US-DM-001: ✅ Pregled zahtjeva na čekanju
- US-DM-002: ✅ Tablični pregled godišnjih odmora
- US-DM-003: ⚠️ Kombiniran prikaz (nedostaje sidebar)

**Department Manager - Odobravanje (4+2 US):**
- US-DM-004: ⚠️ Odobravanje zahtjeva - Prvi nivo (logika postoji, UI nedostaje)
- US-DM-005: ⚠️ Odbijanje zahtjeva - Prvi nivo (logika postoji, UI nedostaje)
- US-DM-006: ❌ Pregled detalja odobrenog zahtjeva
- US-DM-007: ❌ Masovno odobravanje (nice-to-have)
- US-DM-008: ❌ Eksport izvještaja (nice-to-have)

**Manager - Alokacije (4 US):**
- US-MGR-001: ❌ Pregled stanja dana zaposlenika (PO tipu)
- US-MGR-002: ❌ Dodjela dana za novu godinu (PO tipu)
- US-MGR-003: ❌ Izmjena postojeće dodjele (PO tipu)
- US-MGR-004: ❌ Pregled povijesti ledger-a (PO tipu)

**Manager - Bolovanja (7 US):**
- US-MGR-005: ❌ Evidentiranje novog bolovanja
- US-MGR-006: ❌ Pregled aktivnih bolovanja
- US-MGR-007: ❌ Zatvaranje aktivnog bolovanja
- US-MGR-008: ❌ Automatska prilagodba GO (INOVACIJA!)
- US-MGR-009: ❌ Pregled izvještaja o prilagodbama
- US-MGR-010: ❌ Upload medicinske dokumentacije
- US-MGR-011: ❌ Pregled povijesti bolovanja

**General Manager (6 US):**
- US-GM-001: ❌ Pregled zahtjeva za drugi nivo
- US-GM-002: ❌ Finalno odobravanje (drugi nivo)
- US-GM-003: ❌ Odbijanje - drugi nivo
- US-GM-004: ❌ Pregled svih zahtjeva u organizaciji
- US-GM-005: ⚠️ Kreiranje vlastitih zahtjeva (može koristiti employee modul)
- US-GM-006: ❌ Odobravanje vlastitih zahtjeva

**Administrator (13 US):**
- US-ADM-001 do 005: ❌ Upravljanje zaposlenicima (5 US)
- US-ADM-006 do 009: ❌ Upravljanje odjelima (4 US + General Manager)
- US-ADM-010 do 013: ❌ Upravljanje praznicima (4 US)

**Zajedničke funkcionalnosti (7 US):**
- US-CMN-001: ⚠️ Responsive dizajn (djelomično)
- US-CMN-002: ✅ Navigacija između modula
- US-CMN-003: ⚠️ Prikaz korisnika (nedostaje odjava)
- US-CMN-004: ❌ Brzo osvježavanje podataka
- US-CMN-005: ⚠️ Prikaz grešaka (postoji, ali ne kao snackbar)
- US-CMN-006: ✅ Prikaz potvrda uspješnih akcija
- US-CMN-007: ❌ Email notifikacije (nice-to-have)

**Validacije (8 US):**
- US-VAL-000: ⚠️ Razlikovanje needApproval/hasPlanning (djelomično)
- US-VAL-001: ⚠️ Validacija preklapanja (upozorenje postoji, izvršavanje nedostaje)
- US-VAL-002: ✅ Kalkulacija radnih dana
- US-VAL-003: ✅ Validacija dostupnih dana
- US-VAL-004: ✅ Validacija datuma zahtjeva
- US-VAL-005: ❌ Validacija bolovanja
- US-VAL-006: ⚠️ Validacija statusa za uređivanje (logika postoji, UI nedostaje)
- US-VAL-007: ⚠️ Provjera DaySchedule-a i korekcija (upozorenje postoji, izvršavanje nedostaje)

**UKUPNO: 76 User Stories**
- ✅ Potpuno implementirano: ~15 US (20%)
- ⚠️ Djelomično implementirano: ~10 US (13%)
- ❌ Nije implementirano: ~51 US (67%)

**KRITIČNI GAP-ovi (Must-have za funkcionalan mockup):**
1. 🔴 US-DM-004, US-DM-005 - Approval proces (prvi nivo odobrenja i odbijanja)
2. 🔴 US-EMP-012B, US-VAL-007, BR-AUTO-001 - Korekcija vraćanja dana pri odobrenju (INOVACIJA!)
3. 🔴 US-MGR-002, US-MGR-003 - Upravljanje alokacijama
4. 🔴 US-MGR-005, US-MGR-007, US-MGR-008 - Evidencija bolovanja + automatska prilagodba
5. 🔴 BR-WF-002, BR-WF-003 - Workflow: submit i prvo odobrenje
6. 🔴 BR-AUTO-002 - Kreiranje DaySchedule zapisa

### 15.2 Prioriteti za full-featured mockup

#### 🔴 Must-have (kritično za funkcionalan mockup)

**1. Approval proces - PRVI NIVO (2-3 dana)** ⏳ **SLJEDEĆI PRIORITET**
- Implementacija UI-a za odobrenje/odbijanje u `/manager/requests`
- Prikaz detalja zahtjeva prije odobrenja
- Razlikovanje SUBMITTED → APPROVED vs APPROVED_FIRST_LEVEL
- Kreiranje USAGE ledger entry pri odobrenju
- Kreiranje DaySchedule zapisa pri odobrenju
- Implementacija upozorenja o preklapanju s DaySchedule-om
- Povezuje: US-DM-004, US-DM-005, BR-WF-003, BR-WF-005

**2. Korekcija vraćanja dana pri odobrenju (3-4 dana)** 🔴 **INOVACIJA!**
- Algoritam prilagodbe (4 scenarija)
- Vraćanje SVIH preostalih dana iz originalnog zahtjeva (ne samo preklopljenih)
- Kreiranje CORRECTION ledger entry
- Brisanje DaySchedule zapisa originalnog zahtjeva
- Ažuriranje DaySchedule-a s novim zahtjevom
- Dodavanje zapisa u log originalnog zahtjeva
- Izvještaj o prilagodbama
- Povezuje: US-EMP-012B, US-VAL-007, US-MGR-008, BR-AUTO-001

**3. Upravljanje alokacijama (3-4 dana)**
- Ruta `/manager/allocations`
- US-MGR-001: Lista zaposlenika s stanjem dana (PO tipu nedostupnosti)
- US-MGR-002: Forma za dodjelu dana za novu godinu (PO tipu)
- US-MGR-003: Izmjena postojeće dodjele (PO tipu)
- US-MGR-004: Pregled povijesti ledger-a (PO tipu)
- Validacija (1-50 dana, ne može ispod iskorištenih)

**4. Evidencija bolovanja (2-3 dana)**
- Ruta `/manager/sick-leaves`
- US-MGR-005: Forma za novo bolovanje
- US-MGR-006: Lista aktivnih bolovanja
- US-MGR-007: Zatvaranje aktivnog bolovanja
- Za otvorena bolovanja: DaySchedule samo za datum početka
- Za zatvorena bolovanja: DaySchedule za sve dane

**5. DaySchedule management (dio approval procesa)**
- BR-AUTO-002: Kreiranje DaySchedule zapisa
- Upsert za svaki dan razdoblja
- Postavljanje unavailabilityReasonId i applicationId
- Pregazivanje postojećih DaySchedule zapisa

#### 🟡 Should-have (poželjno za impressive mockup)

**6. Draft funkcionalnost (2-3 dana)**
- US-EMP-008: Spremanje kao draft
- US-EMP-010: Uređivanje draft-a
- US-EMP-011: Brisanje draft-a
- US-VAL-006: Validacija statusa za uređivanje

**7. Kalendar prikaz za Employee (2-3 dana)**
- US-EMP-003: Ruta `/employee/calendar`
- 12 mini kalendara za sve mjesece
- Color coding za statuse
- Mijenjanje godine

**8. Drugi nivo odobrenja - General Manager (2-3 dana)**
- US-GM-001: Pregled zahtjeva za drugi nivo
- US-GM-002: Finalno odobravanje
- US-GM-003: Odbijanje - drugi nivo
- BR-WF-004: Workflow pravila

**9. Detalji zahtjeva (1-2 dana)**
- US-EMP-012: Pregled detalja za zaposlenika
- US-DM-006: Pregled detalja za managera
- Povijest promjena statusa
- Komentar voditelja

**10. Pregled stanja po godinama (1-2 dana)**
- US-EMP-002: Tablica po godinama za svaki tip nedostupnosti
- Klik na info ikonu
- Negativni dani crvenom bojom

#### 🟢 Nice-to-have (cherry on top)

**11. Admin modul (4-5 dana)**
- US-ADM-001 do 005: Upravljanje zaposlenicima
- US-ADM-006 do 009: Upravljanje odjelima
- US-ADM-010 do 013: Upravljanje praznicima

**12. Dodatne funkcionalnosti (3-4 dana)**
- US-DM-007: Masovno odobravanje
- US-DM-008: Eksport izvještaja
- US-MGR-010: Upload medicinske dokumentacije
- US-CMN-007: Email notifikacije

**13. UX poboljšanja (2-3 dana)**
- US-CMN-001: Responsive dizajn
- US-EMP-005: TableCalendar za odabir razdoblja
- US-DM-003: Sidebar s pending zahtjevima
- Loading states, animations

### 15.3 Procjena vremena

**Za full-featured mockup:**

| Faza | Funkcionalnost | Dani | Priority | Status | User Stories |
|------|----------------|------|----------|---------|--------------|
| **0** | **Ispravljanje grešaka** | **1** | **🔴** | **⏳ TODO** | **BR-VAL-001, 002, 003, US-VAL-005, 006** |
| 1 | Validacije + kalkulacije | 2-3 | 🔴 | ✅ ZAVRŠENO (s greškama) | US-VAL-002, 003, 004, US-EMP-006 |
| 2 | Tablični kalendar | 5-7 | 🔴 | ✅ ZAVRŠENO | US-DM-002 |
| **3** | **Approval proces - Prvi nivo** | **2-3** | **🔴** | **✅ VEĆINA ZAVRŠENA!** 🎉 | **US-DM-004, 005, BR-WF-003, 005** |
| **3.1** | **DaySchedule preklapanja + upozorenje** | **1** | **🔴** | **⏳ Sljedeći** | **US-DM-004 (dio), US-VAL-007 (dio)** |
| 4 | Korekcija vraćanja dana | 3-4 | 🔴 | ⏳ | US-EMP-012B, US-VAL-007, US-MGR-008, BR-AUTO-001 |
| 5 | DaySchedule management | 0.5 | 🔴 | ✅ VEĆINA ZAVRŠENA | BR-AUTO-002 (većina završena) |
| 6 | Upravljanje alokacijama | 3-4 | 🔴 | ⏳ | US-MGR-001, 002, 003, 004 |
| 7 | Evidencija bolovanja | 2-3 | 🔴 | ⏳ | US-MGR-005, 006, 007 |
| 8 | Draft funkcionalnost | 2-3 | 🟡 | ⏳ | US-EMP-008, 010, 011, US-VAL-006 |
| 9 | Employee kalendar | 2-3 | 🟡 | ⏳ | US-EMP-003 |
| 10 | General Manager - drugi nivo | 2-3 | 🟡 | ⏳ | US-GM-001, 002, 003, BR-WF-004 |
| 11 | Detalji zahtjeva | 1-2 | 🟡 | ⏳ | US-EMP-012, US-DM-006 |
| 12 | Pregled stanja po godinama | 1-2 | 🟡 | ⏳ | US-EMP-002 |
| 13 | Admin modul | 4-5 | 🟢 | ⏳ | US-ADM-001 do 013 |
| 14 | Dodatne funkcionalnosti | 3-4 | 🟢 | ⏳ | US-DM-007, 008, US-MGR-010, US-CMN-007 |
| 15 | UX polish | 2-3 | 🟢 | ⏳ | US-CMN-001, US-EMP-005, US-DM-003 |

**Ukupno:** 35-49 radnih dana (7-10 tjedana)  
**Završeno:** ~10-13 dana (Faze 1, 2, 3 većina, 5 većina) - **S GREŠKAMA U FAZI 1!**  
**Faza 0 - Ispravljanje:** **1 dan** 🔴 **PRIORITET #1 - TODO**  
**Faza 3.1 - DaySchedule preklapanja:** **1 dan** 🔴 **PRIORITET #2 - Nakon Faze 3**  
**Preostalo kritično (🔴):** ~9-14 dana (Faze 0, 3.1, 4, 6-7) → ~2-3 tjedna  
**Preostalo poželjno (🟡):** ~10-13 dana (Faze 8-12) → ~2-2.5 tjedna  
**Nice-to-have (🟢):** ~9-12 dana (Faze 13-15) → ~2 tjedna

**⚠️ VAŽNO:** Sprint 0 (Faza 0) se **MORA** napraviti prije nego nastavimo s drugim fazama!

**🎉 NAPREDAK:** Sprint 3 je VEĆINA ZAVRŠENA! Approval proces (prvi nivo) funkcionira!

**Prioritet za sljedeće:**
1. 🔴 **Sprint 0: Ispravljanje grešaka** (1 dan) - **MORA BITI PRVO!**
2. 🔴 **Sprint 3.1: DaySchedule preklapanja** (1 dan) - Upozorenje o preklapanju s odobrenim zahtjevima
3. 🔴 **Sprint 4: Korekcija vraćanja dana** (3-4 dana) - INOVATIVNA FUNKCIONALNOST!
4. 🔴 **Sprint 6: Upravljanje alokacijama** (3-4 dana) - Dodjela godišnjih dana
5. 🔴 **Sprint 7: Evidencija bolovanja** (2-3 dana) - Forma i popis bolovanja

**Za minimum viable mockup (samo kritično - 🔴):**
- **Faze 0-7:** ~20-27 dana (4-5.5 tjedana)
- **Faze 1-2:** ✅ Završeno (~7-10 dana) - **S GREŠKAMA!**
- **Faza 0:** ⏳ **1 dan (PRIORITET #1)**
- **Preostalo:** ~12-16 dana (2.5-3 tjedna)

**Za impressive mockup (kritično + poželjno - 🔴🟡):**
- Faze 0-12: ~30-40 dana (6-8 tjedana)
- Faze 1-2: ✅ Završeno (~7-10 dana) - **S GREŠKAMA!**
- **Faza 0:** ⏳ **1 dan (PRIORITET #1)**
- **Preostalo:** ~22-29 dana (4.5-6 tjedana)

### 15.4 Preporuke

#### Za nastavak razvoja

1. **Approval proces (2-3 dana):** ⏳ **SLJEDEĆI KORAK**
   - ✅ Validacije su gotove
   - ✅ Mock API infrastruktura postoji
   - ✅ Permissions logika implementirana (canApprove, canReject, getNextStatus)
   - ⏳ Treba dodati approveApplication i rejectApplication u api.ts
   - ⏳ Treba implementirati UI za odobrenje u `/manager/requests`
   - ⏳ Treba dodati prikaz detalja zahtjeva i balance-a zaposlenika
   - ⏳ Treba razlikovati SUBMITTED → APPROVED vs APPROVED_FIRST_LEVEL
   - **Povezuje:** US-DM-004, US-DM-005, BR-WF-003, BR-WF-005

2. **Korekcija vraćanja dana (3-4 dana):** 🔴 **INOVACIJA!**
   - ✅ Upozorenja o korekciji postoje u validacijama
   - ⏳ Implementirati algoritam prilagodbe (4 scenarija)
   - ⏳ **KLJUČNO:** Vraćanje SVIH preostalih dana (ne samo preklopljenih)
   - ⏳ Kreiranje CORRECTION ledger entry
   - ⏳ Brisanje DaySchedule zapisa originalnog zahtjeva
   - ⏳ Kreiranje novih DaySchedule zapisa
   - ⏳ Dodavanje zapisa u log originalnog zahtjeva
   - ⏳ Izvještaj o prilagodbama (US-MGR-009)
   - **Povezuje:** US-EMP-012B, US-VAL-007, US-MGR-008, BR-AUTO-001

3. **Upravljanje alokacijama (3-4 dana):**
   - Kreiraj `/manager/allocations` rutu
   - US-MGR-001: Lista zaposlenika s trenutnim alokacijama (PO tipu nedostupnosti)
   - US-MGR-002: Forma za pojedinačnu i masovnu dodjelu (PO tipu)
   - US-MGR-003: Izmjena postojeće dodjele (PO tipu)
   - US-MGR-004: Pregled povijesti ledger-a (PO tipu)
   - Validacija (1-50 dana, ne može ispod iskorištenih)

4. **Evidencija bolovanja (2-3 dana):**
   - Kreiraj `/manager/sick-leaves` rutu
   - US-MGR-005: Forma za novo bolovanje
   - US-MGR-006: Lista bolovanja odjela
   - US-MGR-007: Zatvaranje aktivnog bolovanja
   - Za otvorena bolovanja: DaySchedule samo za datum početka
   - Za zatvorena bolovanja: DaySchedule za sve dane
   - Pri zatvaranju: automatska prilagodba GO (korekcija)

5. **DaySchedule management (dio approval procesa):**
   - BR-AUTO-002: Kreiranje DaySchedule zapisa
   - Upsert za svaki dan razdoblja
   - Postavljanje unavailabilityReasonId i applicationId
   - Pregazivanje postojećih DaySchedule zapisa pri odobrenju

6. **Iterativni pristup:**
   - ✅ Faza 1 završena - odličan napredak!
   - ✅ Faza 2 završena - tablični kalendar radi!
   - Ne pokušavaj sve odjednom
   - Završi jednu funkcionalnost kompletno prije nego kreneš na drugu
   - Testiraj svaku fazu prije prelaska na sljedeću
   - **Sljedeća prioritet: Approval proces + Korekcija vraćanja dana**

7. **Mock data strategy:**
   - ✅ Mock podaci su odlično struktuirani
   - Dodaj više Applications za testiranje overlap-a (po potrebi)
   - Dodaj više LedgerEntries za testiranje balance-a (po potrebi)
   - Dodaj DaySchedule mock podatke za testiranje korekcije

8. **Component library:**
   - Napravi reusable komponente
   - Posebno za detalje zahtjeva (dialog)
   - Posebno za validaciju forme (već ima u validation.ts)

9. **Keep it simple:**
   - Mockup ne treba biti perfektan
   - Fokus na demo-iranje ključnih funkcionalnosti
   - **INOVACIJA = Korekcija vraćanja dana!** - ovo je najvažnije za pokazati
   - UX polish je manje važan od funkcionalnosti

### 15.5 Success criteria

**Success criteria za mockup:**

**Core funkcionalnosti - ✅ ZAVRŠENO:**
- ✅ Zaposlenik može kreirati zahtjev s validacijom - **ZAVRŠENO**
- ✅ Balance kalkulacija je točna - **ZAVRŠENO**
- ✅ Overlap detection radi - **ZAVRŠENO**
- ✅ Real-time validacija s feedback-om - **ZAVRŠENO**
- ✅ Toast notifications - **ZAVRŠENO**
- ✅ Manager vidi tablični kalendar s planiranjem - **ZAVRŠENO**
- ✅ Identifikacija kritičnih razdoblja - **ZAVRŠENO**

**Approval proces - ⏳ KRITIČNO:**
- ❌ Manager može odobriti zahtjev (US-DM-004)
- ❌ Manager može odbiti zahtjev (US-DM-005)
- ❌ Razlikovanje prvog i drugog nivoa odobrenja
- ❌ Kreiranje USAGE ledger entry pri odobrenju
- ❌ Kreiranje DaySchedule zapisa pri odobrenju

**Korekcija vraćanja dana - 🔴 INOVACIJA:**
- ❌ Algoritam prilagodbe radi (4 scenarija)
- ❌ **KLJUČNO:** Vraćanje SVIH preostalih dana (ne samo preklopljenih)
- ❌ Kreiranje CORRECTION ledger entry
- ❌ Brisanje DaySchedule zapisa originalnog zahtjeva
- ❌ Ažuriranje DaySchedule-a s novim zahtjevom
- ❌ Dodavanje u log originalnog zahtjeva
- ❌ Izvještaj o prilagodbama (US-MGR-009)

**Upravljanje alokacijama - ⏳ KRITIČNO:**
- ❌ Manager može dodjeljivati godišnje dane (US-MGR-002)
- ❌ PO tipu nedostupnosti (odvojeno za svaki tip)
- ❌ Pregled stanja zaposlenika (US-MGR-001)
- ❌ Izmjena postojeće dodjele (US-MGR-003)
- ❌ Pregled povijesti ledger-a (US-MGR-004)

**Evidencija bolovanja - ⏳ KRITIČNO:**
- ❌ Manager može evidentirati bolovanje (US-MGR-005)
- ❌ Pregled aktivnih bolovanja (US-MGR-006)
- ❌ Zatvaranje aktivnog bolovanja (US-MGR-007)
- ❌ Za otvorena bolovanja: DaySchedule samo za datum početka
- ❌ Pri zatvaranju: automatska prilagodba GO (korekcija)

**Bonus - 🟡 Nice-to-have:**
- ❌ Draft funkcionalnost (US-EMP-008, 010, 011)
- ❌ Employee kalendar prikaz (US-EMP-003)
- ❌ General Manager drugi nivo odobrenja (US-GM-002, 003)
- ❌ Admin modul - upravljanje zaposlenicima (US-ADM-001 do 005)
- ❌ Detalji zahtjeva (US-EMP-012, US-DM-006)
- ❌ Pregled stanja po godinama (US-EMP-002)

**Prioritizirani success criteria:**
1. 🔴 **Approval proces** - Must-have za funkcionalan mockup
2. 🔴 **Korekcija vraćanja dana** - INOVACIJA! Must-have za pokazati vrijednost aplikacije
3. 🔴 **Upravljanje alokacijama** - Must-have za funkcionalan mockup
4. 🔴 **Evidencija bolovanja** - Must-have za kompletnu funkcionalnost korekcije
5. 🟡 Draft, kalendar, drugi nivo - Nice-to-have
6. 🟢 Admin modul - Lowest priority

**Minimum viable mockup:**
- Core funkcionalnosti ✅
- Approval proces ❌ (SLJEDEĆI)
- Korekcija vraćanja dana ❌ (INOVACIJA!)
- Upravljanje alokacijama ❌
- Evidencija bolovanja ❌

**Impressive mockup:**
- Minimum viable mockup
- Draft funkcionalnost
- Employee kalendar prikaz
- Drugi nivo odobrenja
- Detalji zahtjeva  

---

## 16. IZVRŠNI PLAN

### 16.1 Sljedeći koraci (Next Sprint)

**Sprint 0: ~~ISPRAVLJANJE GREŠAKA (1 dan)~~** ⏳ **PRIORITET #1 - MORA SE NAPRAVITI PRVO!**

Dan 1:
- [ ] **KRITIČNO:** Ispravi `validateDateRange()` u `lib/utils/validation.ts`
  - [ ] Dodaj parametar `allowPastDates` ili `unavailabilityReasonType`
  - [ ] Za bolovanje: dopusti datum početka u prošlosti
  - [ ] Za regularne zahtjeve: zadr ži trenutnu validaciju (ne dopusti prošlost)
  - [ ] Ažuriraj sve pozive `validateDateRange()`
  - [ ] Ažuriraj `validateApplication()` da prosleđuje tip
- [ ] **KRITIČNO:** Dodaj validaciju preklapanja s DaySchedule-om
  - [ ] Kreiraj `validateDayScheduleOverlap()` u `validation.ts`
  - [ ] Provjera: preklapanje s APPROVED zahtjevima preko DaySchedule
  - [ ] Upozorenje o budućoj korekciji ako je `hasPlanning=true`
  - [ ] Integriraj u `validateApplication()`
  - [ ] Dodaj mock DaySchedule podatke za testiranje
- [ ] Provjeri `calculateBalance()` pozive - filtriranje po `reasonId`
  - [ ] Pregledaj `useBalance()` hook
  - [ ] Pregledaj sve pozive u komponentama
  - [ ] Osiguraj da se uvijek prosleđuje `unavailabilityReasonId`
- [ ] Dodaj UI validaciju statusa za uređivanje
  - [ ] Provjeri status prije prikaza "Uredi" gumba
  - [ ] Samo DRAFT zahtjevi mogu imati "Uredi" gumb
  - [ ] Error poruka ako korisnik pokuša urediti ne-DRAFT zahtjev
- [ ] Testiraj sve scenarije
  - [ ] Bolovanje s prošlim datumom (mora proći)
  - [ ] Godišnji odmor s prošlim datumom (mora failati)
  - [ ] Preklapanje s DaySchedule-om (mora pokazati upozorenje)
  - [ ] Balance kalkulacija (mora biti po reasonId)

**Deliverable:** Ispravljene greške u validacijama - **BLOKIRA Sprint 3!**
**Pokriva:** BR-VAL-001, BR-VAL-002, BR-VAL-003, US-VAL-004, US-VAL-005, US-VAL-006
**Status:** ⏳ **MORA SE NAPRAVITI PRIJE NASTAVKA RAZVOJA**

---

**Sprint 1: ~~Validacije i kalkulacije (2-3 dana)~~** ✅ **ZAVRŠENO** (ali ima grešaka - vidi Sprint 0)

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
**Pokriva:** US-VAL-002, US-VAL-003, US-VAL-004, US-EMP-006

---

**Sprint 2: ~~Tablični kalendar (5-7 dana)~~** ✅ **ZAVRŠENO**

~~Dan 1-2:~~
- [x] PlanningGrid komponenta - osnovna struktura
- [x] Rendering retci/stupci
- [x] Cell rendering

~~Dan 3-4:~~
- [x] Color coding
- [x] Hover states
- [x] Click handlers

~~Dan 5:~~
- [x] Zoom kontrole
- [x] Legend
- [x] Responsive

~~Dan 6-7:~~
- [x] Integracija u manager dashboard
- [x] Testiranje
- [x] Bug fixing

**Status:** ✅ Sva funkcionalnost Faze 2 implementirana!
**Pokriva:** US-DM-002

---

**Sprint 3: Approval proces - Prvi nivo (2-3 dana)** ⏳ **NAKON Sprint 0!**

**NAPOMENA:** ⚠️ **NE POČINJATI dok se ne završi Sprint 0 (ispravljanje grešaka)!**

Dan 1:
- [ ] Kreiraj approveApplication i rejectApplication u api.ts
- [ ] Dodaj DaySchedule mock podatke
- [ ] Implementiraj getNextStatus logiku (SUBMITTED → APPROVED ili APPROVED_FIRST_LEVEL)

Dan 2:
- [ ] UI za odobrenje u /manager/requests
- [ ] Dialog s detaljima zahtjeva
- [ ] Prikaz balance-a zaposlenika
- [ ] Upozorenje o preklapanju s DaySchedule-om

Dan 3:
- [ ] Kreiranje USAGE ledger entry pri odobrenju
- [ ] Kreiranje DaySchedule zapisa pri odobrenju
- [ ] Testiranje workflow-a
- [ ] Bug fixing

**Deliverable:** Manager može odobriti/odbiti zahtjeve
**Pokriva:** US-DM-004, US-DM-005, BR-WF-003, BR-WF-005

---

**Sprint 4: Korekcija vraćanja dana (3-4 dana)** 🔴 **INOVACIJA!**

Dan 1-2:
- [ ] Implementiraj algoritam prilagodbe (4 scenarija)
- [ ] **KLJUČNO:** Vraćanje SVIH preostalih dana (ne samo preklopljenih)
- [ ] Kreiranje CORRECTION ledger entry

Dan 3:
- [ ] Brisanje DaySchedule zapisa originalnog zahtjeva
- [ ] Kreiranje novih DaySchedule zapisa
- [ ] Dodavanje zapisa u log originalnog zahtjeva

Dan 4:
- [ ] Izvještaj o prilagodbama (US-MGR-009)
- [ ] Testiranje svih scenarija
- [ ] Bug fixing

**Deliverable:** Automatska prilagodba GO pri odobrenju novog zahtjeva koji se preklapa
**Pokriva:** US-EMP-012B, US-VAL-007, US-MGR-008, BR-AUTO-001

---

**Sprint 5: Upravljanje alokacijama (3-4 dana)** ⏳

Dan 1:
- [ ] Kreiraj rutu /manager/allocations
- [ ] US-MGR-001: Lista zaposlenika s stanjem dana (PO tipu nedostupnosti)
- [ ] Filtriranje po odjelu managera

Dan 2:
- [ ] US-MGR-002: Dialog za dodjelu dana za novu godinu (PO tipu)
- [ ] Forma za unos godine i broja dana
- [ ] Kreiranje ALLOCATION ledger entry

Dan 3:
- [ ] US-MGR-003: Forma za izmjenu postojeće dodjele (PO tipu)
- [ ] Validacija (1-50 dana, ne može ispod iskorištenih)
- [ ] Kreiranje CORRECTION ledger entry

Dan 4:
- [ ] US-MGR-004: Pregled povijesti ledger-a (PO tipu)
- [ ] Tablica povijesti svih entries po godinama
- [ ] Filtriranje i eksport
- [ ] Testiranje

**Deliverable:** Manager može dodijeliti i mijenjati godišnje dane zaposlenicima
**Pokriva:** US-MGR-001, US-MGR-002, US-MGR-003, US-MGR-004

---

**Sprint 6: Evidencija bolovanja (2-3 dana)** ⏳

Dan 1:
- [ ] Kreiraj rutu /manager/sick-leaves
- [ ] US-MGR-005: Forma za novo bolovanje
- [ ] Odabir zaposlenika, datum početka, datum završetka (opcionalno)
- [ ] Status "Aktivno" ili "Završeno"

Dan 2:
- [ ] US-MGR-006: Lista aktivnih bolovanja
- [ ] Prikaz u kalendaru (od početka do danas za aktivna)
- [ ] DaySchedule zapis za datum početka (otvorena bolovanja)
- [ ] DaySchedule zapisi za sve dane (zatvorena bolovanja)

Dan 3:
- [ ] US-MGR-007: Zatvaranje aktivnog bolovanja
- [ ] Unos datuma završetka
- [ ] Kreiranje DaySchedule zapisa za sve dane
- [ ] Automatska prilagodba GO (poziv korekcije)
- [ ] Testiranje

**Deliverable:** Manager može evidentirati i zatvarati bolovanja
**Pokriva:** US-MGR-005, US-MGR-006, US-MGR-007

---

**Sprint 7-12: Poželjne funkcionalnosti (🟡)** - **Opcionalno**

- Sprint 7: Draft funkcionalnost (2-3 dana) - US-EMP-008, 010, 011, US-VAL-006
- Sprint 8: Employee kalendar (2-3 dana) - US-EMP-003
- Sprint 9: Drugi nivo odobrenja (2-3 dana) - US-GM-001, 002, 003, BR-WF-004
- Sprint 10: Detalji zahtjeva (1-2 dana) - US-EMP-012, US-DM-006
- Sprint 11: Pregled stanja po godinama (1-2 dana) - US-EMP-002
- Sprint 12: Dodatne funkcionalnosti (2-3 dana) - US-DM-007, 008, US-MGR-010

---

**Sprint 13-15: Nice-to-have (🟢)** - **Najniži prioritet**

- Sprint 13: Admin modul - Zaposlenici (2-3 dana) - US-ADM-001 do 005
- Sprint 14: Admin modul - Odjeli i praznici (2-3 dana) - US-ADM-006 do 013
- Sprint 15: UX polish (2-3 dana) - US-CMN-001, US-EMP-005, US-DM-003

---

**Kraj dokumenta**

---

**Pripremio:** AI Assistant  
**Datum:** 20.12.2024  
**Verzija:** 4.2  
**Status:** Ažurirano - **Sprint 3 VEĆINA ZAVRŠENA!** 🎉 Approval proces implementiran!

**Changelog:**
- **v4.2 (20.12.2024):** 🎉 **SPRINT 3 VEĆINA ZAVRŠEN!** - Approval proces (prvi nivo) implementiran
  - ✅ **useApprovalActions() hook** - centralizirana approval/rejection logika u api.ts
  - ✅ **approveApplication()** - potpuno implementirana s permissions, ledger, DaySchedule
  - ✅ **rejectApplication()** - potpuno implementirana s obaveznim komentarom
  - ✅ **canApprove() i canReject()** - permissions funkcije u application.ts
  - ✅ **getNextStatus()** - određivanje APPROVED vs APPROVED_FIRST_LEVEL
  - ✅ **shouldCreateLedgerEntry()** - odluka o ledger kreiranju
  - ✅ **useMockDaySchedules() hook** - state management za DaySchedule
  - ✅ **createDaySchedulesForApplication()** - kreiranje DaySchedule za razdoblje
  - ✅ **Manager Requests UI** - potpuno refaktorirano s approval dialogom
  - ✅ **Employee Requests UI** - prikaz razloga odbijanja (rejectionComment)
  - ✅ **Types** - dodana polja managerComment i rejectionComment
  - ⏳ **Sprint 3.1:** DaySchedule preklapanja + upozorenje (1 dan) - SLJEDEĆI KORAK
  - Napredak: 65% → **75%** 🎉
  - Manager Approval: 20% → **85%** ✅
  - Workflow logic: Parcijalno → **70%** ✅
  - DaySchedule management: 0% → **60%** ✅
- **v4.1 (20.12.2024):** ⚠️ **PRONAĐENE GREŠKE U IMPLEMENTACIJI** - dodana Faza 0 za ispravljanje
  - **KRITIČNO:** Dodana sekcija "Pronađene greške u implementaciji" na vrhu dokumenta
  - **Sprint 0:** Ispravljanje grešaka u validacijama (1 dan) - **MORA SE NAPRAVITI PRVO!**
  - **Greška #1:** `validateDateRange()` ne dopušta prošle datume za bolovanje (linija 26-31 u validation.ts)
  - **Greška #2:** Validacija ne provjerava preklapanje s DaySchedule-om (samo aktivne zahtjeve)
  - **Greška #3:** Provjera da se `calculateBalance()` uvijek poziva s `reasonId`
  - **Greška #4:** UI ne sprječava uređivanje ne-DRAFT zahtjeva
  - Ažurirane tablice prioriteta s Fazom 0 kao PRIORITET #1
  - Ažuriran sprint plan s Sprint 0 prije Sprint 3
  - Dodano upozorenje: Sprint 3 se NE SMIJE početi dok se ne završi Sprint 0
  - **Procjena:** +1 dan (ukupno 38-52 dana umjesto 37-51)
- **v4.0 (20.12.2024):** Ažurirano da u potpunosti pokriva sve User Stories iz user_stories.md
  - Dodana sekcija 0: Autentifikacija i session management
  - Dodana sekcija 2.5: Zajedničke funkcionalnosti (US-CMN-001 do US-CMN-007)
  - Proširena sekcija 2.1: Employee modul s detaljnim mapiranjem User Stories
  - Proširena sekcija 2.2: Manager modul s detaljnim mapiranjem User Stories (US-DM, US-MGR)
  - Proširena sekcija 2.3: General Manager modul s US-GM User Stories
  - Proširena sekcija 2.4: Admin modul s US-ADM User Stories
  - Proširena sekcija 3.1: Validacije s US-VAL User Stories
  - Proširena sekcija 3.3: Workflow s detaljnim statusom implementacije
  - Proširena sekcija 3.4: Automatizacija s fokusom na BR-AUTO-001 (INOVACIJA!)
  - Ažurirane success criteria s prioritiziranim User Stories
  - Ažurirane tablice prioriteta s mapiranjem na User Stories
  - Dodani detaljan sprint plan s mapiranjem User Stories
  - **Ključni fokus:** Korekcija vraćanja SVIH preostalih dana (ne samo preklopljenih)
- **v3.0 (20.12.2024):** Ažurirano nakon implementacije Faze 2 - Tablični kalendar za planiranje
- **v2.0 (20.12.2024):** Ažurirano nakon implementacije Faze 1 - Validacije i kalkulacije
- **v1.0 (20.12.2024):** Inicijalna analiza

**Sažetak User Stories pokrivenosti:**
- **76 User Stories ukupno**
- ✅ Potpuno implementirano: ~15 US (20%)
- ⚠️ Djelomično implementirano: ~10 US (13%) - **NEKI S GREŠKAMA!**
- ❌ Nije implementirano: ~51 US (67%)

**⚠️ KRITIČNI GAP-OVI (Must-have):**
0. 🔴 **Sprint 0: Ispravljanje grešaka** (1 dan) - **PRIORITET #1 - MORA BITI PRVO!**
   - BR-VAL-001: Ispravi validaciju datuma za bolovanje
   - BR-VAL-002: Dodaj validaciju preklapanja s DaySchedule-om
   - BR-VAL-003: Provjeri filtriranje po reasonId
   - US-VAL-006: Dodaj UI validaciju statusa za uređivanje
1. 🔴 Approval proces - Prvi nivo (US-DM-004, US-DM-005, BR-WF-003, BR-WF-005)
2. 🔴 Korekcija vraćanja dana (US-EMP-012B, US-VAL-007, US-MGR-008, BR-AUTO-001) - **INOVACIJA!**
3. 🔴 Upravljanje alokacijama (US-MGR-001, 002, 003, 004)
4. 🔴 Evidencija bolovanja (US-MGR-005, 006, 007)
5. 🔴 DaySchedule management (BR-AUTO-002)

**Prioritet za sljedeće:**
1. **Sprint 0: Ispravljanje grešaka (1 dan) - PRVO!**
2. Approval proces (2-3 dana)
3. Korekcija vraćanja dana (3-4 dana) - **INOVACIJA!**
4. Upravljanje alokacijama (3-4 dana)
5. Evidencija bolovanja (2-3 dana)