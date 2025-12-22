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
- Prisma model za `Application` uključuje polja `startDate` i `endDate`, ali pravilo i UX za open-ended je TBD.

**Opcije**
- A) UI dopušta “bez kraja”, a backend radi “privremeni” endDate (npr. startDate) i kasnije update-a na zatvaranju.
- B) UI NE dopušta “bez kraja” (manager mora unijeti endDate).
- C) Poseban flow (npr. zasebna entitet/logika) — samo ako je kompatibilno sa SSoT pravilom (bez promjene Prisma sheme, ili uz kasniju migraciju).

**Preporuka**
- A) daje najbolji UX i može se izvesti bez promjene scheme, ali zahtijeva jasno pravilo kako DaySchedule izgleda dok je bolovanje otvoreno.

**Odluka**
- TBD

**Impact**
- Kako se kreira/azurira `DaySchedule` za open-ended bolovanje (1 dan vs “do danas” prikaz).
- Kako se radi validacija preklapanja i korekcija kod open-ended.

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
- C) Preko flagova: kombinacija `needApproval` / `hasPlanning` (npr. `needApproval=false` i `hasPlanning=false`) i/ili dodatno pravilo.

**Odluka**
- TBD

**Impact**
- Kako service određuje “na bolovanju” u danom rasponu (npr. danas ili unutar prikazanog intervala).
- Kako UI označava zaposlenika kada postoji više vrsta “bolovanja” ili sličnih razloga.


