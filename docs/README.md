# Dokumentacija projekta
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Projekt:** Luna - Sustav za godišnji odmor  
**Verzija dokumentacije:** 1.0  
**Datum:** 12.12.2024  

---

## 📋 Pregled

Ova dokumentacija definira kompletan razvoj produkcijske verzije sustava za upravljanje godišnjim odmorima i bolovanja. Dokumentacija je nastala na temelju uspješno prezentirane mockup aplikacije koja je zadovoljila korisničke potrebe.

---

## 📚 Struktura dokumentacije

### 1. [Funkcionalna specifikacija](./01_Funkcionalna_Specifikacija.md)
**Svrha:** Detaljan opis svih funkcionalnosti sustava

**Sadržaj:**
- Pregled sustava i korisničkih uloga
- Detaljni funkcionalni zahtjevi po modulima:
  - Administratorski modul (upravljanje zaposlenicima, odjelima, praznicima)
  - Modul zaposlenika (kreiranje zahtjeva, pregled statusa)
  - Modul odobravatelja (odobravanje zahtjeva, planiranje, bolovanja)
- Nefunkcionalni zahtjevi (performanse, sigurnost, UX)
- Prioritizacija za MVP

**Za koga:** Product Owner, Project Manager, Development tim, QA

---

### 2. [User Flow dijagrami](./02_User_Flow_Dijagrami.md)
**Svrha:** Vizualizacija korisničkih tokova za sve ključne funkcionalnosti

**Sadržaj:**
- Autentifikacijski tokovi (login, logout, reset lozinke)
- Zaposlenik tokovi (kreiranje zahtjeva, uređivanje, pregled statusa)
- Odobravatelj tokovi (odobravanje, dodjela dana, evidencija bolovanja, planiranje)
- Administrator tokovi (dodavanje zaposlenika, kreiranje odjela, praznici, statistike)
- Cross-role tokovi (promjena lozinke, profil, odjava)
- Error handling i mobile behavior

**Za koga:** UI/UX dizajneri, Frontend developeri, QA

---

### 3. [Poslovna pravila](./03_Poslovna_Pravila.md)
**Svrha:** Definicija svih poslovnih pravila i validacija

**Sadržaj:**
- Validacijska pravila (zahtjevi, zaposlenici, odjeli, bolovanja, praznici)
- Računska pravila (kalkulacija radnih dana, preostalih dana, preklapanja)
- Autorizacijska pravila (pristup po ulogama, pristup podacima)
- Workflow pravila (statusni prijelazi, automatski prijelazi)
- Pravila automatizacije (automatska prilagodba godišnjih odmora pri bolovanju)
- Sigurnosna pravila (lozinke, rate limiting, session timeout)
- Pravila izvještavanja

**Za koga:** Development tim (frontend i backend), QA, Business Analysts

---

### 4. [Tehnička arhitektura](./04_Tehnicka_Arhitektura.md)
**Svrha:** Detaljan opis tehničke infrastrukture i arhitekture

**Sadržaj:**
- Arhitekturni stil (Client-Server, REST API)
- Tehnološki stack:
  - Full-Stack: Next.js 14+, React, TypeScript
  - Backend: Next.js API Routes + TypeScript
  - Database: PostgreSQL + Redis
  - Storage: AWS S3 / Azure Blob
- Layered arhitektura (frontend i backend)
- Komunikacijski protokoli (REST API, opciono WebSocket)
- Sigurnost (JWT, enkripcija, rate limiting)
- Skalabilnost (caching, database optimizacija, horizontal scaling)
- Deployment (Docker, CI/CD, cloud hosting)
- Monitoring i logging
- Migration plan (od mockupa do produkcije)

**Za koga:** Tech Lead, Backend developeri, Frontend developeri, DevOps, System Architects

---

### 5. [Data Model](./05_Data_Model.md)
**Svrha:** Definicija podatkovnog modela i strukture baze

**Sadržaj:**
- Entity Relationship dijagram (ERD)
- Detaljne tablice (10 glavnih tablica):
  - Users, Employees, Departments, DepartmentApprovers
  - VacationAllocations, VacationRequests
  - SickLeaves, MedicalDocuments
  - Holidays, AuditLogs
- SQL DDL skripte za kreiranje tablica
- Indeksi i optimizacije
- Views (employee_vacation_summary, pending_approvals_view)
- Stored procedures i functions
- Triggers (auto-update timestamps, audit logging)
- Prisma schema (za Next.js backend)

**Za koga:** Backend developeri, Database administratori, Tech Lead

---

### 6. [API specifikacija](./06_API_Specifikacija.md)
**Svrha:** Detaljna dokumentacija API kontrakata (Server Actions i API Routes)

**Sadržaj:**
- Next.js pristupi: Server Components, Server Actions, API Routes
- Kada koristiti koji pristup
- Base URL i autentifikacija (JWT)
- Response formati i error kodovi
- Endpoints po kategorijama:
  - Autentifikacija (login, refresh, forgot password, change password)
  - Employees (CRUD, allocations)
  - Vacation Requests (CRUD, submit, validate)
  - Approvals (pending, approve, reject)
  - Sick Leaves (CRUD, close, documents)
  - Departments (CRUD)
  - Holidays (CRUD)
  - Statistics (overview, department, employee)
  - Planning (calendar)
- Request/Response primjeri za svaki endpoint
- Server Actions primjeri
- Rate limiting i pagination
- OpenAPI/Swagger dokumentacija (za API Routes)

**Za koga:** Frontend developeri, Backend developeri, QA, Integration team

**Napomena:** U Next.js-u većina operacija koristi Server Components i Server Actions umjesto REST API poziva. API Routes se koriste samo za vanjski pristup i webhook-ove.

---

### 7. [Prisma Model Analiza](./prisma_analysis.md)
**Svrha:** Detaljnamapping između poslovnih zahtjeva i Prisma modela

**Sadržaj:**
- **Ledger model** - accounting pristup za tracking nedostupnosti
- `UnavailabilityLedgerEntry` s tipovima: ALLOCATION, USAGE, TRANSFER, CORRECTION
- `hasPlanning` flag - određuje koji razlozi imaju ledger tracking
- **Approval flow** - needApproval i needSecondApproval flagovi
- Automatska prilagodba GO pri bolovanju
- **Scheduled job** za automatski transfer (1.1. u 00:00)
- Kompletan finalni Prisma schema
- Implementacijski plan po fazama

**Za koga:** Backend developeri, Tech Lead, Database administratori

---

## 🚀 Korištenje dokumentacije

### Za Product Ownera / Project Managera
1. **Početak:** Pročitaj [Funkcionalnu specifikaciju](./01_Funkcionalna_Specifikacija.md)
2. Pregledaj prioritizaciju za MVP (poglavlje 5.1)
3. Koristi [User Flow dijagrame](./02_User_Flow_Dijagrami.md) za diskusiju sa dizajnerima
4. Pregledaj [Poslovna pravila](./03_Poslovna_Pravila.md) za razumijevanje validacija

### Za UI/UX dizajnere
1. **Početak:** Pročitaj [User Flow dijagrame](./02_User_Flow_Dijagrami.md)
2. Pregledaj [Funkcionalnu specifikaciju](./01_Funkcionalna_Specifikacija.md) - poglavlje 3 (Funkcionalni zahtjevi)
3. Koristi flowove za kreiranje wireframe-ova i prototipova

### Za Frontend developere
1. **Početak:** Pročitaj [API specifikaciju](./06_API_Specifikacija.md)
2. Pregledaj [Tehničku arhitekturu](./04_Tehnicka_Arhitektura.md) - poglavlje 3.1 (Frontend arhitektura)
3. Koristi [User Flow dijagrame](./02_User_Flow_Dijagrami.md) za implementaciju
4. Pregledaj [Poslovna pravila](./03_Poslovna_Pravila.md) - poglavlje 2 (Validacijska pravila)

### Za Backend developere
1. **Početak:** Pročitaj [Data Model](./05_Data_Model.md)
2. Pregledaj [Tehničku arhitekturu](./04_Tehnicka_Arhitektura.md) - poglavlje 3.2 (Backend arhitektura)
3. Implementiraj prema [API specifikaciji](./06_API_Specifikacija.md)
4. Pregledaj [Poslovna pravila](./03_Poslovna_Pravila.md) za business logiku

### Za QA tim
1. **Početak:** Pročitaj [Funkcionalnu specifikaciju](./01_Funkcionalna_Specifikacija.md)
2. Koristi [User Flow dijagrame](./02_User_Flow_Dijagrami.md) za kreiranje test case-ova
3. Pregledaj [Poslovna pravila](./03_Poslovna_Pravila.md) za testiranje validacija
4. Koristi [API specifikaciju](./06_API_Specifikacija.md) za API testiranje

### Za Tech Lead / Arhitekte
1. **Početak:** Pročitaj [Tehničku arhitekturu](./04_Tehnicka_Arhitektura.md)
2. Pregledaj [Data Model](./05_Data_Model.md)
3. Review [API specifikaciju](./06_API_Specifikacija.md)
4. Pregledaj [Poslovna pravila](./03_Poslovna_Pravila.md) - poglavlje 6 (Pravila automatizacije)

---

## 🎯 MVP prioritizacija

### Phase 1 - Core functionality (4-6 tjedana)

**Must-have features:**
- ✅ Autentifikacija i autorizacija (JWT)
- ✅ Upravljanje zaposlenicima (CRUD)
- ✅ Upravljanje odjelima (CRUD)
- ✅ Kreiranje zahtjeva za godišnji (zaposlenik)
- ✅ Odobravanje/odbijanje zahtjeva (odobravatelj)
- ✅ Dashboard za sve uloge
- ✅ Kalendarski prikaz
- ✅ Dodjela godišnjih dana

**Dokumenti:**
- Funkcionalna specifikacija: FR-AUTH-001 do FR-AUTH-005
- Funkcionalna specifikacija: FR-ADM-001 do FR-ADM-007
- Funkcionalna specifikacija: FR-EMP-001, FR-EMP-003, FR-EMP-005, FR-EMP-009
- Funkcionalna specifikacija: FR-APP-001, FR-APP-004, FR-APP-005, FR-APP-008

---

### Phase 2 - Enhanced functionality (3-4 tjedna)

**Should-have features:**
- ✅ Konfiguracija tipova nedostupnosti (UnavailabilityReason)
  - needApproval / needSecondApproval flagovi
  - hasPlanning flag
- ✅ Dvostuko odobrenje (prvi i drugi nivo)
- ✅ Upravljanje praznicima
- ✅ Evidencija bolovanja
- ✅ Automatska prilagodba godišnjih pri bolovanju
- ✅ Upload medicinske dokumentacije
- ✅ Draft zahtjevi
- ✅ Tablični prikaz planiranja
- ✅ Scheduled job za prijenos neiskorištenih dana (1.1.)

**Dokumenti:**
- Funkcionalna specifikacija: FR-ADM-008 do FR-ADM-011
- Funkcionalna specifikacija: FR-EMP-004, FR-EMP-006, FR-EMP-007
- Funkcionalna specifikacija: FR-APP-006, FR-APP-011 do FR-APP-016
- Poslovna pravila: BR-AUTO-001 do BR-AUTO-003
- Prisma analiza: Ledger model i scheduled job

---

### Phase 3 - Nice-to-have (2-3 tjedna)

**Nice-to-have features:**
- ✅ Email notifikacije
- ✅ Statistike i izvještaji
- ✅ Pregled povijesti alokacija
- ✅ Masovno odobravanje
- ✅ Eksport izvještaja

**Dokumenti:**
- Funkcionalna specifikacija: FR-NOTIF-001, FR-NOTIF-002
- Funkcionalna specifikacija: FR-APP-017, FR-APP-018, FR-APP-019
- API specifikacija: poglavlje 10 (Statistics)

---

## 📊 Procjena resursa

### Development tim (preporučeno)

**Next.js Full-Stack:** 1-2 developera
- Database setup i migracije
- Next.js API Routes implementacija
- React Server Components i Client Components
- Business logika
- Autentifikacija i autorizacija
- UI/UX implementacija

**Full-stack:** 1 developer (alternativa - za manji tim)
- Svi backend i frontend taskovi u jednom projektu

**QA:** 1 tester
- Test case kreiranje
- Manual testing
- Automated testing (opciono)

**DevOps:** 0.5 (part-time ili external)
- CI/CD setup
- Deployment
- Monitoring setup

### Timeline procjena

**MVP (Phase 1):** 4-6 tjedana  
**Full version (Phases 1-2):** 7-10 tjedana  
**Complete (Phases 1-3):** 9-13 tjedana  

**Napomena:** Timeline ovisi o veličini tima i kompleksnosti integracija.

---

## 🔧 Tehnologije (sažetak)

### Full-Stack Framework
- **Framework:** Next.js 14+
- **Language:** TypeScript
- **Frontend:** React 18+ (Server Components + Client Components)
- **Backend:** Next.js API Routes
- **State Management:** Zustand / React Query
- **UI Library:** shadcn/ui + Tailwind CSS
- **ORM:** Prisma
- **Auth:** JWT + bcrypt (ili NextAuth.js)
- **Validation:** Zod
- **Charts:** recharts

### Database
- **Primary:** PostgreSQL 15+
- **Cache:** Redis 7
- **Storage:** AWS S3 / Azure Blob Storage

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions / GitLab CI
- **Hosting:** AWS / Azure / Google Cloud
- **Monitoring:** Sentry + Datadog/Grafana

---

## 📝 Konvencije i standardi

### Naming conventions

**API endpoints:**
- Uvijek plural: `/employees`, `/vacation-requests`
- Kebab-case: `/sick-leaves`, `/vacation-requests`

**Database:**
- Snake_case za tablice i kolone: `vacation_requests`, `employee_id`
- Singular ili plural (dosljedno): `users`, `employees`

**Code:**
- Backend (TypeScript): camelCase za varijable, PascalCase za klase
- Frontend (TypeScript/React): camelCase za varijable, PascalCase za komponente

### Git workflow

**Branches:**
- `main` - produkcija
- `develop` - development
- `feature/feature-name` - nove funkcionalnosti
- `bugfix/bug-name` - bug fixevi
- `hotfix/hotfix-name` - hitni fixevi na produkciji

**Commit messages:**
```
feat: Add vacation request creation
fix: Fix date validation in vacation requests
docs: Update API documentation
refactor: Refactor vacation service
test: Add tests for vacation validation
```

---

## 🔐 Sigurnost

### Kritični sigurnosni zahtjevi

✅ **Autentifikacija:**
- JWT tokeni (short-lived access token, long-lived refresh token)
- Bcrypt password hashing (12 rounds)

✅ **Autorizacija:**
- Role-based access control (RBAC)
- Resource-level permissions

✅ **Data protection:**
- HTTPS only (TLS 1.3)
- Encryption at-rest za osjetljive podatke
- SQL injection protection (ORM)
- XSS protection
- CSRF protection

✅ **Rate limiting:**
- Login: 5 attempts / 15 min
- API: 100 req / min / user

✅ **Audit:**
- Logging svih kritičnih akcija
- Retention: 1 godina

---

## 🧪 Testiranje

### Test strategija

**Unit tests:** 60% coverage minimum
- Backend: Jest
- Frontend: Jest + React Testing Library

**Integration tests:** 30% coverage
- API endpoint testing
- Database integration

**E2E tests:** 10% coverage
- Kritični user flowovi
- Playwright / Cypress E2E tests

**Performance tests:**
- Load testing (100 concurrent users)
- Response time < 2s

---

## 📞 Kontakt i podrška

### Pitanja o dokumentaciji

Za pitanja ili nejasnoće vezane uz dokumentaciju:
- Kreiraj GitHub Issue
- Označi odgovarajući label: `documentation`, `question`
- Referenciraj specifičan dokument i poglavlje

### Doprinosi dokumentaciji

Dokumentacija je living document. Za izmjene ili dopune:
1. Fork repository
2. Kreiraj feature branch
3. Izmijeni dokumentaciju
4. Kreiraj Pull Request s opisom izmjena

---

## 📈 Verzioniranje dokumentacije

**Trenutna verzija:** 1.0  
**Datum:** 12.12.2024  
**Status:** Draft za review  

### Change log

| Verzija | Datum | Izmjene |
|---------|-------|---------|
| 1.0 | 12.12.2024 | Inicijalna verzija - kompletna dokumentacija za razvoj produkcijske aplikacije |

---

## ✅ Sljedeći koraci

### Neposredno

1. ✅ **Review dokumentacije** sa stakeholderima
2. ⏳ **Formiranje development tima**
3. ⏳ **Setup development environmenta**
4. ⏳ **Kreiranje projektnog plana** (sprint planning)

### Prije početka developmenta

1. ⏳ **UI/UX dizajn** na temelju User Flow dijagrama
2. ⏳ **Database schema review** i finalizacija
3. ⏳ **API contract definicija** između frontend/backend timova
4. ⏳ **Setup CI/CD pipeline**

### Razvoj (Phase 1 - MVP)

1. ⏳ Backend: Database setup + Auth endpoints
2. ⏳ Backend: Employees + Departments CRUD
3. ⏳ Backend: Vacation Requests + Approvals
4. ⏳ Frontend: Login + Dashboard
5. ⏳ Frontend: Employee screens
6. ⏳ Frontend: Approver screens
7. ⏳ Integration testing
8. ⏳ Deployment na staging
9. ⏳ UAT (User Acceptance Testing)
10. ⏳ Production deployment

---

## 🎓 Dodatni resursi

### Tehnološki resursi

**Next.js:**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

**Next.js:**
- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

**PostgreSQL:**
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)

**DevOps:**
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS Documentation](https://docs.aws.amazon.com/)

### Best practices

- [REST API Design Best Practices](https://restfulapi.net/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [12 Factor App](https://12factor.net/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Napomena:** Ova dokumentacija je živi dokument i bit će ažuriran kako projekt napreduje. Svaka značajna izmjena zahtijeva verzioniranje i update change loga.

---

**Pripremio:** AI Assistant (Claude Sonnet 4.5)  
**Datum:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Draft za review

