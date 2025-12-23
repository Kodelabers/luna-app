# DaySchedule — pravila generiranja i prepisivanja plana

`DaySchedule` je “materializirani plan po danu”. Unique constraint:
`@@unique([organisationId, employeeId, date])` → implementacija mora raditi **upsert** (ne “blind insert”).

## 1) Izvori istine
- `DaySchedule.date` je u bazi UTC (prikaz u client TZ prema `spec.md`).
- `DaySchedule.applicationId` (opc.) veže dan na zahtjev koji ga je generirao.
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

## 4) Vikendi i praznici
- `isWeekend` i `isHoliday` služe primarno za prikaz i workday kalkulacije.
- Ne ulaze automatski u “potrošnju” bez jasnog workday izračuna.

## 5) Aktivnost
`DaySchedule.active` je defaultno true.
- Pravila deaktivacije (ako ikad trebaju) moraju biti eksplicitno dokumentirana; inače se zapis update-a.


