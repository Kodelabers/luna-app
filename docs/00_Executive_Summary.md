# Executive Summary
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Projekt:** Luna - Sustav za godišnji odmor  
**Datum:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Prijedlog za odobrenje  

---

## 📊 Sažetak projekta

### Pozadina
Uspješno smo prezentirali mockup aplikaciju za upravljanje godišnjim odmorima i bolovanja. Korisnici su bili zadovoljni funkcionalnostima i korisničkim sučeljem. Sada je vrijeme za razvoj prave, produkcijske verzije aplikacije.

### Cilj
Razviti potpuno funkcionalan, siguran i skalabilan sustav za upravljanje godišnjim odmorima i bolovanja koji će:
- Automatizirati proces zahtijevanja i odobravanja godišnjih odmora
- Omogućiti evidenciju bolovanja s automatskom prilagodbom godišnjih odmora
- Pružiti pregled i planiranje resursa na razini odjela
- Centralizirati sve podatke u jednom sustavu

---

## 👥 Korisničke uloge i ključne funkcionalnosti

### 1. Administrator
- Upravljanje zaposlenicima (dodavanje, uređivanje, deaktivacija)
- Upravljanje odjelima i organizacijskom strukturom
- Dodjeljivanje odobravatelja odjelima
- Upravljanje praznicima i neradnim danima
- Pregled statistika cijele organizacije

### 2. Odobravatelj (Manager/Voditelj)
- Pregled i odobravanje zahtjeva zaposlenika svog odjela
- Vizualni kalendar planiranja odmora
- Dodjela godišnjih dana zaposlenicima
- Evidencija bolovanja s automatskom prilagodbom godišnjih odmora
- Statistike i izvještaji za odjel

### 3. Zaposlenik
- Kreiranje zahtjeva za godišnji odmor
- Pregled statusa vlastitih zahtjeva
- Kalendar s planiranim odmorima
- Pregled preostalih dana godišnjeg odmora
- Pregled evidencije bolovanja

---

## 💡 Ključne funkcionalnosti

### 🚀 Inovativne funkcionalnosti

**1. Automatska prilagodba godišnjih odmora**
- Prilikom evidencije bolovanja, sustav automatski prilagođava odobrene godišnje odmore
- Zaposlenici ne gube dane godišnjeg odmora ako su bili na bolovanju
- Potpuna automatizacija - nema potrebe za ručnim korekcijama

**2. Inteligentna validacija zahtjeva**
- Automatska provjera preklapanja s postojećim zahtjevima
- Provjera dostupnosti dana godišnjeg odmora
- Automatsko računanje radnih dana (isključuje vikende i praznike)
- Real-time feedback pri kreiranju zahtjeva

**3. Vizualno planiranje resursa**
- Tablični prikaz svih zaposlenika i njihovih odmora
- Identifikacija kritičnih razdoblja (previše ljudi na odmoru)
- Različite boje za različite statuse (odobreno, na čekanju, bolovanje)
- Fleksibilni prikazi (tjedan, mjesec, custom razdoblje)

---

## 💰 Poslovne koristi

### Operativna efikasnost
✅ **Ušteda vremena:** Automatizacija procesa smanjuje administrativni rad za ~70%  
✅ **Brže odluke:** Odobravatelji vide sve relevantne informacije na jednom mjestu  
✅ **Smanjenje grešaka:** Automatske validacije eliminiraju ljudske greške  

### Bolje upravljanje resursima
✅ **Vizibilnost:** Managers imaju potpuni pregled planiranih odmora  
✅ **Sprječavanje konflikata:** Sustav upozorava na kritična razdoblja  
✅ **Pravednija raspodjela:** Transparentan sustav dodjeljivanja dana  

### Zadovoljstvo zaposlenika
✅ **Jednostavno korištenje:** Intuitivno sučelje, pristupačno sa bilo kojeg uređaja  
✅ **Transparentnost:** Zaposlenici vide status zahtjeva u real-time  
✅ **Pravednost:** Automatsko vraćanje dana pri bolovanju  

### Compliance i sigurnost
✅ **Audit trail:** Potpuno logiranje svih akcija  
✅ **GDPR compliance:** Zaštita osobnih podataka  
✅ **Backup:** Automatski dnevni backup-i  

---

## 🏗️ Tehnička arhitektura

### Visoka razina

```
┌─────────────────────┐
│   Web Browser       │  ← Korisnici pristupaju aplikaciji
│   (Flutter Web)     │
└──────────┬──────────┘
           │ HTTPS / REST API
           │
┌──────────▼──────────┐
│   Backend API       │  ← Business logika i validacije
│   (Node.js)         │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   PostgreSQL        │  ← Trajno spremanje podataka
│   Redis (Cache)     │
└─────────────────────┘
```

### Tehnologije

**Frontend:**
- Flutter Web (cross-platform, moderan UI)
- Pristupačno sa desktop, tablet, mobile

**Backend:**
- Node.js + TypeScript (brz razvoj, skalabilnost)
- PostgreSQL (pouzdana, enterprise-grade baza)
- Redis (performanse, caching)

**Hosting:**
- Cloud (AWS / Azure / Google Cloud)
- Auto-scaling za skalabilnost
- 99.9% uptime garantiran

**Sigurnost:**
- JWT autentifikacija
- HTTPS enkripcija
- Role-based access control
- Rate limiting protiv napada

---

## 📅 Timeline i faze

### Faza 1: MVP - Core funkcionalnosti (4-6 tjedana)
**Deliverables:**
- Autentifikacija korisnika
- Upravljanje zaposlenicima i odjelima
- Kreiranje i odobravanje zahtjeva
- Osnovni dashboard
- Kalendarski prikaz

**Outcome:** Funkcionalan sustav za osnovne procese

---

### Faza 2: Enhanced funkcionalnosti (3-4 tjedna)
**Deliverables:**
- Upravljanje praznicima
- Evidencija bolovanja
- Automatska prilagodba godišnjih odmora
- Vraćanje zahtjeva na doradu
- Tablični prikaz planiranja

**Outcome:** Potpuno funkcionalan sustav s naprednim features

---

### Faza 3: Nice-to-have (2-3 tjedna)
**Deliverables:**
- Email notifikacije
- Detaljne statistike i izvještaji
- Eksport izvještaja (Excel, PDF)
- Masovno odobravanje

**Outcome:** Premium verzija sa svim dodatnim funkcionalnostima

---

**Ukupno vrijeme:** 9-13 tjedana (ovisno o veličini tima)

---

## 👨‍💻 Potrebni resursi

### Development tim

**Opcija 1: Optimalan tim**
- 2 Backend developera
- 2 Frontend developera
- 1 QA tester
- 0.5 DevOps (part-time)

**Timeline:** 9-10 tjedana za complete verziju

---

**Opcija 2: Manji tim**
- 1 Backend developer
- 1 Frontend developer
- 1 QA tester (part-time)
- DevOps outsource

**Timeline:** 12-13 tjedana za complete verziju

---

**Opcija 3: Full-stack developer**
- 1 Full-stack developer
- 1 QA tester (part-time)
- DevOps outsource

**Timeline:** 15-16 tjedana za complete verziju

---

### Infrastructure troškovi (mjesečno)

**Staging environment:**
- Hosting: $50-100/mjesec
- Database: $30-50/mjesec
- Storage: $10-20/mjesec
- **Ukupno: ~$100-200/mjesec**

**Production environment:**
- Hosting: $200-500/mjesec (ovisno o broju korisnika)
- Database: $100-200/mjesec
- Storage: $20-50/mjesec
- Monitoring: $50-100/mjesec
- **Ukupno: ~$400-900/mjesec**

**Napomena:** Cijene ovisno o provideru (AWS/Azure/GCP) i broju korisnika

---

## 📈 ROI - Return on Investment

### Pretpostavke
- **Organizacija:** 100 zaposlenika
- **HR/Admin osoblje:** 2 osobe
- **Trenutno vrijeme za admin godišnjih:** 5 sati/tjedan

### Uštede

**Ušteda vremena:**
- 5 sati/tjedan × 52 tjedna = 260 sati/godišnje
- 70% automatizacija = 182 sata uštede
- @ 30€/sat = **5,460€ godišnje**

**Smanjenje grešaka:**
- Procjena: 5-10 grešaka godišnje
- Trošak ispravka: 2 sata/greška
- @ 30€/sat = **300-600€ godišnje**

**Bolje planiranje:**
- Smanjenje konflikata resursa: ~5%
- Procjena vrijednosti: **2,000€ godišnje**

**Ukupna ušteda: ~7,700€ godišnje**

### Troškovi

**Development (jednokratno):**
- 10 tjedana × 2-4 developera = **15,000-40,000€**

**Infrastructure (godišnje):**
- ~600€/mjesec × 12 = **7,200€/godišnje**

**Maintenance (godišnje):**
- Bug fixes, updates = **5,000-10,000€/godišnje**

### Break-even

Za organizaciju od 100 zaposlenika:
- **Break-even:** 2-3 godine (ovisno o development trošku)
- **Za veće organizacije (500+ zaposlenika):** < 1 godina

**Dodatne koristi koje se teško kvantificiraju:**
- Veće zadovoljstvo zaposlenika
- Bolja transparentnost
- Compliance i audit trail
- Skalabilnost (ne treba dodatno osoblje za rast)

---

## ⚠️ Rizici i mitigacija

### Rizik 1: Tehnički izazovi
**Opis:** Kompleksnost automatske prilagodbe godišnjih odmora  
**Mitigacija:** Detaljno testiranje, fazni rollout, backup ručnog procesa  
**Vjerojatnost:** Srednja | **Utjecaj:** Srednji  

---

### Rizik 2: User adoption
**Opis:** Korisnici ne žele promijeniti postojeće procese  
**Mitigacija:** Training, user guides, support, fazna migracija  
**Vjerojatnost:** Srednja | **Utjecaj:** Visoki  

---

### Rizik 3: Timeline delays
**Opis:** Development traje duže od predviđenog  
**Mitigacija:** Agile pristup, prioritizacija MVP-a, buffer time  
**Vjerojatnost:** Srednja | **Utjecaj:** Srednji  

---

### Rizik 4: Budget overrun
**Opis:** Troškovi premašuju budget  
**Mitigacija:** Fixed-price contract, clear scope, change management process  
**Vjerojatnost:** Niska | **Utjecaj:** Srednji  

---

### Rizik 5: Data security
**Opis:** Breach osobnih podataka zaposlenika  
**Mitigacija:** Security best practices, HTTPS, enkripcija, audit trail  
**Vjerojatnost:** Niska | **Utjecaj:** Visoki  

---

## ✅ Preporuke i sljedeći koraci

### Preporuka: **ODOBRI PROJEKT**

**Razlozi:**
1. ✅ Mockup je uspješno validirao potrebu i funkcionalnosti
2. ✅ ROI je pozitivan unutar 2-3 godine
3. ✅ Tehnologija je mature i provjerena
4. ✅ Development tim je dostupan
5. ✅ Poslovne koristi opravdavaju investiciju

### Neposredni sljedeći koraci (1-2 tjedna)

1. **Formiranje tima**
   - Selekcija developera (backend + frontend)
   - Selekcija QA testera
   - Identifikacija DevOps partnera

2. **Setup**
   - Kreiranje projektnog prostora (GitHub/GitLab)
   - Setup development environmenta
   - Setup komunikacijskih kanala (Slack/Teams)

3. **Planning**
   - Sprint planning (2-week sprints)
   - Kreiranje backlog-a (na temelju dokumentacije)
   - Definition of Done

4. **Design**
   - UI/UX dizajn na temelju User Flow dijagrama
   - Kreiranje design systema
   - Wireframes i prototipovi

### Dugoročni plan (3-6 mjeseci)

**Mjesec 1-2:** Development (Phase 1 - MVP)  
**Mjesec 2:** Internal testing i bug fixes  
**Mjesec 3:** Beta program sa odabranim korisnicima  
**Mjesec 3-4:** Development (Phase 2 - Enhanced)  
**Mjesec 4:** User Acceptance Testing  
**Mjesec 5:** Production deployment  
**Mjesec 6:** Monitoring, support, Phase 3 planning  

---

## 📞 Kontakt za više informacija

Za dodatna pitanja ili pojašnjenja vezana uz:
- **Tehničke detalje:** Pogledaj [Tehničku arhitekturu](./04_Tehnicka_Arhitektura.md)
- **Funkcionalnosti:** Pogledaj [Funkcionalnu specifikaciju](./01_Funkcionalna_Specifikacija.md)
- **API:** Pogledaj [API specifikaciju](./06_API_Specifikacija.md)
- **Sve ostalo:** Pogledaj [README](./README.md) za potpuni pregled dokumentacije

---

## 🎯 Zaključak

Razvoj produkcijske verzije sustava za upravljanje godišnjim odmorima predstavlja odličnu investiciju koja će:

✅ **Smanjiti administrativni teret** za HR i menadžere  
✅ **Poboljšati planiranje resursa** i produktivnost  
✅ **Povećati transparentnost** i zadovoljstvo zaposlenika  
✅ **Osigurati compliance** i audit trail  
✅ **Omogućiti skalabilnost** bez dodatnih resursa  

**Mockup je potvrdio da rješenje radi - sada je vrijeme da ga napravimo realnim.**

---

**Pripremio:** Development Team  
**Datum:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Za odobrenje managementa  

---

**Prilog:** Kompletna tehnička dokumentacija dostupna u `/docs` direktoriju

