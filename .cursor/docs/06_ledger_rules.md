# Ledger (UnavailabilityLedgerEntry) — pravila knjiženja

Ledger je jedini izvor istine za “alokacije, potrošnju, korekcije” po tipu nedostupnosti (reason) i godini.

## 1) Konvencija
- `changeDays`:
  - **pozitivno** = dodaje dane (ALLOCATION, TRANSFER, CORRECTION +)
  - **negativno** = troši dane (USAGE, CORRECTION -)

## 2) Godina (`year`)
Preporuka (prema user stories):
- godina se određuje prema **godini u kojoj period počinje** (startDate u client TZ → mapiran na godinu).

Ako želite drugačije (split po godinama), to je zasebna odluka i mora biti dokumentirana.

## 3) Kada se knjiži
- **ALLOCATION**:
  - kad manager/admin dodijeli dane za godinu (po reasonu)
- **USAGE**:
  - kad zahtjev postane `APPROVED` i `UnavailabilityReason.hasPlanning = true`
- **CORRECTION**:
  - kad se “vraćaju” dani zbog preklapanja i pregazivanja plana (samo relevantno za reason-e s `hasPlanning=true`)
- **TRANSFER**:
  - prijenos u novu godinu (pravilo TBD ako nije definirano)

## 4) Veza na zahtjev
Ako je knjiženje nastalo zbog zahtjeva:
- postaviti `applicationId`

## 5) Kako računamo balance
Za prikaz stanja:
- \(balance = \sum changeDays\) filtrirano po:
  - `organisationId`
  - `employeeId`
  - `unavailabilityReasonId`
  - `year`

## 6) Korekcija kod preklapanja s DaySchedule
Kad novi zahtjev dođe u `APPROVED` i prepisuje `DaySchedule`:
- ako je prebrisani plan bio iz reason-a s `hasPlanning=true`:
  - upisati `CORRECTION` entry koji vraća dane prema dogovorenom pravilu (npr. “vrati sve preostale dane od početka novog eventa do kraja originalnog perioda”)

Detaljna semantika “vrati sve preostale dane” mora biti konzistentna s user stories i po mogućnosti eksplicitno opisana za slučajeve:
- preklapanje s `applicationId` u DaySchedule
- preklapanje bez `applicationId`


