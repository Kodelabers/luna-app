# Otvorena pitanja (TBD) — potrebne odluke

Ovaj dokument je **namjerno** mjesto za otvorena pitanja koja zahtijevaju odluku prije (ili tijekom) implementacije.
Cursor AI ga koristi kao “guardrail”: ako je nešto TBD, implementacija mora poštovati ovdje dogovoreno pravilo.

## Pravila korištenja
- Svako TBD pitanje mora imati:
  - **Kontekst**
  - **Opcije**
  - **Preporuku** (ako postoji)
  - **Odluku** (prazno dok se ne donese)
  - **Impact** (što se mijenja kad se odluči)
- Kad se odluka donese, dopuniti i **linkati** relevantne storyje i docove.

---

## OQ-001: Bolovanje bez datuma završetka (“open-ended”)
**Kontekst**
- U user stories postoji scenarij “aktivno bolovanje bez endDate”.
- Open-ended bolovanje se implementira kao zaseban entitet `SickLeave` (nije `Application`) sa statusom `OPENED` i `endDate = null`.

**Opcije**
- A) Open-ended kao `SickLeave(OPENED,endDate=null)` + materializacija samo start dana u `DaySchedule`.
- B) Open-ended se ne dopušta (endDate obavezan).

**Preporuka**
- A) daje najbolji UX uz jasna pravila prikaza i minimalne DB efekte.

**Odluka**
- **DECIDED: A)**\n+  - `SickLeave.status = OPENED`, `SickLeave.endDate = null`\n+  - `DaySchedule` se kreira/upserta **samo za `startDate`** (1 dan)\n+  - UI (planning + moj kalendar) prikazuje “virtualni raspon” **od `startDate` do današnjeg dana** u `clientTimeZone`.\n+  - Korekcije (ledger + brisanje `DaySchedule` originalnog GO) rade se po pravilu iz `06_ledger_rules.md`.\n+  - `CANCELLED` je moguć samo iz `OPENED` dok je `endDate=null`; cancel **briše** `DaySchedule` zapise koje je bolovanje kreiralo i **ne revert-a** korekcije.

**Impact**
- `DaySchedule` za OPENED bolovanje je minimalan (1 dan), ali UI mora raditi virtualni prikaz do danas.\n+- Validacije preklapanja i korekcije koriste `SickLeave` interval i/ili virtualni interval (za prikaz), ali DB korekcije su deterministične (start dan na OPEN, cijeli interval na CLOSE).

---

## OQ-002: Semantika `Application.active`
**Kontekst**
- `Application` ima `active: Boolean`.
- Stories spominju “otvoreni/aktivni/finalizirani” zahtjevi, ali “active=false” semantika nije eksplicitno definirana.

**Opcije**
- A) `active=false` znači soft-delete (npr. obrisan DRAFT).
- B) `active=false` znači arhiviran/zatvoren (npr. CANCELLED ide na active=false).
- C) `active` se nikad ne dira, koristi se samo `status`.

**Odluka**
- TBD

**Impact**
- Queryji u dashboardu i listama moraju biti konzistentni (default filter).

---

## OQ-003: CANCELLED flow (tko može, kada, posljedice)
**Kontekst**
- Status `CANCELLED` postoji u `ApplicationStatus`.
- Stories trenutno nemaju jasan cancel flow (npr. može li employee otkazati SUBMITTED, može li manager otkazati, itd.).

**Opcije**
- A) Employee može cancel samo DRAFT (i to je zapravo delete/active=false).
- B) Employee može cancel SUBMITTED prije odobrenja (status=CANCELLED).
- C) Manager/GM može cancel u iznimkama.

**Odluka**
- TBD

**Impact**
- Kako se ponašaju ledger i DaySchedule ako se cancel dogodi nakon djelomičnog procesiranja.

---

## OQ-004: Kako prepoznajemo “aktivno bolovanje” (oznaka uz zaposlenika)
**Kontekst**
- U dashboard gantt widgetu želimo prikazati oznaku uz zaposlenika (npr. crveni križ) kada je zaposlenik “trenutno na bolovanju”.
- Potrebna je jasna definicija što znači “bolovanje” i kako ga sustav prepoznaje.

**Opcije**
- A) Preko konfiguracije u adminu: odabrani `UnavailabilityReason` (ili više njih) predstavlja “bolovanje”.
- B) Preko naziva reason-a: `UnavailabilityReason.name == "Bolovanje"` (ili mapiranje po locale).
- C) Preko flagova/relacija: `UnavailabilityReason.sickLeave=true` + postoji `SickLeave.status=OPENED` za zaposlenika.

**Odluka**
- **DECIDED: C)**\n+  - `UnavailabilityReason.sickLeave = true` je kanonski marker za “bolovanje”.\n+  - “Trenutno na bolovanju” = postoji barem jedno `SickLeave(status=OPENED)` za zaposlenika (tenant-scoped).

**Impact**
- Kako service određuje “na bolovanju” u danom rasponu (npr. danas ili unutar prikazanog intervala).
- Kako UI označava zaposlenika kada postoji više vrsta “bolovanja” ili sličnih razloga.


