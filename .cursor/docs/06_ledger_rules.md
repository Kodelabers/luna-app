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

### 2.1) “Otvorena (aktivna) godina” (UI/UX konvencija)
Za `employeeId + unavailabilityReasonId`:
- **Otvorena (aktivna) godina** = godina koja je “otvorena” dodjelom (internal: postoji barem jedan `ALLOCATION` entry za tu godinu).
- Otvorena godina može imati stanje 0 (npr. sve je iskorišteno), ali i dalje je “otvorena”.
- U pravilu postoji **samo jedna** otvorena godina po vrsti odsutnosti i zaposleniku, i to je **najnovija** (zadnja).
- “Trenutna godina” (`currentYear`) za ova pravila računa se po **klijentskoj vremenskoj zoni** (kao i drugdje u aplikaciji).

### 2.2) Pravilo otvaranja godine (UX ograničenje)
- Ako već postoji otvorena godina `openYear`, nova dodjela (“otvaranje nove godine”) radi se isključivo za `openYear + 1`.
- Ne planira se više od 1 godine unaprijed: maksimalno se može otvoriti `currentYear + 1`.
- Ako otvorena godina ne postoji (npr. novi zaposlenik / još nema plana), početna godina se može izabrati u rasponu: `currentYear - 1`, `currentYear`, `currentYear + 1`.
  - Nakon što se prvi plan otvori, nadalje vrijedi pravilo “samo `openYear + 1`”.

### 2.4) UX pravilo: “stari plan” (stale openYear) i ponovno otvaranje bez prijenosa (GO)
Problem: ako je `openYear` jako star (npr. “zadnje planirano 2019.”), pravilo “otvori samo `openYear + 1`” vodi u loš UX (manager bi morao otvarati 2020, 2021, …) i ne odgovara realnim scenarijima (npr. višegodišnje neplaćeno odsustvo).

Zato uvodimo UX pravilo “stari plan”:
- Definicija (preporuka): `openYear` se smatra **stari plan (stale)** ako je `openYear < currentYear - 1`.
- Kad je `openYear` stale, u UI/validaciji se tretira kao da **ne postoji otvorena godina**.

Posljedice za “otvaranje godine” (specifično za GO — opcija A):
- Manager tada **bira početnu godinu** kao kod prvog plana: `currentYear - 1`, `currentYear`, `currentYear + 1`.
- Pri takvom “ponovnom otvaranju” **NE radi se automatski prijenos** iz stare godine u novu godinu.
  - Prijenos (TRANSFER) je rezerviran za **kontinuitet** kad se otvara `openYear + 1` (sekcija 8).
  - Stari saldo ostaje u povijesti (audit), ali se ne “vuče” kroz više godina u novi plan.

### 2.3) UI pravilo: koja se godina prikazuje u “Stanje dana”
- Standardni prikazi “Stanje dana” (dodijeljeno/iskorišteno/na čekanju/preostalo) se po defaultu računaju i prikazuju za **otvorenu (aktivnu) godinu** = `openYear`.
- “Trenutna godina” (`currentYear`) se koristi za UX/validacijska ograničenja otvaranja godine (npr. max `currentYear + 1`), ali **ne određuje** default godinu prikaza stanja.
- Iznimke gdje UI prikazuje druge godine:
  - “Pregled po godinama” (npr. UC-DAYS-02)
  - “Povijest promjena” (UC-DAYS-06)

## 3) Kada se knjiži
- **ALLOCATION**:
  - kad manager/admin dodijeli dane za godinu (po reasonu)
- **USAGE**:
  - kad zahtjev postane `APPROVED` i `UnavailabilityReason.hasPlanning = true`
  - ako zahtjev počinje u novoj godini bez ALLOCATION, dani se oduzimaju iz prethodne godine (vidi sekciju 7)
- **CORRECTION**:
  - kad se "vraćaju" dani zbog preklapanja i pregazivanja plana (samo relevantno za reason-e s `hasPlanning=true`)
  - kad manager ručno ispravlja dodjelu (increase/decrease)
- **TRANSFER**:
  - automatski prijenos preostalih dana između godina pri "otvaranju godine" (vidi sekciju 8)
  - koristi se u oba smjera: negativan `changeDays` iz stare godine, pozitivan u novu godinu

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

### 5.1) UI/UX: “Ukupno na raspolaganju” (pravo za godinu)
U UI korisnik mentalno gleda **pravo na dane za određenu godinu** (npr. GO) — tj. “koliko dana ima na raspolaganju”.

Da bismo izbjegli UX kontradikcije kod prijenosa (carryover), UI u tablicama **ne smije** prikazivati samo `ALLOCATION` kao "Dodijeljeno", jer prijenos iz prethodne godine u novoj godini dolazi kao pozitivan `TRANSFER` (vidi sekciju 8).

**Preporučeni naziv stupca u UI-u:** “Ukupno na raspolaganju” (ili “Pravo za godinu”).

**Definicija (kanonska, izvedena iz ledger agregata):**
- `balance = SUM(changeDays)` za godinu
- `used = abs(SUM(USAGE.changeDays))` za godinu
- `ukupnoNaRaspolaganju = balance + used`

Intuicija:
- `balance` je trenutno stanje (može biti manje zbog `USAGE`)
- dodavanjem `used` dobije se ukupna “količina” koja je bila dostupna za tu godinu (dodjela + prijenos + korekcije), bez obzira koliko je već potrošeno

**Korisna ekvivalentnost za provjeru:**
- `ukupnoNaRaspolaganju = preostalo + naCekanju + iskoristeno`

### 5.2) UI/UX: Zašto je "Dodijeljeno (ALLOCATION)" zbunjujuće kod prijenosa
Primjer:
- u novoj godini manager dodijeli 20 dana (`ALLOCATION +20`)
- iz prethodne godine se prenese 5 dana (u novoj godini `TRANSFER +5`, uz `note="prijenos iz prethodne godine"`)

Ako UI prikaže "Dodijeljeno = 20", a "Preostalo = 25", korisniku to izgleda pogrešno.
Zato u prikazima "Stanje dana" za otvorenu godinu preporučujemo:
- stupac "Ukupno na raspolaganju" = `balance + used`
- (opc.) dodatni tooltip/secondary tekst koji objašnjava da uključuje prenesene dane i ispravke (CORRECTION)

## 6) Korekcija kod preklapanja s DaySchedule
Kad novi zahtjev dođe u `APPROVED` i prepisuje `DaySchedule`:
- ako je prebrisani plan bio iz reason-a s `hasPlanning=true`:
  - upisati `CORRECTION` entry koji vraća dane prema dogovorenom pravilu (kanonsko pravilo ispod)

### 6.1 Kanonsko pravilo: "vrati sve preostale dane" (truncate)
Ovo pravilo se koristi kad event (npr. `SickLeave` ili drugi finalizirani događaj) prepisuje plan nastao iz `Application` koji ima `hasPlanning=true` i `applicationId` postoji u `DaySchedule`.

**Definicija intervala korekcije** (za jedan originalni `Application`):
- `correctionFrom = eventStartLocal` (početak eventa, npr. bolovanja)
- `correctionTo = eventEndLocal` (kraj eventa)

**VAŽNO:** Korekcija se radi **samo za DaySchedule zapise unutar intervala eventa**, ne za cijeli raspon originalnog zahtjeva.

Primjer:
- GO zahtjev: 8.1. - 15.1. (ima DaySchedule za sve dane)
- Bolovanje: 10.1. - 12.1.
- Korekcija: samo za 10., 11., 12. siječnja (3 radna dana)

**Efekti korekcije**:
- pronađi `DaySchedule` zapise s `applicationId` i `hasPlanning=true` u intervalu `[correctionFrom..correctionTo]`
- izbroji radne dane (bez vikenda/praznika) iz tih zapisa
- kreirati `UnavailabilityLedgerEntry`:
  - `type = CORRECTION`
  - `changeDays = +workdays`
  - `unavailabilityReasonId = originalApplication.unavailabilityReasonId`
- obrisati te `DaySchedule` zapise
- upisati `ApplicationLog(POST_APPROVAL_IMPACT_CHANGED)` na originalni `Application`

Time se originalni zahtjev (npr. GO) smatra "djelomično prekinut" za dane koji su se preklopili s bolovanjem.

### 6.2 SickLeave i korekcije (specifično)

**SickLeave ne troši dane** (nema `USAGE`). Ledger se dira samo kroz `CORRECTION` nad `hasPlanning=true` razlozima.

**OPENED (endDate=null)**:
- pri otvaranju bolovanja (`OPENED`) sustav **NE radi korekcije**
- **NE materijalizira DaySchedule** (ni za start dan)
- UI prikazuje "virtualni raspon" od start → danas koristeći `cell.sickLeave` podatke
- budući planirani dani (GO itd.) ostaju vidljivi i netaknuti

**CLOSED (endDate!=null)**:
- tek kod zatvaranja bolovanja sustav radi korekcije
- pronađi `DaySchedule` zapise s `applicationId` i `hasPlanning=true` **samo u rasponu bolovanja** `[startDate..endDate]`
- primijeni korekciju po pravilu 6.1 za te dane
- zatim materijaliziraj `DaySchedule` za bolovanje (svi dani u rasponu)

**CANCELLED**:
- `CANCELLED` je dozvoljen samo iz `OPENED` dok je `endDate=null`
- cancel **ne revert-a** korekcije (jer ih nema - korekcije se rade tek kod CLOSED)
- nema `DaySchedule` za brisati (jer OPENED ne kreira DaySchedule)

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
    - `type = TRANSFER`
    - `changeDays = +prevBalance` (dodaje prenesene dane iz prethodne godine)
    - `note = "prijenos iz prethodne godine"`

Napomene:
- `TRANSFER` se koristi u oba smjera (iz stare godine i u novu godinu); **smjer** se vidi iz znaka `changeDays` (+/-).
- `CORRECTION` je rezerviran za ručne ispravke i vraćanje dana kod preklapanja (sekcija 6).
- `note` je obavezan za ova dva automatska unosa (audit i UX).

### 8.1) Ograničenje prijenosa kod “stari plan” scenarija (GO)
Ako se godina “ponovno otvara” nakon stale `openYear` (vidi sekciju 2.4), automatski prijenos se **ne izvršava**.
U tom slučaju “otvaranje godine” se ponaša kao novi početak plana (bez carryover-a iz davnih godina).


