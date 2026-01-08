# DaySchedule — pravila generiranja i prepisivanja plana

`DaySchedule` je “materializirani plan po danu”. Unique constraint:
`@@unique([organisationId, employeeId, date])` → implementacija mora raditi **upsert** (ne “blind insert”).

## 1) Izvori istine
- `DaySchedule.date` je u bazi UTC (prikaz u client TZ prema `spec.md`).
- `DaySchedule.applicationId` (opc.) veže dan na zahtjev koji ga je generirao.
- `DaySchedule.sickLeaveId` (opc.) veže dan na bolovanje (`SickLeave`) koje ga je generiralo.
- `DaySchedule.unavailabilityReasonId` (opc.) definira razlog nedostupnosti.

## 2) Upsert strategija (preporuka)
Za svaki dan u rasponu zahtjeva (koji treba materializirati):
- pronaći postojećeg `DaySchedule` po `(organisationId, employeeId, date)`
- ako postoji:
  - update polja (`unavailabilityReasonId`, `status`, `applicationId`, `isWeekend`, `isHoliday`, `dayCode`, `active=true`)
- ako ne postoji:
  - create sa svim poljima

## 3) Prepisivanje (“pregazit će postojeći plan”)
Kad novi zahtjev dođe u `APPROVED`:
- za dane u rasponu zahtjeva novi zapis **prepisuje** postojeći plan za taj dan:
  - mijenja `unavailabilityReasonId` i povezane oznake
  - postavlja `applicationId` na novi zahtjev (ako je dio dogovorenog pravila)

Napomena:
- Ako je prethodni plan nastao iz reason-a s `hasPlanning=true`, korekcija dana ide preko ledger pravila (`06_ledger_rules.md`).

## 3B) Bolovanje (`SickLeave`) i DaySchedule
Bolovanje se vodi kroz `SickLeave` (ne `Application`) i koristi `DaySchedule.sickLeaveId` za povezivanje.

**Pravilo datuma:** `endDate >= startDate` (jednodnevno bolovanje je dozvoljeno).

### OPENED (open-ended)
- `SickLeave.status = OPENED`, `endDate = null`
- **NE materijalizira DaySchedule** (ni za startDate)
- **NE radi korekcije** planiranih dana (GO itd.)
- UI prikaz (kalendar + planning) radi "virtualni raspon" od `startDate` do "danas" u `clientTimeZone` koristeći `cell.sickLeave` podatke
- Budući planirani dani ostaju vidljivi i netaknuti

### CLOSED
- `SickLeave.status = CLOSED`, `endDate != null` (`endDate >= startDate`)
- **PRVO** radi korekcije za DaySchedule s `applicationId` i `hasPlanning=true` u rasponu `[startDate..endDate]`
- **ZATIM** upserta `DaySchedule` za sve dane u rasponu `[startDate..endDate]` s `sickLeaveId`

### CANCELLED
- `SickLeave.status = CANCELLED` je dozvoljen samo iz `OPENED` dok je `endDate=null`
- **Nema DaySchedule za brisati** jer OPENED ne kreira DaySchedule zapise
- Budući planirani dani ostaju netaknuti

## 3C) Brisanje DaySchedule kod korekcije "preostali dani" (GO)
Kad bolovanje postaje **CLOSED** (zatvaranje), uzrokuje korekciju "vrati preostale dane" za originalne `Application` (npr. GO) koji imaju `hasPlanning=true` i `applicationId` postoji u DaySchedule:
- pronađi `DaySchedule` zapise s `applicationId` i `hasPlanning=true` **samo u rasponu bolovanja** `[startDate..endDate]`
- obrisati te `DaySchedule` zapise
- vidi `06_ledger_rules.md` za detalje korekcije ledgera

**Napomena:** Korekcije se rade samo kod CLOSED, ne kod OPENED.

## 4) Vikendi i praznici
- `isWeekend` i `isHoliday` služe primarno za prikaz i workday kalkulacije.
- Ne ulaze automatski u “potrošnju” bez jasnog workday izračuna.

## 5) Aktivnost
`DaySchedule.active` je defaultno true.
- Pravila deaktivacije (ako ikad trebaju) moraju biti eksplicitno dokumentirana; inače se zapis update-a.


