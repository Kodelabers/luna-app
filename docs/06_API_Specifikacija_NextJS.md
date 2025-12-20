# Next.js API Pristup - Kratki vodič
## Kada koristiti Server Components, Server Actions i API Routes

**Datum:** 12.12.2024  
**Projekt:** Luna - Sustav za godišnji odmor  

---

## 📋 Pregled pristupa

U Next.js 14+ imamo tri načina komunikacije između frontenda i backend-a:

### 1. Server Components (preporučeno za čitanje)

**Kada koristiti:**
- Čitanje podataka iz baze
- Dashboard-i i liste
- Statistike
- Sve što ne zahtijeva interaktivnost

**Primjer:**
```typescript
// app/employees/page.tsx
import { prisma } from '@/lib/prisma/client'

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: { department: true }
  })
  
  return (
    <div>
      <h1>Zaposlenici</h1>
      <EmployeesList employees={employees} />
    </div>
  )
}
```

**Prednosti:**
- ✅ Najbrže (direktan pristup bazi)
- ✅ Server-side rendering
- ✅ Automatski caching
- ✅ Nema HTTP overhead

---

### 2. Server Actions (preporučeno za mutacije)

**Kada koristiti:**
- Kreiranje, uređivanje, brisanje podataka
- Form submissions
- Sve akcije koje mijenjaju stanje

**Primjer:**
```typescript
// lib/actions/vacation-requests.ts
'use server'

import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const createRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
})

export async function createVacationRequest(
  input: z.infer<typeof createRequestSchema>
) {
  // Validacija
  const data = createRequestSchema.parse(input)
  
  // Business logika
  const request = await prisma.vacationRequest.create({
    data: {
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      notes: data.notes,
      // ...
    }
  })
  
  return { success: true, data: request }
}

// U Client Component:
'use client'
import { createVacationRequest } from '@/lib/actions/vacation-requests'

async function handleSubmit(formData: FormData) {
  const result = await createVacationRequest({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    notes: formData.get('notes'),
  })
  
  if (result.success) {
    toast.success('Zahtjev kreiran!')
  }
}
```

**Prednosti:**
- ✅ Type-safe (TypeScript)
- ✅ Nema HTTP overhead
- ✅ Automatska validacija
- ✅ Direktan pristup bazi
- ✅ Progressivno poboljšanje

---

### 3. API Routes (za vanjski pristup)

**Kada koristiti:**
- Webhook-ovi
- Integracije s vanjskim sistemima
- Mobile aplikacije
- Public API
- Slučajevi gdje treba REST API

**Primjer:**
```typescript
// app/api/vacation-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await auth(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const requests = await prisma.vacationRequest.findMany({
    where: { employeeId: user.id }
  })
  
  return NextResponse.json({ success: true, data: requests })
}
```

**Prednosti:**
- ✅ Standardni REST API
- ✅ Vanjski pristup
- ✅ Webhook podrška
- ✅ Integracije

---

## 🎯 Preporuke za Luna projekt

### Čitanje podataka → Server Components

```typescript
// ✅ DOBRO
// app/dashboard/page.tsx
export default async function Dashboard() {
  const stats = await getDashboardStats()
  return <DashboardView stats={stats} />
}

// ❌ IZBJEGAVATI (nepotrebno)
// app/dashboard/page.tsx
'use client'
export default function Dashboard() {
  const [stats, setStats] = useState()
  useEffect(() => {
    fetch('/api/dashboard').then(...) // Nepotrebno!
  }, [])
}
```

### Mutacije → Server Actions

```typescript
// ✅ DOBRO
// lib/actions/vacation-requests.ts
'use server'
export async function approveRequest(id: string) {
  // ... logika
}

// components/approve-button.tsx
'use client'
import { approveRequest } from '@/lib/actions/vacation-requests'
<button onClick={() => approveRequest(id)}>Odobri</button>

// ❌ IZBJEGAVATI (ako nije potrebno)
fetch('/api/vacation-requests/approve', { method: 'POST', ... })
```

### Vanjski pristup → API Routes

```typescript
// ✅ DOBRO - Webhook
// app/api/webhooks/vacation-approved/route.ts
export async function POST(request: NextRequest) {
  // Webhook logika
}

// ✅ DOBRO - Public API
// app/api/public/statistics/route.ts
export async function GET() {
  // Public statistike
}
```

---

## 📝 Struktura projekta

```
app/
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx              # Server Component - čita podatke
│   ├── employees/
│   │   ├── page.tsx              # Server Component - lista
│   │   └── [id]/
│   │       └── page.tsx          # Server Component - detalji
│   └── vacation-requests/
│       ├── page.tsx              # Server Component - lista
│       └── [id]/
│           └── page.tsx          # Server Component - detalji
│
├── api/                          # API Routes (samo ako potrebno)
│   ├── webhooks/
│   │   └── route.ts
│   └── public/
│       └── statistics/
│           └── route.ts
│
lib/
├── actions/                      # Server Actions
│   ├── auth.ts
│   ├── employees.ts
│   ├── vacation-requests.ts
│   └── approvals.ts
│
└── services/                     # Business logika (dijeljena)
    ├── vacation.service.ts
    └── validation.service.ts
```

---

## ✅ Zaključak

**Za Luna projekt:**
- **90% Server Components** - za čitanje podataka
- **90% Server Actions** - za mutacije
- **10% API Routes** - samo za webhook-ove i vanjski pristup

**API specifikacija (06_API_Specifikacija.md) je korisna za:**
- Dokumentaciju Server Actions kontrakata
- API Routes za vanjski pristup
- TypeScript tipove i validacije
- Testiranje

Ali nije potrebna za većinu internih operacija koje koriste Server Components i Server Actions.

---

**Dokument pripremljen:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Vodič za Next.js pristup

