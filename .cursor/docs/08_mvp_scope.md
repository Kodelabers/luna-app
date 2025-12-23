# MVP scope (preporuka)

Ovo je preporučeni rez za prvi “shipping” (stabilan end-to-end flow) bez širenja u nice-to-have.

## Must-have (MVP)
- **Tenant + auth + membership**
  - `resolveTenantContext`
  - tenant-scoped routing `/:organisationAlias/*`
- **Administracija (ADMIN)**
  - Departments CRUD
  - Employees CRUD + povezivanje user↔employee
  - Unavailability reasons CRUD (needApproval/needSecondApproval/hasPlanning)
  - Holidays CRUD (repeatYearly)
- **Employee**
  - create/edit/delete DRAFT
  - submit zahtjev
  - “Moji zahtjevi” (lista)
  - dashboard kalendar (DaySchedule po mjesecu, tz-aware)
- **Department manager**
  - queue SUBMITTED (approve/reject)
  - “Čeka GM” pregled (APPROVED_FIRST_LEVEL) (read-only)
- **General manager**
  - queue APPROVED_FIRST_LEVEL (approve/reject)
- **Ledger osnovno**
  - ALLOCATION (dodjela dana po year+reason)
  - USAGE (na APPROVED za hasPlanning=true)
  - CORRECTION (na overlap pravila koja su već u user stories)

## Out of MVP (kasnije)
- Export (PDF/Excel/CSV)
- Email notifikacije / background queue
- Upload medicinske dokumentacije (schema trenutno nema attachment model; treba odluku/workaround)
- Masovno odobravanje


