# Ledger Refactoring — Pravila i implementacija

## Problem

Trenutna implementacija ima problem s računanjem "Ukupno na raspolaganju" jer uključuje **sve** CORRECTION entries, uključujući one koje vraćaju dane zbog preklapanja (bolovanje/prepisivanje). To dovodi do toga da zaposlenik izgleda kao da je imao više dana na raspolaganju nego što je stvarno imao na početku godine.

### Primjer problema

- ALLOCATION: +20 dana
- USAGE: -10 dana  
- CORRECTION (zbog bolovanja): +3 dana (vraćanje dana)
- **Trenutna formula**: `balance + used = (20 - 10 + 3) + 10 = 23 dana`
- **Očekivano**: 20 dana (samo ALLOCATION + TRANSFER, bez CORRECTION zbog preklapanja)

## Rješenje

### 1. Ručne korekcije → ALLOCATION

**Promjena**: Kada manager ručno mijenja dodjelu (`updateAllocation`), umjesto CORRECTION entry, koristiti **ALLOCATION entry**.

**Razlog**: Ručne korekcije mijenjaju osnovnu dodjelu za godinu i trebaju biti dio "ukupno na raspolaganju".

**Lokacija upisa**: `lib/services/days-balance.ts` → `updateAllocation()`

### 2. "Ukupno na raspolaganju" → bez CORRECTION

**Promjena**: "Ukupno na raspolaganju" računati samo iz:
- `SUM(ALLOCATION.changeDays)` 
- `SUM(TRANSFER.changeDays)` (prijenos iz prethodne godine)

**Isključiti**: CORRECTION entries (svi tipovi - i ručne i zbog preklapanja)

**Razlog**: CORRECTION entries zbog preklapanja vraćaju već potrošene dane, ne mijenjaju osnovnu dodjelu.

**Nova formula**:
```
ukupnoNaRaspolaganju = SUM(ALLOCATION) + SUM(TRANSFER)
```

## Što treba ažurirati

### 1. `lib/services/days-balance.ts`

#### 1.1. Funkcija `updateAllocation()` (linija ~684)

**Trenutno**: Kreira CORRECTION entry
```typescript
await db.unavailabilityLedgerEntry.create({
  type: "CORRECTION",
  note: `Ispravak dodjele ${adjustmentSign}${adjustmentDays} dana`,
  // ...
});
```

**Nova implementacija**: Kreirati ALLOCATION entry
```typescript
await db.unavailabilityLedgerEntry.create({
  type: "ALLOCATION",
  note: `Ispravak dodjele ${adjustmentSign}${adjustmentDays} dana`,
  // ...
});
```

**Napomena**: Validacija `currentAllocated` (linija ~758) treba uzeti u obzir samo ALLOCATION entries (bez CORRECTION):
```typescript
// Stara logika (uključuje CORRECTION):
const currentAllocated = ledgerEntries
  .filter((entry) => entry.type === "ALLOCATION" || entry.type === "CORRECTION")
  .reduce((sum, entry) => sum + entry.changeDays, 0);

// Nova logika (samo ALLOCATION):
const currentAllocated = ledgerEntries
  .filter((entry) => entry.type === "ALLOCATION")
  .reduce((sum, entry) => sum + entry.changeDays, 0);
```

#### 1.2. Funkcija `getDaysBalanceBreakdown()` (linija ~197)

**Dodati novo polje** `totalAvailable` u `DaysBalanceBreakdown` tip:

```typescript
export type DaysBalanceBreakdown = {
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  balance: number;
  totalAvailable: number; // NOVO
};
```

**Izračunati** `totalAvailable` u funkciji:

```typescript
// Calculate total available (ALLOCATION + TRANSFER only, no CORRECTION)
const totalAvailable = ledgerEntries
  .filter((entry) => entry.type === "ALLOCATION" || entry.type === "TRANSFER")
  .reduce((sum, entry) => sum + entry.changeDays, 0);
```

**Ažurirati return**:
```typescript
return {
  allocated,
  used,
  pending,
  remaining,
  balance,
  totalAvailable, // NOVO
};
```

#### 1.3. Funkcija `getDaysBalanceForEmployee()` (linija ~292)

**Ažurirati** prazan breakdown objekt (linija ~325):
```typescript
const breakdown = openYear !== null
  ? await getDaysBalanceBreakdown(...)
  : { allocated: 0, used: 0, pending: 0, remaining: 0, balance: 0, totalAvailable: 0 }; // Dodati totalAvailable: 0
```

### 2. UI komponente

#### 2.1. `app/[organisationAlias]/administration/days-balance/_components/days-balance-table-client.tsx`

**Trenutno** (linija ~152):
```typescript
const totalAvailable = emp.balance.breakdown.balance + emp.balance.breakdown.used;
```

**Nova implementacija**:
```typescript
const totalAvailable = emp.balance.breakdown.totalAvailable;
```

### 3. Dokumentacija

#### 3.1. `.cursor/docs/06_ledger_rules.md`

**Ažurirati sekciju 3) "Kada se knjiži"** (linija ~66):
```markdown
- **CORRECTION**:
  - kad se "vraćaju" dani zbog preklapanja i pregazivanja plana (samo relevantno za reason-e s `hasPlanning=true`)
  - ~~kad manager ručno ispravlja dodjelu (increase/decrease)~~ → **Koristi se ALLOCATION umjesto CORRECTION**
```

**Ažurirati sekciju 5.1) "Ukupno na raspolaganju"** (linija ~92):
```markdown
**Definicija (kanonska, izvedena iz ledger agregata):**
- `allocated = SUM(ALLOCATION.changeDays)` za godinu
- `transfer = SUM(TRANSFER.changeDays)` za godinu
- `ukupnoNaRaspolaganju = allocated + transfer`

**Napomena**: CORRECTION entries se **ne uključuju** u "ukupno na raspolaganju" jer vraćaju već potrošene dane, ne mijenjaju osnovnu dodjelu.
```

**Ažurirati sekciju 5.2)** (linija ~111):
```markdown
Zato u prikazima "Stanje dana" za otvorenu godinu preporučujemo:
- stupac "Ukupno na raspolaganju" = `allocated + transfer` (bez CORRECTION)
```

**Ažurirati sekciju 8)** (linija ~209):
```markdown
- `CORRECTION` je rezerviran **samo** za vraćanje dana kod preklapanja (sekcija 6).
- Ručne korekcije dodjele koriste `ALLOCATION` entry.
```

## Migracija postojećih podataka

**VAŽNO**: Postojeći CORRECTION entries koji su kreirani ručnim korekcijama (`note` počinje s `"Ispravak dodjele"`) **ne trebaju** se migrirati automatski jer:

1. Već su uključeni u `balance` (suma svih changeDays)
2. Nova logika za `totalAvailable` koristi samo ALLOCATION + TRANSFER
3. Postojeći CORRECTION entries ostaju u povijesti za audit

**Ako je potrebno**: Moguće je napraviti migracijski skript koji:
- Pronađe CORRECTION entries s `note` koji počinje s `"Ispravak dodjele"`
- Kreira ekvivalentne ALLOCATION entries
- Obriše stare CORRECTION entries (ili ih označi kao deprecated)

**Preporuka**: Ne migrirati automatski, već pustiti da se novi zapisi kreiraju s novom logikom.

## Testiranje

### Test scenariji

1. **Ručna korekcija (INCREASE)**:
   - ALLOCATION: +20
   - Ručna korekcija: +5
   - Očekivano: `totalAvailable = 25` (20 + 5)

2. **Ručna korekcija (DECREASE)**:
   - ALLOCATION: +20
   - Ručna korekcija: -3
   - Očekivano: `totalAvailable = 17` (20 - 3)

3. **Prijenos iz prethodne godine**:
   - ALLOCATION: +20
   - TRANSFER: +5 (iz prethodne godine)
   - Očekivano: `totalAvailable = 25` (20 + 5)

4. **Korekcija zbog bolovanja**:
   - ALLOCATION: +20
   - USAGE: -10
   - CORRECTION (bolovanje): +3
   - Očekivano: `totalAvailable = 20` (samo ALLOCATION, bez CORRECTION)

5. **Kombinacija**:
   - ALLOCATION: +20
   - TRANSFER: +5
   - Ručna korekcija: +2 (ALLOCATION)
   - USAGE: -10
   - CORRECTION (bolovanje): +3
   - Očekivano: `totalAvailable = 27` (20 + 5 + 2, bez CORRECTION)

## Checklist implementacije

- [ ] Ažurirati `updateAllocation()` da koristi ALLOCATION umjesto CORRECTION
- [ ] Ažurirati validaciju `currentAllocated` u `updateAllocation()` (samo ALLOCATION)
- [ ] Dodati `totalAvailable` u `DaysBalanceBreakdown` tip
- [ ] Implementirati izračun `totalAvailable` u `getDaysBalanceBreakdown()`
- [ ] Ažurirati prazan breakdown objekt u `getDaysBalanceForEmployee()`
- [ ] Ažurirati UI komponentu `days-balance-table-client.tsx`
- [ ] Ažurirati dokumentaciju `06_ledger_rules.md`
- [ ] Testirati sve scenarije iz sekcije "Testiranje"
