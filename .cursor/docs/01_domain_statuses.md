# Domena — statusi i prijelazi

Ovaj dokument definira **jedinstvena pravila** za statuse i prijelaze **zahtjeva za odsutnost** (`Application`) i kako se bilježe događaji.

## 1) Statusi zahtjeva (ApplicationStatus)
- **DRAFT**: nacrt (vidljiv samo vlasniku); može se uređivati i brisati/soft-delete prema odluci (vidi `OPEN_QUESTIONS.md`).
- **SUBMITTED**: poslan na odobrenje (1. razina).
- **APPROVED_FIRST_LEVEL**: odobren na 1. razini; čeka 2. razinu.
- **APPROVED**: konačno odobren (final).
- **REJECTED**: odbijen (final).
- **CANCELLED**: otkazan (pravila TBD u `OPEN_QUESTIONS.md`).

## 2) Dozvoljeni prijelazi (status machine)
Minimalno (default) pravilo:
- `DRAFT → SUBMITTED`
- `SUBMITTED → APPROVED_FIRST_LEVEL` (ako `UnavailabilityReason.needSecondApproval = true`)
- `SUBMITTED → APPROVED` (ako `UnavailabilityReason.needSecondApproval = false`)
- `SUBMITTED → REJECTED`
- `APPROVED_FIRST_LEVEL → APPROVED`
- `APPROVED_FIRST_LEVEL → REJECTED`
- `DRAFT → (deleted or inactive)` (semantika TBD)
- `* → CANCELLED` (samo ako definiramo cancel flow; TBD)

## 3) Autorizacija (tko smije promijeniti status)
Ovo je operativno pravilo; detalji su u `03_permissions_rbac.md`.
- **Vlasnik (employee)**:
  - smije uređivati/brisati samo `DRAFT`
  - smije poslati `DRAFT → SUBMITTED`
- **Department manager**:
  - smije odlučivati o `SUBMITTED` zahtjevima u svojim departmentima
- **General manager**:
  - smije odlučivati o `APPROVED_FIRST_LEVEL` zahtjevima u cijeloj organizaciji
- **ADMIN**:
  - admin funkcije (nije “approval rola” osim ako tako odlučite; preporuka: admin ne odobrava zahtjeve implicitno)

## 4) Logovi i komentari
### 4.1 ApplicationLog (audit trail)
Za svaki događaj upisati `ApplicationLog`:
- CREATED (create zahtjeva)
- DELETED (brisanje/soft-delete)
- REQUESTED (submit)
- REJECTED / REJECTED_ON_FIRST_APPROVAL (reject)
- APPROVED (approval)
- POST_APPROVAL_IMPACT_CHANGED (kada korekcija promijeni “impact” nakon odobrenja)

### 4.2 ApplicationComment (poruke/razlozi)
Preporuka:
- kod **REJECTED**: komentar je obavezan (tko odbija, mora navesti razlog)
- kod approval: komentar opcionalan


