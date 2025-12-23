# RBAC / autorizacija (tenant-scoped)

Ovaj dokument standardizira pristup i vidljivost podataka. Mora biti u skladu sa `spec.md`.

## 1) Tenant scope (obavezno)
Svaki server-side poziv prvo radi:
- `resolveTenantContext(organisationAlias)` → `{ organisationId, organisation, user, organisationUser }`

Zatim:
- 404 ako org ne postoji ili nije aktivna
- 403 ako membership (`OrganisationUser`) ne postoji ili nije aktivan

## 2) Admin rute
Ruta: `/:organisationAlias/administration/*`
- Dozvoljeno samo ako `organisationUser.roles` sadrži `ADMIN`.

## 3) Department rute (manager access)
Ruta: `/:organisationAlias/department/:departmentId/*`
Korisnik smije pristupiti ako:
- ima `Employee` u toj organizaciji (`Employee.userId = user.id`, `active=true`)
- ima `Manager` zapis (`Manager.employeeId = employee.id`, `active=true`)
- i vrijedi:
  - `Manager.departmentId = departmentId` (department manager), ili
  - `Manager.departmentId IS NULL` (general manager → svi departmenti u org)

## 4) Vidljivost Application podataka
- **DRAFT**:
  - vidljiv samo vlasniku (`Application.employeeId = employee.id`)
  - manageri/GM ga ne vide
- **SUBMITTED / APPROVED_FIRST_LEVEL / APPROVED / REJECTED / CANCELLED**:
  - vlasnik vidi svoje
  - DM vidi samo za `departmentId IN managedDepartmentIds` i samo za statuse relevantne za approval queue
  - GM vidi relevantne statuse u cijeloj organizaciji (tenant-scoped)

## 5) Pravila za dashboard liste (sažetak)
- “Moji otvoreni zahtjevi” (employee):
  - `employeeId = employee.id`
  - `active=true`
  - `status IN (DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL)` (termin “otvoreno” koristiti konzistentno)
- “Za odobriti” (DM):
  - `status = SUBMITTED`, `departmentId IN managedDepartmentIds`, `active=true`
  - (opc.) “Čeka GM”: `status = APPROVED_FIRST_LEVEL`, `departmentId IN managedDepartmentIds`, `active=true`
- “Za odobriti” (GM):
  - `status = APPROVED_FIRST_LEVEL`, `active=true`, scope: cijela org


