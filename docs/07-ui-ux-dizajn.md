# UI/UX Dizajn

## Pregled

Ovaj dokument opisuje dizajn principe, UI komponente i korisničko iskustvo za Luna sustav - aplikaciju za upravljanje godišnjim odmorima, bolovanja i planiranje rasporeda zaposlenika.

## 1. Dizajn Principi

### 1.1 Core Principles

**1. Clarity (Jasnoća)**
- Jednostavno i intuitivno sučelje
- Jasna hijerarhija informacija
- Nedvosmisleni call-to-actions
- Konzistentna terminologija

**2. Efficiency (Efikasnost)**
- Minimalan broj klikova do cilja
- Bulk operacije gdje je prikladno
- Keyboard shortcuts
- Quick actions i context menus

**3. Consistency (Konzistentnost)**
- Jedinstveni dizajn jezik kroz cijelu aplikaciju
- Predvidljivo ponašanje komponenata
- Standardne UX patterns

**4. Accessibility (Pristupačnost)**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios

**5. Responsiveness**
- Mobile-first approach
- Adaptive layout za različite screen sizes
- Touch-friendly interface

### 1.2 Design System

**Baza:**
- Tailwind CSS utility classes
- Component library: shadcn/ui ili Material-UI
- Icons: Lucide Icons / Heroicons / Material Icons
- Fonts: Inter / Roboto / System fonts

## 2. Color Palette

### 2.1 Primary Colors

```css
/* Primary Brand Color */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main brand color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Secondary/Accent Color */
--secondary-500: #8b5cf6;  /* Purple */
--secondary-600: #7c3aed;

/* Success (Odobreni zahtjevi, Active status) */
--success-500: #10b981;
--success-600: #059669;

/* Warning (Pending zahtjevi, Draft) */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error/Danger (Odbijeni zahtjevi, Bolovanje) */
--error-500: #ef4444;
--error-600: #dc2626;

/* Info (Praznici, Vikendi) */
--info-500: #06b6d4;
--info-600: #0891b2;
```

### 2.2 Neutral Colors

```css
/* Light mode */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Dark mode */
--dark-bg: #0f172a;
--dark-surface: #1e293b;
--dark-border: #334155;
```

## 3. Typography

### 3.1 Font Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 3.2 Typographic Hierarchy

```
H1: 2.25rem (36px), Bold, Leading Tight
H2: 1.875rem (30px), Bold, Leading Tight
H3: 1.5rem (24px), Semibold, Leading Tight
H4: 1.25rem (20px), Semibold, Leading Normal
H5: 1.125rem (18px), Medium, Leading Normal
Body: 1rem (16px), Normal, Leading Normal
Small: 0.875rem (14px), Normal, Leading Normal
Caption: 0.75rem (12px), Normal, Leading Normal
```

## 4. Spacing System

```css
/* Tailwind-style spacing scale */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

## 5. Layout Structure

### 5.1 Overall Layout

```
┌─────────────────────────────────────────────────┐
│  Top Navigation Bar (64px)                      │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  Sidebar │  Main Content Area                   │
│  (240px) │                                      │
│          │  ┌────────────────────────────────┐  │
│          │  │  Page Header                   │  │
│          │  ├────────────────────────────────┤  │
│          │  │                                │  │
│          │  │  Content                       │  │
│          │  │                                │  │
│          │  └────────────────────────────────┘  │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### 5.2 Top Navigation

**Elementi (lijevo → desno):**
1. Logo / Brand
2. Breadcrumbs (opciono)
3. Spacer
4. Search bar
5. Notifications icon + badge
6. User avatar + dropdown

**Funkcionalnosti:**
- Sticky position (ostaje vidljiv pri scrollu)
- Quick search (Command+K / Ctrl+K)
- Notification center dropdown
- User menu dropdown

### 5.3 Sidebar Navigation

**Struktura:**
```
┌─────────────────────┐
│ 🏠 Dashboard        │
├─────────────────────┤
│ MY REQUESTS         │
│ 📝 New Request      │
│ 📋 My Requests      │
│ 📅 My Calendar      │
├─────────────────────┤
│ TEAM (ako Manager)  │
│ 👥 Team Overview    │
│ ✓  Pending Approvals│ (badge)
│ 📊 Team Planning    │
│ 📈 Team Reports     │
├─────────────────────┤
│ ADMIN (ako Admin)   │
│ 👤 Employees        │
│ 🏢 Departments      │
│ 🎯 Managers         │
│ 📆 Holidays         │
│ 🔧 Settings         │
├─────────────────────┤
│ 💬 Help & Support   │
└─────────────────────┘
```

**Features:**
- Collapsible (Desktop: icon + text, Collapsed: samo icon)
- Mobile: Hamburger menu
- Active state highlighting
- Badge counts (npr. broj zahtjeva na čekanju)
- Grouped items s collapsible sections
- Role-based visibility (zaposlenici vide samo MY REQUESTS)

### 5.4 Main Content Area

**Tipična struktura:**
```html
<Page>
  <PageHeader>
    <Title>
    <Actions> <!-- Create, Export, etc. -->
    <Tabs> <!-- Optional -->
  </PageHeader>
  
  <PageContent>
    <Filters> <!-- Optional -->
    <Content>
  </PageContent>
</Page>
```

## 6. Komponente

### 6.1 Buttons

**Variants:**

**Primary Button**
- Use: Main actions (Save, Create, Submit)
- Style: Solid primary color
- States: Default, Hover, Active, Disabled, Loading

**Secondary Button**
- Use: Less important actions (Cancel, Back)
- Style: Outlined or ghost

**Danger Button**
- Use: Destructive actions (Delete, Remove)
- Style: Solid red

**Sizes:**
- Small: 32px height
- Medium: 40px height (default)
- Large: 48px height

**Example:**
```tsx
// Primary
<Button variant="primary" size="medium">
  Approve Request
</Button>

// With icon
<Button variant="primary" icon={<PlusIcon />}>
  New Request
</Button>

// Loading state
<Button variant="primary" loading>
  Approving...
</Button>

// Danger
<Button variant="danger" icon={<XIcon />}>
  Reject Request
</Button>
```

### 6.2 Forms

**Form Layout:**
- Vertical stacking (default)
- Label above input
- Help text below input
- Error messages below input (red color)
- Required indicator (*)

**Input Fields:**
```tsx
<FormField>
  <Label required>Email Address</Label>
  <Input 
    type="email" 
    placeholder="john@example.com"
  />
  <HelpText>We'll never share your email</HelpText>
  <ErrorMessage>Invalid email format</ErrorMessage>
</FormField>
```

**Input Types:**
- Text input
- Email input
- Password input (with show/hide toggle)
- Number input
- Textarea
- Select / Dropdown
- Multi-select
- Checkbox
- Radio buttons
- Toggle switch
- Date picker
- File upload (drag & drop)

**Validation:**
- Inline validation on blur
- Form-level validation on submit
- Clear error messages
- Success states

### 6.3 Tables

**Features:**
- Sortable columns
- Filterable
- Searchable
- Pagination
- Row selection (checkbox)
- Bulk actions
- Expandable rows
- Sticky header
- Responsive (cards na mobile)

**Structure:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHeaderCell sortable>Name</TableHeaderCell>
      <TableHeaderCell sortable>Email</TableHeaderCell>
      <TableHeaderCell>Status</TableHeaderCell>
      <TableHeaderCell align="right">Actions</TableHeaderCell>
    </TableRow>
  </TableHeader>
  
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>
        <Badge variant="success">Active</Badge>
      </TableCell>
      <TableCell align="right">
        <DropdownMenu>
          <MenuItem>Edit</MenuItem>
          <MenuItem>Delete</MenuItem>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Empty State:**
- Illustration / Icon
- Title: "No requests yet"
- Description: "Get started by creating your first leave request"
- Action button: "Create Request"

### 6.4 Cards

**Use Cases:**
- Dashboard widgets
- List items (mobile view)
- Feature highlights
- Statistics

**Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Users</CardTitle>
    <CardIcon><UsersIcon /></CardIcon>
  </CardHeader>
  <CardBody>
    <Metric>1,234</Metric>
    <Change positive>+12% from last month</Change>
  </CardBody>
</Card>
```

### 6.5 Modals / Dialogs

**Use Cases:**
- Create/Edit forms
- Confirmations
- Alerts
- Full-screen wizards

**Types:**

**1. Standard Modal**
- Centered on screen
- Overlay backdrop (semi-transparent)
- Close button (X) in top-right
- ESC key to close

**2. Confirmation Dialog**
- Smaller size
- Clear question
- Danger action highlighted
- "Cancel" and "Confirm" buttons

**3. Side Panel / Drawer**
- Slides from right
- Good for forms without navigating away
- Close with X or click outside

**Example - Confirmation:**
```tsx
<ConfirmDialog
  title="Reject Request"
  message="Are you sure you want to reject this leave request from John Doe? Please provide a reason."
  confirmText="Reject"
  confirmVariant="danger"
  onConfirm={handleReject}
  onCancel={handleCancel}
/>
```

### 6.6 Notifications / Toasts

**Types:**
- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)

**Position:** Top-right corner

**Behavior:**
- Auto-dismiss after 5 seconds
- Manual close button
- Stackable (multiple at once)
- Queue if too many

**Example:**
```tsx
toast.success("Request approved successfully")
toast.error("Failed to create request")
toast.warning("You have only 5 days remaining")
toast.info("New holiday added to calendar")
```

### 6.7 Badges & Status Indicators

**Use Cases:**
- Application status (Draft, Submitted, Approved, Rejected)
- Employee status (Active, Inactive)
- Leave type indicators
- Day counts

**Variants:**
```tsx
<Badge variant="success">Approved</Badge>
<Badge variant="danger">Rejected</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">First Level Approved</Badge>
<Badge variant="neutral">Draft</Badge>
```

**Application Status Colors:**
- DRAFT → Gray (neutral)
- SUBMITTED → Yellow (warning)
- APPROVED_FIRST_LEVEL → Blue (info)
- APPROVED → Green (success)
- REJECTED → Red (danger)
- CANCELLED → Gray (neutral)

### 6.8 Loading States

**Types:**

**1. Spinner**
- Use: Button loading, small components
- Sizes: Small, Medium, Large

**2. Skeleton Loader**
- Use: Content placeholders
- Matches content layout
- Subtle animation

**3. Progress Bar**
- Use: File uploads, multi-step processes
- Shows percentage

**4. Full Page Loader**
- Use: Initial app load, route changes
- Spinner + brand logo

### 6.9 Empty States

**Elements:**
- Illustration / Icon (large, friendly)
- Heading (clear, descriptive)
- Description (helpful, encouraging)
- Primary action (when applicable)

**Example:**
```
┌────────────────────────┐
│                        │
│     [Illustration]     │
│                        │
│   No requests yet      │
│   Get started by       │
│   creating your first  │
│   leave request        │
│                        │
│   [New Request Btn]    │
│                        │
└────────────────────────┘
```

### 6.10 Calendar Component

**Ključna komponenta za Luna aplikaciju**

**Tipovi:**

**1. Monthly Calendar (Employee View)**
- Standard mjesečni pogled
- Označavanje:
  - Zeleno: Odobreni godišnji
  - Žuto: Zahtjevi na čekanju
  - Crveno/Narančasto: Bolovanje
  - Sivo: Vikendi
  - Plavo: Praznici
- Tooltip on hover s detaljima
- Click to view details

**2. Team Planning Calendar (Manager View)**
- Tablični format (redci = zaposlenici, stupci = dani)
- Quick overview koliko ljudi je available
- Color-coded status per person per day
- Export funkcionalnost
- Zoom nivoi: Week / Month / Custom range

**3. Date Range Picker (za forme)**
- range calendar
- Real-time calculation radnih dana
- Označavanje vikenda i praznika
- Validacija preklapanja
- Visual feedback za selected range

**Calendar Legend:**
```
✓ Working         🏖️ Annual Leave    🤒 Sick Leave
⏳ Pending        🎉 Holiday         - Weekend
```

**Interakcije:**
- Drag to select range (gdje applicable)
- Click to view details
- Double-click za quick actions
- Keyboard navigation (arrow keys)
- Touch-friendly za mobile

### 6.11 Status Flow Indicator

**Vizualni prikaz toka zahtjeva**

**Timeline Component:**
```tsx
<StatusTimeline>
  <TimelineItem status="completed" timestamp="Jan 5, 10:30">
    Created by John Doe
  </TimelineItem>
  <TimelineItem status="completed" timestamp="Jan 5, 10:32">
    Submitted by John Doe
  </TimelineItem>
  <TimelineItem status="current" timestamp="Jan 6, 2:15">
    Waiting for approval
  </TimelineItem>
  <TimelineItem status="pending">
    Final approval
  </TimelineItem>
</StatusTimeline>
```

**Statusi:**
- Completed: ✓ zeleni checkmark
- Current: 🔵 plavi dot, animated
- Pending: ⚪ sivi dot
- Rejected: ✗ crveni X

**Use Cases:**
- Request detail page
- Approval flow visualization
- Audit trail prikaz

## 7. Page Designs

### 7.1 Dashboard - Zaposlenik

**Layout:**
```
┌──────────────────────────────────────────────┐
│  My Dashboard                                │
├──────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │ Total  │ │ Used   │ │ Pending│ │ Remain.││
│  │ Days   │ │ Days   │ │ Days   │ │ Days   ││
│  │  20    │ │   8    │ │   3    │ │   9    ││
│  └────────┘ └────────┘ └────────┘ └────────┘│
├──────────────────────────────────────────────┤
│  My Requests                    [New Request]│
│  ┌────────────────────────────────────────┐  │
│  │ Status    Date Range      Days  Actions│  │
│  │ Approved  Jan 15-19       5     View   │  │
│  │ Pending   Feb 10-14       5     View   │  │
│  │ Draft     Mar 05-08       4     Edit   │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Calendar - My Leave                    │  │
│  │                                        │  │
│  │  [Monthly Calendar View]               │  │
│  │  - Green: Approved leave               │  │
│  │  - Yellow: Pending leave               │  │
│  │  - Red: Sick leave                     │  │
│  │  - Gray: Holidays/Weekends             │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 7.2 Dashboard - Manager/Odobravatelj

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Team Dashboard                [Team Filter ▼]│
├──────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │ Pending│ │ On     │ │ Team   │ │ This   ││
│  │ Appr.  │ │ Leave  │ │ Members│ │ Month  ││
│  │   5    │ │   3    │ │   15   │ │   8    ││
│  └────────┘ └────────┘ └────────┘ └────────┘│
├──────────────────────────────────────────────┤
│  Pending Approvals                [Approve All]│
│  ┌────────────────────────────────────────┐  │
│  │ Employee   Date Range    Days  Actions │  │
│  │ John Doe   Jan 15-19     5     [✓][✗] │  │
│  │ Jane Smith Feb 10-14     5     [✓][✗] │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Team Planning                 [Week][Month]  │
│  ┌────────────────────────────────────────┐  │
│  │      Mon  Tue  Wed  Thu  Fri  Sat  Sun │  │
│  │ John    ✓    ✓    🏖️   🏖️   🏖️   -    - │  │
│  │ Jane    ✓    ✓    ✓    ✓    ✓    -    - │  │
│  │ Mike    🤒   🤒   ✓    ✓    ✓    -    - │  │
│  │ Sara    ✓    ✓    ✓    ✓    ✓    -    - │  │
│  │ Tom     ✓    ✓    ✓    🏖️   🏖️   -    - │  │
│  └────────────────────────────────────────┘  │
│  Legend: ✓ Working | 🏖️ On Leave | 🤒 Sick  │
└──────────────────────────────────────────────┘
```

### 7.3 List Page - Zahtjevi (Employee)

**Layout:**
```
┌──────────────────────────────────────────────┐
│  My Requests                    [New Request]│
├──────────────────────────────────────────────┤
│  [Search] [Status ▼] [Year ▼] [Type ▼]       │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Status     Date Range    Days   Type   │  │
│  │ [APPROVED] Jan 15-19     5      GO     │  │
│  │ [PENDING]  Feb 10-14     5      GO     │  │
│  │ [DRAFT]    Mar 05-08     4      GO     │  │
│  │ [REJECTED] Apr 01-03     3      GO     │  │
│  │ [APPROVED] May 20-24     5      SD     │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Showing 1-5 of 12         [< 1 2 3 >]       │
└──────────────────────────────────────────────┘
```

**Features:**
- Quick search
- Filter po statusu (Draft, Pending, Approved, Rejected)
- Filter po godini
- Filter po tipu nedostupnosti
- Color-coded status badges
- Quick actions (View, Edit za Draft)

### 7.4 List Page - Zahtjevi (Manager)

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Team Requests                                │
├──────────────────────────────────────────────┤
│  [Search] [Status: Pending ▼] [Employee ▼]   │
├──────────────────────────────────────────────┤
│  [✓] Select All    [Bulk Approve]             │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ ☐ Employee    Date         Days Status │  │
│  │ ☐ John Doe    Jan 15-19    5    PEND. │  │
│  │              Remaining: 12/20           │  │
│  │              [Approve] [Reject]         │  │
│  │                                        │  │
│  │ ☐ Jane Smith  Feb 10-14    5    PEND. │  │
│  │              Remaining: 8/20            │  │
│  │              [Approve] [Reject]         │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Showing 1-5 of 15         [< 1 2 3 >]       │
└──────────────────────────────────────────────┘
```

**Features:**
- Vidi zahtjeve za svoj odjel
- Bulk selection i odobravanje
- Brzi uvid u preostale dane zaposlenika
- Inline approve/reject akcije

### 7.5 Detail Page - Request Detail

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Back to Requests                [Edit]    │
├──────────────────────────────────────────────┤
│  Leave Request                   [APPROVED ▼]│
│                                              │
│  Request Information                         │
│  ┌────────────────────────────────────────┐  │
│  │ Employee:      John Doe                │  │
│  │ Type:          Annual Leave (GO)       │  │
│  │ Date Range:    Jan 15 - Jan 19, 2025  │  │
│  │ Working Days:  5 days                  │  │
│  │ Note:          Family vacation         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Status Timeline                             │
│  ┌────────────────────────────────────────┐  │
│  │ ✓ Created        Jan 5, 10:30 AM       │  │
│  │   by John Doe                          │  │
│  │                                        │  │
│  │ ✓ Submitted      Jan 5, 10:32 AM       │  │
│  │   by John Doe                          │  │
│  │                                        │  │
│  │ ✓ First Approved Jan 6, 2:15 PM        │  │
│  │   by Mike Manager                      │  │
│  │                                        │  │
│  │ ✓ Approved       Jan 6, 3:45 PM        │  │
│  │   by Sara Admin                        │  │
│  │   Comment: Approved                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Calendar Preview                            │
│  ┌────────────────────────────────────────┐  │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun    │  │
│  │   13   14  [15] [16] [17]  18   19    │  │
│  │                                        │  │
│  │  [Green] = Approved leave days         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 7.6 Create/Edit Form - New Request

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Back         New Leave Request            │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Request Details                        │  │
│  │                                        │  │
│  │ Leave Type *                           │  │
│  │ [Godišnji odmor (GO)    ▼]            │  │
│  │                                        │  │
│  │ Date Range *                           │  │
│  │ Start: [📅 Select date]                │  │
│  │ End:   [📅 Select date]                │  │
│  │                                        │  │
│  │ Working Days: 5                        │  │
│  │ (Excluding weekends and holidays)      │  │
│  │                                        │  │
│  │ Your Remaining Days: 15/20             │  │
│  │ After this request: 10                 │  │
│  │                                        │  │
│  │ Note (optional)                        │  │
│  │ [                              ]       │  │
│  │ [                              ]       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Preview                                │  │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun    │  │
│  │   13   14  [15] [16] [17]  18   19    │  │
│  │                                        │  │
│  │  [Yellow] = Selected days              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│         [Save as Draft]  [Submit Request]    │
└──────────────────────────────────────────────┘
```

**Validation:**
- Real-time calculation of working days
- Check preklapanja s postojećim zahtjevima
- Check dostupnosti dana
- Real-time validation on date change
- Show warning ako nedovoljno dana
- Disable submit ako invalid

### 7.7 Admin - Employees List

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Employees                    [Add Employee] │
├──────────────────────────────────────────────┤
│  [Search] [Department ▼] [Status ▼]          │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Name        Dept      Days   Status    │  │
│  │ John Doe    IT        12/20  Active    │  │
│  │ Jane Smith  HR        8/20   Active    │  │
│  │ Mike Brown  Finance   15/22  Active    │  │
│  │ Sara White  IT        20/20  Active    │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Showing 1-20 of 85     [< 1 2 3 ... 5 >]    │
└──────────────────────────────────────────────┘
```

**Features:**
- Quick search po imenu ili emailu
- Filter po odjelu
- Filter po statusu (Active/Inactive)
- Quick view preostalih dana
- Quick actions (Edit, Deactivate, View)

### 7.8 Admin - Department Management

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Departments                 [Add Department]│
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ IT Department                          │  │
│  │ 15 employees | 2 managers              │  │
│  │                                        │  │
│  │ Managers: Mike Manager, Sara Admin     │  │
│  │                                        │  │
│  │ [View Team] [Edit] [Manage Managers]   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ HR Department                          │  │
│  │ 8 employees | 1 manager                │  │
│  │                                        │  │
│  │ Managers: Jane Lead                    │  │
│  │                                        │  │
│  │ [View Team] [Edit] [Manage Managers]   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 7.9 Admin - Holiday Calendar

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Holidays Calendar 2025         [Add Holiday]│
├──────────────────────────────────────────────┤
│  [Year: 2025 ▼]      [Import from Template] │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Date          Name           Recurring │  │
│  │ Jan 1         New Year       ✓         │  │
│  │ Jan 6         Epiphany       ✓         │  │
│  │ Apr 18        Good Friday    -         │  │
│  │ Apr 21        Easter Monday  -         │  │
│  │ May 1         Labour Day     ✓         │  │
│  │ May 30        Statehood Day  ✓         │  │
│  │ Jun 22        Anti-Fascist   ✓         │  │
│  │ Aug 5         Victory Day    ✓         │  │
│  │ Aug 15        Assumption     ✓         │  │
│  │ Oct 8         Independence   ✓         │  │
│  │ Nov 1         All Saints     ✓         │  │
│  │ Dec 25-26     Christmas      ✓         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 7.10 Manager - Team Planning (Tablični prikaz)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Team Planning                [Week][Month][Custom]  [Export]│
├──────────────────────────────────────────────────────────────┤
│  February 2025                              [◀ Prev  Next ▶] │
├──────────────────────────────────────────────────────────────┤
│  Employee      10  11  12  13  14  15  16  17  18  19  20... │
│               Mon Tue Wed Thu Fri Sat Sun Mon Tue Wed Thu    │
│  ─────────────────────────────────────────────────────────── │
│  John Doe       ✓   ✓   ✓   ✓   ✓   -   -   🏖️  🏖️  🏖️  🏖️│
│  Jane Smith     ✓   ✓   ✓   ✓   ✓   -   -   ✓   ✓   ✓   ✓ │
│  Mike Brown     🤒  🤒  ✓   ✓   ✓   -   -   ✓   ✓   ✓   ✓ │
│  Sara White     ✓   ✓   🏖️  🏖️  🏖️  -   -   ✓   ✓   ✓   ✓ │
│  Tom Green      ✓   ✓   ✓   ✓   ✓   -   -   ✓   ⏳  ⏳  ⏳ │
│  Amy Blue       ✓   ✓   ✓   ✓   ✓   -   -   ✓   ✓   ✓   ✓ │
│  ─────────────────────────────────────────────────────────── │
│  On Leave       1   1   2   2   2   -   -   1   2   2   2  │
│  Available      5   5   4   4   4   -   -   5   4   4   4  │
└──────────────────────────────────────────────────────────────┘

Legend:
✓ Working    🏖️ On Leave    🤒 Sick Leave    ⏳ Pending    - Weekend/Holiday
```

**Features:**
- Scroll horizontalno za duža razdoblja
- Color-coded cells za brzi pregled
- Bottom row pokazuje availability count
- Klik na cell pokazuje details
- Warning indicator ako previše ljudi na leave
- Export opcije (PDF, Excel)

### 7.11 Settings Page

**Layout: Tab-based**
```
┌──────────────────────────────────────────────┐
│  Settings                                    │
├──────────────────────────────────────────────┤
│  [Organisation] [Leave Types] [Notifications]│
├──────────────────────────────────────────────┤
│  Organisation Settings                       │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Company Information                    │  │
│  │                                        │  │
│  │ Organisation Name                      │  │
│  │ [                    ]                 │  │
│  │                                        │  │
│  │ Organisation Logo                      │  │
│  │ [Upload or drag & drop]               │  │
│  │                                        │  │
│  │ Timezone                               │  │
│  │ [Europe/Zagreb      ▼]                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Leave Policies                         │  │
│  │                                        │  │
│  │ Default Annual Leave Days              │  │
│  │ [20                  ]                 │  │
│  │                                        │  │
│  │ Carry Over Policy                      │  │
│  │ ☐ Allow carry over to next year       │  │
│  │ ☐ Auto-transfer unused days           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│                       [Save Changes]         │
└──────────────────────────────────────────────┘
```

## 8. Responsive Design

### 8.1 Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### 8.2 Mobile Adaptations

**Navigation:**
- Hamburger menu umjesto sidebara
- Bottom navigation za quick access (opciono)
- Swipe gestures

**Tables:**
- Transform u card layout
- Key info prikazan, rest collapsible
- Swipe actions (Edit, Delete)

**Forms:**
- Full-width inputs
- Larger touch targets (min 44x44px)
- Native mobile keyboards (email, number, tel)

**Dashboard:**
- Stack cards vertically
- Simplify charts za manji screen
- Hide less important metrics

## 9. Dark Mode

**Implementation:**
- Toggle u user menu
- Saved u user preferences
- CSS variables za colors
- Smooth transition između modes

**Color Adjustments:**
- Lower contrast ratios
- Muted colors (manje saturated)
- Darker backgrounds (#0f172a umjesto white)
- Lighter text (#e2e8f0 umjesto black)

## 10. Accessibility

### 10.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order
- Skip to content link
- Focus indicators visible
- Keyboard shortcuts (with hints)

**Screen Readers:**
- Semantic HTML (nav, main, article, aside)
- ARIA labels where needed
- Alt text za images
- Form labels properly associated
- Error announcements

**Other:**
- Text resizing do 200% bez layout breaking
- No content za pure mouse/hover (sve dostupno keyboardom)
- No flashing content (seizure risk)

### 10.2 Focus Management

**Indicators:**
- Visible focus ring (primary color, 2px outline)
- Offset 2px od elementa
- Skip links vidljivi na focus

**Modal Focus:**
- Trap focus unutar modala
- Focus na prvi input element pri otvaranju
- Return focus na trigger element pri zatvaranju

## 11. Animations & Transitions

### 11.1 Timing

```css
/* Durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Easing */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 11.2 Use Cases

**Subtle Transitions:**
- Button hover (150ms)
- Color changes (150ms)
- Opacity changes (150ms)

**Medium Transitions:**
- Dropdown menus (300ms)
- Accordion expand (300ms)
- Tab switching (300ms)

**Intentional Animations:**
- Page transitions (500ms)
- Modal enter/exit (300ms)
- Drawer slide (300ms)

**Principle:**
- Animations should feel snappy, not sluggish
- Prefer transforms over position changes (better performance)
- Use GPU-accelerated properties (transform, opacity)
- Reducirana animacija ako user preferira (prefers-reduced-motion)

## 12. Error States

### 12.1 Types

**1. Form Errors**
- Inline below field
- Red color + icon
- Clear message

**2. Page Errors**
- 404 Not Found
- 403 Forbidden
- 500 Server Error
- Network Error

**3. API Errors**
- Toast notification
- Retry button ako applicable

### 12.2 Error Page Design

```
┌────────────────────────┐
│                        │
│    [Error Icon]        │
│                        │
│    Oops! Page not      │
│    found               │
│                        │
│    The page you're     │
│    looking for doesn't │
│    exist or has been   │
│    moved.              │
│                        │
│    [Go to Dashboard]   │
│    [Go Back]           │
│                        │
└────────────────────────┘
```

## 13. Success States

**Subtle confirmations:**
- Toast notifications
- Inline success messages (green)
- Checkmark animations
- Success badges/icons

**Examples:**
- "Request submitted successfully"
- "Request approved"
- "Request rejected"
- "Employee added successfully"
- "Department created"
- "Holiday added to calendar"
- "Settings saved"
- "Allocation updated"

## 14. Onboarding & First-Run Experience

### 14.1 Initial Setup Wizard (Admin)

**Steps:**
1. Welcome screen
2. Organisation information (name, logo, timezone)
3. Add departments
4. Add first employees
5. Configure leave types
6. Add holidays for current year
7. Success screen

**Design:**
- Progress indicator (steps)
- Clear next/back buttons
- Skip option (za kasnije)
- Helpful tips/hints per step

### 14.2 First Login - Employee

**When to show:**
- First login nakon što je admin kreirao račun
- Brief introduction to key features

**Flow:**
1. Welcome message
2. Quick tour of dashboard
3. How to create a leave request
4. How to check remaining days
5. Done

**Implementation:**
- Spotlight on feature
- Brief explanation
- Next/Skip buttons
- Dot indicator (step 1 of 5)

### 14.3 First Login - Manager

**Additional steps za managere:**
1. Welcome + role explanation
2. Pending approvals location
3. Team planning view
4. How to approve/reject requests
5. Done

### 14.4 Empty States

**Zaposlenici - No requests yet:**
- Illustration: Calendar with checkmark
- Heading: "No leave requests yet"
- Description: "Create your first leave request to get started"
- CTA: "Create Request" button
- Link: "Learn more about leave policies"

**Manager - No pending approvals:**
- Illustration: Checkmark with celebration
- Heading: "All caught up!"
- Description: "No pending approvals at the moment"
- Alternative: "View all requests" link

**Admin - No employees:**
- Illustration: Team/people icon
- Heading: "No employees yet"
- Description: "Add your first employee to get started"
- CTA: "Add Employee" button
- Link: "Import from CSV"

## 15. Wireframes (Text-based)

### Employee Dashboard - Desktop
```
+----------------------------------------------------------+
| 🏠 Dashboard    🔍 Search    🔔 2    👤 John Doe ▼       |
+--------+-------------------------------------------------+
| 📝 New |  My Dashboard                    2025          |
| 📋 Requ+------------------+-----------------------------+
| 📅 Cal | 📊 Total: 20     | 📉 Used: 8   | ⏳ Pend: 3 |
| ─────  |                  |              | ✅ Rem: 9  |
| 👥 Team+------------------+--------------+--------------+
| ✓ Pend | My Requests                      [New Request]|
| 📊 Plan+--------------------------------------------------+
| 📈 Rep | Status     Date Range     Days    Actions      |
|        | [APPROVED] Jan 15-19      5       [View]       |
|        | [PENDING]  Feb 10-14      5       [View]       |
|        | [DRAFT]    Mar 05-08      4       [Edit]       |
+--------+--------------------------------------------------+
         | Calendar - My Leave             [Month View ▼] |
         |  S  M  T  W  T  F  S                           |
         |        1  2  3  4  5   Jan 2025                |
         |  6  7  8  9 10 11 12                           |
         | 13 14 [15][16][17]18 19  [15-17] = Approved   |
         | 20 21 22 23 24 25 26                           |
         +------------------------------------------------+
```

### Manager Dashboard - Desktop
```
+----------------------------------------------------------+
| 🏠 Team Dashboard    🔍        🔔 5    👤 Manager ▼       |
+--------+-------------------------------------------------+
| 📝 New |  Team Dashboard        [Department: IT ▼]      |
| 📋 Requ+------------------+-----------------------------+
| 📅 Cal | 📊 Pending: 5    | 👥 On Leave: 3 | Total: 15|
| ─────  +------------------+-----------------------------+
| 👥 Team| Pending Approvals              [Approve All ▼] |
| ✓ Pend +--------------------------------------------------+
| 📊 Plan| Employee      Date Range    Days   Actions      |
| 📈 Rep | John Doe      Jan 15-19     5      [✓][✗]      |
|        | Remaining: 12/20                               |
|        | Jane Smith    Feb 10-14     5      [✓][✗]      |
+--------| Remaining: 8/20         +----------------------+
         |                                                |
         | Team Planning                   [Week][Month] |
         | Employee   Mon Tue Wed Thu Fri Sat Sun        |
         | John       ✓   ✓   🏖️  🏖️  🏖️  -   -         |
         | Jane       ✓   ✓   ✓   ✓   ✓   -   -         |
         | Mike       🤒  🤒  ✓   ✓   ✓   -   -         |
         | Sara       ✓   ✓   ✓   ✓   ✓   -   -         |
         +------------------------------------------------+
```

### Mobile View - Employee
```
+------------------------+
| ☰  Dashboard    🔔 👤  |
+------------------------+
|                        |
| 📊 Total Days          |
| 20 days                |
+------------------------+
| 📉 Used Days           |
| 8 days                 |
+------------------------+
| ⏳ Pending             |
| 3 days                 |
+------------------------+
| ✅ Remaining           |
| 9 days                 |
+------------------------+
|                        |
| [➕ New Request]       |
|                        |
+------------------------+
| My Requests            |
|                        |
| ┌────────────────────┐ |
| │ APPROVED           │ |
| │ Jan 15-19, 2025    │ |
| │ 5 days             │ |
| │ [View Details]     │ |
| └────────────────────┘ |
|                        |
| ┌────────────────────┐ |
| │ PENDING            │ |
| │ Feb 10-14, 2025    │ |
| │ 5 days             │ |
| │ [View Details]     │ |
| └────────────────────┘ |
+------------------------+
```

### Mobile View - Manager
```
+------------------------+
| ☰  Team Dashboard 🔔 👤|
+------------------------+
|                        |
| 📊 Pending Approvals   |
| 5 requests             |
+------------------------+
| 👥 Team On Leave       |
| 3 employees            |
+------------------------+
|                        |
| Pending Approvals      |
|                        |
| ┌────────────────────┐ |
| │ John Doe           │ |
| │ Jan 15-19 (5 days) │ |
| │ Remaining: 12/20   │ |
| │                    │ |
| │ [Approve] [Reject] │ |
| └────────────────────┘ |
|                        |
| ┌────────────────────┐ |
| │ Jane Smith         │ |
| │ Feb 10-14 (5 days) │ |
| │ Remaining: 8/20    │ |
| │                    │ |
| │ [Approve] [Reject] │ |
| └────────────────────┘ |
+------------------------+
| [View All Requests]    |
+------------------------+
```

### New Request Form - Mobile
```
+------------------------+
| ← Back  New Request    |
+------------------------+
|                        |
| Leave Type *           |
| [Godišnji odmor ▼]    |
|                        |
| Start Date *           |
| [📅 Jan 15, 2025]      |
|                        |
| End Date *             |
| [📅 Jan 19, 2025]      |
|                        |
| ┌────────────────────┐ |
| │ Working Days: 5    │ |
| │ Remaining: 15/20   │ |
| │ After: 10 days     │ |
| └────────────────────┘ |
|                        |
| Note (optional)        |
| [                   ]  |
| [                   ]  |
|                        |
| Preview                |
| Mon Tue Wed Thu Fri    |
| [15][16][17][18][19]   |
|                        |
+------------------------+
| [Save Draft]           |
| [Submit Request]       |
+------------------------+
```

## 16. UI Component Library Recommendation

**Option A: shadcn/ui + Tailwind** ⭐ PREPORUČENO
- Pros: Highly customizable, modern, copy-paste components
- Best for: Custom designs, full control
- Luna specifics: Odlično za custom calendar komponente i complex forms

**Option B: Material-UI (MUI)**
- Pros: Comprehensive, battle-tested, great documentation
- Best for: Faster development, enterprise feel
- Luna specifics: Dobar built-in date picker, ali manje fleksibilan za custom calendar view

**Option C: Ant Design**
- Pros: Rich component set, good for admin panels, excellent table components
- Best for: Data-heavy applications
- Luna specifics: Odličan za tablične preglede (Team Planning), ali veći bundle size

**Preporuka za Luna projekt: shadcn/ui + Tailwind**

**Razlozi:**
- Maximum flexibility za custom calendar komponente
- Modern aesthetics koji odgovara modernoj admin aplikaciji
- Great developer experience
- Easy customization za team planning view
- Lightweight - brzi load timovi
- Excellent TypeScript support

**Dodatne biblioteke za razmotriti:**
- **Date/Calendar:** `react-day-picker` ili `date-fns` za date manipulaciju
- **Tables:** `@tanstack/react-table` za napredne table features (sorting, filtering)
- **Forms:** `react-hook-form` + `zod` za validation
- **Charts** (ako potrebno): `recharts` ili `chart.js`
- **Export:** `xlsx` za Excel export, `jspdf` za PDF

## 17. Luna-Specific UX Considerations

### 17.1 Leave Request Validation

**Real-time feedback:**
- Dok korisnik odabire datume, odmah show:
  - Broj radnih dana
  - Preostali dani nakon ovog zahtjeva
  - Upozorenja ako ima preklapanja
  - Warning ako nedovoljno dana

**Visual indicators:**
- ✓ Zeleno: Sve OK, može submitati
- ⚠️ Žuto: Upozorenje (npr. overlap warning)
- ✗ Crveno: Error, ne može submitati

### 17.2 Approval Workflow UX

**Efficient approvals:**
- Bulk approve opcija
- Quick approve s jednim klikom
- Inline reject s required reason
- Keyboard shortcuts (A = approve, R = reject)

**Context pri odobrenju:**
- Vidi preostale dane zaposlenika
- Vidi team calendar (koliko ljudi je već na odmoru)
- Vidi history (da li zaposlenik često traži last-minute)

### 17.3 Calendar Interactions

**Navigation:**
- Smooth transitions između mjeseci
- Quick jump to today
- Jump to specific date
- Week numbers opciono

**Mobile considerations:**
- Swipe between months
- Tap to select dates
- Long press for details
- Bottom sheet za details umjesto modala

### 17.4 Notifications Strategy

**Priority levels:**
- 🔴 High: Zahtjev odbijen, Important system message
- 🟡 Medium: Zahtjev odobren, Pending approval reminder
- 🟢 Low: Draft saved, General updates

**Channels:**
- In-app notifications (real-time)
- Email (digest ili immediate, user preference)
- Optional: Push notifications za mobile

### 17.5 Performance Considerations

**Critical paths:**
- Dashboard load < 1s
- Calendar render < 500ms
- Form interactions < 100ms latency

**Optimization strategies:**
- Lazy load team planning za velike timove
- Virtual scrolling za long employee lists
- Infinite scroll za request history
- Cache frequently accessed data (holidays, employee list)

### 17.6 Accessibility for Luna

**Specific considerations:**
- Calendar navigation mora biti fully keyboard accessible
- Screen reader announcements za status changes
- Color blindness: Ne samo color coding, use icons/patterns
- High contrast mode support
- Text alternatives za sve status indicators

**ARIA labels primjeri:**
```tsx
<button aria-label="Approve leave request for John Doe, 5 days">
  Approve
</button>

<div role="status" aria-live="polite">
  Request approved successfully
</div>
```

---

**Dokument pripremljen za:** Luna - Sustav za godišnji odmor  
**Verzija:** 1.0  
**Datum:** 2024  
**Status:** Za development reference