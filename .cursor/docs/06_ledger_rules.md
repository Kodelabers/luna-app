# Ledger (UnavailabilityLedgerEntry) — pravila knjiženja

Ledger je jedini izvor istine za “alokacije, potrošnju, korekcije” po tipu nedostupnosti (reason) i godini.

## User-facing terminologija (UI)

Ovaj dokument opisuje **interni mehanizam**. U UI se ovo mora prikazivati kroz korisničke pojmove iz `/.cursor/docs/09_terminology_glossary.md`:

- UI koristi: **odsutnost**, **vrsta odsutnosti**, **stanje dana**, **dodijeljeno/iskorišteno/na čekanju/preostalo**
- UI ne koristi: *ledger, allocation/alokacija, usage, correction, transfer, knjiženje*
- `UnavailabilityLedgerEntry` se u UI-u prikazuje kao:
  - “Stanje dana” (agregat)
  - (opc.) “Povijest promjena” gdje se tipovi mapiraju: `ALLOCATION=Dodjela`, `USAGE=Iskorištenje`, `TRANSFER=Prijenos`, `CORRECTION=Ispravak`

## 1) Konvencija
- `changeDays`:
  - **pozitivno** = dodaje dane (ALLOCATION, TRANSFER, CORRECTION +)
  - **negativno** = troši dane (USAGE, CORRECTION -)

## 2) Godina (`year`)
Preporuka (prema user stories):
- godina se određuje prema **godini u kojoj period počinje** (startDate u client TZ → mapiran na godinu).
- Ako nema ALLOCATION za godinu u kojoj period počinje, validacija i knjiženje mogu se odnositi na prethodnu godinu (vidi sekciju 7).

Ako želite drugačije (split po godinama), to je zasebna odluka i mora biti dokumentirana.

## 3) Kada se knjiži
- **ALLOCATION**:
  - kad manager/admin dodijeli dane za godinu (po reasonu)
- **USAGE**:
  - kad zahtjev postane `APPROVED` i `UnavailabilityReason.hasPlanning = true`
  - ako zahtjev počinje u novoj godini bez ALLOCATION, dani se oduzimaju iz prethodne godine (vidi sekciju 7)
- **CORRECTION**:
  - kad se “vraćaju” dani zbog preklapanja i pregazivanja plana (samo relevantno za reason-e s `hasPlanning=true`)
- **TRANSFER**:
  - automatski prijenos preostalih dana u novu godinu pri “otvaranju godine” (vidi sekciju 8)

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

## 7) Korištenje preostalih dana iz prethodne godine

Ako korisnik kreira zahtjev za novu godinu (npr. siječanj 2026.) prije nego što je napravljena ALLOCATION za tu godinu, sustav omogućava korištenje preostalih dana iz prethodne godine (npr. 2025.).

### Pravila validacije
- Ako nema ALLOCATION za godinu u kojoj period počinje, provjeriti prethodnu godinu (`year - 1`)
- Ako u prethodnoj godini postoje preostali dani (balance > 0) i `workdays <= balance`, dopustiti kreiranje zahtjeva
- Ako u prethodnoj godini nema dovoljno dana ili nema preostalih dana, blokirati kreiranje zahtjeva

### Pravila knjiženja
- Pri odobrenju (`APPROVED`), ako nema ALLOCATION za godinu u kojoj period počinje, USAGE entry se kreira za prethodnu godinu
- USAGE entry za prethodnu godinu ima istu strukturu kao i za tekuću godinu (negativan `changeDays`, veza na `applicationId`)

### Napomena
- Ako nova godina još nije “otvorena” dodjelom (ALLOCATION) za tu godinu, sustav može privremeno dopustiti korištenje preostalih dana iz prethodne godine (pravila iznad).
- Kad manager “otvori” novu godinu dodjelom, preostali dani iz prethodne godine se automatski prenose (vidi sekciju 8).

## 8) Otvaranje nove godine i automatski prijenos preostalih dana

Kad manager doda dodjelu za novu godinu (ALLOCATION), sustav mora automatski prenijeti preostale dane iz prethodne godine za istu vrstu odsutnosti.

### Pravilo (high-level)
- Ako u prethodnoj godini postoji preostalo stanje \(balance > 0\), tada se:
  1) **prethodna godina zatvara** tako da joj stanje postane 0
  2) u novoj godini se to stanje **dodaje** na novo stanje (uz inicijalnu dodjelu koju je manager unio)

### Pravilo knjiženja (internal)
Za `employeeId + unavailabilityReasonId`:
- Izračunaj `prevBalance = SUM(changeDays)` za `year = newYear - 1`.
- Ako je `prevBalance > 0`:
  - U prethodnoj godini kreirati `UnavailabilityLedgerEntry`:
    - `year = newYear - 1`
    - `type = TRANSFER`
    - `changeDays = -prevBalance` (zatvara prethodnu godinu na 0)
    - `note = "prijenos u iduću godinu"`
  - U novoj godini kreirati `UnavailabilityLedgerEntry`:
    - `year = newYear`
    - `type = CORRECTION`
    - `changeDays = +prevBalance` (dodaje prenesene dane na novu godinu)
    - `note = "prijenos iz prethodne godine"`

Napomene:
- `TRANSFER` se ovdje koristi kao “prijenos između godina”; **smjer** se vidi iz znaka `changeDays`.
- `note` je obavezan za ova dva automatska unosa (audit i UX).


