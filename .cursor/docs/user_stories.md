# User Stories - Sustav za godišnji odmor

## Cursor AI — važni prateći dokumenti
Ovaj `user_stories.md` je **epic-level** popis user storyja. Za implementacijska pravila i odluke koristi:
- `/.cursor/docs/00_index.md` (index)
- `/.cursor/docs/02_data_model_mapping.md` (koncept → Prisma mapping)
- `/.cursor/docs/01_domain_statuses.md` (statusi i prijelazi)
- `/.cursor/docs/OPEN_QUESTIONS.md` (otvorena pitanja / TBD odluke)

## Uvod

Ovaj dokument sadrži user stories za aplikaciju za upravljanje godišnjim odmorima i bolovanja.

---

## 1. AUTENTIFIKACIJA

Sve vezano uz registraciju, prijavu i odjavu korisnika rješava Clerk i nije potrebno opisivati u ovom dokumentu.

---

## 1.5 DASHBOARD

### US-DASH-001: Dashboard kontekst i određivanje uloga
**Kao** sustav  
**Želim** odrediti ulogu korisnika na dashboardu  
**Kako bih** prikazao odgovarajuće widgete i funkcionalnosti

**Kriteriji prihvaćanja:**
- Sustav određuje sljedeće atribute za korisnika:
  - `isGeneralManager`: ima li korisnik ulogu General Managera (Manager zapis bez departmentId)
  - `isDepartmentManager`: ima li korisnik ulogu Department Managera (Manager zapis s departmentId)
  - `managedDepartmentIds`: lista odjela koje korisnik upravlja kao Department Manager
- Ako korisnik nema povezan Employee profil u organizaciji:
  - Dashboard prikazuje ograničeni prikaz (poruka "Niste povezani na zaposlenika")
  - Korisnik ne može vidjeti kalendar ni zahtjeve
- Ako korisnik ima **obje uloge** (GM + Department Manager):
  - Dashboard prikazuje **oba seta widgeta** istovremeno
  - GM widget prikazuje zahtjeve za drugi nivo odobrenja
  - Department Manager widget prikazuje zahtjeve za prvi nivo odobrenja
- Uloge se mogu preklapati (korisnik može biti i GM i department manager)

**Error kodovi:**
- 403: Korisnik nije član organizacije
- 404: Organizacija ne postoji

---

### US-DASH-002: Kalendar na dashboardu s timezone podrškom
**Kao** zaposlenik  
**Želim** vidjeti kalendar na dashboardu s mojim DaySchedule zapisima  
**Kako bih** brzo vidio svoj plan za tekući mjesec

**Kriteriji prihvaćanja:**
- Kalendar prikazuje `DaySchedule` za odabrani mjesec.
- Prikaz je **timezone-aware**:
  - datumi se prikazuju u korisnikovoj vremenskoj zoni (IANA tz, npr. `Europe/Zagreb`)
  - podaci u bazi su u UTC; sustav radi ispravnu konverziju za prikaz i filtriranje mjeseca
- Trenutni dan (“danas”) je vizualno istaknut.
- Za svaki dan se vidi barem:
  - status dana (ako postoji plan)
  - oznaka vikend/praznik
  - vrsta odsutnosti i boja (za legendu), ako postoji
- Vikendi i praznici su vizualno razlučivi, ali **ne ulaze u workday/potrošnju** (to je dio workday/ledger pravila).

**Napomena (implementacija):**
- Detaljna timezone pravila: `/.cursor/docs/07_timezones_dates.md`

**Error kodovi:**
- 403: Korisnik nije vezan na Employee u organizaciji
- 422: Nevalidni month/year parametri

---

### US-DASH-003: Dashboard widgeti za zahtjeve (po ulozi)
**Kao** korisnik  
**Želim** vidjeti relevantne zahtjeve na dashboardu ovisno o mojoj ulozi  
**Kako bih** brzo vidio što trebam napraviti

**Kriteriji prihvaćanja:**

**3.1 Widget "Moji otvoreni zahtjevi" — obični korisnik:**
- Prikazuje se card s listom vlastitih **otvorenih** zahtjeva
- **"Otvoreni"** = zahtjevi koji nisu finalizirani (npr. DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)
- DRAFT zahtjevi su vidljivi **samo vlasniku** (nikome drugome)
- Za svaki zahtjev prikazuje se: razdoblje, broj dana, status, vrsta odsutnosti
- Sortiranje: newest-first (točan query detalj nije dio ovog dokumenta)

**3.2 Widget "Za odobriti" — Department Manager:**
- Prikazuje se card s **tabovima**:
  - **"Čeka moje odobrenje":** `status = SUBMITTED`, `departmentId IN managedDepartmentIds`
  - **"Čeka GM":** `status = APPROVED_FIRST_LEVEL`, `departmentId IN managedDepartmentIds`
- Manager **ne vidi tuđe DRAFT** zahtjeve
- Za svaki zahtjev prikazuje se: ime zaposlenika, odjel, razdoblje, broj dana, napomena
- Može direktno odobriti/odbiti zahtjev iz taba "Čeka moje odobrenje"

**3.3 Widget "Za odobriti" — General Manager:**
- Prikazuje se card s listom zahtjeva za drugi nivo odobrenja
- Filtrira se: `status = APPROVED_FIRST_LEVEL`, `active=true`, cijela organizacija
- Za svaki zahtjev prikazuje se: ime zaposlenika, odjel, razdoblje, broj dana, tko je odobrio prvi nivo
- Može direktno odobriti/odbiti zahtjev

**Kombinacija uloga:**
- Ako korisnik ima **i GM i Department Manager** ulogu, prikazuju se **oba widgeta** na dashboardu
 
**Napomena:**
- Pravilo vidljivosti (tko vidi koje zahtjeve) mora poštovati:
  - manager ne vidi tuđe DRAFT
  - DM vidi samo zahtjeve iz svojih odjela
  - GM vidi zahtjeve za 2. razinu u cijeloj organizaciji
- Detalji: `/.cursor/docs/03_permissions_rbac.md`.

---

### US-DASH-004: Planiranje odjela (gantt) na dashboardu
**Kao** Department Manager ili General Manager  
**Želim** vidjeti gantt-like pregled zaposlenika i datuma (po odjelima koje smijem vidjeti)  
**Kako bih** brzo vidio odobreni plan i zahtjeve zaposlenika u budućem razdoblju

**Kriteriji prihvaćanja:**
- Prikazuje se tablica (gantt):
  - redci: zaposlenici odjela/odjela koji su trenutno u scope-u prikaza
  - stupci: dani u odabranom rasponu (od danas u budućnost)
- **Default scope + filtriranje odjela:**
  - **Department Manager** defaultno vidi **sve odjele** u kojima je manager; može filtrirati na jedan odjel
  - **General Manager** defaultno vidi **sve odjele** u organizaciji; može filtrirati na jedan odjel
- **Odabir raspona datuma:**
  - default je “1 mjesec” (od danas prema budućnosti)
  - postoje brzi odabiri: 1 mjesec / 3 mjeseca / 6 mjeseci / 1 godina
  - postoji ručni odabir: Od / Do
- **Cjelovit prikaz: plan + zahtjevi**
  - **Plan (DaySchedule)** je prikazan kao **neutralna pozadina** po danu (da se vidi stvarni, odobreni plan)
  - **Zahtjevi (Applications)** su prikazani kao **overlay blokovi** preko tablice
  - korisniku mora biti jasno što je **odobreno (plan)** i što je **na čekanju (zahtjev)**
- **Boje po statusu zahtjeva (za overlay blokove):**
  - prikazuju se statusi: `SUBMITTED`, `APPROVED_FIRST_LEVEL`, `APPROVED`
  - svaki od ova 3 statusa ima **različitu boju** (uz legendu status → boja)
- **Preklapanja:**
  - preklapanje zahtjeva s planom je vizualno uočljivo (zbog neutralne pozadine plana)
  - opcionalno se može prikazati diskretan indikator/tooltip “što se preklapa s čim” za dodatnu jasnoću
- **Oznaka “na bolovanju”:**
  - uz ime zaposlenika prikazuje se oznaka (npr. crveni križ) ako je zaposlenik “trenutno na bolovanju”
  - definicija “aktivno bolovanje” je TBD (vidi `/.cursor/docs/OPEN_QUESTIONS.md`)
- Klik na blok/ćeliju otvara detalje (read-only) o zahtjevu/planu.

## 2. ZAPOSLENIK - PREGLED STANJA DANA

### US-EMP-001: Pregled stanja dana
**Kao** zaposlenik  
**Želim** vidjeti pregled stanja svojih dana  
**Kako bih** znao koliko dana imam na raspolaganju

**Kriteriji prihvaćanja:**
- **Stanje se prikazuje PO vrsti odsutnosti (odvojeno za svaku vrstu)**
- Za svaku vrstu odsutnosti (npr. "Godišnji odmor", "Slobodni dani", "Edukacija") prikazuje se:
  - Ukupan broj dodijeljenih dana za tekuću godinu
  - Broj iskorištenih dana
  - Broj dana na čekanju (SUBMITTED, APPROVED_FIRST_LEVEL)
  - Broj preostalih dana
- Svaka vrsta odsutnosti ima vlastitu vizualnu oznaku (npr. karticu s ikonom i bojom)
- **Napomena:** Ne prikazuje se "ukupna" suma svih vrsta, već svaka vrsta posebno

---

### US-EMP-002: Pregled stanja po godinama
**Ako** zaposlenik  
**Želim** vidjeti stanje svojih dana po godinama  
**Kako bih** razumio koliko imam dana za svaku godinu

**Kriteriji prihvaćanja:**
- **Stanje se prikazuje PO vrsti odsutnosti (odvojeno za svaku vrstu)**
- Za svaku vrstu odsutnosti (npr. "Godišnji odmor", "Slobodni dani") prikazuje se tablica po godinama
- Za svaku godinu i svaku vrstu prikazuje se: dodijeljeno, iskorišteno, na čekanju, preostalo
- Tablicu mogu otvoriti klikom na info ikonu kod kartice specifičnog tipa
- Negativni preostali dani se vizualno ističu (npr. crvenom bojom)
- **Napomena:** Svaka vrsta odsutnosti ima vlastitu tablicu/sekciju, ne miješaju se zajedno

---

### US-EMP-003: Pregled kalendara godišnjih odmora
**Kao** zaposlenik  
**Želim** vidjeti kalendar s mojim godišnjim odmorima  
**Kako bih** vizualno planirao svoje odmore

**Kriteriji prihvaćanja:**
- Prikazuju se svi mjeseci u godini (12 mini kalendara)
- Svaki status i tip dana ima svoju vizualnu oznaku (npr. zelena za APPROVED, plava za APPROVED_FIRST_LEVEL, žuta za SUBMITTED)
- Vikendi i praznici su vizualno razlučivi od radnih dana
- Mogu mijenjati godinu pomoću strelica
- Kalendar se automatski pozicionira na trenutni mjesec
- **"Danas" highlight:** Trenutni dan je vizualno istaknut u kalendaru
- **Timezone handling:** Svi datumi se prikazuju u korisnikovoj vremenskoj zoni (clientTimeZone)

---

### US-EMP-004: Pregled svih zahtjeva
**Kao** zaposlenik  
**Želim** vidjeti listu svih svojih zahtjeva  
**Kako bih** pratio status svojih zahtjeva

**Kriteriji prihvaćanja:**
- Prikazuju se svi zahtjevi u statusima: DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED, REJECTED
- Za svaki zahtjev vidim: razdoblje, broj dana, status, napomenu
- Svaki status je vizualno razlučiv (npr. različitom bojom ili ikonom)
- Ako je zahtjev odbijen, vidim komentar voditelja
- DRAFT zahtjeve mogu uređivati i brisati
- SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED i REJECTED zahtjevi se ne mogu uređivati
- APPROVED zahtjevi se ne mogu direktno uređivati ili otkazati
- Rezultat APPROVED zahtjeva se nalazi u DaySchedule-u i može biti promijenjen novim zahtjevom

---

## 3. ZAPOSLENIK - KREIRANJE ZAHTJEVA

### US-EMP-005: Odabir razdoblja godišnjeg odmora
**Kao** zaposlenik  
**Želim** odabrati razdoblje godišnjeg odmora putem kalendara  
**Kako bih** vizualno označio dane koje želim koristiti

**Kriteriji prihvaćanja:**
- Prikazuje se interaktivni kalendar (TableCalendar)
- Mogu odabrati raspon datuma klikom i povlačenjem
- Vikendi su vizualno istaknuti (npr. drugom bojom)
- Praznici su vizualno označeni (npr. točkicom ili drugom bojom)
- Prikazuje se vizualni pregled odabranog razdoblja
- Prikazuje se broj kalendarskih dana

---

### US-EMP-006: Validacija zahtjeva u stvarnom vremenu
**Kao** zaposlenik  
**Želim** da se zahtjev automatski validira dok ga kreiram  
**Kako bih** odmah znao ako postoji problem

**Kriteriji prihvaćanja:**
- Validacija se izvršava automatski nakon odabira datuma
- Prikazuje se broj radnih dana (isključujući vikende i praznike)
- Prikazuje se broj preostalih dana
- Vizualno se razlikuje valjan zahtjev od nevaljanog (npr. zeleni okvir za valjan, crveni za nevaljan)
- Ako zahtjev nije valjan, prikazuje se poruka greške
- Provjerava se preklapanje s aktivnim zahtjevima (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)
- Provjerava se preklapanje s DaySchedule-om (stvarni plan zaposlenika)
- Provjerava se dostupnost dana
- Ako postoji preklapanje sa DaySchedule-om gdje unavailability reason ima hasPlanning=true:
  - Prikazuje se upozorenje da će se izvršiti korekcija (vraćanje dana) kada zahtjev bude odobren (APPROVED)
  - Ako postoji povezani zahtjev (applicationId): upozorenje navodi da će se vratiti SVI preostali dani iz originalnog zahtjeva (od početka novog zahtjeva do kraja originalnog), ne samo preklopljeni dani
  - Za zahtjeve s needApproval=false: korekcija će se izvršiti odmah (automatski APPROVED)
  - Za zahtjeve s needApproval=true: korekcija će se izvršiti tek kada zahtjev pređe u APPROVED status
  - Prikazuje se upozorenje da će novi zahtjev pregaziti postojeći plan u DaySchedule-u

---

### US-EMP-007: Dodavanje napomene zahtjevu
**Kao** zaposlenik  
**Želim** dodati napomenu uz svoj zahtjev  
**Kako bih** dao dodatne informacije voditelju

**Kriteriji prihvaćanja:**
- Napomena je opcionalno polje
- Prikazuje se tekstualno polje za unos napomene
- Napomena se sprema uz zahtjev

---

### US-EMP-008: Spremanje zahtjeva kao nacrt
**Kao** zaposlenik  
**Želim** spremiti zahtjev kao nacrt  
**Kako bih** ga mogao kasnije doraditi prije slanja

**Kriteriji prihvaćanja:**
- Prikazuje se gumb "Spremi nacrt"
- Gumb je onemogućen ako zahtjev nije valjan
- Nacrt nije vidljiv voditelju
- Nacrt ne rezervira dane
- Mogu kasnije uređivati nacrt

---

### US-EMP-009: Slanje zahtjeva na odobrenje
**Kao** zaposlenik  
**Želim** poslati zahtjev na odobrenje  
**Kako bi** voditelj mogao razmotriti moj zahtjev

**Kriteriji prihvaćanja:**
- Prikazuje se gumb "Pošalji zahtjev"
- Gumb je onemogućen ako zahtjev nije valjan
- Ako postoji preklapanje s postojećim planom, prije slanja se prikazuje jasno upozorenje (moguća buduća korekcija i prepisivanje plana).
- Nakon slanja:
  - zahtjev dobiva status **SUBMITTED** (ili odmah postaje **APPROVED** za vrste odsutnosti koje se automatski odobravaju)
  - zahtjev postaje vidljiv odgovornim odobravateljima (DM i/ili GM, ovisno o pravilima vrste odsutnosti)
- Kad zahtjev postane konačno odobren:
  - plan (DaySchedule) se ažurira za dane u periodu
  - ako vrsta odsutnosti prati stanje dana, stanje dana se ažurira
- Prikazuje se potvrda uspješnog slanja

---

### US-EMP-010: Uređivanje DRAFT zahtjeva
**Kao** zaposlenik  
**Želim** urediti zahtjev koji je u DRAFT statusu  
**Kako bih** ispravio greške prije slanja

**Kriteriji prihvaćanja:**
- Mogu kliknuti na "Uredi" kod DRAFT zahtjeva
- Otvara se isti ekran kao za kreiranje
- Datumi i napomena se popunjavaju postojećim podacima
- Mogu promijeniti datume i napomenu
- Mogu spremiti kao DRAFT ili poslati na odobrenje
- SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED i REJECTED zahtjevi se ne mogu uređivati
- APPROVED zahtjevi se ne mogu direktno uređivati ili otkazati
- Rezultat APPROVED zahtjeva (DaySchedule zapisi) može biti promijenjen novim zahtjevom (vidi US-EMP-012B)

---

### US-EMP-011: Brisanje DRAFT zahtjeva
**Kao** zaposlenik  
**Želim** obrisati zahtjev koji je u DRAFT statusu  
**Kako bih** uklonio zahtjev koji mi više ne treba

**Kriteriji prihvaćanja:**
- Mogu kliknuti na "Obriši" kod DRAFT zahtjeva
- Prikazuje se potvrda prije brisanja
- Zahtjev se trajno briše iz sustava
- SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED i REJECTED zahtjevi se ne mogu brisati

---

### US-EMP-012: Pregled detalja odobrenog zahtjeva
**Kao** zaposlenik  
**Želim** vidjeti detalje odobrenog zahtjeva  
**Kako bih** imao uvid u sve informacije

**Kriteriji prihvaćanja:**
- Mogu kliknuti na dan u kalendaru koji ima odobren godišnji
- Otvara se dialog s detaljima
- Prikazuje se: razdoblje, broj dana, status, odobravatelj, datum odobrenja
- Prikazuje se moja napomena (ako postoji)
- Prikazuje se komentar odobravatelja (ako postoji)
- APPROVED zahtjevi se ne mogu mijenjati direktnim uređivanjem
- DaySchedule zapisi nastali iz APPROVED zahtjeva mogu biti promijenjeni novim zahtjevom (npr. bolovanje)

---

### US-EMP-012B: Korekcija vraćanja dana kroz novi zahtjev
**Kao** zaposlenik  
**Želim** kreirati novi zahtjev za dane koji su već odobreni  
**Kako bih** vratio dane koje nisam iskoristio (npr. zbog bolovanja)

**Kriteriji prihvaćanja:**
- Kreiranje novog zahtjeva za razdoblje koje se preklapa s DaySchedule-om (stvarni plan)
- Sustav automatski detektira preklapanje sa DaySchedule-om
- Sustav provjerava da li unavailability reason u DaySchedule-u ima hasPlanning=true
- Ako ima hasPlanning=true:
  - Prikazuje se upozorenje da će se izvršiti korekcija (vraćanje dana) kada zahtjev bude odobren (APPROVED)
  - Ako postoji povezani zahtjev (applicationId): upozorenje navodi da će se vratiti SVI preostali dani iz originalnog zahtjeva (od početka novog zahtjeva do kraja originalnog), ne samo preklopljeni dani
  - Za zahtjeve s needApproval=false: korekcija će se izvršiti odmah (automatski APPROVED)
  - Za zahtjeve s needApproval=true: korekcija će se izvršiti tek kada zahtjev pređe u APPROVED status
- Pri odobrenju (APPROVED): sustav izvršava korekciju - vraća potrošene dane u stanje dana (internal: `CORRECTION` entry)
- Pri odobrenju: ako postoji povezani zahtjev (applicationId u DaySchedule-u):
  - Vraćaju se SVI preostali dani iz originalnog zahtjeva (od datuma početka novog zahtjeva do datuma završetka originalnog zahtjeva)
  - Razlog: Novi zahtjev (npr. bolovanje) prekida realizaciju originalnog zahtjeva, često bez poznatog datuma završetka
  - Zaposlenik može kasnije kreirati novi zahtjev za preostale dane ako je primjenjivo
  - Brišu se SVI DaySchedule zapisi originalnog zahtjeva od datuma početka novog zahtjeva nadalje
  - U log originalnog zahtjeva dodaje se zapis da zahtjev nije realiziran u potpunosti i da su preostali dani vraćeni
- Pri odobrenju: novi zahtjev pregazi postojeći plan u DaySchedule-u (ažurira se DaySchedule s novim unavailabilityReasonom)
- Originalni zahtjev (ako postoji) ostaje nepromijenjen (status APPROVED, datumi ostaju isti)
- Novi zahtjev se kreira normalno (može biti DRAFT ili SUBMITTED)
- Vidim u detaljima originalnog zahtjeva (ako postoji) da je izvršena korekcija (u logu)

---

### US-EMP-013: Pregled vlastitih bolovanja
**Kao** zaposlenik  
**Želim** vidjeti evidenciju svojih bolovanja  
**Kako bih** pratio kada sam bio na bolovanju

**Kriteriji prihvaćanja:**
- Prikazuje se lista bolovanja
- Za svako bolovanje vidim: datum početka, datum završetka, status, trajanje
- Aktivna bolovanja su označena
- Vidim ako je bolovanje utjecalo na godišnje odmore

---

## 4. DEPARTMENT MANAGER - PREGLED ZAHTJEVA

### US-DM-001: Pregled zahtjeva na čekanju
**Kao** Department Manager  
**Želim** vidjeti sve zahtjeve na čekanju u mom odjelu  
**Kako bih** mogao brzo reagirati na zahtjeve

**Kriteriji prihvaćanja:**
- **UI s tabovima** za preglednost:
  - **Tab "Čeka moje odobrenje":** Zahtjevi sa statusom SUBMITTED koje trebam odobriti (prvi nivo)
  - **Tab "Čeka GM":** Zahtjevi sa statusom APPROVED_FIRST_LEVEL koje sam odobrio, ali GM još nije
- Za svaki zahtjev vidim: ime zaposlenika, razdoblje, broj dana, napomenu
- Prikazuje se ukupan broj zahtjeva na čekanju (zbroj oba taba)
- Mogu kliknuti na zahtjev za odobravanje (samo iz taba "Čeka moje odobrenje")
- Manager **ne vidi tuđe DRAFT** zahtjeve

**Napomena:** Oba tipa zahtjeva filtriraju se prema `departmentId IN managedDepartmentIds`

---

### US-DM-002: Tablični pregled godišnjih odmora
**Kao** Department Manager  
**Želim** vidjeti tablični prikaz svih zaposlenika i njihovih odmora  
**Kako bih** planirao resurse odjela

**Kriteriji prihvaćanja:**
- Prikazuje se tablica s zaposlenicima u retcima i danima u stupcima
- Svaki status zahtjeva ima svoju vizualnu oznaku (npr. zelena za APPROVED, plava za APPROVED_FIRST_LEVEL, žuta za SUBMITTED)
- Bolovanje je vizualno razlučivo od godišnjeg odmora (npr. drugom bojom)
- Vikendi i praznici su vizualno razlučivi od radnih dana
- Defaultni prikaz kreće **od danas** i ide u budućnost (npr. 1 mjesec).
- Mogu odabrati razdoblje prikaza (1, 3, 6, 12 mjeseci)
- Mogu ručno odabrati datume početka i kraja
- Prikazuju se zaglavlja mjeseci
- Mogu kliknuti na označeni dan za pregled detalja

**Napomena:**
- Ovaj pregled može biti dostupan i kao dashboard widget po odjelu (vidi US-DASH-004) s istim pravilima raspona i statusnih oznaka.

---

### US-DM-003: Kombiniran prikaz kalendara i zahtjeva
**Kao** Department Manager  
**Želim** vidjeti kalendar i zahtjeve na čekanju istovremeno  
**Kako bih** brže donosio odluke

**Kriteriji prihvaćanja:**
- Kalendar zauzima većinu prostora (npr. lijeva strana ekrana)
- Zahtjevi na čekanju (SUBMITTED) su prikazani u sidebaru (npr. desna strana ekrana)
- Sidebar prikazuje broj zahtjeva na čekanju
- Za svaki zahtjev u sidebaru prikazuje se: ime, razdoblje, dani, napomena
- Iz sidebara mogu direktno odobriti zahtjev (prvi nivo)

---

## 5. DEPARTMENT MANAGER - ODOBRAVANJE ZAHTJEVA (PRVI NIVO)

### US-DM-004: Odobravanje zahtjeva - Prvi nivo
**Kao** Department Manager  
**Želim** odobriti zahtjev zaposlenika svog odjela  
**Kako bi** zahtjev prošao prvi nivo odobrenja

**Kriteriji prihvaćanja:**
- Kliknem na gumb "Odobri" kod zahtjeva sa statusom SUBMITTED
- Otvara se dialog s detaljima zahtjeva
- Vidim sve informacije: zaposlenik, razdoblje, dani, napomena zaposlenika
- Ako postoji preklapanje sa DaySchedule-om gdje unavailability reason ima hasPlanning=true:
  - Prikazuje se upozorenje da će se izvršiti korekcija (vraćanje dana) i da će novi zahtjev pregaziti postojeći plan
  - Ako postoji povezani zahtjev (applicationId): upozorenje navodi da će se vratiti SVI preostali dani iz originalnog zahtjeva (od početka novog zahtjeva do kraja originalnog), ne samo preklopljeni dani
  - Vidim detalje o preklapanju (koji dani, koja vrsta odsutnosti)
- Mogu dodati vlastiti komentar (opcionalno)
- Kliknem na "Odobri" za potvrdu
- Ako zahtjev ne treba drugi nivo odobrenja: status postaje APPROVED (konačno)
- Ako zahtjev treba drugi nivo odobrenja: status postaje APPROVED_FIRST_LEVEL
- Kada status postane APPROVED:
  - Dani se trajno oduzimaju od dodijeljenih dana (stanje dana)
  - Ako postoji preklapanje sa DaySchedule-om s hasPlanning=true: izvršava se korekcija (vraća dane, CORRECTION ledger entry)
  - Ako postoji povezani zahtjev (applicationId u DaySchedule-u):
    - Vraćaju se SVI preostali dani iz originalnog zahtjeva (od početka novog zahtjeva do kraja originalnog zahtjeva), ne samo preklopljeni dani
    - Brišu se SVI zapisi iz DaySchedule-a koji imaju applicationId = ID originalnog zahtjeva za dane od početka novog zahtjeva do kraja originalnog zahtjeva (jer su ti dani vraćeni da se mogu koristiti u novom zahtjevu)
    - U log originalnog zahtjeva dodaje se zapis da su preostali dani vraćeni
  - Novi zahtjev pregazi postojeći plan u DaySchedule-u (ažurira se DaySchedule s novom vrstom odsutnosti)
  - DaySchedule zapisi se prepisuju za dane novog zahtjeva (novi unavailability reason zamjenjuje stari)
- Prikazuje se potvrda uspješnog odobravanja

---

### US-DM-005: Odbijanje zahtjeva - Prvi nivo
**Kao** Department Manager  
**Želim** odbiti zahtjev zaposlenika svog odjela  
**Kako bi** zaposlenik znao da ne može koristiti te dane

**Kriteriji prihvaćanja:**
- Kliknem na gumb "Odbij" kod zahtjeva sa statusom SUBMITTED
- Moram unijeti razlog odbijanja (obavezno polje)
- Status zahtjeva postaje REJECTED
- Dani se oslobađaju (ako su bili rezervirani)
- Zaposlenik vidi razlog odbijanja
- Prikazuje se potvrda

---

### US-DM-006: Pregled detalja odobrenog zahtjeva
**Kao** Department Manager  
**Želim** vidjeti detalje već odobrenog zahtjeva  
**Kako bih** pregledao povijesne podatke

**Kriteriji prihvaćanja:**
- Kliknem na dan u kalendaru označen kao APPROVED ili APPROVED_FIRST_LEVEL
- Otvara se read-only dialog
- Vidim: zaposlenika, razdoblje, dane, status, odobravatelja, datum odobrenja
- Vidim napomenu zaposlenika i vlastiti komentar
- Vidim ako je zahtjev u statusu APPROVED_FIRST_LEVEL (čeka drugi nivo)

---

### US-DM-007: Masovno odobravanje zahtjeva
**Kao** Department Manager  
**Želim** masovno odobriti više zahtjeva odjednom  
**Kako bih** brže procesirao zahtjeve u špici (npr. ljeto)

**Kriteriji prihvaćanja:**
- Mogu selektirati više zahtjeva iz liste (checkbox)
- Prikazuje se gumb "Masovno odobri"
- Mogu dodati jedan zajednički komentar za sve zahtjeve
- Sustav provodi validaciju za svaki zahtjev prije odobrenja
- Ako neki zahtjev ne može biti odobren, prikazuje se lista grešaka
- Uspješno odobreni zahtjevi se procesiraju, neuspješni ostaju u SUBMITTED statusu
- Prikazuje se sažetak: X zahtjeva odobreno, Y odbijeno s razlozima

**Prioritet:** Nice-to-have

---

### US-DM-008: Eksport izvještaja
**Kao** Department Manager ili General Manager  
**Želim** eksportirati izvještaje u različite formate  
**Kako bih** mogao dijeliti informacije s drugim sustavima ili priložiti u dokumentaciju

**Kriteriji prihvaćanja:**
- Mogu eksportirati tablični prikaz planiranja u Excel i PDF
- Mogu eksportirati listu zahtjeva u Excel, PDF, CSV
- Mogu eksportirati pregled dodjela i stanja dana zaposlenika u Excel i PDF
- Mogu eksportirati statistiku odjela u PDF
- Eksport sadrži: logo organizacije, datum kreiranja, ime korisnika koji je kreirao
- PDF ima lijepo formatiranje s headerima i footerima
- Excel ima zamrznute headere i filtriranje
- CSV je u UTF-8 formatu

**Prioritet:** Nice-to-have

---

## 6. GENERAL MANAGER - ODOBRAVANJE ZAHTJEVA (DRUGI NIVO)

### US-GM-001: Pregled zahtjeva za drugi nivo odobrenja
**Kao** General Manager  
**Želim** vidjeti sve zahtjeve koji su odobreni na prvom nivou  
**Kako bih** mogao donijeti finalno odobrenje

**Kriteriji prihvaćanja:**
- Prikazuje se lista svih zahtjeva sa statusom APPROVED_FIRST_LEVEL
- Za svaki zahtjev vidim: ime zaposlenika, odjel, razdoblje, broj dana, napomenu
- Vidim tko je odobrio na prvom nivou (Department Manager)
- Prikazuje se broj zahtjeva na čekanju za drugi nivo
- Mogu kliknuti na zahtjev za finalno odobrenje

---

### US-GM-002: Finalno odobravanje zahtjeva
**Kao** General Manager  
**Želim** odobriti zahtjev koji je prošao prvi nivo  
**Kako bi** zahtjev bio potpuno odobren

**Kriteriji prihvaćanja:**
- Kliknem na gumb "Odobri" kod zahtjeva sa statusom APPROVED_FIRST_LEVEL
- Otvara se dialog s detaljima zahtjeva
- Vidim sve informacije: zaposlenik, odjel, razdoblje, dani, napomena zaposlenika
- Vidim komentar Department Managera (ako postoji)
- Ako postoji preklapanje sa DaySchedule-om gdje unavailability reason ima hasPlanning=true:
  - Prikazuje se upozorenje da će se izvršiti korekcija (vraćanje dana) i da će novi zahtjev pregaziti postojeći plan
  - Ako postoji povezani zahtjev (applicationId): upozorenje navodi da će se vratiti SVI preostali dani iz originalnog zahtjeva (od početka novog zahtjeva do kraja originalnog), ne samo preklopljeni dani
  - Vidim detalje o preklapanju (koji dani, koja vrsta odsutnosti)
- Mogu dodati vlastiti komentar (opcionalno)
- Kliknem na "Odobri" za potvrdu
- Status zahtjeva postaje APPROVED (konačno)
- Dani se trajno oduzimaju od dodijeljenih dana (stanje dana)
- Ako postoji preklapanje sa DaySchedule-om s hasPlanning=true: izvršava se korekcija (vraća dane, CORRECTION ledger entry)
- Ako postoji povezani zahtjev (applicationId u DaySchedule-u):
  - Vraćaju se SVI preostali dani iz originalnog zahtjeva (od početka novog zahtjeva do kraja originalnog zahtjeva), ne samo preklopljeni dani
  - Brišu se SVI zapisi iz DaySchedule-a koji imaju applicationId = ID originalnog zahtjeva za dane od početka novog zahtjeva do kraja originalnog zahtjeva (jer su ti dani vraćeni da se mogu koristiti u novom zahtjevu)
  - U log originalnog zahtjeva dodaje se zapis da su preostali dani vraćeni
- Novi zahtjev pregazi postojeći plan u DaySchedule-u (ažurira se DaySchedule)
- Prikazuje se potvrda uspješnog odobravanja

---

### US-GM-003: Odbijanje zahtjeva - Drugi nivo
**Kao** General Manager  
**Želim** odbiti zahtjev koji je prošao prvi nivo  
**Kako bi** zaposlenik znao da zahtjev nije konačno odobren

**Kriteriji prihvaćanja:**
- Kliknem na gumb "Odbij" kod zahtjeva sa statusom APPROVED_FIRST_LEVEL
- Moram unijeti razlog odbijanja (obavezno polje)
- Status zahtjeva postaje REJECTED
- Dani se oslobađaju (ako su bili rezervirani)
- Zaposlenik vidi razlog odbijanja
- Department Manager također vidi razlog odbijanja
- Prikazuje se potvrda

---

### US-GM-004: Pregled svih zahtjeva u organizaciji
**Kao** General Manager  
**Želim** vidjeti sve zahtjeve u organizaciji  
**Kako bih** imao potpuni pregled planiranja

**Kriteriji prihvaćanja:**
- Prikazuje se lista svih zahtjeva iz svih odjela
- Mogu filtrirati po odjelu, statusu, zaposleniku
- Vidim status svakog zahtjeva (SUBMITTED, APPROVED_FIRST_LEVEL, APPROVED, REJECTED)
- Mogu pregledati detalje bilo kojeg zahtjeva
- Vidim tablični prikaz planiranja za sve odjele
 - U sklopu tabličnog prikaza mogu odabrati pojedini odjel i vidjeti gantt pregled planiranja (vidi US-DASH-004).

---

### US-GM-005: Kreiranje vlastitih zahtjeva General Managera
**Kao** General Manager  
**Želim** kreirati vlastite zahtjeve za godišnji odmor i druge odsutnosti  
**Kako bih** planirao svoj odmor

**Kriteriji prihvaćanja:**
- General Manager može kreirati vlastite zahtjeve kao i svaki drugi zaposlenik
- Zahtjevi prolaze kroz isti proces validacije
- Kreiranje zahtjeva kroz standardni modul zaposlenika

---

### US-GM-006: Odobravanje vlastitih zahtjeva
**Kao** General Manager  
**Želim** moći odobriti vlastite zahtjeve na svim nivoima  
**Kako bih** mogao brzo finalizirati svoj odmor

**Kriteriji prihvaćanja:**
- General Manager može odobriti vlastite zahtjeve na prvom nivou (kao Department Manager)
- General Manager može odobriti vlastite zahtjeve na drugom nivou (kao General Manager)
- Sustav ne blokira odobravanje vlastitih zahtjeva za General Managera
- U log-u se bilježi da je General Manager sam odobrio vlastiti zahtjev
- Prikazuje se upozorenje da odobrava vlastiti zahtjev

---

## 7. DEPARTMENT MANAGER / GENERAL MANAGER - PLANIRANJE ODSUTNOSTI (STANJE DANA)

### US-MGR-001: Pregled stanja dana zaposlenika
**Kao** Department Manager ili General Manager  
**Želim** vidjeti pregled stanja dana zaposlenika  
**Kako bih** znao koliko dana ima svaki zaposlenik

**Kriteriji prihvaćanja:**
- Department Manager vidi samo zaposlenike svog odjela
- General Manager vidi sve zaposlenike u organizaciji
- Prikazuje se lista zaposlenika sa stanjem njihovih dana
- **Stanje se prikazuje PO vrsti odsutnosti (odvojeno za svaku vrstu)**
- Za svakog zaposlenika i svaku vrstu odsutnosti (npr. "Godišnji odmor", "Slobodni dani", "Edukacija") vidim:
  - Naziv vrste odsutnosti
  - Dodijeljeno dana (za tekuću godinu)
  - Iskorišteno dana
  - Na čekanju dana
  - Preostalo dana
- Informacije su vizualno prikazane (npr. u chipovima gdje svaki tip ima svoju oznaku)
- Za svakog zaposlenika i svaki tip prikazuje se tablica po godinama
- Mogu kliknuti "Uredi dodjele" za promjenu dodjela (po tipu)
- **Napomena:** Ne prikazuje se "ukupna" suma svih tipova, već svaka vrsta odsutnosti ima vlastite brojke

---

### US-MGR-002: Dodjela dana za novu godinu
**Kao** Department Manager ili General Manager  
**Želim** dodijeliti dane zaposleniku za novu godinu  
**Kako bi** zaposlenik imao dane za planiranje

**Kriteriji prihvaćanja:**
- Otvaram dialog za upravljanje danima
- **Odabirem vrstu odsutnosti** za koju dodjelјujem dane (npr. "Godišnji odmor", "Slobodni dani", "Edukacija")
- Prikazuje se trenutno stanje za odabrani tip
- Vidim gumb "Dodaj novu godinu" za odabrani tip
- Odabirem godinu
- Unosim broj dana (1-50)
- Spremam dodjelu (internal: kreira se `ALLOCATION` evidencija promjene za specifičnu vrstu)
- Nova godina se pojavljuje u tablici za taj tip
- **Napomena:** Svaka vrsta odsutnosti ima vlastite evidencije promjena i stanje

---

### US-MGR-003: Izmjena postojeće dodjele dana
**Kao** Department Manager ili General Manager  
**Želim** promijeniti broj dana za postojeću godinu  
**Kako bi** ispravio grešku ili dodao dodatne dane

**Kriteriji prihvaćanja:**
- **Odabirem vrstu odsutnosti** za koju mijenjam dodjelu
- Kliknem na "Uredi" kod godine u tablici za odabrani tip
- Mijenjam broj dana
- Ne mogu smanjiti ispod već iskorištenih dana (za taj specifični tip)
- Spremam promjene (kreira se CORRECTION evidencija promjene za specifični tip)
- Automatski se preračunavaju preostali dani za taj tip
- Prikazuje se upozorenje ako pokušavam smanjiti ispod iskorištenih
- **Napomena:** Promjena se odnosi samo na odabranu vrstu odsutnosti, ne utječe na druge vrste

---

### US-MGR-004: Pregled povijesti evidencije zaposlenika
**Kao** Department Manager ili General Manager  
**Želim** vidjeti povijest evidencije dana zaposlenika po godinama  
**Kako bih** imao uvid u sve promjene i korekcije

**Kriteriji prihvaćanja:**
- **Odabirem vrstu odsutnosti** za koju želim vidjeti povijest
- Prikazuje se tablica s poviješću svih evidencija promjena po godinama za odabrani tip
- Za svaku godinu i odabrani tip vidim: početnu dodjelu, transfer, korekcije, potrošnju, preostalo
- Svaka evidencija ima timestamp i korisnika koji ju je kreirao
- Mogu filtrirati po godini i tipu evidencije (ALLOCATION, USAGE, TRANSFER, CORRECTION)
- Vidim poveznicu na zahtjev (applicationId) ako je evidencija nastala iz zahtjeva
- Mogu eksportirati povijest u Excel/PDF (za odabrani tip)
- **Napomena:** Povijest se prikazuje odvojeno za svaku vrstu odsutnosti, ne miješa se

---

## 8. DEPARTMENT MANAGER / GENERAL MANAGER - UPRAVLJANJE BOLOVANJIMA

### US-MGR-005: Evidentiranje novog bolovanja
**Kao** Department Manager ili General Manager  
**Želim** evidentirati bolovanje zaposlenika  
**Kako bi** imao evidenciju bolovanja

**Kriteriji prihvaćanja:**
- Odabirem zaposlenika iz liste
- Unosim datum početka bolovanja (obavezno)
- Mogu unijeti datum završetka (opcionalno za aktivna bolovanja)
- Mogu dodati napomenu
- Mogu dodati medicinsku dokumentaciju (upload datoteke)
- Ako bolovanje ima datum završetka, status je "Završeno"
- Ako nema datum završetka, status je "Aktivno"
- **Za otvorena bolovanja (bez datuma završetka):**
  - Kreira se DaySchedule zapis samo za datum početka bolovanja
  - U kalendaru se vizualno prikazuju svi dani od datuma početka do danas s oznakom "Aktivno bolovanje - u tijeku"
  - Ostali DaySchedule zapisi se ne kreiraju dok se bolovanje ne zatvori
- **Za zatvorena bolovanja (s datumom završetka):**
  - Kreiraju se DaySchedule zapisi za sve dane između datuma početka i završetka
- Spremam bolovanje

---

### US-MGR-006: Pregled aktivnih bolovanja
**Kao** Department Manager ili General Manager  
**Želim** vidjeti popis zaposlenika s aktivnim bolovanjima  
**Kako bih** znao tko je trenutno na bolovanju

**Kriteriji prihvaćanja:**
- Prikazuje se lista svih zaposlenika odjela
- Zaposlenici s aktivnim bolovanjem su označeni
- Za aktivno bolovanje vidim: datum početka, trajanje u danima (od datuma početka do danas)
- Aktivno bolovanje je vizualno istaknuto (npr. crvenom oznakom)
- U kalendaru se prikazuju svi dani od datuma početka do danas s oznakom "Aktivno bolovanje - u tijeku"
- Mogu kliknuti za zatvaranje bolovanja
- **Napomena:** Manager ručno zatvara bolovanja, nema automatskog zatvaranja

---

### US-MGR-007: Zatvaranje aktivnog bolovanja
**Kao** Department Manager ili General Manager  
**Želim** zatvoriti aktivno bolovanje  
**Kako bih** označio kraj bolovanja

**Kriteriji prihvaćanja:**
- Kliknem na "Zatvori bolovanje" kod aktivnog bolovanja
- Unosim datum završetka (mora biti nakon datuma početka)
- Mogu dodati dodatnu napomenu
- Mogu dodati medicinsku dokumentaciju
- Status se mijenja u "Završeno"
- **Pri zatvaranju bolovanja:**
  - Kreiraju se DaySchedule zapisi za sve dane između datuma početka i završetka
  - Postojeći DaySchedule zapis za prvi dan se ažurira (update umjesto create)
  - Automatski se prilagođavaju godišnji odmori (odnosno drugi unavailability reasons koji su bili upisani u dayschedule prema pravilima kao kod odobravanja zahtjeva koji se preklapa sa postojećim daysceduleom) ako je bilo preklapanja (izvršava se korekcija)

---

### US-MGR-008: Automatska prilagodba godišnjih odmora pri bolovanju
**Kao** Department Manager ili General Manager  
**Želim** da sustav automatski prilagodi godišnje odmore kad evidiram bolovanje  
**Kako bi** zaposlenik dobio nazad dane koje je bio na bolovanju

**Kriteriji prihvaćanja:**
- Pri spremanju bolovanja, sustav provjerava preklapanje s DaySchedule-om (stvarni plan)
- **Za otvorena bolovanja (bez datuma završetka):**
  - Provjerava se preklapanje samo za datum početka bolovanja
  - Ako postoji preklapanje s godišnjim odmorom na taj dan, izvršava se korekcija
- **Za zatvorena bolovanja (s datumom završetka):**
  - Pri spremanju ili zatvaranju bolovanja, sustav provjerava preklapanje za cijelo razdoblje
- Sustav provjerava da li unavailability reason u DaySchedule-u ima hasPlanning=true
- Ako ima hasPlanning=true i postoji preklapanje:
  - Ako postoji povezani zahtjev (applicationId u DaySchedule-u):
    - Vraćaju se SVI preostali dani iz originalnog zahtjeva (od početka bolovanja do kraja originalnog zahtjeva), ne samo preklopljeni dani
    - Brišu se SVI zapisi iz DaySchedule-a koji imaju applicationId = ID originalnog zahtjeva za dane od početka bolovanja do kraja originalnog zahtjeva (jer su ti dani vraćeni da se mogu koristiti u novom zahtjevu)
    - U log originalnog zahtjeva dodaje se zapis da su preostali dani vraćeni zbog bolovanja
    - Originalni zahtjev ostaje APPROVED i nepromijenjen (datumi ostaju isti)
- Originalni zahtjev (ako postoji) uvijek ostaje APPROVED (ne mijenja se status)
- DaySchedule zapisi se ažuriraju (dodaju se novi zapisi za bolovanje)
- Prikazuje se izvještaj o svim prilagodbama
- Zaposlenik vidi komentar o automatskoj prilagodbi u logu zahtjeva (ako postoji)

---

### US-MGR-009: Pregled izvještaja o prilagodbama
**Kao** Department Manager ili General Manager  
**Želim** vidjeti izvještaj o prilagodbama godišnjih odmora  
**Kako bih** razumio što se dogodilo nakon evidencije bolovanja

**Kriteriji prihvaćanja:**
- Nakon spremanja bolovanja prikazuje se dialog s izvještajem
- Za svaku prilagodbu vidim: ID zahtjeva, staro razdoblje, novo razdoblje, vraćeni dani
- Ako je zahtjev otkazan, to je jasno označeno
- Vidim ukupan broj vraćenih dana
- Mogu zatvoriti izvještaj

---

### US-MGR-010: Upload medicinske dokumentacije
**Kao** Department Manager ili General Manager  
**Želim** uploadati medicinsku dokumentaciju uz bolovanje  
**Kako bih** imao potpunu evidenciju

**Kriteriji prihvaćanja:**
- Mogu kliknuti "Upload dokumenta"
- Otvarač se prozor za odabir datoteke
- Podržani formati: PDF, JPG, PNG
- Maksimalna veličina: 5MB po datoteci
- Mogu dodati više dokumenata
- Dokumenti se spremaju uz bolovanje
- Vidim listu uploadanih dokumenata

---

### US-MGR-011: Pregled povijesti bolovanja
**Kao** Department Manager ili General Manager  
**Želim** vidjeti povijest bolovanja zaposlenika  
**Kako bih** imao uvid u sve evidencije

**Kriteriji prihvaćanja:**
- Kliknem na "Prikaži povijest" kod zaposlenika
- Prikazuje se lista svih bolovanja (aktivnih i završenih)
- Za svako bolovanje vidim: razdoblje, trajanje, status, napomenu, dokumentaciju
- Mogu filtrirati po statusu
- Mogu preuzeti medicinsku dokumentaciju

---

## 9. ADMINISTRATOR - UPRAVLJANJE ZAPOSLENICIMA

### US-ADM-001: Dodavanje novog zaposlenika
**Kao** administrator  
**Želim** dodati novog zaposlenika u sustav  
**Kako bi** mogao koristiti aplikaciju

**Kriteriji prihvaćanja:**
- Kliknem na "Dodaj zaposlenika"
- Unosim ime (obavezno)
- Unosim prezime (obavezno)
- Unosim email (obavezno, mora biti jedinstven)
- Odabirem odjel (opcionalno)
- Unosim broj dana godišnjeg odmora (default: 20)
- Spremam zaposlenika
- Automatski se kreira početna dodjela dana za tekuću godinu (internal: `ALLOCATION` entry)
- Status je automatski "Aktivan"

---

### US-ADM-002: Pregled liste zaposlenika
**Kao** administrator  
**Želim** vidjeti listu svih zaposlenika  
**Kako bih** mogao upravljati zaposlenicima

**Kriteriji prihvaćanja:**
- Prikazuje se tablica s zaposlenicima
- Za svakog zaposlenika vidim: ime i prezime, email, odjel
- Mogu pretraživati po imenu i emailu
- Svaki zaposlenik ima avatar s inicijalom imena
- Aktivni i neaktivni zaposlenici su različito prikazani
- Mogu kliknuti na zaposlenika za uređivanje

---

### US-ADM-003: Uređivanje zaposlenika
**Kao** administrator  
**Želim** urediti podatke zaposlenika  
**Kako bih** ispravio greške ili ažurirao informacije

**Kriteriji prihvaćanja:**
- Kliknem na "Uredi" ili na red zaposlenika
- Otvara se form s postojećim podacima
- Mogu promijeniti ime, prezime, email, odjel
- Email mora ostati jedinstven
- Spremam promjene
- Prikazuje se potvrda

---

### US-ADM-004: Deaktivacija zaposlenika
**Kao** administrator  
**Želim** deaktivirati zaposlenika  
**Kako bi** više ne mogao pristupiti sustavu

**Kriteriji prihvaćanja:**
- Kliknem na "..." meni kod zaposlenika
- Odabirem "Deaktiviraj"
- Status zaposlenika postaje "Neaktivan"
- Zaposlenik više ne može pristupiti sustavu
- Postojeći podaci ostaju vidljivi
- Mogu kasnije ponovno aktivirati zaposlenika

---

### US-ADM-005: Brisanje zaposlenika
**Kao** administrator  
**Želim** obrisati zaposlenika iz sustava  
**Kako bih** uklonio pogrešne unose

**Kriteriji prihvaćanja:**
- Kliknem na "..." meni kod zaposlenika
- Odabirem "Obriši"
- Prikazuje se potvrda brisanja
- Potvrdim brisanje
- Zaposlenik se trajno briše iz sustava
- Prikazuje se potvrda

---

## 10. ADMINISTRATOR - UPRAVLJANJE ODJELIMA

### US-ADM-006: Kreiranje novog odjela
**Kao** administrator  
**Želim** kreirati novi odjel  
**Kako bih** organizirao zaposlenike

**Kriteriji prihvaćanja:**
- Kliknem na "Dodaj odjel"
- Unosim naziv odjela (obavezno, jedinstven)
- Unosim opis (opcionalno)
- Mogu dodati Department Managere iz liste zaposlenika
- Mogu dodati zaposlenike koji pripadaju odjelu
- Spremam odjel

---

### US-ADM-007: Uređivanje odjela
**Kao** administrator  
**Želim** urediti postojeći odjel  
**Kako bih** promijenio strukturu organizacije

**Kriteriji prihvaćanja:**
- Kliknem na "Uredi" kod odjela
- Mogu promijeniti naziv i opis
- Mogu dodati/ukloniti Department Managere
- Mogu dodati/ukloniti zaposlenike
- Spremam promjene

---

### US-ADM-008: Dodjeljivanje Department Managera odjelu
**Kao** administrator  
**Želim** dodijeliti Department Managera odjelu  
**Kako bi** mogao odobravati zahtjeve zaposlenika na prvom nivou

**Kriteriji prihvaćanja:**
- U formi za odjel vidim popis mogućih Department Managera
- Mogu odabrati jednog ili više Department Managera
- Department Manager mora biti aktivni zaposlenik
- Department Manager automatski dobiva pristup funkcijama odobravanja prvog nivoa
- Jedan zaposlenik može biti Department Manager za više odjela

---

### US-ADM-008B: Dodjeljivanje General Managera
**Kao** administrator  
**Želim** dodijeliti General Managera organizaciji  
**Kako bi** mogao odobravati zahtjeve na drugom nivou

**Kriteriji prihvaćanja:**
- U postavkama organizacije vidim popis mogućih General Managera
- Mogu odabrati jednog ili više General Managera
- General Manager mora biti aktivni zaposlenik
- General Manager automatski dobiva pristup funkcijama odobravanja drugog nivoa
- General Manager vidi sve odjele u organizaciji

---

### US-ADM-009: Pregled odjela
**Kao** administrator  
**Želim** vidjeti listu svih odjela  
**Kako bih** imao pregled organizacije

**Kriteriji prihvaćanja:**
- Prikazuje se lista svih odjela
- Za svaki odjel vidim: naziv, opis, broj zaposlenika, broj Department Managera
- Mogu filtrirati aktivne/neaktivne odjele
- Mogu kliknuti na odjel za uređivanje

---

## 11. ADMINISTRATOR - UPRAVLJANJE PRAZNICIMA

### US-ADM-010: Dodavanje novog praznika
**Kao** administrator  
**Želim** dodati praznik u kalendar  
**Kako bi** praznici bili isključeni iz kalkulacije radnih dana

**Kriteriji prihvaćanja:**
- Kliknem na "Dodaj praznik"
- Unosim naziv praznika (obavezno)
- Odabirem datum (obavezno)
- Odabirem tip: ponavljajući ili jednokratni
- Ako je jednokratni, unosim godinu
- Spremam praznik
- Praznik se prikazuje u kalendaru zaposlenika

---

### US-ADM-011: Pregled liste praznika
**Kao** administrator  
**Želim** vidjeti listu svih praznika  
**Kako bih** mogao upravljati praznicima

**Kriteriji prihvaćanja:**
- Prikazuje se lista svih praznika
- Za svaki praznik vidim: naziv, datum, tip (ponavljajući/jednokratni)
- Praznici su sortirani po datumu
- Mogu filtrirati po godini
- Mogu uređivati i brisati praznike

---

### US-ADM-012: Uređivanje praznika
**Kao** administrator  
**Želim** urediti postojeći praznik  
**Kako bih** ispravio greške

**Kriteriji prihvaćanja:**
- Kliknem na "Uredi" kod praznika
- Mogu promijeniti naziv i datum
- Mogu promijeniti tip (ponavljajući/jednokratni)
- Ne mogu uređivati praznike iz prošlosti
- Spremam promjene

---

### US-ADM-013: Brisanje praznika
**Kao** administrator  
**Želim** obrisati praznik  
**Kako bih** uklonio pogrešne unose

**Kriteriji prihvaćanja:**
- Kliknem na "Obriši" kod praznika
- Prikazuje se potvrda brisanja
- Potvrdim brisanje
- Praznik se briše iz kalendara
- Postojeći zahtjevi se ne mijenjaju retroaktivno

---

## 12. ZAJEDNIČKE FUNKCIONALNOSTI

### US-CMN-003: Prikaz trenutno prijavljenog korisnika
**Kao** korisnik  
**Želim** vidjeti svoje ime u aplikaciji  
**Kako bih** znao da sam prijavljen

**Kriteriji prihvaćanja:**
- U gornjem desnom kutu prikazuje se moje ime
- Prikazuje se moja uloga (Administrator/Department Manager/General Manager/Zaposlenik)
- Mogu kliknuti za odjavu

---

### US-CMN-005: Prikaz grešaka
**Kao** korisnik  
**Želim** vidjeti jasne poruke o greškama  
**Kako bih** znao što je pošlo krivo

**Kriteriji prihvaćanja:**
- Greške se prikazuju u snackbar-u na dnu ekrana
- Poruka jasno opisuje problem
- Snackbar se automatski zatvara nakon nekoliko sekundi
- Mogu ručno zatvoriti snackbar

---

### US-CMN-006: Prikaz potvrda uspješnih akcija
**Kao** korisnik  
**Želim** vidjeti potvrdu kada je akcija uspješna  
**Kako bih** znao da je sve prošlo u redu

**Kriteriji prihvaćanja:**
- Potvrde se prikazuju u snackbar-u
- Poruka potvrđuje što je napravljeno
- Snackbar se vizualno razlikuje od poruka o greškama (npr. zelena boja za uspjeh)
- Automatski se zatvara nakon nekoliko sekundi

---

### US-CMN-007: Email notifikacije
**Kao** korisnik  
**Želim** primati email notifikacije za važne događaje  
**Kako bih** bio obaviješten bez potrebe za prijavom u sustav

**Kriteriji prihvaćanja:**
- **Zaposlenik prima notifikacije za:**
  - Zahtjev odobren (APPROVED)
  - Zahtjev odbijen (REJECTED)
  - Zahtjev odobren na prvom nivou (APPROVED_FIRST_LEVEL) - čeka drugi nivo
  - Dodjela dana promijenjena
- **Department Manager prima notifikacije za:**
  - Novi zahtjev na čekanju (SUBMITTED)
- **General Manager prima notifikacije za:**
  - Zahtjev čeka drugo odobrenje (APPROVED_FIRST_LEVEL)
- Email sadrži: tip događaja, zaposlenik, razdoblje, broj dana, link za pregled
- Korisnici mogu isključiti notifikacije u postavkama profila
- Notifikacije se šalju asinkrono (queue/background job)

**Prioritet:** Nice-to-have

---

## 13. POSLOVNE LOGIKE I VALIDACIJE

### US-VAL-000: Razlikovanje needApproval i hasPlanning flagova
**Kao** sustav  
**Želim** jasno razlikovati needApproval i hasPlanning flagove  
**Kako bi** se pravilno provodila poslovna logika

**Kriteriji prihvaćanja:**
- **needApproval**: Označava da zahtjev treba proći kroz proces odobrenja da bi postao APPROVED
  - needApproval=false: Zahtjev ide direktno u APPROVED status (npr. bolovanje)
  - needApproval=true: Zahtjev mora proći odobrenje (SUBMITTED → APPROVED)
- **hasPlanning**: Označava da zahtjev troši alocirane dane i ima ledger entries
  - hasPlanning=true: Zahtjev ima planning, troši dane, kreira ledger entries (npr. godišnji odmor)
  - hasPlanning=false: Zahtjev nema planning, ne troši dane (npr. bolovanje - samo evidencija)
- **Korekcija dana:** Ako se kreira novi zahtjev koji se preklapa s DaySchedule zapisom nastalog iz zahtjeva s hasPlanning=true, izvršava se korekcija (vraćanje alociranih dana)
  - Primjer: Godišnji odmor (hasPlanning=true) prekine se bolovanje → vraćaju se dani godišnjeg odmora

---

### US-VAL-001: Validacija preklapanja zahtjeva
**Kao** sustav  
**Želim** provjeriti preklapanje novog zahtjeva s postojećim planom i aktivnim zahtjevima  
**Kako bi** osigurao konzistentnost plana i omogućio korekcije gdje je potrebno

**Kriteriji prihvaćanja:**
- Blokirati kreiranje/submit ako postoji preklapanje s drugim “aktivnim” zahtjevom koji nije finaliziran (`DRAFT`, `SUBMITTED`, `APPROVED_FIRST_LEVEL`).
- Ako postoji preklapanje s postojećim planom (`DaySchedule`), sustav vraća upozorenje da će APPROVED zahtjev prepisati plan.
- Ako prebrisani plan potječe iz reason-a s `hasPlanning=true`, sustav upozorava na buduću korekciju i izvršava je tek na APPROVED (vidi `04_applications_flow.md`, `05_dayschedule_rules.md`, `06_ledger_rules.md`).

---

### US-VAL-002: Kalkulacija radnih dana
**Kao** sustav  
**Želim** točno izračunati broj radnih dana  
**Kako bi** zaposlenik znao koliko dana stvarno troši

**Kriteriji prihvaćanja:**
- Sustav isključuje subote i nedjelje
- Sustav isključuje praznike iz tablice praznika
- Ponavljajući praznici se primjenjuju na sve godine
- Jednokratni praznici samo za specifičnu godinu
- Prikazuje se točan broj radnih dana

---

### US-VAL-003: Validacija dostupnih dana
**Kao** sustav  
**Želim** provjeriti da zaposlenik ima dovoljno dana  
**Kako bi** spriječio negativan saldo

**Kriteriji prihvaćanja:**
- Sustav računa: Dodijeljeno - Odobreno (APPROVED) - Na čekanju (SUBMITTED, APPROVED_FIRST_LEVEL) = Dostupno
- Ako traženi dani prelaze dostupne, prikazuje se greška
- Greška pokazuje koliko je dostupno i koliko se traži
- Validacija se radi za godinu u kojoj POČINJE godišnji
- Balance se računa iz ledger entries (SUM changeDays)
- **Ako nema ALLOCATION za godinu u kojoj period počinje:**
  - Sustav provjerava prethodnu godinu (`year - 1`)
  - Ako u prethodnoj godini postoje preostali dani (balance > 0) i traženi dani su manji ili jednaki preostalim danima, validacija prolazi
- **Napomena:** U normalnom toku poslovanja, administrator napravi TRANSFER preostalih dana iz prethodne godine u novu prije planiranja nove godine

---

### US-VAL-004: Validacija datuma zahtjeva
**Kao** sustav  
**Želim** provjeriti da su datumi logički ispravni  
**Kako bi** spriječio nelogične zahtjeve

**Kriteriji prihvaćanja:**
- Datum početka mora biti prije ili jednak datumu završetka
- Datum početka smije biti u prošlosti (evidencija naknadnih događaja kao bolovanja)
- Datum završetka ne smije biti više od 365 dana u budućnosti
- Zahtjev mora uključivati barem jedan radni dan
- **Napomena:** Za otvorena pitanja/odluke vidi `/.cursor/docs/OPEN_QUESTIONS.md`.

---

### US-VAL-005: Validacija bolovanja
**Kao** sustav  
**Želim** provjeriti da bolovanje ne prelazi s drugim bolovanjem  
**Kako bi** zaposlenik imao samo jedno aktivno bolovanje u periodu

**Kriteriji prihvaćanja:**
- Sustav provjerava preklapanje s aktivnim bolovanjima
- Ako postoji preklapanje, prikazuje se greška
- Datum početka ne smije biti u budućnosti
- Datum završetka mora biti nakon datuma početka
 - Semantika “aktivnog bolovanja bez datuma završetka” je TBD (vidi `/.cursor/docs/OPEN_QUESTIONS.md`).

---

### US-VAL-006: Validacija statusa za uređivanje zahtjeva
**Kao** sustav  
**Želim** spriječiti uređivanje zahtjeva koji su već poslani na odobrenje  
**Kako bi** se osigurala integritet procesa odobravanja

**Kriteriji prihvaćanja:**
- Pravila uređivanja ovise o statusu (vidi `/.cursor/docs/01_domain_statuses.md`):
  - `DRAFT` se može uređivati/brisati
  - ostali statusi se ne uređuju kroz “edit zahtjeva” flow
- Ako korisnik pokuša urediti nedozvoljen status, prikazuje se jasna greška.

---

### US-VAL-007: Provjera preklapanja s DaySchedule-om i korekcija pri odobrenju
**Kao** sustav  
**Želim** provjeriti preklapanje novog zahtjeva s DaySchedule-om (stvarni plan) i izvršiti korekciju pri odobrenju  
**Kako bi** osigurao konzistentnost plana i omogućio korekcije

**Kriteriji prihvaćanja:**
- Pri kreiranju i pri odobrenju sustav poštuje pravila:
  - preklapanje se provjerava prema `DaySchedule` i “aktivnim” zahtjevima
  - na `APPROVED` zahtjev prepisuje plan za dane u periodu (DaySchedule upsert)
  - korekcije dana (ledger) rade se samo kad se prepisuje plan iz reason-a s `hasPlanning=true`
- Detaljna pravila i edge-caseovi su u:
  - `/.cursor/docs/04_applications_flow.md`
  - `/.cursor/docs/05_dayschedule_rules.md`
  - `/.cursor/docs/06_ledger_rules.md`
  - otvorena pitanja: `/.cursor/docs/OPEN_QUESTIONS.md`



