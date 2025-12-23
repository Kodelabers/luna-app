# Analiza: UC01-Dashboard.md vs user_stories.md

Usporedba specifičnog dokumenta `UC01-Dashboard.md` s glavnim `user_stories.md` dokumentom.

**Smjer analize**: Samo UC01-Dashboard.md → user_stories.md (ne obrnuto)

**Status**: ✅ Ažurirano (2024-12-22)

---

## Pronađene kontradikcije

### 1. Definicija "otvorenih zahtjeva" za zaposlenika

**UC-DASH-03.1:**
> "Otvoreni" = aktivni zahtjevi koji nisu finalizirani: `status IN (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)`

**US-EMP-004:**
> Prikazuju se svi zahtjevi u statusima: DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, **APPROVED, REJECTED**

⚠️ **Potencijalna kontradikcija**: UC-DASH-03.1 eksplicitno definira "otvorene zahtjeve" kao one koji **isključuju** APPROVED i REJECTED, dok US-EMP-004 prikazuje sve statuse. Ovo bi moglo biti namjerno (različiti pogledi), ali terminologija nije usklađena.

---

## Nedostaje u user_stories.md

### 1. UC-DASH-01: Logika određivanja uloga na dashboardu

Nigdje u `user_stories.md` nije eksplicitno opisano:
- Kako sustav određuje `isGeneralManager`, `isDepartmentManager`, `managedDepartmentIds`
- Pravilo da korisnik koji ima **obje uloge** (GM + department manager) vidi **oba seta widgeta** istovremeno

### 2. UC-DASH-02: Timezone handling za kalendar

`user_stories.md` ne pokriva:
- Input parametar `clientTimeZone` (IANA tz format)
- Konverziju UTC ↔ lokalna vremenska zona
- Tehnički model podataka kalendara (`dateISO`, `utcDateISO`, `isWeekend`, `isHoliday`, etc.)
- Specifične error kodove (403, 422)

### 3. UC-DASH-03.2: Manager vidi DVA tipa zahtjeva

**UC-DASH-03.2** eksplicitno definira da department manager vidi:
1. Zahtjeve koje mora odobriti: `status = SUBMITTED`
2. Zahtjeve koje je odobrio, ali GM još nije: `status = APPROVED_FIRST_LEVEL`

**US-DM-001** pokriva samo prvi tip:
> Prikazuje se lista svih zahtjeva sa statusom SUBMITTED

❌ **Nedostaje**: Widget/tab za zahtjeve koje je manager odobrio ali čekaju GM odobrenje

### 4. UC-DASH-03: UI specifikacija dashboard widgeta

Nedostaje specifikacija dashboard layouta:
- Obični korisnik: "Moji otvoreni zahtjevi" card + list
- Manager: "Za odobriti" s **tabovima** (`Čeka moje odobrenje` / `Čeka GM`)
- GM: "Za odobriti" list

### 5. UC-DASH-02: "Today" highlight

UC-DASH-02 specifično navodi:
> "Danas" highlight radi UI (na klijentu) ili se može vratiti kao `todayLocalISO`

US-EMP-003 ne spominje highlight za trenutni dan.

### 6. UC-DASH-01: Korisnik bez Employee profila

UC-DASH-01 navodi scenarij:
> ako ne postoji: korisnik nema "employee profil" → dashboard može biti ograničen (npr. samo poruka "nisi povezan na zaposlenika")

Ovaj edge case nije pokriven u `user_stories.md`.

---

## Preporuka

Dodati u `user_stories.md`:

1. ✅ **US-DASH-001**: Dashboard kontekst i određivanje uloga
2. ✅ **US-DASH-002**: Kalendar s timezone podrškom i today highlightom  
3. ✅ **US-DASH-003**: Dashboard widgeti za zahtjeve (po ulozi) - novi user story
4. ✅ Ažurirati **US-DM-001** da uključi i `APPROVED_FIRST_LEVEL` zahtjeve koji čekaju GM
5. ✅ Ažurirati **US-EMP-003** da uključi "Today" highlight i timezone handling
6. ✅ Ažurirati **US-EMP-004** da razjasni razliku između "aktivnih" i "otvorenih" zahtjeva

