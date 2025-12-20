# User Flow Dijagrami
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Verzija:** 1.0  
**Datum:** 12.12.2024  
**Projekt:** Luna - Sustav za godišnji odmor  

---

## 1. UVOD

### 1.1 Svrha dokumenta
Ovaj dokument prikazuje korisničke tokove (user flows) za sve ključne funkcionalnosti sustava. User flow dijagrami vizualiziraju korake koje korisnik mora proći da bi izvršio određenu akciju.

### 1.2 Konvencije
- **Pravokutnik** - Ekran/stranica
- **Romb** - Odluka/uvjet
- **Oval** - Početak/završetak toka
- **Strelica** - Smjer kretanja

---

## 2. AUTENTIFIKACIJA

### 2.1 Prijava u sustav

```
[START: Neautenticirani korisnik]
    ↓
[Login ekran]
    - Unos emaila
    - Unos lozinke
    ↓
<Validni podaci?>
    |
    ├── NE → [Prikaz greške] → [Login ekran]
    |
    └── DA
        ↓
    <Aktivan korisnik?>
        |
        ├── NE → [Poruka: Račun deaktiviran] → [Login ekran]
        |
        └── DA
            ↓
        <Koja uloga?>
            |
            ├── Administrator → [Admin Dashboard]
            ├── Odobravatelj → [Approver Dashboard]
            └── Zaposlenik → [Employee Dashboard]
                ↓
            [END: Autenticirani korisnik]
```

**Alternativni tokovi:**
- **A1:** Korisnik klikne "Zaboravljena lozinka"
  - Redirect na Reset Password ekran
  - Unos emaila
  - Slanje reset linka
  - Potvrda i povratak na Login

### 2.2 Zaboravljena lozinka

```
[START: Login ekran]
    ↓
[Klik: "Zaboravljena lozinka"]
    ↓
[Reset Password ekran]
    - Unos emaila
    ↓
<Email postoji u sustavu?>
    |
    ├── NE → [Prikaži generičku poruku: "Ako email postoji..."]
    |           ↓
    └── DA  → [Slanje reset linka na email]
                ↓
            [Prikaži generičku poruku: "Ako email postoji..."]
                ↓
            [Korisnik otvara email]
                ↓
            [Klik na reset link]
                ↓
            [New Password ekran]
                - Unos nove lozinke
                - Potvrda lozinke
                ↓
            <Validna lozinka?>
                |
                ├── NE → [Prikaz greške] → [New Password ekran]
                |
                └── DA
                    ↓
                [Spremanje nove lozinke]
                    ↓
                [Potvrda uspjeha]
                    ↓
                [Redirect na Login ekran]
                    ↓
                [END]
```

---

## 3. ZAPOSLENIK TOKOVI

### 3.1 Kreiranje zahtjeva za godišnji odmor

```
[START: Employee Dashboard]
    ↓
[Klik: "Novi zahtjev"]
    ↓
[Create Vacation Request ekran]
    - Odabir datuma početka
    - Odabir datuma završetka
    - Unos napomene (opciono)
    ↓
[Automatska kalkulacija radnih dana]
    ↓
<Validacija?>
    |
    ├── Greška → [Prikaz greške validacije]
    |               ↓
    |           [Ostaje na Create ekranu]
    |               ↓
    |           <Korisnik ispravi?>
    |               |
    |               ├── NE → [Klik: Odustani] → [Employee Dashboard]
    |               └── DA → [Ponovno validacija]
    |
    └── OK
        ↓
    <Koja akcija?>
        |
        ├── [Klik: "Spremi kao draft"]
        |       ↓
        |   [Spremanje sa statusom: Draft]
        |       ↓
        |   [Potvrda uspjeha]
        |       ↓
        |   [Employee Dashboard]
        |
        └── [Klik: "Pošalji na odobrenje"]
                ↓
            [Spremanje sa statusom: Pending]
                ↓
            [Slanje notifikacije odobravatelju]
                ↓
            [Potvrda uspjeha]
                ↓
            [Employee Dashboard]
                ↓
            [END]
```

**Moguće greške validacije:**
1. Datum početka je u prošlosti
2. Datum početka je nakon datuma završetka
3. Postoji preklapanje s postojećim zahtjevom
4. Nema dovoljno preostalih dana
5. Razdoblje uključuje vikende/praznike (info, ne greška)

### 3.2 Uređivanje draft/returned zahtjeva

```
[START: Employee Dashboard]
    ↓
[Lista zahtjeva]
    ↓
<Odabir zahtjeva sa statusom Draft ili Returned>
    ↓
[Klik: "Uredi"]
    ↓
[Edit Vacation Request ekran]
    - Prikaz postojećih podataka
    - Prikaz komentara voditelja (ako Returned)
    ↓
<Korisnik mijenja podatke?>
    |
    ├── NE → [Klik: Odustani] → [Employee Dashboard]
    |
    └── DA
        ↓
    [Izmjena datuma/napomene]
        ↓
    [Automatska kalkulacija radnih dana]
        ↓
    <Validacija?>
        |
        ├── Greška → [Prikaz greške] → [Edit ekran]
        |
        └── OK
            ↓
        <Koja akcija?>
            |
            ├── [Spremi kao draft] → [Spremanje] → [Dashboard]
            |
            └── [Pošalji na odobrenje]
                    ↓
                [Spremanje sa statusom: Pending]
                    ↓
                [Slanje notifikacije odobravatelju]
                    ↓
                [Employee Dashboard]
                    ↓
                [END]
```

### 3.3 Pregled statusa zahtjeva

```
[START: Employee Dashboard]
    ↓
[Prikaz kartice: "Aktivni zahtjevi"]
    - Lista zahtjeva sa statusima
    ↓
<Klik na zahtjev>
    ↓
[Request Details ekran]
    - Datum razdoblja
    - Broj dana
    - Status (sa bojom)
    - Napomena zaposlenika
    - Komentar voditelja (ako postoji)
    - Ime odobravatelja (ako odobren)
    - Timestampovi
    ↓
<Koji status?>
    |
    ├── Draft
    |     ↓
    |   [Opcije: Uredi, Obriši, Pošalji]
    |
    ├── Pending
    |     ↓
    |   [Opcije: Samo pregled]
    |
    ├── Returned
    |     ↓
    |   [Opcije: Uredi, Obriši, Pošalji]
    |
    ├── Approved
    |     ↓
    |   [Opcije: Samo pregled]
    |
    └── Rejected
          ↓
        [Opcije: Samo pregled, Prikaz razloga]
    ↓
[Klik: Natrag]
    ↓
[Employee Dashboard]
    ↓
[END]
```

### 3.4 Pregled kalendara

```
[START: Employee Dashboard]
    ↓
[Prikaz kalendara]
    - Odobreni odmori (zeleno)
    - Zahtjevi na čekanju (žuto)
    - Praznici (sivo)
    ↓
<Odabir mjeseca/tjedna>
    ↓
[Osvježavanje prikaza]
    ↓
<Klik na dan?>
    |
    ├── NE → [Ostaje na Dashboardu]
    |
    └── DA (Ako je odabran dan s odmorom)
        ↓
    [Prikaz detalja zahtjeva]
        ↓
    [Zatvaranje popup-a]
        ↓
    [Employee Dashboard]
        ↓
    [END]
```

---

## 4. ODOBRAVATELJ TOKOVI

### 4.1 Odobravanje zahtjeva

```
[START: Approver Dashboard]
    ↓
[Lista zahtjeva na čekanju]
    - Ime zaposlenika
    - Datum razdoblja
    - Broj dana
    - Preostali dani zaposlenika
    ↓
<Klik na zahtjev>
    ↓
[Request Review ekran]
    - Svi detalji zahtjeva
    - Napomena zaposlenika
    - Kalendar s vizualizacijom
    - Pregled preklapanja s drugim zaposlenicima
    ↓
<Provjera preklapanja?>
    |
    ├── Kritično preklapanje → [Upozorenje: Previše ljudi na odmoru]
    |                               ↓
    └── OK                      [Nastavak odluke]
        ↓
    <Koja odluka?>
        |
        ├── [Klik: "Odobri"]
        |       ↓
        |   <Unos komentara?>
        |       |
        |       ├── DA → [Unos komentara (opciono)]
        |       └── NE → [Bez komentara]
        |           ↓
        |       [Potvrda: "Sigurno odobravate?"]
        |           ↓
        |       <Potvrda?>
        |           |
        |           ├── NE → [Natrag na Review ekran]
        |           └── DA
        |               ↓
        |           [Spremanje sa statusom: Approved]
        |               ↓
        |           [Slanje notifikacije zaposleniku]
        |               ↓
        |           [Potvrda uspjeha]
        |               ↓
        |           [Approver Dashboard]
        |
        ├── [Klik: "Odbij"]
        |       ↓
        |   [Unos razloga (obavezno)]
        |       ↓
        |   <Unijet razlog?>
        |       |
        |       ├── NE → [Greška: Razlog obavezan]
        |       └── DA
        |           ↓
        |       [Potvrda: "Sigurno odbijate?"]
        |           ↓
        |       <Potvrda?>
        |           |
        |           ├── NE → [Natrag na Review ekran]
        |           └── DA
        |               ↓
        |           [Spremanje sa statusom: Rejected]
        |               ↓
        |           [Slanje notifikacije zaposleniku]
        |               ↓
        |           [Potvrda uspjeha]
        |               ↓
        |           [Approver Dashboard]
        |
        └── [Klik: "Vrati na doradu"]
                ↓
            [Unos razloga (obavezno)]
                ↓
            <Unijet razlog?>
                |
                ├── NE → [Greška: Razlog obavezan]
                └── DA
                    ↓
                [Spremanje sa statusom: Returned]
                    ↓
                [Slanje notifikacije zaposleniku]
                    ↓
                [Potvrda uspjeha]
                    ↓
                [Approver Dashboard]
                    ↓
                [END]
```

### 4.2 Dodjela godišnjih dana za novu godinu

```
[START: Approver Dashboard]
    ↓
[Klik: "Upravljanje alokacijama"]
    ↓
[Vacation Allocations ekran]
    - Lista zaposlenika odjela
    - Prikaz trenutnih alokacija
    ↓
<Odabir godine>
    ↓
<Nova godina ili postojeća?>
    |
    ├── Postojeća godina
    |       ↓
    |   [Prikaz postojećih alokacija]
    |       ↓
    |   [Opcija: Uredi pojedinačnu alokaciju]
    |
    └── Nova godina (sljedeća)
            ↓
        <Koja metoda dodjele?>
            |
            ├── [Pojedinačna dodjela]
            |       ↓
            |   [Odabir zaposlenika]
            |       ↓
            |   [Unos broja dana]
            |       ↓
            |   <Validacija (1-50)?>
            |       |
            |       ├── Greška → [Prikaz greške] → [Ponovno unos]
            |       └── OK
            |           ↓
            |       [Spremanje alokacije]
            |           ↓
            |       [Potvrda uspjeha]
            |           ↓
            |       [Allocations ekran]
            |
            ├── [Masovna dodjela]
            |       ↓
            |   [Unos broja dana za sve]
            |       ↓
            |   <Validacija (1-50)?>
            |       |
            |       ├── Greška → [Prikaz greške]
            |       └── OK
            |           ↓
            |       [Potvrda: "Dodijeliti X dana svim zaposlenicima?"]
            |           ↓
            |       <Potvrda?>
            |           |
            |           ├── NE → [Allocations ekran]
            |           └── DA
            |               ↓
            |           [Kreiranje alokacija za sve zaposlenike]
            |               ↓
            |           [Potvrda uspjeha]
            |               ↓
            |           [Allocations ekran]
            |
            └── [Kopiranje iz prethodne godine]
                    ↓
                [Potvrda: "Kopirati alokacije iz {prethodna godina}?"]
                    ↓
                <Potvrda?>
                    |
                    ├── NE → [Allocations ekran]
                    └── DA
                        ↓
                    [Kreiranje alokacija sa istim brojem dana]
                        ↓
                    [Potvrda uspjeha]
                        ↓
                    [Allocations ekran]
                        ↓
                    [END]
```

### 4.3 Evidencija bolovanja

```
[START: Approver Dashboard]
    ↓
[Klik: "Upravljanje bolovanjima"]
    ↓
[Sick Leave Management ekran]
    - Lista aktivnih i prošlih bolovanja
    ↓
[Klik: "Novo bolovanje"]
    ↓
[Create Sick Leave ekran]
    - Odabir zaposlenika
    - Unos datuma početka
    - Unos datuma završetka (opciono)
    - Unos napomene (opciono)
    - Upload medicinske dokumentacije (opciono)
    ↓
<Validacija?>
    |
    ├── Greška
    |     ↓
    |   [Prikaz greške]
    |     ↓
    |   [Create Sick Leave ekran]
    |     ↓
    |   <Korisnik ispravi?>
    |       |
    |       ├── NE → [Klik: Odustani] → [Sick Leave Management]
    |       └── DA → [Ponovno validacija]
    |
    └── OK
        ↓
    [Klik: "Spremi"]
        ↓
    [Kreiranje bolovanja]
        ↓
    <Postoji završni datum?>
        |
        ├── NE → [Status: Aktivno]
        |
        └── DA → [Status: Završeno]
            ↓
        [Automatska provjera preklapanja s odobrenim godišnjim odmorima]
            ↓
        <Postoje preklapanja?>
            |
            ├── NE
            |     ↓
            |   [Potvrda uspjeha]
            |     ↓
            |   [Sick Leave Management ekran]
            |
            └── DA
                ↓
            [Automatska prilagodba godišnjih odmora]
                ↓
            [Generiranje izvještaja prilagodbi]
                ↓
            [Prikaz izvještaja prilagodbi]
                - Lista izmijenjenih zahtjeva
                - Stari i novi datumi
                - Vraćeni dani
                ↓
            <Pregled izvještaja>
                ↓
            [Klik: "Zatvori"]
                ↓
            [Sick Leave Management ekran]
                ↓
            [END]
```

**Scenariji automatske prilagodbe:**

```
Slučaj 1: Potpuno preklapanje
[Odobren godišnji: 10.12. - 15.12.]
[Bolovanje:         10.12. - 15.12.]
    ↓
[Rezultat: Zahtjev OTKAZAN, 4 dana vraćeno]

Slučaj 2: Preklapanje na početku
[Odobren godišnji: 10.12. - 15.12.]
[Bolovanje:         08.12. - 12.12.]
    ↓
[Rezultat: Godišnji pomaknut na 13.12. - 15.12., 2 dana vraćeno]

Slučaj 3: Preklapanje na kraju
[Odobren godišnji: 10.12. - 15.12.]
[Bolovanje:         13.12. - 17.12.]
    ↓
[Rezultat: Godišnji skraćen na 10.12. - 12.12., 2 dana vraćeno]

Slučaj 4: Preklapanje u sredini
[Odobren godišnji: 10.12. - 20.12.]
[Bolovanje:         13.12. - 15.12.]
    ↓
[Rezultat: Godišnji skraćen na 10.12. - 12.12., 6 dana vraćeno]
```

### 4.4 Planiranje godišnjih odmora (tablični prikaz)

```
[START: Approver Dashboard]
    ↓
[Klik: "Planiranje odmora"]
    ↓
[Vacation Planning ekran]
    - Tablični kalendar
    - Retci: Zaposlenici
    - Stupci: Datumi
    ↓
<Odabir razdoblja>
    |
    ├── Tjedan → [Prikaz 7 dana]
    ├── Mjesec → [Prikaz cijelog mjeseca]
    └── Custom → [Odabir datuma početka i završetka]
        ↓
    [Osvježavanje tablice]
        ↓
    [Vizualizacija]:
        - Zelene ćelije: Odobreni odmori
        - Žute ćelije: Zahtjevi na čekanju
        - Narančaste ćelije: Bolovanja
        - Sive ćelije: Vikendi/praznici
        ↓
    <Klik na ćeliju?>
        |
        ├── NE → [Ostaje na Planiranju]
        |
        └── DA (Ako ćelija ima podatke)
            ↓
        [Popup s detaljima zahtjeva/bolovanja]
            ↓
        <Ako je Pending zahtjev>
            |
            ├── [Opcija: Brzi pregled]
            |       ↓
            |   [Klik: "Pregledaj"]
            |       ↓
            |   [Request Review ekran]
            |       ↓
            |   [Odobravanje/Odbijanje]
            |       ↓
            |   [Natrag na Planning]
            |
            └── [Zatvaranje popup-a]
                ↓
            [Ostaje na Planning ekranu]
        ↓
    <Kritična razdoblja?>
        |
        ├── DA (Previše ljudi na odmoru)
        |       ↓
        |   [Vizualni indikator upozorenja]
        |   [Prikaz upozorenja: "X/Y ljudi na odmoru"]
        |
        └── NE
            ↓
        [Normalan prikaz]
            ↓
        [END]
```

---

## 5. ADMINISTRATOR TOKOVI

### 5.1 Dodavanje novog zaposlenika

```
[START: Admin Dashboard]
    ↓
[Klik: "Upravljanje zaposlenicima"]
    ↓
[Employee Management ekran]
    - Lista svih zaposlenika
    ↓
[Klik: "Dodaj zaposlenika"]
    ↓
[Create Employee ekran]
    - Unos imena
    - Unos prezimena
    - Unos emaila
    - Odabir odjela (opciono)
    - Unos broja dana godišnjeg (default: 20)
    - Odabir statusa (default: aktivan)
    ↓
<Validacija?>
    |
    ├── Greška
    |     ↓
    |   [Prikaz greške]:
    |       - Email već postoji
    |       - Email nije validan
    |       - Obavezna polja prazna
    |       - Broj dana izvan raspona (1-50)
    |     ↓
    |   [Ostaje na Create ekranu]
    |     ↓
    |   <Korisnik ispravi?>
    |       |
    |       ├── NE → [Klik: Odustani] → [Employee Management]
    |       └── DA → [Ponovno validacija]
    |
    └── OK
        ↓
    [Klik: "Spremi"]
        ↓
    [Kreiranje zaposlenika]
        ↓
    [Automatsko kreiranje User računa]
        ↓
    [Kreiranje alokacije za tekuću godinu]
        ↓
    [Generiranje privremene lozinke]
        ↓
    [Potvrda uspjeha + prikaz privremene lozinke]
        ↓
    [Opcija: Slanje podataka na email]
        ↓
    [Employee Management ekran]
        ↓
    [END]
```

### 5.2 Kreiranje odjela

```
[START: Admin Dashboard]
    ↓
[Klik: "Upravljanje odjelima"]
    ↓
[Department Management ekran]
    - Lista svih odjela
    ↓
[Klik: "Dodaj odjel"]
    ↓
[Create Department ekran]
    - Unos naziva
    - Unos opisa (opciono)
    - Odabir odobravatelja (multi-select)
    - Odabir zaposlenika (multi-select)
    ↓
<Validacija?>
    |
    ├── Greška
    |     ↓
    |   [Prikaz greške]:
    |       - Naziv već postoji
    |       - Naziv prazan
    |     ↓
    |   [Create Department ekran]
    |     ↓
    |   <Korisnik ispravi?>
    |       |
    |       ├── NE → [Klik: Odustani] → [Department Management]
    |       └── DA → [Ponovno validacija]
    |
    └── OK
        ↓
    [Klik: "Spremi"]
        ↓
    [Kreiranje odjela]
        ↓
    <Ima odabranih odobravatelja?>
        |
        ├── DA → [Dodjeljivanje uloge "Approver" odobravateljima]
        |           ↓
        |       [Povezivanje odobravatelja s odjelom]
        |
        └── NE → [Odjel bez odobravatelja]
            ↓
    <Ima odabranih zaposlenika?>
        |
        ├── DA → [Povezivanje zaposlenika s odjelom]
        |           ↓
        |       [Ažuriranje departmentId zaposlenika]
        |
        └── NE → [Prazan odjel]
            ↓
        [Potvrda uspjeha]
            ↓
        [Department Management ekran]
            ↓
        [END]
```

### 5.3 Dodavanje praznika

```
[START: Admin Dashboard]
    ↓
[Klik: "Upravljanje praznicima"]
    ↓
[Holiday Management ekran]
    - Lista svih praznika
    - Filter po godini
    ↓
[Klik: "Dodaj praznik"]
    ↓
[Create Holiday ekran]
    - Unos naziva
    - Odabir datuma
    - Odabir tipa (Ponavljajući/Jednokratni)
    - Odabir godine (za jednokratne)
    ↓
<Validacija?>
    |
    ├── Greška
    |     ↓
    |   [Prikaz greške]:
    |       - Naziv prazan
    |       - Datum u prošlosti (za novu godinu)
    |       - Praznik na taj datum već postoji
    |     ↓
    |   [Create Holiday ekran]
    |     ↓
    |   <Korisnik ispravi?>
    |       |
    |       ├── NE → [Klik: Odustani] → [Holiday Management]
    |       └── DA → [Ponovno validacija]
    |
    └── OK
        ↓
    [Klik: "Spremi"]
        ↓
    [Kreiranje praznika]
        ↓
    <Tip: Ponavljajući?>
        |
        ├── DA → [Kreiranje za sve buduće godine]
        └── NE → [Kreiranje samo za odabranu godinu]
            ↓
        [Potvrda uspjeha]
            ↓
        [Holiday Management ekran]
            ↓
        [END]
```

### 5.4 Pregled statistika

```
[START: Admin Dashboard]
    ↓
[Prikaz statistika na Dashboardu]:
    - Ukupan broj zaposlenika
    - Broj aktivnih zaposlenika
    - Broj odjela
    - Broj zahtjeva na čekanju (svi odjeli)
    - Broj odobrenih odmora (tekući mjesec)
    - Broj aktivnih bolovanja
    ↓
<Klik: "Detaljnije statistike">
    ↓
[Statistics ekran]
    - Grafički prikaz:
        * Korištenje godišnjih odmora po mjesecima
        * Broj zahtjeva po statusima
        * Raspodjela po odjelima
        * Trend bolovanja
    - Filtriranje:
        * Po odjelu
        * Po razdoblju
        * Po godini
    ↓
<Eksport?>
    |
    ├── DA → [Odabir formata: Excel/PDF/CSV]
    |           ↓
    |       [Generiranje izvještaja]
    |           ↓
    |       [Download datoteke]
    |
    └── NE → [Ostaje na Statistics ekranu]
        ↓
    [Klik: Natrag]
        ↓
    [Admin Dashboard]
        ↓
    [END]
```

---

## 6. CROSS-ROLE TOKOVI

### 6.1 Promjena lozinke

```
[START: Bilo koji Dashboard]
    ↓
[Klik na: Korisnički profil (u headeru)]
    ↓
[Dropdown meni]
    ↓
[Klik: "Promjena lozinke"]
    ↓
[Change Password ekran]
    - Unos trenutne lozinke
    - Unos nove lozinke
    - Potvrda nove lozinke
    ↓
<Validacija?>
    |
    ├── Greška
    |     ↓
    |   [Prikaz greške]:
    |       - Trenutna lozinka neispravna
    |       - Nova lozinka prekratka (<8 znakova)
    |       - Potvrda se ne podudara
    |       - Nova=Stara lozinka
    |     ↓
    |   [Change Password ekran]
    |     ↓
    |   <Korisnik ispravi?>
    |       |
    |       ├── NE → [Klik: Odustani] → [Dashboard]
    |       └── DA → [Ponovno validacija]
    |
    └── OK
        ↓
    [Spremanje nove lozinke (hashirano)]
        ↓
    [Potvrda uspjeha]
        ↓
    [Logout korisnika]
        ↓
    [Redirect na Login ekran]
        ↓
    [Poruka: "Lozinka promijenjena. Prijavite se ponovno."]
        ↓
    [END]
```

### 6.2 Pregled i uređivanje profila

```
[START: Bilo koji Dashboard]
    ↓
[Klik na: Korisnički profil (u headeru)]
    ↓
[Dropdown meni]
    ↓
[Klik: "Moj profil"]
    ↓
[User Profile ekran]
    - Prikaz podataka:
        * Ime i prezime
        * Email
        * Odjel
        * Uloga
        * Broj dana godišnjeg (ako zaposlenik)
        * Datum registracije
        * Zadnja prijava
    ↓
[Klik: "Uredi"]
    ↓
[Edit Profile ekran]
    - Onemogućena izmjena:
        * Ime i prezime (samo Admin može)
        * Odjel (samo Admin može)
        * Uloga (samo Admin može)
        * Broj dana (samo Approver/Admin može)
    ↓
<Izmjena emaila?>
    |
    ├── NE → [Klik: Odustani] → [User Profile]
    |
    └── DA
        ↓
    <Validacija (validan i jedinstven)?>
        |
        ├── Greška → [Prikaz greške] → [Edit Profile]
        |
        └── OK
            ↓
        [Spremanje]
            ↓
        [Potvrda uspjeha]
            ↓
        [User Profile ekran]
            ↓
        [END]
```

### 6.3 Odjava iz sustava

```
[START: Bilo koji Dashboard]
    ↓
[Klik na: Korisnički profil (u headeru)]
    ↓
[Dropdown meni]
    ↓
[Klik: "Odjava"]
    ↓
[Brisanje aktivne sesije]
    ↓
[Redirect na Login ekran]
    ↓
[END: Neautenticirani korisnik]
```

---

## 7. ERROR HANDLING TOKOVI

### 7.1 Network error

```
[Bilo koja akcija koja zahtijeva API poziv]
    ↓
<Network request>
    |
    ├── Success → [Nastavak normalnog toka]
    |
    └── Failure (Network error)
        ↓
    [Prikaz error toast/modal]:
        - "Greška u komunikaciji sa serverom"
        - "Molimo provjerite internet vezu"
        - Opcija: "Pokušaj ponovno"
        ↓
    <Klik: "Pokušaj ponovno">
        ↓
    [Ponovno slanje request-a]
        ↓
    <Success?>
        |
        ├── DA → [Nastavak normalnog toka]
        └── NE → [Ponovno prikaz greške]
```

### 7.2 Session timeout

```
[Korisnik neaktivan 8 sati]
    ↓
[Expiracija sesije]
    ↓
<Korisnik pokuša izvršiti akciju>
    ↓
[API vraća: 401 Unauthorized]
    ↓
[Prikaz modal]:
    - "Sesija je istekla"
    - "Molimo prijavite se ponovno"
    - Gumb: "OK"
    ↓
[Brisanje lokalne sesije]
    ↓
[Redirect na Login ekran]
    ↓
[END]
```

### 7.3 Validation error

```
[Korisnik popunjava formu]
    ↓
[Klik: "Spremi/Pošalji"]
    ↓
[Frontend validacija]
    ↓
<Validacija OK?>
    |
    ├── NE
    |     ↓
    |   [Prikaz inline grešaka]:
    |       - Crveni border oko polja
    |       - Error poruka ispod polja
    |       - Fokus na prvo polje s greškom
    |     ↓
    |   [Korisnik ispravi]
    |     ↓
    |   [Live validacija prilikom typing-a]
    |     ↓
    |   [Uklanjanje error poruke kad je polje OK]
    |
    └── DA
        ↓
    [Slanje na backend]
        ↓
    <Backend validacija OK?>
        |
        ├── NE
        |     ↓
        |   [Prikaz grešaka sa backend-a]
        |     ↓
        |   [Korisnik ispravi]
        |
        └── DA
            ↓
        [Nastavak normalnog toka]
```

---

## 8. MOBILE/RESPONSIVE BEHAVIOR

### 8.1 Mobile navigation

```
[START: Mobile uređaj]
    ↓
<Veličina ekrana < 768px?>
    |
    └── DA
        ↓
    [Hamburger menu ikona umjesto horizontalnog menu-a]
        ↓
    <Klik na hamburger>
        ↓
    [Prikaz slide-in navigacije]:
        - Links prema svim modulima
        - Korisnički profil
        - Odjava
        ↓
    <Odabir opcije>
        ↓
    [Zatvaranje navigacije]
        ↓
    [Navigacija na odabrani ekran]
        ↓
    [END]
```

### 8.2 Tablični prikazi na mobilnom

```
[START: Vacation Planning ekran]
    ↓
<Veličina ekrana < 768px?>
    |
    └── DA
        ↓
    [Umjesto tablice]:
        - Card-based prikaz
        - Grupiranje po zaposlenicima
        - Swipe za promjenu datuma
        ↓
    <Klik na karticu>
        ↓
    [Prikaz detalja u full-screen modalu]
        ↓
    [Zatvaranje]
        ↓
    [Natrag na card prikaz]
        ↓
    [END]
```

---

## 9. NOTIFIKACIJSKI TOKOVI

### 9.1 Email notifikacija - Novi zahtjev (za Odobravatelja)

```
[Zaposlenik šalje zahtjev na odobrenje]
    ↓
[Backend kreira zahtjev sa statusom: Pending]
    ↓
[Trigger: Slanje email notifikacije]
    ↓
[Dohvaćanje odobravatelja odjela zaposlenika]
    ↓
<Ima odobravatelja?>
    |
    ├── NE → [Log upozorenja] → [END]
    |
    └── DA
        ↓
    [Generiranje email sadržaja]:
        - Ime zaposlenika
        - Datum razdoblja
        - Broj dana
        - Link prema zahtjevu
        ↓
    [Slanje emaila svim odobravateljima odjela]
        ↓
    [Log: Email poslan]
        ↓
    [Odobravatelj otvara email]
        ↓
    [Klik na link u emailu]
        ↓
    <Autentificiran?>
        |
        ├── NE → [Redirect na Login] → [Nakon logina redirect na zahtjev]
        |
        └── DA → [Redirect direktno na Request Review ekran]
            ↓
        [Odobravatelj pregledava i odlučuje]
            ↓
        [END]
```

### 9.2 Email notifikacija - Odluka o zahtjevu (za Zaposlenika)

```
[Odobravatelj donosi odluku (Odobri/Odbij/Vrati)]
    ↓
[Backend ažurira status zahtjeva]
    ↓
[Trigger: Slanje email notifikacije]
    ↓
[Dohvaćanje podataka zaposlenika]
        ↓
    [Generiranje email sadržaja ovisno o odluci]:
        |
        ├── Odobren
        |     ↓
        |   [Subject: "Zahtjev za godišnji odmor odobren"]
        |   [Body]:
        |       - Razdoblje odobreno
        |       - Ime odobravatelja
        |       - Komentar (ako postoji)
        |       - Link na Dashboard
        |
        ├── Odbijen
        |     ↓
        |   [Subject: "Zahtjev za godišnji odmor odbijen"]
        |   [Body]:
        |       - Razdoblje
        |       - Razlog odbijanja
        |       - Link na Dashboard
        |
        └── Vraćen
            ↓
        [Subject: "Zahtjev za godišnji odmor vraćen na doradu"]
        [Body]:
            - Razdoblje
            - Komentar voditelja
            - Link za uređivanje zahtjeva
        ↓
    [Slanje emaila zaposleniku]
        ↓
    [Log: Email poslan]
        ↓
    [Zaposlenik otvara email]
        ↓
    [Klik na link u emailu]
        ↓
    <Autentificiran?>
        |
        ├── NE → [Redirect na Login] → [Nakon logina redirect na Dashboard]
        |
        └── DA → [Redirect na Dashboard/Edit zahtjev]
            ↓
        [END]
```

---

## 10. ZAKLJUČAK

Ovaj dokument pokriva sve glavne user flow tokove sustava. Svaki tok je detaljno opisan s alternativnim putanjama, error handling-om i edge case-ovima.

### 10.1 Prioritizacija za implementaciju

**Faza 1 - Osnovni tokovi:**
- 2.1 Prijava u sustav
- 3.1 Kreiranje zahtjeva za godišnji odmor
- 4.1 Odobravanje zahtjeva
- 5.1 Dodavanje novog zaposlenika
- 5.2 Kreiranje odjela

**Faza 2 - Prošireni tokovi:**
- 3.2 Uređivanje zahtjeva
- 4.2 Dodjela godišnjih dana
- 4.3 Evidencija bolovanja
- 5.3 Dodavanje praznika

**Faza 3 - Napredni tokovi:**
- 4.4 Planiranje godišnjih odmora
- 5.4 Pregled statistika
- 9.1-9.2 Notifikacijski tokovi

**Faza 4 - Nice-to-have:**
- 8.1-8.2 Mobile optimizacije
- Eksport funkcionalnosti
- Napredne statistike

---

**Dokument pripremljen:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Draft za review

