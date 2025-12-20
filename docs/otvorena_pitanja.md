# Otvorena pitanja
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Verzija:** 1.0  
**Datum:** 20.12.2024  
**Projekt:** Luna - Sustav za godišnji odmor  

---

## 1. LOGIKA ZA OTVORENA BOLOVANJA BEZ DATUMA ZAVRŠETKA

### Kontekst
Kada se kreira bolovanje bez datuma završetka (aktivno bolovanje), sustav ne zna do kada će trajati bolovanje.

### Pitanja

**1.1 Što se događa s DaySchedule zapisima kada se kreira bolovanje bez datuma završetka?**

Opcije:
- **A)** Ne kreirati DaySchedule zapise dok se bolovanje ne zatvori (stavi datum završetka)
- **B)** Kreirati DaySchedule zapise za razumno razdoblje (npr. 30 dana) i automatski proširivati ako je potrebno
- **C)** Kreirati DaySchedule zapis samo za prvi dan bolovanja

**1.2 Kako prikazati u kalendaru dane koji su "potencijalno" bolovanje ali još nemaju potvrđen kraj?**

Opcije:
- **A)** Prikazati samo prvi dan bolovanja s oznakom "Aktivno bolovanje - u tijeku"
- **B)** Prikazati pattern (npr. isprekidane linije) za procijenjeno razdoblje
- **C)** Prikazati sve dane od početka bolovanja pa nadalje dok se ne zatvori
- **D)** Ne prikazivati buduće dane dok se bolovanje ne zatvori

**1.3 Treba li ograničiti koliko daleko u budućnost se DaySchedule popunjava za otvorena bolovanja?**

Opcije:
- **A)** Da, maksimalno 30 dana u budućnost
- **B)** Da, maksimalno 60 dana u budućnost
- **C)** Da, maksimalno 90 dana u budućnost
- **D)** Ne, čekati zatvaranje bolovanja

### ✅ ODLUKA (20.12.2024)

**Opcija 1.1-C + 1.2-Custom + 1.3:**
- **1.1:** Kreirati DaySchedule zapis samo za prvi dan bolovanja
- **1.2:** Prikazati u kalendaru sve dane od početka bolovanja do danas s oznakom "Aktivno bolovanje - u tijeku"
- **1.3:** U trenutku zatvaranja bolovanja (dodavanja datuma završetka) popuniti DaySchedule za sva ostala dana

**Implementacija:**
1. Pri kreiranju bolovanja bez datuma završetka:
   - Kreirati DaySchedule zapis samo za datum početka bolovanja
   - Status: NOT_AVAILABLE
   - unavailabilityReasonId: Bolovanje
   
2. Prikaz u kalendaru (UI):
   - Prikazati sve dane od datuma početka do danas (current date)
   - Označiti vizualno s "Aktivno bolovanje - u tijeku"
   - Ne kreirati DaySchedule zapise za te dane (samo vizualni prikaz)
   
3. Pri zatvaranju bolovanja (dodavanje endDate):
   - Kreirati DaySchedule zapise za sve dane između startDate i endDate
   - Prepisati postojeći zapis za prvi dan (update umjesto create)

**Razlog:** Optimalno rješenje - samo jedan DaySchedule zapis pri otvaranju, vizualni prikaz u UI, svi zapisi se kreiraju tek pri zatvaranju.

---

## 2. VALIDACIJA DATUMA POČETKA U PROŠLOSTI

### Kontekst
Trenutno sustav dozvolјava kreiranje zahtjeva s datumom početka u prošlosti (potrebno za naknadnu evidenciju bolovanja), ali nije definirano koliko daleko u prošlost.

### Pitanja

**2.1 Koliko dana u prošlosti dozvoliti za kreiranje zahtjeva?**

Opcije:
- **A)** Bez ograničenja (bilo koji datum u prošlosti)
- **B)** Maksimalno 7 dana u prošlosti
- **C)** Maksimalno 30 dana u prošlosti (unutar tekućeg mjeseca)
- **D)** Maksimalno 90 dana u prošlosti (unutar tekućeg kvartala)
- **E)** Unutar tekuće godine (ne može se kreirati zahtjev za prošlu godinu)

**2.2 Treba li različito pravilo za različite tipove zahtjeva?**

Opcije:
- **A)** Da, bolovanja mogu biti bilo koji datum u prošlosti, godišnji odmor maksimalno 7 dana
- **B)** Da, bolovanja maksimalno 90 dana, godišnji odmor maksimalno 7 dana
- **C)** Da, bolovanja unutar tekuće godine, godišnji odmor maksimalno 30 dana
- **D)** Ne, ista pravila za sve tipove

**2.3 Treba li različito pravilo za administratore/managere vs zaposlenike?**

Opcije:
- **A)** Da, administratori i manageri nemaju ograničenja, zaposlenici imaju
- **B)** Da, administratori nemaju ograničenja, manageri i zaposlenici imaju ista ograničenja
- **C)** Ne, ista pravila za sve uloge

### Preporuka (za diskusiju)
Preporučujem **Opcija 2.1-C + 2.2-B + 2.3-A**:
- Bolovanja mogu biti evidencirana maksimalno 90 dana u prošlosti (3 mjeseca)
- Godišnji odmor može biti kreiran maksimalno 30 dana u prošlosti (1 mjesec)
- Administratori i manageri nemaju ograničenja (za korekcije starijih zapisa)

**Razlog:** 
- Bolovanja se često evidentiraju naknadno (čeka se medicinska dokumentacija)
- Godišnji odmor ne bi trebao biti kreiran daleko u prošlosti (iznimka: korekcije od strane admina)
- Admini trebaju moći ispravljati stare zapise

---

## 3. DODATNA PITANJA (ZA BUDUĆE RAZMATRANJE)

### 3.1 Otkazivanje APPROVED zahtjeva od strane zaposlenika

**Pitanje:** Treba li dozvoliti zaposleniku da otkaže vlastiti APPROVED zahtjev (prije datuma početka)?

Opcije:
- **A)** Ne, samo manager može otkazati APPROVED zahtjev
- **B)** Da, ali samo do X dana prije datuma početka
- **C)** Da, ali samo uz approval managera
- **D)** Da, bez ograničenja (do datuma početka)

### 3.2 Automatsko zatvaranje otvorenih bolovanja

**Pitanje:** Treba li sustav automatski zatvoriti otvorena bolovanja nakon određenog razdoblja?

**✅ ODLUKA (20.12.2024): Opcija C**
- Manager ručno zatvara bolovanja
- Nema automatskog zatvaranja
- Opciono: Sustav može slati notifikacije/upozorenja za dugotrajna otvorena bolovanja, ali ne zatvara ih automatski

---

**Napomena:** Ova pitanja zahtijevaju odluku prije implementacije relevantnih funkcionalnosti.

