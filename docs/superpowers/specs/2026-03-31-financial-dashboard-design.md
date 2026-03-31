# Financial Dashboard & Modern UI — Design Spec

## Overview

Build a personal financial dashboard for Indian users with a modern sidebar-based UI. Phase 1 covers Bank Accounts, Credit Cards, Loans, Family Members, and Reminders. All data is manual entry with staleness nudges, designed for future auto-sync via India's Account Aggregator APIs.

## Product Scope

### Phase 1 (This Build)
- Sidebar app shell with Deep Ocean color palette
- Overview dashboard with net worth, quick stats, upcoming dues, needs attention
- Bank Accounts (savings/current, multiple, family-linked)
- Credit Cards (with due dates, utilization tracking)
- Loans (home/car/personal/education/gold, EMI tracking)
- Family Members (profiles with relationship, linked accounts)
- Reminders (auto-generated dues + staleness nudges + custom)

### Phase 2 (Future)
- FD, RD, PF, PPF, Credits Given (money lent out)

### Phase 3 (Future)
- Sharing with CA, friends, family (selective data sharing)
- Indian tax saving suggestions (rule-based, Section 80C/80D/etc.)

### Phase 4 (Future)
- AI Financial Advisor ("Smart CA") powered by Claude API

---

## Data Models

All monetary amounts stored as **integers in paise** (₹1,25,000 = 12500000 paise). Prevents floating point errors. Converted to rupees with Indian formatting on display.

### FamilyMember

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Owner (logged-in user) |
| name | String | Member name |
| relationship | Enum | self, spouse, parent, child, sibling, other |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Relations: `user User`, `bankAccounts BankAccount[]`, `creditCards CreditCard[]`, `loans Loan[]`

A "Self" FamilyMember is auto-created when the user first accesses the financial dashboard.

### BankAccount

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Owner |
| familyMemberId | String | Whose account |
| bankName | String | Bank name (from predefined Indian banks list) |
| accountType | Enum | savings, current |
| accountNumberLast4 | String | Last 4 digits |
| ifscCode | String? | Optional IFSC |
| balance | BigInt | Balance in paise |
| balanceUpdatedAt | DateTime | When balance was last updated |
| isActive | Boolean | Default true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Relations: `user User`, `familyMember FamilyMember`

### CreditCard

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Owner |
| familyMemberId | String | Whose card |
| bankName | String | Issuing bank |
| cardName | String | Card product name (e.g., "Regalia", "Simply Save") |
| cardNumberLast4 | String | Last 4 digits |
| creditLimit | BigInt | Credit limit in paise |
| currentDue | BigInt | Current outstanding due in paise |
| minimumDue | BigInt | Minimum due in paise |
| dueDate | Int | Day of month (1-31) |
| billingCycleDate | Int | Billing cycle start day (1-31) |
| isActive | Boolean | Default true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Relations: `user User`, `familyMember FamilyMember`

### Loan

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Owner |
| familyMemberId | String | Whose loan |
| lenderName | String | Bank/NBFC name |
| loanType | Enum | home, car, personal, education, gold, other |
| principalAmount | BigInt | Original principal in paise |
| outstandingAmount | BigInt | Current outstanding in paise |
| emiAmount | BigInt | Monthly EMI in paise |
| interestRate | Float | Annual interest rate (e.g., 8.5) |
| tenureMonths | Int | Total tenure in months |
| startDate | DateTime | Loan start date |
| endDate | DateTime? | Expected end date |
| emiDueDate | Int | EMI due day of month (1-31) |
| isActive | Boolean | Default true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Relations: `user User`, `familyMember FamilyMember`

### Reminder

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Owner |
| type | Enum | credit_card_due, loan_emi, balance_update, custom |
| title | String | Display title |
| description | String? | Optional details |
| linkedEntityId | String? | ID of linked account/card/loan |
| linkedEntityType | Enum? | bank_account, credit_card, loan |
| dueDate | DateTime? | One-time reminder date |
| recurringDay | Int? | Day of month for recurring |
| frequency | Enum | once, monthly, quarterly, yearly |
| isActive | Boolean | Default true |
| lastNotifiedAt | DateTime? | For staleness tracking |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Relations: `user User`

### Enum Definitions

```
enum Relationship { self, spouse, parent, child, sibling, other }
enum AccountType { savings, current }
enum LoanType { home, car, personal, education, gold, other }
enum ReminderType { credit_card_due, loan_emi, balance_update, custom }
enum LinkedEntityType { bank_account, credit_card, loan }
enum ReminderFrequency { once, monthly, quarterly, yearly }
```

---

## API Endpoints

All endpoints require authentication. All follow asyncHandler + AppError pattern.

### Family Members — `/api/family-members/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all family members for current user |
| POST | `/` | Create family member |
| PUT | `/:id` | Update family member |
| DELETE | `/:id` | Delete (blocked if has linked accounts) |

### Bank Accounts — `/api/bank-accounts/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all accounts (filterable by familyMemberId) |
| POST | `/` | Create bank account |
| GET | `/:id` | Get account detail |
| PUT | `/:id` | Update account (including balance update) |
| DELETE | `/:id` | Soft-delete (set isActive = false) |
| PUT | `/:id/balance` | Quick balance update (just amount + timestamp) |

### Credit Cards — `/api/credit-cards/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all cards (filterable by familyMemberId) |
| POST | `/` | Create credit card |
| GET | `/:id` | Get card detail |
| PUT | `/:id` | Update card |
| DELETE | `/:id` | Soft-delete |

### Loans — `/api/loans/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all loans (filterable by familyMemberId) |
| POST | `/` | Create loan |
| GET | `/:id` | Get loan detail |
| PUT | `/:id` | Update loan |
| DELETE | `/:id` | Soft-delete |

### Reminders — `/api/reminders/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List reminders (filterable by type, upcoming) |
| POST | `/` | Create custom reminder |
| PUT | `/:id` | Update reminder |
| DELETE | `/:id` | Delete reminder |
| POST | `/generate` | Auto-generate reminders from cards/loans dues |

### Dashboard — `/api/dashboard/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/overview` | Net worth, quick stats, upcoming dues, needs attention (aggregated) |

The overview endpoint returns a pre-computed summary to avoid multiple client calls:

```typescript
{
  netWorth: { total, assets, liabilities },
  quickStats: { bankBalance, cardDues, nextDueDate, loanEmiTotal, familyMemberCount },
  upcomingDues: [{ type, name, amount, dueDate, daysLeft }],
  needsAttention: [{ type, title, description, entityId?, entityType? }]
}
```

---

## UI Design

### Color Palette — Deep Ocean

**Sidebar:**
- Background: linear-gradient(180deg, #0f172a, #1e3a5f)
- Active item: rgba(56, 189, 248, 0.15) with #38bdf8 text
- Inactive: white text at 60% opacity
- Logo: gradient text #38bdf8 → #818cf8

**Content area:**
- Page background: #f8fafc
- Cards: white with subtle border (#e2e8f0)
- Stat cards: white with colored left border strip

**Semantic colors:**
- Primary/Action: #2563eb (blue-600)
- Accent: #38bdf8 (sky-400)
- Secondary accent: #818cf8 (violet-400)
- Positive/Assets: #34d399 (emerald-400) / #059669 (emerald-600)
- Negative/Liabilities: #f43f5e (rose-500) / #dc2626 (red-600)
- Warning: #fbbf24 (amber-400) / #f59e0b (amber-500)
- Net worth hero: linear-gradient(135deg, #0f172a, #1e3a5f)

**Tailwind config tokens:**
```
ocean-900: #0f172a (sidebar dark)
ocean-800: #1e3a5f (sidebar light)
ocean-accent: #38bdf8 (sky blue)
ocean-violet: #818cf8 (secondary)
```

### Layout Structure

**Authenticated users:** SidebarLayout
```
┌─────────────────────────────────────────────┐
│  Top Bar: Logo | Search (future) | User     │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Content (routes render here)    │
│ 240px    │  max-width: 1200px, centered     │
│ fixed    │  padding: 24px                   │
└──────────┴──────────────────────────────────┘
```

**Public users:** Current Layout (unchanged)

**Sidebar sections:**
1. Overview (default landing)
2. Bank Accounts
3. Credit Cards
4. Loans
5. Family
6. Reminders
7. --- divider ---
8. Invites
9. Admin (collapsible, permission-gated): Users, Roles, Permissions, Settings

**Responsive breakpoints:**
- Desktop (>1024px): Full sidebar (240px) + content
- Tablet (768-1024px): Collapsed sidebar (64px, icons only) + content
- Mobile (<768px): Hidden sidebar, hamburger menu overlay, content full-width

### Page Designs

**Overview Dashboard:**
- Net worth hero card (dark gradient, filterable by family member dropdown)
- 4 quick stat cards in a row (bank balance, card dues, loan EMIs, family count)
- 2-column below: Upcoming Dues (sorted by date, color-coded urgency) + Needs Attention (stale balances + custom reminders)

**Bank Accounts / Credit Cards / Loans pages:**
- Header: page title + "Add" button (top right)
- Group by family member (collapsible sections: "Self", "Wife", etc.)
- Each item is a card/row with key info
- Click → opens detail modal (edit/delete)
- Quick balance update button on bank accounts (inline)

**Family page:**
- Grid of family member cards (name, relationship badge, linked counts)
- "Add Member" button
- Click member → filtered view of all their accounts/cards/loans

**Reminders page:**
- Two tabs: "Upcoming" (sorted by date) and "All"
- Auto-generated reminders are non-deletable (tied to cards/loans)
- Custom reminders have edit/delete
- "Add Reminder" button for custom ones

### Indian-Specific Formatting

**Currency:**
- `formatINR(paise: number): string` → "₹1,25,000"
- Uses Indian grouping: last 3 digits, then groups of 2 (₹1,00,00,000 for 1 crore)
- Always ₹ prefix, no decimals for display (paise stored but not shown in UI)

**Dates:**
- Format: DD MMM YYYY (02 Apr 2026)
- Due dates shown as countdown: "3 days left", "Due tomorrow", "Overdue by 2 days"

**Bank names:** Predefined list of major Indian banks:
SBI, HDFC, ICICI, Axis, Kotak Mahindra, PNB, Bank of Baroda, Union Bank, Canara Bank, IndusInd, Yes Bank, IDBI, Bank of India, Federal Bank, RBL, South Indian Bank, Karur Vysya, AU Small Finance, Bandhan Bank, IDFC First

---

## Components

### Shared Components (new)

| Component | Purpose |
|-----------|---------|
| `SidebarLayout` | App shell with sidebar + content area |
| `Sidebar` | Navigation sidebar with collapsible sections |
| `StatCard` | Quick stat with label, value, accent color, subtext |
| `AmountDisplay` | Renders paise as formatted INR |
| `DueDateBadge` | Color-coded due date countdown |
| `EntityCard` | Reusable card for account/card/loan list items |
| `AddEditModal` | Modal wrapper for add/edit forms |
| `FamilyMemberSelect` | Dropdown of family members for forms |
| `BankNameSelect` | Dropdown of Indian bank names |
| `EmptyState` | Empty state with message and CTA |
| `GroupByMember` | Groups a list of entities by family member |

### Utility Functions (new)

| Function | Location | Purpose |
|----------|----------|---------|
| `formatINR(paise)` | `client/src/utils/format.ts` | Paise → "₹1,25,000" |
| `formatDate(date)` | `client/src/utils/format.ts` | ISO → "02 Apr 2026" |
| `daysUntil(date)` | `client/src/utils/format.ts` | Date → "3 days left" / "Overdue" |
| `paiseTo Rupees(paise)` | `shared/src/utils/currency.ts` | Paise → rupees number |
| `rupeesToPaise(rupees)` | `shared/src/utils/currency.ts` | Rupees → paise number |

---

## Auto-Generated Reminders

When a credit card or loan is created/updated, the system automatically generates reminders:

- **Credit card due:** Monthly reminder, `recurringDay = card.dueDate`, title = "{bankName} {cardName} payment due"
- **Loan EMI:** Monthly reminder, `recurringDay = loan.emiDueDate`, title = "{lenderName} {loanType} EMI due"
- **Balance staleness:** If `bankAccount.balanceUpdatedAt` is older than 30 days, show in "Needs Attention" on dashboard

Auto-generated reminders are re-created when the source entity changes (e.g., card due date updated → reminder date updated). They are deleted when the source entity is deleted/deactivated.

---

## Error Handling

Uses existing AppError classes:
- `NotFoundError` for missing entities
- `ValidationError` for invalid inputs (Zod)
- `ForbiddenError` if user tries to access another user's data
- `ConflictError` if deleting a family member with linked accounts

All controllers use `asyncHandler`. All endpoints validate `userId` ownership — users can only see/edit their own data.

---

## Testing Strategy

### Server Tests
- CRUD operations for each model (create, read, update, delete)
- Ownership enforcement (user A cannot access user B's data)
- Family member deletion blocked when linked accounts exist
- Dashboard overview aggregation correctness
- INR formatting utility tests
- Reminder auto-generation on card/loan creation

### Client Tests
- `formatINR` utility tests (edge cases: 0, large numbers, negative)
- `SidebarLayout` renders sidebar and content
- Overview page renders stats and lists
- Add/edit modals open and submit correctly
- Empty states shown when no data

---

## Implementation Decomposition

This is a large build. Split into 3 implementation plans:

**Plan 1: Data Foundation + Sidebar Shell**
- Prisma models (all 5) + migrations
- Family member CRUD API
- Bank account CRUD API
- Shared utility functions (formatINR, currency conversion)
- SidebarLayout component + routing restructure
- Family page (UI)

**Plan 2: Financial Instruments + Dashboard**
- Credit card CRUD API
- Loan CRUD API
- Dashboard overview API (aggregation endpoint)
- Bank Accounts page (UI)
- Credit Cards page (UI)
- Loans page (UI)
- Overview dashboard page (UI)

**Plan 3: Reminders + Polish**
- Reminder CRUD API
- Auto-generated reminders logic
- Reminders page (UI)
- "Needs Attention" widget on dashboard
- Responsive sidebar (mobile hamburger, tablet collapsed)
- Empty states for all pages
- Documentation updates
