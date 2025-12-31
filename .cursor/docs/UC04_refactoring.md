# UC04 refactoring — “Stanje dana” (manager) UX bez promjene ledger pravila

Ovaj dokument daje upute za refaktoring administratorskog modula “Stanje dana i dodjele” (UC04) tako da bude intuitivan korisnicima, **bez ikakvih promjena Prisma modela i ledger poslovnih pravila**.

## Cilj
- Manager vidi jednostavan prikaz **prava na dane odsutnosti** (npr. GO) po zaposleniku.
- UI nema kontradikcije tipa “Dodijeljeno 20 / Preostalo 25” kad postoji prijenos iz prethodne godine.
- “Otvorena godina” (openYear) ostaje dostupna manageru kao signal “planirano do”, ali se prikazuje kao sekundarna informacija (badge/tekst uz zaposlenika).

## Ograničenja (ne dirati)
- Prisma schema je SSoT (ne mijenjati).
- Ledger pravila su SSoT (`/.cursor/docs/06_ledger_rules.md`).
- Nema promjene načina knjiženja: ALLOCATION/USAGE/TRANSFER/CORRECTION ostaju kako su.
- UI ne koristi interne termine (ledger/allocation/transfer/knjiženje); koristi isključivo korisničke pojmove (vidi `/.cursor/docs/09_terminology_glossary.md`).

## Problem (što danas zbunjuje)
U današnjem UI-u manager tablica prikazuje:
- "Dodijeljeno" = samo `ALLOCATION` u godini (npr. 20)
- "Preostalo" = `balance - pending`, gdje `balance = SUM(changeDays)` (npr. 25 ako je preneseno 5 dana)

Kod prijenosa (carryover) iz prethodne godine, preneseni dani se u novoj godini pojavljuju kao `TRANSFER +prevBalance` (uz `note="prijenos iz prethodne godine"`), pa je "Dodijeljeno (ALLOCATION)" manji od "Preostalo" i korisniku izgleda pogrešno.

## Ciljani UX (što korisnik treba vidjeti)
Tablica po zaposleniku (za odabranu vrstu odsutnosti) prikazuje:
- Zaposlenik (uz sekundarni signal “Planirano do: YYYY”)
- Odjel
- **Ukupno na raspolaganju** (pravo za godinu)
- Iskorišteno
- Na čekanju
- Preostalo
- Akcije (Dodjela / Ispravak / Povijest)

## Kanonske definicije metrika (bez promjene backend logike)
Za kombinaciju `employeeId + unavailabilityReasonId + openYear`:

- `balance = SUM(changeDays)` za tu godinu  
  (u kodu: `breakdown.balance`)
- `used = abs(SUM(USAGE.changeDays))` za tu godinu  
  (u kodu: `breakdown.used`)
- `pending` ostaje kako je danas (SUBMITTED + APPROVED_FIRST_LEVEL workdays za godinu početka perioda)  
  (u kodu: `breakdown.pending`)
- `remaining = balance - pending`  
  (u kodu: `breakdown.remaining`)

### Nova UI metrika: “Ukupno na raspolaganju”
**Definicija:**
- `ukupnoNaRaspolaganju = balance + used`

Intuicija: to je “pravo za godinu” (osnovna dodjela + preneseni dani + ispravci), neovisno o tome koliko je već potrošeno.

**Korisna provjera:**
- `ukupnoNaRaspolaganju = remaining + pending + used`

## Refactoring upute (konkretni koraci)

### 1) UI tablica (manager by reason)
Datoteka: `app/[organisationAlias]/administration/days-balance/_components/days-balance-table-client.tsx`

Promjene:
- Ukloniti zaseban stupac `activeYear`.
- U “employee” ćeliji dodati sekundarni prikaz openYear kao badge/tekst:
  - Ako `openYear != null`: “Planirano do: {openYear}”
  - Ako `openYear == null`: “nije planirano” (postojeći tekst se može iskoristiti)
- Stupac `allocated` zamijeniti novim stupcem (i prijevodom) “Ukupno na raspolaganju”:
  - Render vrijednosti: `emp.balance.breakdown.balance + emp.balance.breakdown.used`

Napomena:
- `breakdown.allocated` ostaje koristan za internu logiku (npr. “hasAllocation”), ali ne treba biti primarni broj u UI tablici za pravo na dane.

### 2) i18n ključevi
Datoteke: `messages/hr.json`, `messages/en.json`

Dodati nove ključeve (primjer):
- `daysBalance.totalAvailable`: “Ukupno na raspolaganju” / “Total available”
- `daysBalance.plannedThrough`: “Planirano do: {year}” / “Planned through: {year}”

Ako zadržavate postojeći `daysBalance.notPlanned`, može se koristiti kad `openYear` ne postoji.

### 3) Dokumentacija (da ostane konzistentno)
Već treba biti ažurirano/usklađeno kroz:
- `/.cursor/docs/06_ledger_rules.md` (sekcija 5.1 i 5.2)
- `/.cursor/docs/09_terminology_glossary.md` (standardni nazivi u “Stanje dana”)
- `/.cursor/docs/UC04-StanjeDanaDodjele.md` (UC04 use caseovi + UI napomene)
- `/.cursor/docs/user_stories.md` (US-MGR-001)

## Acceptance criteria (primjeri)
1) **Carryover slučaj**  
   - Osnovno dodijeljeno (ALLOCATION): 20  
   - Preneseno iz prethodne godine: 5 (u novoj godini CORRECTION +5)  
   - used=0, pending=0  
   - UI mora pokazati:  
     - “Ukupno na raspolaganju” = 25  
     - “Preostalo” = 25  

2) **S pendingom**  
   - ukupnoNaRaspolaganju=25, used=0, pending=3  
   - UI: remaining=22 (i sve je konzistentno: 25 = 22 + 3 + 0)

3) **S potrošnjom**  
   - ukupnoNaRaspolaganju=25, used=10, pending=2  
   - UI: remaining=13 (25 = 13 + 2 + 10)

4) **Bez otvorene godine**  
   - openYear=null  
   - UI prikazuje “nije planirano” uz zaposlenika  
   - Primarna akcija je “Dodjela” (otvaranje prve godine)


