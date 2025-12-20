# API specifikacija
## Sustav za upravljanje godišnjim odmorima i bolovanja

**Verzija:** 1.0  
**Datum:** 12.12.2024  
**Projekt:** Luna - Sustav za godišnji odmor  
**API Verzija:** v1  

---

## 1. UVOD

### 1.1 Svrha dokumenta
Ovaj dokument opisuje REST API za sustav upravljanje godišnjim odmorima. API omogućava:
- Autentifikaciju i autorizaciju korisnika
- Upravljanje zaposlenicima, odjelima i praznicima
- Kreiranje i odobravanje zahtjeva za godišnji odmor
- Evidenciju bolovanja
- Izvještavanje i statistike

### 1.2 Base URL

```
Development:  http://localhost:3000/api/v1
Staging:      https://staging-api.vacation-system.com/api/v1
Production:   https://api.vacation-system.com/api/v1
```

### 1.3 Autentifikacija

API koristi **JWT (JSON Web Token)** autentifikaciju.

**Header format:**
```http
Authorization: Bearer {access_token}
```

**Token lifecycle:**
- **Access Token:** Važeći 1 sat
- **Refresh Token:** Važeći 7 dana

---

## 2. RESPONSE FORMATI

### 2.1 Uspješni odgovor

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-12-12T10:30:00Z"
}
```

### 2.2 Error odgovor

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-12-12T10:30:00Z"
}
```

### 2.3 Error kodovi

| Kod | HTTP Status | Opis |
|-----|-------------|------|
| VALIDATION_ERROR | 400 | Neispravni input podaci |
| UNAUTHORIZED | 401 | Korisnik nije autentificiran |
| FORBIDDEN | 403 | Korisnik nema pristup resursu |
| NOT_FOUND | 404 | Resurs nije pronađen |
| CONFLICT | 409 | Konflikt podataka (npr. email već postoji) |
| BUSINESS_RULE_VIOLATION | 422 | Kršenje poslovnih pravila |
| INTERNAL_ERROR | 500 | Greška na serveru |

---

## 3. AUTENTIFIKACIJA ENDPOINTS

### 3.1 POST /auth/login

**Opis:** Prijava korisnika u sustav

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "employee",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Login successful"
}
```

**Errors:**
- `401 UNAUTHORIZED` - Neispravni podaci
- `403 FORBIDDEN` - Račun deaktiviran

---

### 3.2 POST /auth/refresh

**Opis:** Osvježavanje access tokena

**Request:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 3.3 POST /auth/logout

**Opis:** Odjava korisnika

**Request:**
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 3.4 POST /auth/forgot-password

**Opis:** Zahtjev za reset lozinke

**Request:**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If email exists, reset link has been sent"
}
```

**Napomena:** Response je isti bez obzira postoji li email (security)

---

### 3.5 POST /auth/reset-password

**Opis:** Reset lozinke

**Request:**
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Token invalidan ili istekao

---

### 3.6 PUT /auth/change-password

**Opis:** Promjena vlastite lozinke

**Auth:** Required

**Request:**
```http
PUT /api/v1/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `401 UNAUTHORIZED` - Trenutna lozinka neispravna

---

## 4. EMPLOYEES ENDPOINTS

### 4.1 GET /employees

**Opis:** Dohvaćanje liste zaposlenika

**Auth:** Required (Admin, Approver)

**Query parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `search` (string) - pretraga po imenu, prezimenu, emailu
- `departmentId` (uuid) - filtriranje po odjelu
- `isActive` (boolean) - filtriranje po statusu

**Request:**
```http
GET /api/v1/employees?page=1&limit=20&departmentId=uuid&isActive=true
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com",
        "departmentId": "uuid",
        "departmentName": "Engineering",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 4.2 GET /employees/:id

**Opis:** Dohvaćanje detalja zaposlenika

**Auth:** Required (Admin, Approver, Self)

**Request:**
```http
GET /api/v1/employees/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-06-01T00:00:00Z"
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Zaposlenik ne postoji
- `403 FORBIDDEN` - Nema pristup

---

### 4.3 POST /employees

**Opis:** Kreiranje novog zaposlenika

**Auth:** Required (Admin)

**Request:**
```http
POST /api/v1/employees
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@company.com",
  "departmentId": "uuid",
  "password": "temporaryPassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@company.com",
    "departmentId": "uuid",
    "isActive": true,
    "temporaryPassword": "temporaryPassword123",
    "createdAt": "2024-12-12T10:30:00Z"
  },
  "message": "Employee created successfully"
}
```

**Errors:**
- `409 CONFLICT` - Email već postoji
- `400 VALIDATION_ERROR` - Neispravni podaci

---

### 4.4 PUT /employees/:id

**Opis:** Uređivanje zaposlenika

**Auth:** Required (Admin)

**Request:**
```http
PUT /api/v1/employees/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith-Jones",
  "email": "jane.smith-jones@company.com",
  "departmentId": "uuid",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith-Jones",
    "email": "jane.smith-jones@company.com",
    "departmentId": "uuid",
    "isActive": true,
    "updatedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Employee updated successfully"
}
```

---

### 4.5 DELETE /employees/:id

**Opis:** Deaktivacija zaposlenika (soft delete)

**Auth:** Required (Admin)

**Request:**
```http
DELETE /api/v1/employees/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee deactivated successfully"
}
```

---

### 4.6 GET /employees/:id/allocations

**Opis:** Dohvaćanje alokacija zaposlenika

**Auth:** Required (Admin, Approver (same dept), Self)

**Query parameters:**
- `year` (integer, optional) - filtriranje po godini

**Request:**
```http
GET /api/v1/employees/{id}/allocations?year=2025
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "allocations": [
      {
        "id": "uuid",
        "employeeId": "uuid",
        "year": 2025,
        "allocatedDays": 20,
        "usedDays": 5,
        "pendingDays": 3,
        "remainingDays": 12,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-12-12T10:30:00Z"
      }
    ]
  }
}
```

---

### 4.7 POST /employees/:id/allocations

**Opis:** Kreiranje ili ažuriranje alokacije za zaposlenika

**Auth:** Required (Admin, Approver (same dept))

**Request:**
```http
POST /api/v1/employees/{id}/allocations
Authorization: Bearer {token}
Content-Type: application/json

{
  "year": 2025,
  "allocatedDays": 22
}
```

**Response (201 Created ili 200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "year": 2025,
    "allocatedDays": 22,
    "createdAt": "2024-12-12T10:30:00Z"
  },
  "message": "Allocation created successfully"
}
```

**Errors:**
- `422 BUSINESS_RULE_VIOLATION` - Ne može se smanjiti ispod iskorištenih dana

---

## 5. VACATION REQUESTS ENDPOINTS

### 5.1 GET /vacation-requests

**Opis:** Dohvaćanje liste zahtjeva

**Auth:** Required

**Query parameters:**
- `page`, `limit` - pagination
- `status` - draft, submitted, approved_first_level, approved, rejected, cancelled
- `employeeId` - filtriranje po zaposleniku (Admin/Approver)
- `year` - filtriranje po godini
- `startDate`, `endDate` - filtriranje po datumima

**Request:**
```http
GET /api/v1/vacation-requests?status=pending&year=2025
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "employeeId": "uuid",
        "employeeName": "John Doe",
        "startDate": "2025-01-10",
        "endDate": "2025-01-20",
        "requestedDays": 9,
        "notes": "Family vacation",
        "status": "pending",
        "createdAt": "2024-12-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 5.2 GET /vacation-requests/my-requests

**Opis:** Dohvaćanje vlastitih zahtjeva

**Auth:** Required

**Query parameters:**
- `page`, `limit`
- `status`
- `year`

**Request:**
```http
GET /api/v1/vacation-requests/my-requests?year=2025
Authorization: Bearer {token}
```

**Response:** Isti format kao 5.1

---

### 5.3 GET /vacation-requests/:id

**Opis:** Dohvaćanje detalja zahtjeva

**Auth:** Required (Owner, Approver, Admin)

**Request:**
```http
GET /api/v1/vacation-requests/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "startDate": "2025-01-10",
    "endDate": "2025-01-20",
    "requestedDays": 9,
    "notes": "Family vacation",
    "status": "pending",
    "approver": null,
    "approverComment": null,
    "createdAt": "2024-12-01T10:30:00Z",
    "updatedAt": "2024-12-05T14:20:00Z",
    "approvedAt": null
  }
}
```

---

### 5.4 POST /vacation-requests

**Opis:** Kreiranje novog zahtjeva

**Auth:** Required

**Request:**
```http
POST /api/v1/vacation-requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-01-10",
  "endDate": "2025-01-20",
  "notes": "Family vacation"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "startDate": "2025-01-10",
    "endDate": "2025-01-20",
    "requestedDays": 9,
    "notes": "Family vacation",
    "status": "draft",
    "createdAt": "2024-12-12T10:30:00Z"
  },
  "message": "Vacation request created successfully"
}
```

**Errors:**
- `422 BUSINESS_RULE_VIOLATION` - Validation errors:
  - Datum u prošlosti
  - Preklapanje s postojećim zahtjevom
  - Nedovoljno preostalih dana

---

### 5.5 PUT /vacation-requests/:id

**Opis:** Uređivanje zahtjeva (samo draft)

**Auth:** Required (Owner)

**Request:**
```http
PUT /api/v1/vacation-requests/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-01-12",
  "endDate": "2025-01-22",
  "notes": "Updated dates"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startDate": "2025-01-12",
    "endDate": "2025-01-22",
    "requestedDays": 9,
    "notes": "Updated dates",
    "status": "draft",
    "updatedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Vacation request updated successfully"
}
```

**Errors:**
- `422 BUSINESS_RULE_VIOLATION` - Može se uređivati samo draft zahtjeve

---

### 5.6 DELETE /vacation-requests/:id

**Opis:** Brisanje zahtjeva (samo draft)

**Auth:** Required (Owner)

**Request:**
```http
DELETE /api/v1/vacation-requests/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vacation request deleted successfully"
}
```

---

### 5.7 POST /vacation-requests/:id/submit

**Opis:** Slanje zahtjeva na odobrenje (draft → submitted ili approved, ovisno o needApproval flagu)

**Auth:** Required (Owner)

**Napomena:** 
- Ako `UnavailabilityReason.needApproval = false`: Status ide direktno u `approved`
- Ako `UnavailabilityReason.needApproval = true`: Status ide u `submitted`

**Request:**
```http
POST /api/v1/vacation-requests/{id}/submit
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "submitted",  // ili "approved" ako ne treba odobrenje
    "updatedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Vacation request submitted for approval"
}
```

---

### 5.8 POST /vacation-requests/:id/validate

**Opis:** Validacija zahtjeva bez spremanja

**Auth:** Required

**Request:**
```http
POST /api/v1/vacation-requests/{id}/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-01-10",
  "endDate": "2025-01-20"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "requestedDays": 9,
    "availableDays": 15,
    "warnings": [
      "Request includes 2 weekends"
    ],
    "errors": []
  }
}
```

**Response (validation fails):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "requestedDays": 9,
    "availableDays": 5,
    "warnings": [],
    "errors": [
      "Insufficient available days (requested: 9, available: 5)",
      "Overlaps with existing request (10.01.2025 - 15.01.2025)"
    ]
  }
}
```

---

## 6. APPROVALS ENDPOINTS

### 6.1 GET /approvals/pending

**Opis:** Dohvaćanje zahtjeva na čekanju

**Auth:** Required (Approver, Admin)

**Query parameters:**
- `page`, `limit`
- `departmentId` - filtriranje po odjelu

**Request:**
```http
GET /api/v1/approvals/pending?departmentId=uuid
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "employee": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "departmentName": "Engineering"
        },
        "startDate": "2025-01-10",
        "endDate": "2025-01-20",
        "requestedDays": 9,
        "notes": "Family vacation",
        "employeeRemainingDays": 15,
        "daysPending": 2,
        "createdAt": "2024-12-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 6.2 POST /approvals/:requestId/approve

**Opis:** Odobravanje zahtjeva (Department Manager ili General Manager, ovisno o statusu)

**Auth:** Required (Department Manager, General Manager, Admin)

**Pravila:**
- **Department Manager:**
  - Može odobravati zahtjeve zaposlenika svog odjela
  - Ne može odobravati vlastite zahtjeve
  - Ako status = `submitted` i `needSecondApproval = false`: Status ide u `approved` (konačno)
  - Ako status = `submitted` i `needSecondApproval = true`: Status ide u `approved_first_level`

- **General Manager:**
  - Može odobravati zahtjeve svih odjela
  - Ako status = `approved_first_level`: Status ide u `approved` (konačno)

**Request:**
```http
POST /api/v1/approvals/{requestId}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "comment": "Approved. Enjoy your vacation!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",  // ili "approved_first_level" za prvi nivo s needSecondApproval=true
    "approverId": "uuid",
    "approverComment": "Approved. Enjoy your vacation!",
    "approvedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Vacation request approved successfully"
}
```

**Errors:**
- `403 FORBIDDEN` - Approver nije za taj odjel
- `422 BUSINESS_RULE_VIOLATION` - Zahtjev nije u pending statusu

---

### 6.3 POST /approvals/:requestId/reject

**Opis:** Odbijanje zahtjeva (Department Manager ili General Manager)

**Auth:** Required (Department Manager, General Manager, Admin)

**Pravila:**
- **Department Manager:** Može odbiti zahtjeve zaposlenika svog odjela u statusu `submitted`
- **General Manager:** Može odbiti zahtjeve u statusu `submitted` ili `approved_first_level`
- Status se postavlja na `rejected` bez obzira na nivo
- ApplicationLogType:
  - `REJECTED` ako status bio `submitted`
  - `REJECTED_ON_FIRST_APPROVAL` ako status bio `approved_first_level`

**Request:**
```http
POST /api/v1/approvals/{requestId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "comment": "Too many people on vacation in that period."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "approverId": "uuid",
    "approverComment": "Too many people on vacation in that period.",
    "approvedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Vacation request rejected"
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Comment je obavezan

---


## 7. SICK LEAVES ENDPOINTS

### 7.1 GET /sick-leaves

**Opis:** Dohvaćanje liste bolovanja

**Auth:** Required (Approver, Admin)

**Query parameters:**
- `page`, `limit`
- `employeeId`
- `status` - active, completed
- `departmentId`

**Request:**
```http
GET /api/v1/sick-leaves?status=active&departmentId=uuid
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sickLeaves": [
      {
        "id": "uuid",
        "employee": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "startDate": "2024-12-01",
        "endDate": null,
        "status": "active",
        "durationDays": 11,
        "notes": "Flu",
        "createdBy": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Manager"
        },
        "createdAt": "2024-12-01T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### 7.2 GET /sick-leaves/my-sick-leaves

**Opis:** Dohvaćanje vlastitih bolovanja

**Auth:** Required

**Request:**
```http
GET /api/v1/sick-leaves/my-sick-leaves
Authorization: Bearer {token}
```

**Response:** Isti format kao 7.1

---

### 7.3 GET /sick-leaves/:id

**Opis:** Dohvaćanje detalja bolovanja

**Auth:** Required (Approver, Admin, Self)

**Request:**
```http
GET /api/v1/sick-leaves/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    },
    "startDate": "2024-12-01",
    "endDate": "2024-12-10",
    "status": "completed",
    "durationDays": 8,
    "notes": "Flu with medical certificate",
    "medicalDocuments": [
      {
        "id": "uuid",
        "filename": "medical_certificate.pdf",
        "uploadedAt": "2024-12-02T10:00:00Z"
      }
    ],
    "createdBy": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Manager"
    },
    "createdAt": "2024-12-01T08:00:00Z",
    "closedAt": "2024-12-10T09:00:00Z",
    "affectedVacationRequests": [
      {
        "id": "uuid",
        "oldPeriod": "01.12.2024 - 10.12.2024",
        "newPeriod": "Cancelled",
        "daysReturned": 6
      }
    ]
  }
}
```

---

### 7.4 POST /sick-leaves

**Opis:** Evidencija novog bolovanja

**Auth:** Required (Approver, Admin)

**Request:**
```http
POST /api/v1/sick-leaves
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": "uuid",
  "startDate": "2024-12-01",
  "endDate": "2024-12-10",
  "notes": "Flu"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "startDate": "2024-12-01",
    "endDate": "2024-12-10",
    "status": "completed",
    "notes": "Flu",
    "createdBy": "uuid",
    "createdAt": "2024-12-12T10:30:00Z",
    "vacationAdjustments": [
      {
        "requestId": "uuid",
        "action": "cancelled",
        "daysReturned": 6
      }
    ]
  },
  "message": "Sick leave created and vacation requests adjusted"
}
```

**Napomena:** Ako `endDate` je `null`, bolovanje je aktivno

---

### 7.5 PUT /sick-leaves/:id

**Opis:** Uređivanje bolovanja

**Auth:** Required (Approver, Admin)

**Request:**
```http
PUT /api/v1/sick-leaves/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2024-12-01",
  "endDate": "2024-12-12",
  "notes": "Flu, extended"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startDate": "2024-12-01",
    "endDate": "2024-12-12",
    "status": "completed",
    "notes": "Flu, extended",
    "updatedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Sick leave updated successfully"
}
```

---

### 7.6 POST /sick-leaves/:id/close

**Opis:** Zatvaranje aktivnog bolovanja

**Auth:** Required (Approver, Admin)

**Request:**
```http
POST /api/v1/sick-leaves/{id}/close
Authorization: Bearer {token}
Content-Type: application/json

{
  "endDate": "2024-12-10"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "endDate": "2024-12-10",
    "status": "completed",
    "closedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Sick leave closed successfully"
}
```

---

### 7.7 POST /sick-leaves/:id/documents

**Opis:** Upload medicinske dokumentacije

**Auth:** Required (Approver, Admin)

**Request:**
```http
POST /api/v1/sick-leaves/{id}/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary file data]
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "medical_certificate.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 245678,
    "uploadedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Document uploaded successfully"
}
```

---

### 7.8 GET /sick-leaves/:id/documents/:documentId

**Opis:** Download medicinske dokumentacije

**Auth:** Required (Approver, Admin, Self)

**Request:**
```http
GET /api/v1/sick-leaves/{id}/documents/{documentId}
Authorization: Bearer {token}
```

**Response (200 OK):**
```
Content-Type: application/pdf (or appropriate MIME type)
Content-Disposition: attachment; filename="medical_certificate.pdf"

[Binary file data]
```

---

## 8. DEPARTMENTS ENDPOINTS

### 8.1 GET /departments

**Opis:** Dohvaćanje liste odjela

**Auth:** Required (Admin, Approver)

**Query parameters:**
- `isActive` (boolean)

**Request:**
```http
GET /api/v1/departments?isActive=true
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "uuid",
        "name": "Engineering",
        "description": "Software development team",
        "isActive": true,
        "employeeCount": 25,
        "approverCount": 2,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 8.2 GET /departments/:id

**Opis:** Dohvaćanje detalja odjela

**Auth:** Required (Admin, Approver)

**Request:**
```http
GET /api/v1/departments/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "description": "Software development team",
    "isActive": true,
    "employees": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      }
    ],
    "approvers": [
      {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Manager",
        "email": "jane.manager@company.com"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-06-01T00:00:00Z"
  }
}
```

---

### 8.3 POST /departments

**Opis:** Kreiranje novog odjela

**Auth:** Required (Admin)

**Request:**
```http
POST /api/v1/departments
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Marketing",
  "description": "Marketing and PR team",
  "approverIds": ["uuid1", "uuid2"],
  "employeeIds": ["uuid3", "uuid4"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Marketing",
    "description": "Marketing and PR team",
    "isActive": true,
    "createdAt": "2024-12-12T10:30:00Z"
  },
  "message": "Department created successfully"
}
```

---

### 8.4 PUT /departments/:id

**Opis:** Uređivanje odjela

**Auth:** Required (Admin)

**Request:**
```http
PUT /api/v1/departments/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Marketing & PR",
  "description": "Marketing, PR and Communication team",
  "approverIds": ["uuid1", "uuid2", "uuid3"],
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Marketing & PR",
    "description": "Marketing, PR and Communication team",
    "isActive": true,
    "updatedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Department updated successfully"
}
```

---

### 8.5 DELETE /departments/:id

**Opis:** Deaktivacija odjela

**Auth:** Required (Admin)

**Request:**
```http
DELETE /api/v1/departments/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Department deactivated successfully"
}
```

---

## 9. HOLIDAYS ENDPOINTS

### 9.1 GET /holidays

**Opis:** Dohvaćanje liste praznika

**Auth:** Required

**Query parameters:**
- `year` (integer) - filtriranje po godini

**Request:**
```http
GET /api/v1/holidays?year=2025
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "holidays": [
      {
        "id": "uuid",
        "name": "Nova godina",
        "date": "2025-01-01",
        "isRecurring": true,
        "year": null
      },
      {
        "id": "uuid",
        "name": "Uskrs",
        "date": "2025-04-20",
        "isRecurring": false,
        "year": 2025
      }
    ]
  }
}
```

---

### 9.2 POST /holidays

**Opis:** Kreiranje praznika

**Auth:** Required (Admin)

**Request:**
```http
POST /api/v1/holidays
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dan rada",
  "date": "2025-05-01",
  "isRecurring": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Dan rada",
    "date": "2025-05-01",
    "isRecurring": true,
    "year": null,
    "createdAt": "2024-12-12T10:30:00Z"
  },
  "message": "Holiday created successfully"
}
```

---

### 9.3 PUT /holidays/:id

**Opis:** Uređivanje praznika

**Auth:** Required (Admin)

**Request:**
```http
PUT /api/v1/holidays/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dan rada (Labour Day)",
  "date": "2025-05-01",
  "isRecurring": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Dan rada (Labour Day)",
    "date": "2025-05-01",
    "isRecurring": true,
    "updatedAt": "2024-12-12T10:30:00Z"
  },
  "message": "Holiday updated successfully"
}
```

---

### 9.4 DELETE /holidays/:id

**Opis:** Brisanje praznika

**Auth:** Required (Admin)

**Request:**
```http
DELETE /api/v1/holidays/{id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Holiday deleted successfully"
}
```

---

## 10. STATISTICS ENDPOINTS

### 10.1 GET /statistics/overview

**Opis:** Opći pregled statistika

**Auth:** Required (Admin)

**Request:**
```http
GET /api/v1/statistics/overview
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employees": {
      "total": 150,
      "active": 145,
      "inactive": 5
    },
    "departments": {
      "total": 8,
      "active": 8
    },
    "vacationRequests": {
      "pending": 12,
      "approved": 245,
      "rejected": 8,
      "thisMonth": 35
    },
    "sickLeaves": {
      "active": 3,
      "thisMonth": 8,
      "totalDays": 45
    }
  }
}
```

---

### 10.2 GET /statistics/department/:id

**Opis:** Statistika odjela

**Auth:** Required (Admin, Approver (same dept))

**Query parameters:**
- `year` (integer, default: current year)

**Request:**
```http
GET /api/v1/statistics/department/{id}?year=2025
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "year": 2025,
    "employees": {
      "total": 25,
      "active": 24
    },
    "vacationUsage": {
      "totalAllocated": 500,
      "totalUsed": 280,
      "totalPending": 45,
      "totalRemaining": 175,
      "averageUsagePercent": 56
    },
    "vacationRequestsByMonth": {
      "January": 12,
      "February": 15,
      "March": 18
      // ...
    },
    "topVacationUsers": [
      {
        "employeeId": "uuid",
        "employeeName": "John Doe",
        "usedDays": 20,
        "allocatedDays": 20,
        "usagePercent": 100
      }
    ],
    "sickLeaveStats": {
      "totalSickLeaves": 15,
      "totalDays": 89,
      "averageDuration": 5.9
    }
  }
}
```

---

### 10.3 GET /statistics/employee/:id

**Opis:** Statistika zaposlenika

**Auth:** Required (Admin, Approver (same dept), Self)

**Query parameters:**
- `year` (integer, default: current year)

**Request:**
```http
GET /api/v1/statistics/employee/{id}?year=2025
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "year": 2025,
    "vacation": {
      "allocated": 20,
      "used": 12,
      "pending": 3,
      "remaining": 5,
      "usagePercent": 60
    },
    "requests": {
      "total": 8,
      "approved": 6,
      "pending": 1,
      "rejected": 1
    },
    "sickLeaves": {
      "total": 2,
      "totalDays": 12
    },
    "timeline": [
      {
        "type": "vacation",
        "startDate": "2025-01-10",
        "endDate": "2025-01-20",
        "days": 9
      },
      {
        "type": "sick_leave",
        "startDate": "2025-03-01",
        "endDate": "2025-03-05",
        "days": 5
      }
    ]
  }
}
```

---

## 11. PLANNING ENDPOINTS

### 11.1 GET /planning/calendar

**Opis:** Kalendar planiranja za odjel

**Auth:** Required (Approver, Admin)

**Query parameters:**
- `departmentId` (uuid, required)
- `startDate` (date, required)
- `endDate` (date, required)

**Request:**
```http
GET /api/v1/planning/calendar?departmentId=uuid&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "employees": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "calendar": {
          "2025-01-10": {
            "type": "vacation",
            "status": "approved",
            "requestId": "uuid"
          },
          "2025-01-11": {
            "type": "vacation",
            "status": "approved",
            "requestId": "uuid"
          },
          "2025-01-12": {
            "type": "vacation",
            "status": "approved",
            "requestId": "uuid"
          },
          "2025-01-20": {
            "type": "sick_leave",
            "sickLeaveId": "uuid"
          }
        }
      }
    ],
    "criticalDates": [
      {
        "date": "2025-01-10",
        "employeesOnLeave": 8,
        "totalEmployees": 25,
        "percentOnLeave": 32,
        "severity": "warning"
      }
    ],
    "holidays": [
      {
        "date": "2025-01-01",
        "name": "Nova godina"
      }
    ]
  }
}
```

---

## 12. ZAKLJUČAK

### 12.1 API Verzioniranje

API koristi URL path verzioniranje: `/api/v1/`, `/api/v2/`

Nove verzije API-ja se kreiraju kada:
- Dolazi do breaking changes
- Mijenja se struktura response-a
- Mijenjaju se required parametri

### 12.2 Rate Limiting

```
General endpoints: 100 requests/minute/user
Login endpoint: 5 attempts/15 minutes/IP
File upload: 10 requests/hour/user
```

Response header:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702123456
```

### 12.3 Pagination

Svi list endpoints podržavaju pagination:
```
?page=1&limit=20
```

Default: `page=1`, `limit=20`  
Max: `limit=100`

### 12.4 OpenAPI dokumentacija

API će imati auto-generated OpenAPI (Swagger) dokumentaciju dostupnu na:
```
/api/docs
```

---

**Dokument pripremljen:** 12.12.2024  
**Verzija:** 1.0  
**Status:** Draft za review

