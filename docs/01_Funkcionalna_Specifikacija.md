# Funkcionalna specifikacija
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Verzija:** 1.0  
**Datum:** 12.12.2024  
**Projekt:** Luna - Sustav za godišnji odmor  

---

## 1. UVOD

### 1.1 Svrha dokumenta
Ovaj dokument definira funkcionalnu specifikaciju sustava za upravljanje godišnjim odmorima i bolovanja. Dokument služi kao osnova za razvoj produkcijske verzije aplikacije.

### 1.2 Opseg sustava
Sustav omogućava kompletno upravljanje godišnjim odmorima i bolovanja zaposlenika unutar organizacije, uključujući:
- Administraciju organizacijske strukture (odjeli, zaposlenici, praznici)
- Kreiranje i odobravanje zahtjeva za godišnji odmor
- Evidenciju bolovanja i automatsku prilagodbu godišnjih odmora
- Pregled i planiranje godišnjih odmora na razini odjela

### 1.3 Ciljna publika
- Product Owner i Project Manager
- Frontend i backend developeri
- QA tim
- UI/UX dizajneri
- Tehnički arhitekti

---

## 2. PREGLED SUSTAVA

### 2.1 Opis sustava
Sustav je web aplikacija za upravljanje godišnjim odmorima i bolovanja. Sustav omogućava:
- Centralizirano upravljanje zaposlenicima i organizacijskom strukturom
- Automatiziran proces zahtjevanja i odobravanja godišnjih odmora
- Inteligentnu validaciju zahtjeva (preklapanja, dostupnost dana, praznici)
- Evidenciju bolovanja s automatskim prilagodbama godišnjih odmora
- Vizualni pregled planiranih odmora za menadžere/odobravatelje

### 2.2 Korisničke uloge

#### 2.2.1 Administrator (ADMIN)
- **Opis:** Administrira organizacijsku strukturu i osnovne postavke sustava
- **Pristup:** Potpuni pristup svim administratorskim funkcijama
- **Odgovornosti:**
  - Upravljanje zaposlenicima (dodavanje, uređivanje, deaktivacija)
  - Upravljanje odjelima
  - Dodjeljivanje managera odjelima (Department Manager / General Manager)
  - Upravljanje praznicima
  - Konfiguracija tipova nedostupnosti (UnavailabilityReason)
  - Pregled statistika sustava

#### 2.2.2 Department Manager (Voditelj odjela)
- **Opis:** Odobrava zahtjeve zaposlenika u svom odjelu (prvi nivo odobrenja)
- **Pristup:** Pristup samo svom odjelu
- **Odgovornosti:**
  - Pregled zahtjeva zaposlenika svog odjela
  - Prvo odobrenje zahtjeva (SUBMITTED → APPROVED ili APPROVED_FIRST_LEVEL)
  - Odbijanje zahtjeva na prvom nivou
  - Pregled kalendara godišnjih odmora svog odjela
  - Upravljanje godišnjim alokacijama zaposlenika svog odjela
  - Evidencija bolovanja zaposlenika svog odjela
- **Napomena:** Ne može odobravati vlastite zahtjeve

#### 2.2.3 General Manager (Opći voditelj)
- **Opis:** Odobrava zahtjeve na drugom nivou za sve odjele u organizaciji
- **Pristup:** Pristup svim odjelima i zahtjevima u organizaciji
- **Odgovornosti:**
  - Pregled svih zahtjeva u organizaciji
  - Drugo odobrenje zahtjeva (APPROVED_FIRST_LEVEL → APPROVED)
  - Odbijanje zahtjeva na drugom nivou
  - Pregled kalendara svih odjela
  - Upravljanje godišnjim alokacijama za sve zaposlenike
  - Evidencija bolovanja za sve zaposlenike
  - Strateški pregled planiranja nedostupnosti

#### 2.2.4 Zaposlenik (Employee)
- **Opis:** Kreira zahtjeve za godišnji odmor i druge vrste nedostupnosti
- **Pristup:** Pristup vlastitim podacima i zahtjevima
- **Odgovornosti:**
  - Kreiranje zahtjeva za godišnji odmor i druge vrste nedostupnosti
  - Praćenje statusa vlastitih zahtjeva
  - Pregled preostalih dana godišnjeg odmora
  - Pregled povijesti godišnjih odmora

---

## 3. FUNKCIONALNE ZAHTJEVE

### 3.1 ADMINISTRATORSKI MODUL

#### 3.1.1 Upravljanje zaposlenicima

**FR-ADM-001: Dodavanje novog zaposlenika**
- **Opis:** Administrator može dodati novog zaposlenika u sustav
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - Ime (obavezno)
  - Prezime (obavezno)
  - Email (obavezno, jedinstveno)
  - Odjel (opcionalno)
  - Broj dana godišnjeg odmora (obavezno, default 20)
  - Status (aktivan/neaktivan)
- **Izlaz:** Kreiran novi korisnički račun zaposlenika
- **Validacije:**
  - Email mora biti validan i jedinstveni u sustavu
  - Broj dana mora biti pozitivan broj (1-50)
  - Ime i prezime ne smiju biti prazni
- **Business logika:**
  - Prilikom kreiranja automatski se kreira alokacija za tekuću godinu
  - Default broj dana je 20
  - Status je automatski postavljen na "aktivan"

**FR-ADM-002: Uređivanje zaposlenika**
- **Opis:** Administrator može urediti podatke zaposlenika
- **Prioritet:** Kritičan
- **Mogućnosti:**
  - Izmjena osnovnih podataka (ime, prezime, email)
  - Promjena odjela
  - Izmjena broja dana godišnjeg odmora za tekuću godinu
  - Aktivacija/deaktivacija zaposlenika
- **Ograničenja:**
  - Email se može promijeniti samo ako je jedinstveni u sustavu
  - Ne može se umanjiti broj dana ispod već iskorištenih dana

**FR-ADM-003: Deaktivacija zaposlenika**
- **Opis:** Administrator može deaktivirati zaposlenika
- **Prioritet:** Visok
- **Efekti:**
  - Zaposlenik više ne može pristupiti sustavu
  - Postojeći podaci i zahtjevi ostaju vidljivi
  - Zaposlenik ostaje vidljiv u povijesnim izvještajima

**FR-ADM-004: Pregled liste zaposlenika**
- **Opis:** Administrator vidi listu svih zaposlenika
- **Prioritet:** Kritičan
- **Funkcionalnosti:**
  - Pretraga po imenu, prezimenu, emailu
  - Filtriranje po odjelu
  - Filtriranje po statusu (aktivan/neaktivan)
  - Sortiranje po različitim poljima
  - Paginacija (ako ima više od 50 zapisa)

#### 3.1.2 Upravljanje odjelima

**FR-ADM-005: Kreiranje odjela**
- **Opis:** Administrator može kreirati novi odjel
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - Naziv odjela (obavezno, jedinstveni)
  - Opis (opcionalno)
  - Odobravatelji (opcionalno, lista zaposlenika)
  - Zaposlenici (opcionalno, lista zaposlenika)
- **Validacije:**
  - Naziv ne smije biti prazan
  - Naziv mora biti jedinstveni u sustavu
  - Odobravatelj mora biti aktivan zaposlenik

**FR-ADM-006: Uređivanje odjela**
- **Opis:** Administrator može urediti postojeći odjel
- **Prioritet:** Kritičan
- **Mogućnosti:**
  - Izmjena naziva i opisa
  - Dodavanje/uklanjanje odobravatelja
  - Dodavanje/uklanjanje zaposlenika
  - Deaktivacija odjela

**FR-ADM-007: Dodjeljivanje odobravatelja odjelu**
- **Opis:** Administrator dodeljuje jednog ili više odobravatelja odjelu
- **Prioritet:** Kritičan
- **Business logika:**
  - Jedan odjel može imati više odobravatelja
  - Jedan zaposlenik može biti odobravatelj za više odjela
  - Odobravatelj automatski dobiva ulogu "Approver" u sustavu

#### 3.1.3 Upravljanje praznicima

**FR-ADM-008: Dodavanje praznika**
- **Opis:** Administrator može dodati praznik u kalendar
- **Prioritet:** Visok
- **Ulazni podaci:**
  - Naziv praznika (obavezno)
  - Datum (obavezno)
  - Tip: Ponavljajući ili jednokratni (obavezno)
  - Godina (obavezno za jednokratne)
- **Validacije:**
  - Datum ne smije biti u prošlosti (za novu godinu)
  - Naziv ne smije biti prazan

**FR-ADM-009: Uređivanje praznika**
- **Opis:** Administrator može urediti postojeći praznik
- **Prioritet:** Srednji
- **Ograničenja:**
  - Ne mogu se uređivati praznici iz prošlosti

**FR-ADM-010: Brisanje praznika**
- **Opis:** Administrator može obrisati praznik
- **Prioritet:** Srednji
- **Efekti:**
  - Datum prestaje biti isključen iz kalkulacije radnih dana
  - Postojeći zahtjevi se ne mijenjaju retroaktivno

**FR-ADM-011: Uvoz praznika za novu godinu**
- **Opis:** Administrator može masovno uvesti praznike za nadolazeću godinu
- **Prioritet:** Nizak (nice-to-have)
- **Format:** Excel ili CSV datoteka s kolonama: Naziv, Datum, Tip

---

### 3.2 MODUL ZAPOSLENIKA

#### 3.2.1 Dashboard zaposlenika

**FR-EMP-001: Pregled dashboarda**
- **Opis:** Zaposlenik vidi pregled svojih godišnjih odmora
- **Prioritet:** Kritičan
- **Prikazane informacije:**
  - Ukupno dana godišnjeg odmora (za tekuću godinu)
  - Iskorišteni dani
  - Preostali dani (računajući i zahtjeve na čekanju)
  - Lista aktivnih zahtjeva sa statusima
  - Kalendar s odobrenim godišnjim odmorima
  - Brzi pregled sljedećeg planiranog odmora

**FR-EMP-002: Kalendarski prikaz**
- **Opis:** Zaposlenik vidi vlastite godišnje odmore na kalendaru
- **Prioritet:** Visok
- **Vrste prikaza:**
  - Mjesečni prikaz
  - Tjedni prikaz
- **Označavanje:**
  - Zeleno: Odobreni godišnji odmor
  - Žuto: Zahtjev na čekanju
  - Sivo: Praznici
  - Crveno: Vikendi

#### 3.2.2 Kreiranje zahtjeva za godišnji odmor

**FR-EMP-003: Kreiranje novog zahtjeva**
- **Opis:** Zaposlenik može kreirati zahtjev za godišnji odmor ili drugu vrstu nedostupnosti
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - Tip nedostupnosti (UnavailabilityReason) - obavezno
  - Datum početka (obavezno)
  - Datum završetka (obavezno)
  - Napomena (opcionalno, max 500 znakova)
- **Automatske kalkulacije:**
  - Broj radnih dana (isključujući vikende i praznike)
  - Preostali dani nakon ovog zahtjeva (za tipove s hasPlanning=true)
- **Validacije:** (vidi poglavlje 4 - Poslovna pravila)
- **Statusni tokovi (ovisno o konfiguraciji UnavailabilityReason):**
  
  **1. Bez odobrenja (needApproval = false):**
  ```
  DRAFT → submit() → APPROVED (konačno)
  ```
  
  **2. Jednostruko odobrenje (needApproval = true, needSecondApproval = false):**
  ```
  DRAFT → submit() → SUBMITTED → approve() → APPROVED (konačno)
                              ↓
                          REJECTED
  ```
  
  **3. Dvostuko odobrenje (needApproval = true, needSecondApproval = true):**
  ```
  DRAFT → submit() → SUBMITTED → approve1() → APPROVED_FIRST_LEVEL → approve2() → APPROVED (konačno)
                              ↓                          ↓
                          REJECTED              REJECTED
  ```
  
  **4. Otkazivanje:**
  ```
  APPROVED → cancel() → CANCELLED
  ```

**FR-EMP-004: Spremanje kao draft**
- **Opis:** Zaposlenik može spremiti zahtjev kao draft
- **Prioritet:** Srednji
- **Funkcionalnost:**
  - Zahtjev nije vidljiv odobravatelju
  - Zahtjev ne rezervira dane
  - Zaposlenik može kasnije urediti i poslati na odobrenje

**FR-EMP-005: Slanje na odobrenje**
- **Opis:** Zaposlenik šalje draft zahtjev na odobrenje
- **Prioritet:** Kritičan
- **Efekti:**
  - Status se mijenja u "Pending"
  - Zahtjev postaje vidljiv odobravatelju
  - Dani se privremeno rezerviraju
  - (Opciono) Odobravatelj dobiva notifikaciju

**FR-EMP-006: Uređivanje draft zahtjeva**
- **Opis:** Zaposlenik može urediti zahtjev koji je u draft statusu
- **Prioritet:** Visok
- **Ograničenja:**
  - Mogu se uređivati samo zahtjevi sa statusom "Draft"
  - Pending, Approved i Rejected zahtjevi se ne mogu uređivati

**FR-EMP-007: Brisanje draft zahtjeva**
- **Opis:** Zaposlenik može obrisati zahtjev u draft statusu
- **Prioritet:** Srednji
- **Ograničenja:**
  - Mogu se brisati samo zahtjevi u statusu "Draft"

#### 3.2.3 Pregled zahtjeva

**FR-EMP-009: Lista vlastitih zahtjeva**
- **Opis:** Zaposlenik vidi listu svojih svih zahtjeva
- **Prioritet:** Kritičan
- **Prikazane informacije:**
  - Datum razdoblja
  - Broj dana
  - Status (sa statusnom bojom)
  - Komentar odobravatelja (ako postoji)
  - Datum kreiranja
  - Datum odobrenja/odbijanja
- **Filtriranje:**
  - Po statusu
  - Po godini
  - Po datumu kreiranja
- **Sortiranje:**
  - Po datumu početka (default)
  - Po statusu
  - Po datumu kreiranja

**FR-EMP-010: Detalji zahtjeva**
- **Opis:** Zaposlenik može vidjeti detalje zahtjeva
- **Prioritet:** Visok
- **Prikazane informacije:**
  - Svi podaci zahtjeva
  - Povijest promjena statusa
  - Komentar voditelja
  - Ime odobravatelja (ako je odobren)
  - Svi timestampovi

#### 3.2.4 Evidencija bolovanja (za zaposlenika)

**FR-EMP-011: Pregled vlastitih bolovanja**
- **Opis:** Zaposlenik vidi evidenciju svojih bolovanja
- **Prioritet:** Srednji
- **Prikazane informacije:**
  - Datum početka
  - Datum završetka (ako je završeno)
  - Status (Aktivno/Završeno)
  - Trajanje u danima
  - Eventualni utjecaj na godišnje odmore
- **Napomena:** Bolovanje evidentirano samo od strane odobravatelja

---

### 3.3 MODUL ODOBRAVATELJA

#### 3.3.1 Dashboard odobravatelja

**FR-APP-001: Pregled zahtjeva na čekanju**
- **Opis:** Odobravatelj vidi sve zahtjeve na čekanju u svom odjelu
- **Prioritet:** Kritičan
- **Prikazane informacije:**
  - Ime zaposlenika
  - Datum razdoblja
  - Broj dana
  - Preostali dani zaposlenika
  - Datum kreiranja zahtjeva
  - Eventualna napomena zaposlenika
- **Sortiranje:**
  - Po datumu kreiranja (default - najstariji prvo)
  - Po datumu početka odmora
  - Po imenu zaposlenika

**FR-APP-002: Tablični kalendarski prikaz**
- **Opis:** Odobravatelj vidi tablični prikaz svih zaposlenika i njihovih odmora
- **Prioritet:** Kritičan
- **Format:**
  - Retci: Zaposlenici odjela
  - Stupci: Dani u odabranom razdoblju
  - Ćelije: Status za svaki dan
- **Označavanje:**
  - Zeleno: Odobren godišnji odmor
  - Žuto: Zahtjev na čekanju
  - Narančasto: Bolovanje
  - Sivo: Vikend/praznik
  - Bijelo: Radni dan
- **Konfiguracija prikaza:**
  - Tjedan (default)
  - Mjesec
  - Prilagođeno razdoblje (max 3 mjeseca)

**FR-APP-003: Pregled alokacija zaposlenika**
- **Opis:** Odobravatelj vidi pregled godišnjih alokacija svih zaposlenika
- **Prioritet:** Visok
- **Prikazane informacije:**
  - Ime zaposlenika
  - Ukupno dana (za tekuću/odabranu godinu)
  - Iskorišteno dana
  - Na čekanju dana
  - Preostalo dana
- **Funkcionalnosti:**
  - Sortiranje po različitim poljima
  - Eksport u Excel/CSV
  - Vizualni indikator ako je preostalo < 5 dana

#### 3.3.2 Odobravanje zahtjeva

**FR-APP-004: Odobravanje zahtjeva**
- **Opis:** Odobravatelj može odobriti zahtjev
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - ID zahtjeva
  - Komentar (opcionalno, max 500 znakova)
- **Efekti:**
  - Status se mijenja u "Approved"
  - Dani se trajno rezerviraju
  - Timestamp odobrenja i ID odobravatelja se pohranjuju
  - (Opciono) Zaposlenik dobiva notifikaciju

**FR-APP-005: Odbijanje zahtjeva**
- **Opis:** Odobravatelj može odbiti zahtjev
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - ID zahtjeva
  - Razlog odbijanja (obavezno, max 500 znakova)
- **Efekti:**
  - Status se mijenja u "Rejected"
  - Dani se oslobađaju
  - Zaposlenik vidi razlog odbijanja
  - (Opciono) Zaposlenik dobiva notifikaciju

#### 3.3.3 Upravljanje alokacijama

**FR-APP-008: Dodjela godišnjih dana za novu godinu**
- **Opis:** Odobravatelj dodeljuje dane godišnjeg odmora zaposlenicima za novu godinu
- **Prioritet:** Kritičan
- **Mogućnosti:**
  - Pojedinačna dodjela po zaposleniku
  - Masovna dodjela za sve zaposlenike odjela
  - Kopiranje iz prethodne godine
- **Validacije:**
  - Broj dana mora biti između 1 i 50
  - Ne može se dodjeljivati za prošle godine

**FR-APP-009: Izmjena alokacije tekuće godine**
- **Opis:** Odobravatelj može izmijeniti broj dana za tekuću godinu
- **Prioritet:** Visok
- **Ograničenja:**
  - Ne može se smanjiti ispod već iskorištenih dana
  - Promjena se logira u audit trail
- **Efekti:**
  - Automatska rekalibracija preostalih dana

**FR-APP-010: Pregled povijesti alokacija**
- **Opis:** Odobravatelj vidi povijest alokacija zaposlenika
- **Prioritet:** Srednji
- **Prikazane informacije:**
  - Godina
  - Ukupno dodeljeno dana
  - Iskorišteno
  - Preostalo (na kraju godine)
  - Datum dodjele

#### 3.3.4 Upravljanje bolovanja

**FR-APP-011: Evidencija novog bolovanja**
- **Opis:** Odobravatelj evidentira bolovanje zaposlenika
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - Zaposlenik (obavezno)
  - Datum početka (obavezno)
  - Datum završetka (opcionalno - ako je još aktivno)
  - Napomena (opcionalno)
  - Medicinska dokumentacija (opcionalno, upload datoteke)
- **Validacije:**
  - Datum početka ne može biti u budućnosti
  - Datum završetka mora biti nakon datuma početka
  - Zaposlenik mora biti aktivan

**FR-APP-012: Automatska prilagodba godišnjih odmora**
- **Opis:** Prilikom unosa bolovanja sustav automatski prilagođava odobrene godišnje odmore
- **Prioritet:** Kritičan
- **Business logika:**
  - Sustav provjerava preklapanje bolovanja s odobrenim godišnjim odmorima
  - **Slučaj 1 - Potpuno preklapanje:** Zahtjev se automatski otkazuje, dani se vraćaju u alokaciju
  - **Slučaj 2 - Djelomično preklapanje na početku:** Početni datum godišnjeg se pomiče
  - **Slučaj 3 - Djelomično preklapanje na kraju:** Završni datum godišnjeg se pomiče
  - **Slučaj 4 - Preklapanje u sredini:** Završni datum godišnjeg se skraćuje (ostaje prvi dio)
- **Efekti:**
  - Automatska izmjena zahtjeva za godišnji
  - Vraćanje preklopljenih dana u alokaciju
  - Odobravatelj dobiva izvještaj o svim prilagodbama
  - U komentaru zahtjeva se bilježi automatska prilagodba

**FR-APP-013: Zatvaranje aktivnog bolovanja**
- **Opis:** Odobravatelj zatvara aktivno bolovanje unošenjem datuma završetka
- **Prioritet:** Visok
- **Ulazni podaci:**
  - ID bolovanja
  - Datum završetka (obavezno)
  - Dodatna napomena (opcionalno)
- **Validacije:**
  - Datum završetka mora biti nakon datuma početka
  - Datum završetka ne može biti u budućnosti

**FR-APP-014: Lista bolovanja odjela**
- **Opis:** Odobravatelj vidi listu svih bolovanja u odjelu
- **Prioritet:** Visok
- **Prikazane informacije:**
  - Ime zaposlenika
  - Datum početka i završetka
  - Status (Aktivno/Završeno)
  - Trajanje
  - Unio
  - Datum unosa
- **Filtriranje:**
  - Po statusu (Aktivno/Završeno)
  - Po zaposleniku
  - Po datumu razdoblja
  - Po godini

**FR-APP-015: Uređivanje bolovanja**
- **Opis:** Odobravatelj može urediti postojeće bolovanje
- **Prioritet:** Srednji
- **Mogućnosti:**
  - Izmjena datuma
  - Izmjena napomene
  - Dodavanje medicinske dokumentacije
- **Ograničenja:**
  - Izmjena datuma pokreće ponovnu provjeru preklapanja s godišnjim odmorima

**FR-APP-016: Brisanje bolovanja**
- **Opis:** Odobravatelj može obrisati pogrešno evidentirano bolovanje
- **Prioritet:** Nizak
- **Efekti:**
  - Vraćanje eventualnih prilagodbi godišnjih odmora
  - Vraćanje dana u alokaciju (ako su bili vraćeni)
- **Ograničenja:**
  - Može se brisati samo bolovanje iz trenutne ili prethodne godine
  - Brisanje se logira u audit trail

#### 3.3.5 Planiranje i izvještavanje

**FR-APP-017: Planiranje godišnjih odmora**
- **Opis:** Odobravatelj ima uvid u planiranje odmora odjela
- **Prioritet:** Visok
- **Funkcionalnosti:**
  - Vizualni pregled preklapanja odmora
  - Identifikacija kritičnih razdoblja (previše ljudi na odmoru)
  - Eksport plana u PDF/Excel

**FR-APP-018: Statistika odjela**
- **Opis:** Odobravatelj vidi statistiku korištenja godišnjih odmora
- **Prioritet:** Srednji
- **Metrike:**
  - Broj aktivnih/odobrenih/odbijenih zahtjeva

**FR-APP-019: Eksport izvještaja**
- **Opis:** Odobravatelj može eksportirati izvještaje
- **Prioritet:** Nizak (nice-to-have)
- **Formati:**
  - Excel
  - PDF
  - CSV

---

### 3.4 ZAJEDNIČKI FUNKCIONALNI ZAHTJEVI

#### 3.4.1 Autentifikacija i autorizacija

**FR-AUTH-001: Prijava u sustav**
- **Opis:** Korisnici se prijavljuju sa email i lozinkom
- **Prioritet:** Kritičan
- **Ulazni podaci:**
  - Email (obavezno)
  - Lozinka (obavezno)
- **Validacije:**
  - Email mora biti validan
  - Kombinacija mora postojati u sustavu
  - Korisnički račun mora biti aktivan
- **Sigurnost:**
  - Lozinka mora biti hashirana (bcrypt/argon2)
  - Rate limiting (max 5 pokušaja u 15 minuta)
  - Session timeout nakon 8 sati neaktivnosti

**FR-AUTH-002: Odjava iz sustava**
- **Opis:** Korisnici se mogu odjaviti iz sustava
- **Prioritet:** Kritičan
- **Efekti:**
  - Brisanje aktivne sesije
  - Redirect na login stranicu

**FR-AUTH-003: Zaboravljena lozinka**
- **Opis:** Korisnici mogu zatražiti reset lozinke
- **Prioritet:** Visok
- **Tok:**
  1. Korisnik unosi email
  2. Sustav šalje reset link na email (ako postoji)
  3. Link je validan 24h
  4. Korisnik postavlja novu lozinku
- **Sigurnost:**
  - Token je jednokratni i expira nakon 24h
  - Lozinka mora zadovoljiti sigurnosne zahtjeve

**FR-AUTH-004: Promjena lozinke**
- **Opis:** Korisnici mogu promijeniti vlastitu lozinku
- **Prioritet:** Visok
- **Ulazni podaci:**
  - Stara lozinka (obavezno)
  - Nova lozinka (obavezno)
  - Potvrda nove lozinke (obavezno)
- **Validacije:**
  - Stara lozinka mora biti točna
  - Nova lozinka mora zadovoljiti sigurnosne zahtjeve
  - Nova i potvrda se moraju poklapati

**FR-AUTH-005: Role-based access control (RBAC)**
- **Opis:** Sustav ograničava pristup prema ulogama
- **Prioritet:** Kritičan
- **Pravila:**
  - Administrator: Pristup svim administratorskim funkcijama
  - Odobravatelj: Pristup funkcijama odobrenja za svoj odjel
  - Zaposlenik: Pristup samo vlastitim podacima

#### 3.4.2 Korisnički profil

**FR-PROFILE-001: Pregled vlastitog profila**
- **Opis:** Korisnici vide vlastite podatke
- **Prioritet:** Visok
- **Prikazane informacije:**
  - Ime i prezime
  - Email
  - Odjel
  - Uloga
  - Broj dana godišnjeg (za zaposlenike)

**FR-PROFILE-002: Uređivanje profila**
- **Opis:** Korisnici ne mogu urediti podatke
- **Prioritet:** Srednji
- **Ograničenja:**
  - Ne mogu mijenjati ulogu
  - Ne mogu mijenjati odjel
  - Ne mogu mijenjati broj dana godišnjeg

#### 3.4.3 Notifikacije

**FR-NOTIF-001: Email notifikacije**
- **Opis:** Sustav šalje email notifikacije za ključne događaje
- **Prioritet:** Srednji (nice-to-have)
- **Eventi:**
  - Zaposlenik: Zahtjev odobren/odbijen
  - Odobravatelj: Novi zahtjev na čekanju
  - Administrator: Kritičan događaj u sustavu
- **Konfiguracija:**
  - Korisnici mogu uključiti/isključiti notifikacije

#### 3.4.4 Audit trail

**FR-AUDIT-001: Logiranje akcija**
- **Opis:** Sustav logira sve kritične akcije korisnika
- **Prioritet:** Visok
- **Logirane akcije:**
  - Kreiranje/uređivanje/brisanje zaposlenika
  - Kreiranje/uređivanje/brisanje odjela
  - Odobravanje/odbijanje zahtjeva
  - Izmjena alokacija
  - Evidencija bolovanja
- **Podaci:**
  - Timestamp
  - Korisnik koji je izvršio akciju
  - Tip akcije
  - Stare i nove vrijednosti (za izmjene)

**FR-AUDIT-002: Pregled audit loga**
- **Opis:** Administrator može pregledati audit log
- **Prioritet:** Srednji
- **Filtriranje:**
  - Po korisniku
  - Po tipu akcije
  - Po datumu
  - Po entitetu (zaposlenik, zahtjev, odjel...)

---

## 4. NEFUNKCIONALNI ZAHTJEVI

### 4.1 Performanse

**NFR-PERF-001: Vrijeme učitavanja stranica**
- Sve stranice moraju se učitati u manje od 2 sekunde (pri normalnoj vezi)

**NFR-PERF-002: Responzivnost**
- Akcije korisnika moraju imati feedback u manje od 500ms

**NFR-PERF-003: Skalabilnost**
- Sustav mora podržavati najmanje 1000 aktivnih korisnika
- Sustav mora podržavati najmanje 10,000 zahtjeva godišnje

### 4.2 Sigurnost

**NFR-SEC-001: Enkripcija podataka**
- Svi osjetljivi podaci moraju biti enkriptirani u bazi (at-rest encryption)
- Sva komunikacija mora biti preko HTTPS (in-transit encryption)

**NFR-SEC-002: Zaštita od napada**
- Zaštita od SQL injection
- Zaštita od XSS napada
- Zaštita od CSRF napada
- Rate limiting na API endpoints

**NFR-SEC-003: Backup i recovery**
- Dnevni automatski backup baze podataka
- Recovery time objective (RTO): 4 sata
- Recovery point objective (RPO): 24 sata

### 4.3 Korisničko iskustvo

**NFR-UX-001: Responsive design**
- Aplikacija mora biti upotrebljiva na desktop, tablet i mobile uređajima
- Minimalna podržana rezolucija: 1024x768

**NFR-UX-002: Browser kompatibilnost**
- Podrška za Chrome, Firefox, Safari, Edge (najnovije 2 verzije)

**NFR-UX-003: Pristupačnost**
- WCAG 2.1 Level AA compliance (po mogućnosti)
- Keyboard navigation

### 4.4 Održavanje

**NFR-MAINT-001: Logiranje**
- Detaljno logiranje grešaka i upozorenja
- Centralizirani logging sustav

**NFR-MAINT-002: Monitoring**
- Health check endpoints
- Performance monitoring
- Error tracking

---

## 5. ZAKLJUČAK

Ovaj dokument definira funkcionalnu specifikaciju sustava za upravljanje godišnjim odmorima i bolovanja. Specifikacija služi kao osnova za razvoj produkcijske verzije aplikacije i trebala bi biti dopunjena tehničkom specifikacijom, API dokumentacijom i dizajn dokumentima.

### 5.1 Prioritizacija za MVP (Minimum Viable Product)

**Must-have (Kritično):**
- FR-ADM-001 do FR-ADM-007 (Upravljanje zaposlenicima i odjelima)
- FR-ADM-008 do FR-ADM-010 (Osnovno upravljanje praznicima)
- FR-EMP-001, FR-EMP-003, FR-EMP-005, FR-EMP-009 (Osnovna funkcionalnost zaposlenika)
- FR-APP-001, FR-APP-002, FR-APP-004, FR-APP-005 (Osnovna funkcionalnost odobravatelja)
- FR-APP-008 (Dodjela dana)
- FR-APP-011, FR-APP-012 (Bolovanje i automatska prilagodba)
- FR-AUTH-001, FR-AUTH-002, FR-AUTH-005 (Autentifikacija)

**Should-have (Visoki prioritet):**
- Svi ostali zahtjevi označeni kao "Visok"

**Nice-to-have:**
- Svi zahtjevi označeni kao "Nizak" ili "nice-to-have"

---

**Dokument pripremljen:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Draft za review

