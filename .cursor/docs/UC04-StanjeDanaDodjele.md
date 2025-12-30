# Use Cases (HR) — Stanje dana i dodjele (po vrsti odsutnosti)

Svi use caseovi moraju poštovati `spec.md` (SSoT Prisma schema, multitenancy, Server Actions + useActionState, UTC datumi, klijentska vremenska zona, shadcn default theme + dark/light/system, i18n).

## Referentni dokumenti
- `/.cursor/docs/spec.md`
- `/.cursor/docs/09_terminology_glossary.md` (UI: odsutnost / vrsta odsutnosti / stanje dana)
- `/.cursor/docs/03_permissions_rbac.md`
- `/.cursor/docs/06_ledger_rules.md` (internal: ledger; UI prikaz = stanje dana)
- `/.cursor/docs/02_data_model_mapping.md`

## Povezani user stories
- US-EMP-001, US-EMP-002 (pregled vlastitog stanja dana)
- US-MGR-001..004 (pregled stanja zaposlenika + dodjela/izmjena + povijest evidencije)

---

## UC-DAYS-01 — Employee: Pregled vlastitog stanja dana (po vrsti odsutnosti)

### Cilj
Zaposlenik vidi svoje stanje dana, **odvojeno po vrsti odsutnosti** (npr. godišnji, slobodni dani), za tekuću godinu:
- dodijeljeno, iskorišteno, na čekanju, preostalo

### Akteri
- OrganisationUser (ulogiran)
- Employee (vezan na usera u organizaciji)

### Ruta/UI (primjer)
- `/:organisationAlias/profile` ili poseban ekran “Stanje dana”

### Preduvjeti
- Tenant ctx
- Employee postoji u org-u (`active=true`)

### Glavni tok
1) Dohvatiti sve aktivne “vrste odsutnosti” (`UnavailabilityReason`) relevantne za prikaz.
2) Za svaku vrstu i godinu:
   - izračunati stanje dana iz internal evidencija (ledger; SUM `changeDays` + statusne komponente za “na čekanju” prema pravilima aplikacije).
3) Vratiti serializabilan model: lista kartica po vrsti odsutnosti.

### Pravila
- Prikaz je **po vrsti odsutnosti**, bez “ukupnog zbroja” svih vrsta.

### Greške
- 403: user nije vezan na Employee u org-u

---

## UC-DAYS-02 — Employee: Pregled stanja po godinama (po vrsti odsutnosti)

### Cilj
Zaposlenik može otvoriti detaljniji prikaz stanja dana po godinama za odabranu vrstu odsutnosti.

### Preduvjeti
- kao UC-DAYS-01

### Glavni tok
1) UI odabere vrstu odsutnosti.
2) Service vraća tablicu po godinama: dodijeljeno/iskorišteno/na čekanju/preostalo.

---

## UC-DAYS-03 — Manager: Pregled stanja dana zaposlenika (po vrsti odsutnosti)

### Cilj
DM/GM vidi stanje dana zaposlenika u svom scope-u (DM: samo svoj odjel, GM: cijela organizacija), po vrsti odsutnosti.

### Akteri
- OrganisationUser (ulogiran)
- Manager (DM/GM)

### Preduvjeti
- Tenant ctx
- Manager pristup (RBAC)

### Glavni tok
1) Odrediti scope zaposlenika (DM: department, GM: svi).
2) Za svakog zaposlenika vratiti stanje dana po vrsti odsutnosti za tekuću godinu + opcionalno tablicu po godinama (ili link na detalje).

---

## UC-DAYS-04 — Manager: Dodjela dana za novu godinu (po vrsti odsutnosti)

### Cilj
DM/GM dodjeljuje broj dana zaposleniku za odabranu godinu i vrstu odsutnosti.

### Input (Server Action)
- `employeeId: number`
- `unavailabilityReasonId: number` (UI: vrsta odsutnosti)
- `year: number`
- `days: number` (1–50)

### Preduvjeti
- Tenant ctx
- RBAC: manager smije mijenjati samo zaposlenike u svom scope-u

### Glavni tok
1) Validirati input (year, days).
2) Upisati internal evidenciju dodjele (ledger entry tip `ALLOCATION`) za zaposlenika/vrsu/godinu.
3) Ako u prethodnoj godini postoji preostalo stanje dana za istu vrstu odsutnosti, izvršiti automatski prijenos:
   - u prethodnoj godini dodati `TRANSFER` entry s negativnim `changeDays` i `note="prijenos u iduću godinu"` (zatvara godinu na 0)
   - u novoj godini dodati `CORRECTION` entry s pozitivnim `changeDays` i `note="prijenos iz prethodne godine"` (dodaje prenesene dane na novu godinu)
4) Vratiti novo stanje dana.

### Pravila
- UI terminologija: “dodjela”, “stanje dana”; bez “alokacija/ledger” riječi.
- “Otvaranje godine” mora biti idempotentno: ako je prijenos već napravljen, ne smije se duplicirati.
- Detaljna pravila knjiženja i `note` vrijednosti su u `/.cursor/docs/06_ledger_rules.md` (sekcija “Otvaranje nove godine…”).

---

## UC-DAYS-05 — Manager: Izmjena postojeće dodjele (korekcija)

### Cilj
DM/GM mijenja dodijeljeni broj dana za postojeću godinu (ispravak/korekcija).

### Input
- `employeeId`, `unavailabilityReasonId`, `year`, `newDays`

### Glavni tok
1) Izračunati trenutno iskorišteno za tu godinu i vrstu.
2) Ako bi `newDays` palo ispod već iskorištenog → blokirati (poruka).
3) Upisati internal korekciju (ledger entry tip `CORRECTION`) i vratiti stanje.

---

## UC-DAYS-06 — Manager: Povijest promjena (po vrsti odsutnosti i godini)

### Cilj
DM/GM vidi povijest promjena stanja dana (dodjele, prijenosi, korekcije, potrošnja) za odabranu vrstu odsutnosti.

### Pravila
- UI nazivi tipova evidencija mapiraju se prema `09_terminology_glossary.md`:
  - ALLOCATION=Dodjela, USAGE=Iskorištenje, TRANSFER=Prijenos, CORRECTION=Ispravak


