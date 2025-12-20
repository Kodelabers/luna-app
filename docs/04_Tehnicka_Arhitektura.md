# UI/UX Dizajn

## Pregled

Ovaj dokument opisuje dizajn principe, UI komponente i korisničko iskustvo za multi-tenant admin aplikaciju.

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

/* Success */
--success-500: #10b981;
--success-600: #059669;

/* Warning */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error/Danger */
--error-500: #ef4444;
--error-600: #dc2626;

/* Info */
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
┌─────────────────┐
│ Tenant Selector │  (ako Super Admin)
├─────────────────┤
│ 📊 Dashboard    │
│ 👥 Users        │
│ 👔 Teams        │
│ 🔐 Roles        │
│ 📄 Billing      │
│ 📊 Analytics    │
│ 📢 Notifications│
│ 🔧 Settings     │
├─────────────────┤
│ 📚 Help Center  │
│ 💬 Support      │
└─────────────────┘
```

**Features:**
- Collapsible (Desktop: icon + text, Collapsed: samo icon)
- Mobile: Hamburger menu
- Active state highlighting
- Badge counts (npr. notification count)
- Grouped items s collapsible sections

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
  Save Changes
</Button>

// With icon
<Button variant="primary" icon={<PlusIcon />}>
  Create User
</Button>

// Loading state
<Button variant="primary" loading>
  Saving...
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
- Title: "No users yet"
- Description: "Get started by creating your first user"
- Action button: "Create User"

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
  title="Delete User"
  message="Are you sure you want to delete John Doe? This action cannot be undone."
  confirmText="Delete"
  confirmVariant="danger"
  onConfirm={handleDelete}
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
toast.success("User created successfully")
toast.error("Failed to delete user")
toast.warning("Your trial ends in 3 days")
toast.info("New features available")
```

### 6.7 Badges & Status Indicators

**Use Cases:**
- User status (Active, Inactive, Suspended)
- Subscription status (Trial, Active, Cancelled)
- Notification counts
- Feature tags

**Variants:**
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Suspended</Badge>
<Badge variant="warning">Trial</Badge>
<Badge variant="info">New</Badge>
<Badge variant="neutral">Draft</Badge>
```

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
│   No users yet         │
│   Get started by       │
│   adding your first    │
│   team member          │
│                        │
│   [Create User Btn]    │
│                        │
└────────────────────────┘
```

## 7. Page Designs

### 7.1 Dashboard

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Dashboard                           [Filter]│
├──────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │ Total  │ │ Active │ │ New    │ │ Revenue││
│  │ Users  │ │ Users  │ │ Today  │ │        ││
│  │ 1,234  │ │ 1,089  │ │   15   │ │ $5,234 ││
│  └────────┘ └────────┘ └────────┘ └────────┘│
├──────────────────────────────────────────────┤
│  ┌────────────────────┐ ┌──────────────────┐ │
│  │ User Growth Chart  │ │ Recent Activity  │ │
│  │                    │ │                  │ │
│  │     [Line Chart]   │ │  - User joined   │ │
│  │                    │ │  - Invoice paid  │ │
│  └────────────────────┘ └──────────────────┘ │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Recent Users Table                     │  │
│  │  Name      Email         Status        │  │
│  │  ...       ...           ...           │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 7.2 List Page (npr. Users)

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Users                          [Create User]│
├──────────────────────────────────────────────┤
│  [Search] [Filter: Status ▼] [Filter: Role ▼]│
├──────────────────────────────────────────────┤
│  [✓] Select All    [Bulk Actions ▼]          │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ ☐ Name          Email        Status    │  │
│  │ ☐ John Doe     john@...      Active    │  │
│  │ ☐ Jane Smith   jane@...      Active    │  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Showing 1-20 of 150    [< 1 2 3 ... 8 >]    │
└──────────────────────────────────────────────┘
```

**Features:**
- Quick search (searches na frontendu dok ne klikne search)
- Advanced filters (sidebar ili dropdown)
- Column sorting
- Bulk selection + actions
- Quick actions (Edit, Delete) per row
- Pagination

### 7.3 Detail/View Page (npr. User Detail)

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Back to Users                    [Edit]   │
├──────────────────────────────────────────────┤
│  ┌────┐ John Doe                   [Active ▼]│
│  │ JD │ john@example.com                     │
│  └────┘ Member since Jan 15, 2024            │
├──────────────────────────────────────────────┤
│  [Profile] [Activity] [Permissions] [Teams]  │
├──────────────────────────────────────────────┤
│  Personal Information                        │
│  ┌────────────────────────────────────────┐  │
│  │ Name:     John Doe                     │  │
│  │ Email:    john@example.com             │  │
│  │ Phone:    +1 234 567 8900              │  │
│  │ Role:     Admin                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Recent Activity                             │
│  ┌────────────────────────────────────────┐  │
│  │ - Logged in from Chrome                │  │
│  │ - Updated profile                      │  │
│  │ - Created new team                     │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 7.4 Create/Edit Form Page

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Back         Create User                  │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ Personal Information                   │  │
│  │                                        │  │
│  │ First Name *                           │  │
│  │ [                    ]                 │  │
│  │                                        │  │
│  │ Last Name *                            │  │
│  │ [                    ]                 │  │
│  │                                        │  │
│  │ Email Address *                        │  │
│  │ [                    ]                 │  │
│  │                                        │  │
│  │ Phone                                  │  │
│  │ [                    ]                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Account Settings                       │  │
│  │                                        │  │
│  │ Role *                                 │  │
│  │ [Select Role      ▼]                   │  │
│  │                                        │  │
│  │ Teams                                  │  │
│  │ [Select Teams     ▼]                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│              [Cancel]  [Create User]         │
└──────────────────────────────────────────────┘
```

**Validation:**
- Real-time validation on blur
- Inline error messages
- Disable submit dok nema validan form
- Show loading state na button pri submitu

### 7.5 Settings Page

**Layout: Tab-based**
```
┌──────────────────────────────────────────────┐
│  Settings                                    │
├──────────────────────────────────────────────┤
│  [General] [Security] [Billing] [Team]       │
├──────────────────────────────────────────────┤
│  General Settings                            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Company Information                    │  │
│  │                                        │  │
│  │ Company Name                           │  │
│  │ [                    ]                 │  │
│  │                                        │  │
│  │ Company Logo                           │  │
│  │ [Upload or drag & drop]               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Preferences                            │  │
│  │                                        │  │
│  │ Timezone                               │  │
│  │ [Europe/Zagreb      ▼]                 │  │
│  │                                        │  │
│  │ Language                               │  │
│  │ [English            ▼]                 │  │
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
- "User created successfully"
- "Settings saved"
- "Password changed"
- "Email sent"

## 14. Onboarding & First-Run Experience

### 14.1 Initial Setup Wizard

**Steps:**
1. Welcome screen
2. Company information
3. Invite team members
4. Choose subscription plan
5. Success screen

**Design:**
- Progress indicator (steps)
- Clear next/back buttons
- Skip option (za kasnije)
- Helpful tips/hints

### 14.2 Product Tours

**When to show:**
- First login
- New feature releases
- On-demand (Help menu)

**Implementation:**
- Spotlight on feature
- Brief explanation
- Next/Skip buttons
- Dot indicator (step 1 of 5)

### 14.3 Empty States

**First-time states:**
- Friendly illustration
- Encouraging message
- Clear call-to-action
- Link do documentation

## 15. Wireframes (Text-based)

### Dashboard - Desktop
```
+----------------------------------------------------------+
| 🏠 Dashboard    🔍 Search    🔔 3    👤 Admin ▼          |
+--------+------------------------------------------------+
| 📊 Dash|  Dashboard                        📅 Filter  |
| 👥 User+------------------------------------------------+
| 👔 Team|  📊 1,234      👥 1,089    🆕 15    💰 $5.2K |
| 🔐 Role|   Total        Active    New Today  Revenue   |
| 📄 Bill+-------------------+---------------------------+
| 📊 Anal|  📈 User Growth  |  📋 Recent Activity      |
| 📢 Noti|                  |  • User X joined         |
| 🔧 Sett|  [Line Chart]    |  • Invoice paid          |
|        |                  |  • User Y updated        |
+--------+------------------+--------------+-------------+
         |  Recent Users                   |             |
         |  Name      Email      Status    | Actions     |
         |  John      j@ex.com   Active    | ⋮          |
         |  Jane      jane@...   Active    | ⋮          |
         +----------------------------------+-------------+
```

### Mobile View
```
+------------------------+
| ☰  Dashboard    🔔 👤  |
+------------------------+
|                        |
| 📊 Total Users         |
| 1,234                  |
| +12% from last month   |
+------------------------+
|                        |
| 👥 Active Users        |
| 1,089                  |
| +5% from last month    |
+------------------------+
| ... more cards ...     |
+------------------------+
| Recent Users           |
|                        |
| [Card View]            |
| John Doe               |
| john@example.com       |
| Status: Active         |
| [View]                 |
+------------------------+
```

## 16. UI Component Library Recommendation

**Option A: shadcn/ui + Tailwind**
- Pros: Highly customizable, modern, copy-paste components
- Best for: Custom designs, full control

**Option B: Material-UI (MUI)**
- Pros: Comprehensive, battle-tested, great documentation
- Best for: Faster development, enterprise feel

**Option C: Ant Design**
- Pros: Rich component set, good for admin panels
- Best for: Data-heavy applications

**Preporuka za ovaj projekt: shadcn/ui + Tailwind**
- Maximum flexibility
- Modern aesthetics
- Great developer experience
- Easy customization

