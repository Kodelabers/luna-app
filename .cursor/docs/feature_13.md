# Feature 13: Opcija za poništavanje preostalih dana odsustva kod zatvaranja bolovanja

## Trenutno stanje implementacije
Kod zatvaranja bolovanja (`UC-SL-02`), ako na dan zatvaranja (`endDate`) postoji odobreno odsustvo (npr. GO), trenutno se vraćaju samo dani koji su se preklopili s bolovanjem. Preostali dani iz istog zahtjeva nakon datuma zatvaranja ostaju netaknuti.

## Zahtjev
Dodati opciju korisniku da odluči što želi sa preostalim danima odsustva vezanog na isti zahtjev koji se preklapa s bolovanjem.

## Opcije

### 1. Ništa (default)
- Trenutno ponašanje
- Vraća samo dane koji su se preklopili s bolovanjem (u rasponu `[startDate..endDate]`)
- Preostali dani iz istog zahtjeva nakon `endDate` bolovanja ostaju netaknuti

### 2. Poništi preostale dane
- Poništava sve preostale dane iz istog zahtjeva (gleda se materialized plan!) koji su nakon datuma zatvaranja bolovanja (`endDate`)
- Poništavanje se radi na isti način kao trenutno poništavanje koje je bilo preklopljeno s bolovanjem:
  - Identificiraj `applicationId` iz `DaySchedule` zapisa na `endDate` (mora imati `hasPlanning=true`)
  - Pronađi sve `DaySchedule` zapise s **točno tim `applicationId`-jem** i `hasPlanning=true` **nakon** `endDate` bolovanja
  - Vrati dane u ledger (`CORRECTION +workdays`)
  - Obriši te `DaySchedule` zapise
  - Upisi `ApplicationLog(POST_APPROVAL_IMPACT_CHANGED)` i komentar na aplikaciju

## UI
- Opcija se prikazuje samo ako na `endDate` postoji odobreno odsustvo (`DaySchedule` s `applicationId` i `hasPlanning=true`)
- **Info Alert** (prikazuje se samo ako postoji preklapanje):
  - "Na dan zatvaranja bolovanja postoji odobreno odsustvo. Odaberite kako želite postupiti s preostalim danima tog odsustva."
- **RadioGroup** s dvije opcije:
  - **Opcija 1 (default: "none")**: "Ostavi preostale dane netaknute"
    - Opis: "Vraćaju se samo dani koji su se preklopili s bolovanjem. Preostali dani odsustva nakon datuma zatvaranja ostaju u rasporedu."
  - **Opcija 2 ("cancel")**: "Poništi sve preostale dane"
    - Opis: "Svi preostali dani odsustva nakon datuma zatvaranja bolovanja bit će poništeni i vraćeni u stanje dana."

## Implementacija

### Funkcija `hasRemainingDaysAfterEndDate`
- Uzima datum zatvaranja bolovanja (`endDate`)
- Provjerava ima li na `endDate` materijalizirano odsustvo (`DaySchedule` s `applicationId` i `hasPlanning=true`)
- Za taj `applicationId` provjerava postoje li `DaySchedule` zapisi **nakon** `endDate`
- Ako postoje, vraća `true` (treba prikazati opciju korisniku)

### Poništavanje preostalih dana
- Ako korisnik odabere opciju "Poništi preostale dane":
  - Pronađi sve `DaySchedule` zapise s **istim `applicationId`** (koji je identificiran na `endDate`) i `hasPlanning=true` **nakon** `endDate`
  - Vrati dane u ledger (`CORRECTION +workdays`)
  - Obriši te `DaySchedule` zapise
  - Upisi `ApplicationLog(POST_APPROVAL_IMPACT_CHANGED)` i komentar na aplikaciju
- **VAŽNO**: Poništavaju se samo dani s tim `applicationId`-jem nakon `endDate`. Ništa drugo.

### Tehnički detalji
- Dodati polje `cancelRemainingDays?: boolean` u `CloseSickLeaveInput`
- Proširiti `applySickLeaveCorrections` ili kreirati novu funkciju za poništavanje preostalih dana

## Reference
- `UC08-SickLeave.md` - UC-SL-02 (Zatvori bolovanje)
- `06_ledger_rules.md` - sekcija 6.1 (Kanonsko pravilo "truncate")
- `lib/services/sick-leave.ts` - `closeSickLeave` i `applySickLeaveCorrections`
