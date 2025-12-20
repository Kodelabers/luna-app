# Tehnička arhitektura
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Verzija:** 1.0  
**Datum:** 12.12.2024  
**Projekt:** Luna - Sustav za godišnji odmor  

---

## 1. UVOD

### 1.1 Svrha dokumenta
Ovaj dokument opisuje tehničku arhitekturu produkcijske verzije sustava za upravljanje godišnjim odmorima. Dokument pokriva:
- Arhitekturni stil i pattern
- Tehnološki stack
- Komponente sustava
- Komunikacijske protokole
- Deployment strategiju
- Sigurnost i skalabilnost

### 1.2 Trenutno stanje (Mockup aplikacija)
**Tehnologije:**
- Flutter Web (frontend + logic)
- SharedPreferences (lokalno spremanje podataka)
- Nema pravog backend-a
- Nema baze podataka

**Ograničenja:**
- Podaci se gube prilikom refresh-a
- Nema multi-user pristupa
- Nema autentifikacije
- Nema stvarne validacije

---

## 2. CILJANA ARHITEKTURA

### 2.1 Arhitekturni stil

#### Odabrani stil: **Client-Server arhitektura sa REST API-jem**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Flutter Web Application (SPA)                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   UI       │  │   State    │  │  Services  │     │   │
│  │  │ Components │  │ Management │  │  (API)     │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS / REST API
┌─────────────────────────────────────────────────────────────┐
│                       SERVER TIER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Backend Application                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │    API     │  │  Business  │  │    Data    │     │   │
│  │  │   Layer    │  │   Logic    │  │   Access   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                         DATA TIER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database / MySQL                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Redis (Cache & Session Store)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         File Storage (S3 / Azure Blob)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Tehnološki stack

#### Frontend (Client Tier)

**Glavni framework:**
- **Flutter Web** (verzija 3.9+)
  - Razlog: Već postoji mockup u Flutteru
  - Cross-platform potencijal (može postati mobilna app)
  - Brz development
  - Moderni UI

**State Management:**
- **Provider** (trenutno koristi se)
- Alternativa: **Riverpod** (preporuka za produkciju)

**HTTP Client:**
- **Dio** (HTTP/2 support, interceptors, caching)

**Dodatne biblioteke:**
- **flutter_secure_storage** - za JWT token
- **intl** - internacionalizacija
- **table_calendar** - kalendarski prikaz
- **fl_chart** - grafovi i statistike
- **dio_cache_interceptor** - HTTP caching

---

#### Backend (Server Tier)

**Preporuka 1: Node.js + Express**
```
+ Brz razvoj
+ Velika zajednica
+ Async/await prirodan
+ Jednostavna integracija s PostgreSQL
+ Dobar za REST API
- Malo sporiji od Goa ili Rust-a
```

**Preporuka 2: .NET Core (C#)**
```
+ Enterprise-grade
+ Odlična performansa
+ Built-in autentifikacija
+ Entity Framework (ORM)
+ Dobar tooling
- Veći resource footprint
```

**Preporuka 3: Python + FastAPI**
```
+ Brz razvoj
+ Moderne async features
+ Auto-generated OpenAPI docs
+ Jednostavan za ML integraciju (buduće mogućnosti)
- Sporiji od Node.js/.NET
```

**Odabir za MVP: Node.js + Express**
- Razlog: Brz razvoj, fleksibilnost, dobra podrška

**Stack:**
- **Node.js** (v20 LTS)
- **Express.js** (web framework)
- **TypeScript** (type safety)
- **Prisma** (ORM - Object Relational Mapper)
- **JWT** (autentifikacija)
- **bcrypt** (hashing lozinki)
- **Joi** / **Zod** (validacija)
- **Winston** (logging)

---

#### Baza podataka (Data Tier)

**Glavni Database: PostgreSQL**
```
+ Open-source
+ ACID compliance
+ Podrška za JSON (flexibility)
+ Odlična performansa
+ Zreli ekosustav
+ Relacijski podaci idealno pašu za ovaj sustav
```

**Alternativa: MySQL**
- Također dobar izbor
- Malo jednostavniji od PostgreSQL-a

**Cache & Session Store: Redis**
```
+ In-memory key-value store
+ Brz pristup
+ Session storage
+ Rate limiting
+ API response caching
```

**File Storage:**
- **AWS S3** / **Azure Blob Storage** / **Google Cloud Storage**
- Za medicinske dokumente (bolovanje)
- Za buduće attachment-e

---

#### DevOps & Infrastructure

**Containerization:**
- **Docker** - containerizacija aplikacija
- **Docker Compose** - lokalni development

**CI/CD:**
- **GitHub Actions** / **GitLab CI** / **Azure DevOps**
- Automatizirani testovi
- Automatizirani deployment

**Hosting:**

**Opcija 1: Cloud Provider (Preporuka)**
- **AWS**: EC2 + RDS + S3 + CloudFront
- **Azure**: App Service + Azure SQL + Blob Storage
- **Google Cloud**: App Engine + Cloud SQL + Cloud Storage

**Opcija 2: VPS**
- DigitalOcean / Linode / Hetzner
- Jeftinije, ali više admin posla

**Load Balancer:**
- Nginx / AWS ALB / Azure Load Balancer

**Monitoring:**
- **Sentry** - Error tracking
- **DataDog** / **New Relic** - APM (Application Performance Monitoring)
- **Grafana + Prometheus** - Metrics

---

## 3. ARHITEKTURNI LAYERI

### 3.1 Frontend arhitektura (Flutter)

```
lib/
├── core/
│   ├── config/
│   │   ├── api_config.dart           # API endpoints
│   │   └── app_config.dart           # App configuration
│   ├── constants/
│   │   ├── app_constants.dart        # Constants
│   │   └── route_constants.dart      # Route names
│   ├── errors/
│   │   ├── exceptions.dart           # Custom exceptions
│   │   └── failures.dart             # Failure classes
│   └── utils/
│       ├── date_utils.dart
│       └── validators.dart
│
├── data/
│   ├── models/                       # Data models (DTOs)
│   │   ├── employee_model.dart
│   │   ├── vacation_request_model.dart
│   │   └── ...
│   ├── repositories/                 # Repository implementations
│   │   ├── auth_repository_impl.dart
│   │   ├── employee_repository_impl.dart
│   │   └── ...
│   └── data_sources/                 # API clients
│       ├── remote/
│       │   ├── auth_api.dart
│       │   ├── vacation_api.dart
│       │   └── ...
│       └── local/
│           └── secure_storage.dart   # Local token storage
│
├── domain/
│   ├── entities/                     # Business entities
│   │   ├── employee.dart
│   │   ├── vacation_request.dart
│   │   └── ...
│   ├── repositories/                 # Repository interfaces
│   │   ├── auth_repository.dart
│   │   └── vacation_repository.dart
│   └── usecases/                     # Business logic
│       ├── auth/
│       │   ├── login_usecase.dart
│       │   └── logout_usecase.dart
│       └── vacation/
│           ├── create_request_usecase.dart
│           └── approve_request_usecase.dart
│
├── presentation/
│   ├── providers/                    # State management
│   │   ├── auth_provider.dart
│   │   ├── vacation_provider.dart
│   │   └── ...
│   ├── screens/                      # UI Screens
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── employee/
│   │   └── approver/
│   ├── widgets/                      # Reusable widgets
│   │   ├── common/
│   │   ├── vacation/
│   │   └── calendar/
│   └── routes/
│       └── app_router.dart           # Routing configuration
│
└── main.dart                         # Entry point
```

**Architectural pattern: Clean Architecture / Feature-first**
- Separation of concerns
- Testabilnost
- Dependency injection
- Repository pattern

---

### 3.2 Backend arhitektura (Node.js + Express)

```
src/
├── config/
│   ├── database.ts                   # DB connection config
│   ├── redis.ts                      # Redis config
│   ├── jwt.ts                        # JWT config
│   └── app.ts                        # Express app config
│
├── middleware/
│   ├── auth.middleware.ts            # JWT authentication
│   ├── authorize.middleware.ts       # Role-based authorization
│   ├── validate.middleware.ts        # Request validation
│   ├── errorHandler.middleware.ts    # Error handling
│   └── rateLimit.middleware.ts       # Rate limiting
│
├── routes/
│   ├── auth.routes.ts
│   ├── employees.routes.ts
│   ├── vacations.routes.ts
│   ├── approvals.routes.ts
│   ├── departments.routes.ts
│   ├── sickLeaves.routes.ts
│   └── index.ts                      # Route aggregation
│
├── controllers/
│   ├── auth.controller.ts
│   ├── employee.controller.ts
│   ├── vacation.controller.ts
│   ├── approval.controller.ts
│   └── ...
│
├── services/                         # Business logic
│   ├── auth.service.ts
│   ├── vacation.service.ts
│   ├── validation.service.ts
│   ├── notification.service.ts
│   └── ...
│
├── repositories/                     # Data access layer
│   ├── employee.repository.ts
│   ├── vacation.repository.ts
│   ├── department.repository.ts
│   └── ...
│
├── models/                           # Prisma models (generated)
│   └── index.ts
│
├── validators/                       # Request validators (Joi/Zod)
│   ├── auth.validator.ts
│   ├── vacation.validator.ts
│   └── ...
│
├── utils/
│   ├── logger.ts                     # Winston logger
│   ├── dateUtils.ts
│   ├── emailService.ts
│   └── ...
│
├── types/
│   ├── express.d.ts                  # Express type extensions
│   └── custom.types.ts
│
└── server.ts                         # Server entry point
```

**Architectural pattern: Layered Architecture**
- Routes → Controllers → Services → Repositories
- Dependency injection
- Separation of concerns

---

## 4. KOMUNIKACIJA

### 4.1 REST API specifikacija

**Base URL:**
```
Development: http://localhost:3000/api/v1
Production:  https://api.vacation-system.com/api/v1
```

**Autentifikacija:**
- JWT token u Authorization header
- Format: `Authorization: Bearer {token}`

**Primjeri endpoints:**

```http
# Auth
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password

# Employees
GET    /employees
GET    /employees/:id
POST   /employees
PUT    /employees/:id
DELETE /employees/:id
GET    /employees/:id/allocations
POST   /employees/:id/allocations

# Vacation Requests
GET    /vacation-requests
GET    /vacation-requests/:id
POST   /vacation-requests
PUT    /vacation-requests/:id
DELETE /vacation-requests/:id
POST   /vacation-requests/:id/submit
GET    /vacation-requests/my-requests

# Approvals
GET    /approvals/pending
POST   /approvals/:requestId/approve
POST   /approvals/:requestId/reject
POST   /approvals/:requestId/return

# Sick Leaves
GET    /sick-leaves
POST   /sick-leaves
PUT    /sick-leaves/:id
DELETE /sick-leaves/:id
POST   /sick-leaves/:id/close

# Departments
GET    /departments
POST   /departments
PUT    /departments/:id
DELETE /departments/:id

# Holidays
GET    /holidays
POST   /holidays
PUT    /holidays/:id
DELETE /holidays/:id

# Statistics
GET    /statistics/overview
GET    /statistics/department/:id
GET    /statistics/employee/:id
```

**Response format:**
```json
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is already in use"
      }
    ]
  }
}
```

---

### 4.2 Real-time komunikacija (Opciono)

**Za real-time notifikacije:**
- **WebSocket** (Socket.io)
- **Server-Sent Events (SSE)**

**Use cases:**
- Trenutna notifikacija o odobrenom zahtjevu
- Live update kalendara kad netko kreira zahtjev
- Real-time upozorenja

**Implementacija:**
```
Frontend: socket.io-client
Backend: socket.io (Node.js)
```

---

## 5. SIGURNOST

### 5.1 Autentifikacija i autorizacija

**JWT Token struktura:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "employee|approver|admin",
  "departmentId": "uuid",
  "iat": 1234567890,
  "exp": 1234597890
}
```

**Token lifecycle:**
- Access Token: 1 sat (kratki rok)
- Refresh Token: 7 dana (duži rok)
- Refresh Token stored u httpOnly cookie

**Password hashing:**
- Bcrypt sa salt rounds: 12
- Never store plain text passwords

---

### 5.2 API Security

**Rate Limiting:**
```javascript
// Login endpoint
- 5 attempts per 15 minutes per IP

// General API endpoints
- 100 requests per minute per user

// File upload
- 10 requests per hour per user
```

**Input validation:**
- Svi input-i se validiraju na backend-u (Joi/Zod)
- Sanitizacija SQL injection
- XSS protection (escape HTML)
- CSRF protection (SameSite cookies)

**CORS configuration:**
```javascript
// Production
{
  origin: 'https://vacation-system.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

---

### 5.3 Data Security

**Encryption:**
- **At-rest:** Database encryption (PostgreSQL: pgcrypto)
- **In-transit:** TLS 1.3 (HTTPS)
- **Sensitive fields:** Additional encryption za osobne podatke (AES-256)

**Backup:**
- Automatski daily backup baze podataka
- Backup retention: 30 dana
- Enkriptirani backup-i
- Testiranje restore procedure mjesečno

**Compliance:**
- **GDPR compliant** (EU)
  - Right to be forgotten (soft delete)
  - Data export functionality
  - Privacy policy

---

## 6. SKALABILNOST I PERFORMANSE

### 6.1 Caching strategija

**Redis caching layers:**

**1. Session cache:**
```
Key: "session:{userId}"
Value: { userId, token, ... }
TTL: 8 hours
```

**2. API response cache:**
```
Key: "api:{endpoint}:{params}"
Value: JSON response
TTL: 5 minutes (za često čitane podatke)

Primjer:
- GET /employees → cache 5 min
- GET /holidays → cache 1 hour
- GET /vacation-requests/my-requests → NO cache (uvijek fresh)
```

**3. Rate limit counter:**
```
Key: "ratelimit:{userId}:{endpoint}"
Value: counter
TTL: 1 minute / 15 minutes (ovisno o limitu)
```

---

### 6.2 Database optimizacija

**Indexes:**
```sql
-- Employees
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department_id);

-- Vacation Requests
CREATE INDEX idx_requests_employee ON vacation_requests(employee_id);
CREATE INDEX idx_requests_status ON vacation_requests(status);
CREATE INDEX idx_requests_dates ON vacation_requests(start_date, end_date);

-- Allocations
CREATE INDEX idx_allocations_employee_year ON vacation_allocations(employee_id, year);
```

**Query optimization:**
- Eager loading relacionih podataka (JOIN)
- Pagination za liste (LIMIT/OFFSET)
- Partial index za često filtrirane podatke

**Connection pooling:**
```javascript
// Prisma connection pool
{
  poolSize: 10,        // Max broj konekcija
  connectionTimeout: 5000,
}
```

---

### 6.3 Horizontal Scaling

**Stateless backend:**
- Session stored u Redis (ne u memoriji servera)
- Enable više backend instanci iza load balancer-a

```
                    ┌──────────────┐
                    │Load Balancer │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼────┐      ┌─────▼────┐
   │Backend 1│       │Backend 2 │      │Backend 3 │
   └────┬────┘       └────┬─────┘      └────┬─────┘
        │                 │                  │
        └─────────────────┼──────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
           ┌────▼────┐        ┌─────▼─────┐
           │PostgreSQL│        │   Redis   │
           └─────────┘        └───────────┘
```

---

## 7. DEPLOYMENT

### 7.1 Docker containerization

**Frontend Dockerfile:**
```dockerfile
# Stage 1: Build
FROM flutter:latest AS build
WORKDIR /app
COPY . .
RUN flutter build web --release

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**docker-compose.yml (Development):**
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/vacation_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=vacation_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

### 7.2 CI/CD Pipeline

**GitHub Actions workflow:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t vacation-app:${{ github.sha }} .
      - name: Push to registry
        run: docker push vacation-app:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Deploy script
          ssh user@server 'docker pull vacation-app:${{ github.sha }}'
          ssh user@server 'docker-compose up -d'
```

---

### 7.3 Production deployment

**Infrastruktura (AWS primjer):**

```
┌─────────────────────────────────────────────────────────┐
│                      Route 53 (DNS)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              CloudFront (CDN) - Frontend                 │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐   ┌──────────▼────────┐
│ S3 (Static Web)  │   │  ALB (API)        │
└──────────────────┘   └──────────┬────────┘
                                  │
                       ┌──────────┴──────────┐
                       │                     │
              ┌────────▼────────┐  ┌────────▼────────┐
              │  ECS/EC2 (API)  │  │  ECS/EC2 (API)  │
              └────────┬────────┘  └────────┬────────┘
                       │                     │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           ┌────────▼────────┐        ┌────────▼────────┐
           │  RDS PostgreSQL │        │ ElastiCache     │
           │  (Multi-AZ)     │        │ (Redis)         │
           └─────────────────┘        └─────────────────┘
```

**Komponente:**
- **Route 53:** DNS management
- **CloudFront:** CDN za frontend (brzo učitavanje)
- **S3:** Hosting Flutter web app-a (static files)
- **Application Load Balancer:** Distribucija traffic-a na backend instance
- **ECS/EC2:** Backend API serveri (auto-scaling group)
- **RDS PostgreSQL:** Managed baza (Multi-AZ za high availability)
- **ElastiCache:** Managed Redis
- **S3:** File storage za dokumente

---

## 8. MONITORING I LOGGING

### 8.1 Logging strategy

**Log levels:**
```
ERROR  - Kritične greške (database down, uncaught exceptions)
WARN   - Upozorenja (rate limit hit, validation errors)
INFO   - Informativni eventi (user login, request created)
DEBUG  - Development debugging
```

**Log format (JSON):**
```json
{
  "timestamp": "2024-12-12T10:30:00.000Z",
  "level": "INFO",
  "message": "User logged in",
  "userId": "uuid",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "...",
  "requestId": "uuid"
}
```

**Log destinations:**
- Development: Console
- Production: File + CloudWatch / ELK Stack / Datadog

---

### 8.2 Metrics

**Key metrics:**
```
Application:
- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

Business:
- Vacation requests created/day
- Approval time (avg, median)
- Pending requests count
- Active sick leaves

System:
- CPU usage
- Memory usage
- Database connections
- Redis hit rate
```

**Tools:**
- **Prometheus:** Metrics collection
- **Grafana:** Visualization
- **Datadog/New Relic:** All-in-one APM

---

### 8.3 Error tracking

**Sentry integration:**
- Automatic error reporting
- Stack traces
- User context
- Breadcrumbs (user actions prije greške)

**Alerting:**
- Error rate spike → Email/Slack notification
- Database connection lost → Page on-call engineer
- High response time → Auto-scale trigger

---

## 9. TESTIRANJE

### 9.1 Testing strategija

**Test pyramid:**
```
            /\
           /  \         10%  - E2E tests
          /────\
         /      \       30%  - Integration tests
        /────────\
       /          \     60%  - Unit tests
      /────────────\
```

---

### 9.2 Types of tests

**Unit tests:**
```javascript
// Backend (Jest)
describe('VacationService', () => {
  describe('validateRequest', () => {
    it('should reject request with start date in past', async () => {
      const result = await vacationService.validateRequest({
        startDate: '2020-01-01',
        endDate: '2020-01-05'
      });
      expect(result.valid).toBe(false);
    });
  });
});

// Frontend (Flutter)
test('Employee model fromJson', () {
  final json = {'id': '1', 'firstName': 'John'};
  final employee = Employee.fromJson(json);
  expect(employee.id, '1');
  expect(employee.firstName, 'John');
});
```

**Integration tests:**
```javascript
// API endpoint tests
describe('POST /vacation-requests', () => {
  it('should create vacation request', async () => {
    const response = await request(app)
      .post('/api/v1/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2025-01-10', endDate: '2025-01-15' });
    
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

**E2E tests:**
```javascript
// Flutter integration tests
testWidgets('Employee can create vacation request', (tester) async {
  await tester.pumpWidget(MyApp());
  
  // Login
  await tester.tap(find.byType(LoginButton));
  await tester.pumpAndSettle();
  
  // Navigate to create request
  await tester.tap(find.text('New Request'));
  await tester.pumpAndSettle();
  
  // Fill form
  await tester.enterText(find.byKey(Key('startDate')), '01.01.2025');
  await tester.tap(find.text('Submit'));
  await tester.pumpAndSettle();
  
  // Verify success
  expect(find.text('Request created'), findsOneWidget);
});
```

---

## 10. MIGRATION PLAN

### 10.1 Migration from mockup to production

**Faze:**

**Faza 1: Backend setup (2-3 tjedna)**
- Setup PostgreSQL baze
- Kreiranje database schema (Prisma migrations)
- Implementacija REST API endpoints
- Implementacija autentifikacije
- Unit testovi

**Faza 2: Frontend refaktoring (2 tjedna)**
- Zamjena DataService sa API calls
- Implementacija JWT storage i refresh
- Error handling
- Loading states

**Faza 3: Data migration (1 tjedan)**
- Export mockup podataka (ako postoje stvarni podaci)
- Import u PostgreSQL
- Validacija podataka

**Faza 4: Testing (1-2 tjedna)**
- Integration testing
- E2E testing
- UAT (User Acceptance Testing)
- Bug fixing

**Faza 5: Deployment (1 tjedan)**
- Production environment setup
- CI/CD pipeline
- Deploy
- Monitoring setup

**Faza 6: Launch & Support (ongoing)**
- Soft launch (beta korisnici)
- Prikupljanje feedback-a
- Bug fixes
- Full launch

---

## 11. ZAKLJUČAK

### 11.1 Prednosti predložene arhitekture

✓ **Skalabilnost:** Horizontalno skaliranje backend-a  
✓ **Maintainability:** Layered architecture, separation of concerns  
✓ **Security:** JWT, encryption, HTTPS  
✓ **Performance:** Redis caching, database optimization  
✓ **Reliability:** Auto-scaling, health checks, monitoring  
✓ **Developer experience:** TypeScript, modern tools, CI/CD  

### 11.2 Trade-offs

**Kompleksnost:**
- Više komponenti nego mockup (backend, baza, cache)
- Veći operacijski overhead

**Cijena:**
- Hosting troškovi (RDS, EC2, Redis)
- Development time duži nego mockup

**No need to over-engineer MVP:**
- Početi s jednostavnom verzijom
- Dodati kompleksnost po potrebi

---

**Dokument pripremljen:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Draft za review  
**Sljedeći koraci:** Review sa dev timom, procjena resursa

