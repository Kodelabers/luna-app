# Cursor AI Spec (HR) — Next.js 16 + Clerk + Supabase + Prisma

**Prisma schema.prisma je Single Source of Truth i NE SMIJE se mijenjati.**

## Iznimka (odobreno) — SickLeave (Bolovanje)
Za implementaciju bolovanja kao zasebnog entiteta `SickLeave` odobrena je **jednokratna** promjena Prisma sheme, isključivo za:
- dodavanje `model SickLeave` i `enum SickLeaveStatus` (`OPENED`, `CLOSED`, `CANCELLED`)
- dodavanje `UnavailabilityReason.sickLeave: boolean`
- dodavanje `DaySchedule.sickLeaveId` (nullable FK)

Nakon ove promjene, pravilo “schema.prisma se ne smije mijenjati” vrijedi bez dodatnih iznimki osim ako se nova iznimka eksplicitno ne dokumentira.

---

## 0) Struktura projekta (bez `src/`)
- `app/` — page/layout/routing
- `components/` — UI (shadcn/ui + blocks)
- `lib/actions/` — Server Actions (UI boundary)
- `lib/services/` — Prisma upiti + poslovna logika + integracije (jedini “backend” sloj)
- `lib/integrations/` — Clerk helperi + Supabase Storage (pozivaju se iz services)
- `lib/tenant/` — tenant resolver
- `lib/validation/` — zod sheme
- `lib/errors/` — domenske greške + mapiranje u FormState

---

## 1) Verzija i forme (OBAVEZNO: useActionState)
- Koristi se **Next.js 16**.
- Svi read/write flowovi iz UI-a idu preko **Server Actions**.
- Kao validator se koristi **zod**.
- Za forme se koristi **isključivo**:
  - `useActionState(action, initialState)` u client komponentama
- Zabranjeno je koristiti deprecated hookove/pattern-e (npr. `useFormState`, `useFormStatus`).

### useActionState pravila
- `useActionState` vraća:
  - `[state, formAction, isPending]`
- `isPending` se koristi za pending/submitting UI (disable gumba, spinner).
- `state` se koristi za prikaz poruka i grešaka.

### Standard: FormState
Svaka Server Action koja je vezana uz formu mora:
- imati potpis:  
  `action(prevState: FormState, formData: FormData) => Promise<FormState>`
- vraćati **serializabilni** `FormState` (plain object):

```ts
{
  success?: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  formError?: string
}
```

Pravila:
- Ne vraćati ne-serializabilne vrijednosti.
- Datume vraćati kao ISO string ako su potrebni u UI-u.

---

## 2) UI standard (shadcn/ui + blocks + theme)
- Koristiti **najnovije shadcn/ui** komponente.
- Koristiti **shadcn default theme** bez custom override-a u početnoj fazi.
- Podržani modovi prikaza:
  - `light`
  - `dark`
  - `system` (auto – prati OS postavku)
- Theme switching mora koristiti shadcn/nextjs preporučeni pattern (`ThemeProvider`).
- Preferirati **shadcn blocks** za veće stranice (admin dashboardi, tablični prikazi).
- `components/ui/*` — shadcn primitives

Administracija koristi standardne pattern-e:
- filtriranje ide preko url query parametara
- tablica + toolbar (search/filter)
- dialog/sheet za create/edit
- empty state + skeleton
- toast feedback

---

## 3) Internacionalizacija (i18n)
- Aplikacija mora biti **višejezična (multilingual)**.
- Jezik se određuje:
  - po korisničkoj postavci (ako postoji)
  - ili fallback na browser/OS jezik
- UI tekstovi moraju biti spremni za lokalizaciju (npr. dictionary-based pristup).
- Datum, vrijeme i brojevi moraju se formatirati prema aktivnom jeziku i lokalnim pravilima (Intl API).

---

## 4) Datumi, vrijeme i vremenske zone (KRITIČNO)
- **Svi datumi i vremena u bazi MORAJU biti spremljeni u UTC formatu.**
- Prisma `DateTime` polja se tretiraju kao UTC.
- Nikada ne spremati “local time” u bazu.

### Klijentska vremenska zona
- Klijentska vremenska zona (IANA tz, npr. `Europe/Zagreb`) mora biti poznata na klijentu.
- Klijent šalje datume serveru u UTC formatu (ili uz jasnu konverziju).
- Server Actions i Services:
  - uvijek rade s UTC vrijednostima
  - nikada ne pretpostavljaju lokalnu vremensku zonu servera

### Query pravila vezana uz datume
- Svi upiti koji ovise o datumu (npr. rasponi, dani, planiranje):
  - moraju biti ispravno izračunati za klijentsku vremensku zonu
  - konverzija (local → UTC) se radi prije Prisma upita
- Prikaz datuma u UI-u:
  - uvijek se radi konverzijom iz UTC u klijentsku vremensku zonu

Primjer:
- Korisnik odabere datum u lokalnoj zoni
- Datum se konvertira u UTC prije spremanja
- Prilikom čitanja, UTC se konvertira nazad u lokalno vrijeme za prikaz

---

## 5) Routing (multitenancy)
Sve rute su tenant scoped: `/:organisationAlias/...`

### 5.1 Department rute (generičke)
- `/:organisationAlias/department/:departmentId/...`

Primjeri:
- `app/[organisationAlias]/department/[departmentId]/page.tsx`
- `app/[organisationAlias]/department/[departmentId]/employees/page.tsx`
- `app/[organisationAlias]/department/[departmentId]/applications/page.tsx`

**Obavezno:** provjera pripadnosti departmenta tenant-u:
- `Department.id = departmentId AND Department.organisationId = ctx.organisationId AND active = true`

### 5.2 Administracija
Sve admin funkcionalnosti su pod:
- `/:organisationAlias/administration/...`

Primjeri:
- `/administration/departments`
- `/administration/employees`
- `/administration/unavailability-reasons`
- `/administration/holidays`
- `/administration/members`

---

## 6) Autentifikacija (Clerk → lokalni User)
- Auth: Clerk
- Lokalni `User` mapiran po `User.clerkId`.
- Na svakom server-side zahtjevu:
  - osigurati da lokalni `User` postoji (upsert po `clerkId`)
  - opcionalno syncati email i ime
  - **ne dirati** `active` automatski

---

## 7) Autorizacija

### 7.1 Admin pristup administraciji
- ADMIN je definiran isključivo kroz:
  - `OrganisationUser.roles` sadrži `ADMIN`
- Samo ADMIN smije pristupiti rutama:
  - `/:organisationAlias/administration/*`

### 7.2 Pristup department rutama (dinamički preko Manager)
Korisnik smije pristupiti `/:organisationAlias/department/:departmentId/*` ako:
1) postoji `Employee` u tenant-u s:
   - `Employee.userId = User.id`
   - `active = true`
2) postoji `Manager` zapis s:
   - `Manager.employeeId = Employee.id`
   - `active = true`
3) i vrijedi jedno od:
   - `Manager.departmentId = departmentId` (department manager)
   - `Manager.departmentId IS NULL` (general manager → pristup svim departmentima u organizaciji)

Ako uvjeti nisu zadovoljeni → **403 Forbidden**.

---

## 8) Tenant kontekst (obavezno)
Lokacija: `lib/tenant/resolveTenantContext.ts`

Contract:
```
resolveTenantContext(alias)
  -> { organisationId, organisation, user, organisationUser }
```

Pravila:
- 404 ako organizacija ne postoji ili nije `active = true`
- 403 ako membership (`OrganisationUser`) ne postoji ili nije `active = true`
- prije membership checka osigurati lokalnog `User`-a (Clerk upsert)

Svaka Server Action mora:
1) pozvati `resolveTenantContext(organisationAlias)`
2) provesti autorizaciju (ADMIN ili Manager-based)
3) pozvati service funkciju

---

## 9) Layering
### 9.1 Server Actions — `lib/actions/*`
Dozvoljeno:
- `"use server"`
- zod validacija inputa
- `resolveTenantContext`
- poziv `lib/services/*`
- vraćanje `FormState`
- `revalidatePath`

Zabranjeno:
- Prisma upiti
- Supabase Storage direktno
- kompleksna poslovna logika

### 9.2 Services — `lib/services/*` (Prisma + poslovna logika)
Services su **jedini sloj** koji smije:
- raditi Prisma upite
- provoditi poslovnu logiku (statusi, approval, schedule, ledger)
- pozivati integracije (Supabase Storage, Clerk helperi)

Obavezno:
- Svaki DB upit mora biti scoped na `organisationId`
- Defaultno filtrirati `active = true` gdje postoji
- Poštovati unique constraintove:
  - Department: `organisationId + alias`
  - DaySchedule: `organisationId + employeeId + date`

Preporučeni helperi u services sloju:
- `requireAdmin(ctx)`
- `requireDepartmentAccess(ctx, departmentId)`

---

## 10) Supabase Storage
- kad se upload napravi onda se vrati url koji se sprema u bazu u odgovarajuce polje. 
- nazivi se dodjeljuju automatski i mogu ukljucivati prefix `Organisation.id` pa underscore i dalje neki unique string
- URL spremati **isključivo** u postojeća DB polja (npr. `Organisation.logoUrl`)

---

## 11) Error handling
- Services bacaju domenske greške:
  - `NotFoundError`
  - `ForbiddenError`
  - `ValidationError`
  - `ConflictError`
- Actions mapiraju greške u `FormState`:
  - `fieldErrors` za validaciju
  - `formError` za opće greške
- Zabranjeno je leakati cross-tenant informacije

---

## 12) Cache revalidation
- Nakon admin mutacija:
  - revalidirati relevantne `/:organisationAlias/administration/...` rute
- Nakon department mutacija:
  - revalidirati relevantne `/:organisationAlias/department/:departmentId/...` rute
