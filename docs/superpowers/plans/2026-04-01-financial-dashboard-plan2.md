# Financial Dashboard Plan 2: Credit Cards, Loans & Overview Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CreditCard and Loan Prisma models, CRUD APIs for both, a dashboard overview aggregation endpoint, and the corresponding UI pages including the full Overview dashboard.

**Architecture:** Follows Plan 1 patterns — Prisma models with BigInt paise, asyncHandler + AppError, Deep Ocean themed UI. Dashboard overview endpoint returns pre-computed aggregations to minimize client API calls.

**Tech Stack:** Prisma, Express, React, Tailwind CSS, TypeScript, Zod

---

## Tasks Summary

1. Shared types for CreditCard + Loan + Dashboard
2. Prisma models — CreditCard + Loan
3. CreditCard CRUD API
4. Loan CRUD API
5. Dashboard Overview API
6. Credit Cards page UI
7. Loans page UI
8. Overview Dashboard page UI
9. Update App.tsx routes
10. Documentation + Final verification

---

### Task 1: Shared Finance Types — CreditCard + Loan + Dashboard

**Files:**
- Modify: `shared/src/types/finance.ts`

Add these interfaces after `BankAccountResponse`:

```typescript
export interface CreditCardResponse {
  id: string;
  familyMemberId: string;
  familyMember?: { name: string; relationship: Relationship };
  bankName: string;
  cardName: string;
  cardNumberLast4: string;
  creditLimit: string;
  currentDue: string;
  minimumDue: string;
  dueDate: number;
  billingCycleDate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoanResponse {
  id: string;
  familyMemberId: string;
  familyMember?: { name: string; relationship: Relationship };
  lenderName: string;
  loanType: LoanType;
  principalAmount: string;
  outstandingAmount: string;
  emiAmount: string;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  endDate: string | null;
  emiDueDate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOverview {
  netWorth: { total: number; assets: number; liabilities: number };
  quickStats: {
    bankBalance: number;
    cardDues: number;
    nextDueDate: string | null;
    nextDueDays: number | null;
    loanEmiTotal: number;
    familyMemberCount: number;
  };
  upcomingDues: Array<{
    type: "credit_card" | "loan";
    name: string;
    amount: number;
    dueDate: number;
    daysLeft: number;
  }>;
  needsAttention: Array<{
    type: "stale_balance" | "overdue";
    title: string;
    description: string;
    entityId?: string;
    entityType?: string;
  }>;
}
```

Build shared after: `pnpm --filter @diary/shared run build`

Commit: `git commit -m "feat: add CreditCard, Loan, and DashboardOverview shared types"`

---

### Task 2: Prisma Models — CreditCard + Loan

**Files:**
- Modify: `server/prisma/schema.prisma`

Add `LoanType` enum after `AccountType`:

```prisma
enum LoanType {
  home
  car
  personal
  education
  gold
  other
}
```

Add `CreditCard` model after `BankAccount`:

```prisma
model CreditCard {
  id               String       @id @default(cuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  familyMemberId   String
  familyMember     FamilyMember @relation(fields: [familyMemberId], references: [id])
  bankName         String
  cardName         String
  cardNumberLast4  String
  creditLimit      BigInt       @default(0)
  currentDue       BigInt       @default(0)
  minimumDue       BigInt       @default(0)
  dueDate          Int
  billingCycleDate Int
  isActive         Boolean      @default(true)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([userId])
  @@index([familyMemberId])
}
```

Add `Loan` model after `CreditCard`:

```prisma
model Loan {
  id                String       @id @default(cuid())
  userId            String
  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  familyMemberId    String
  familyMember      FamilyMember @relation(fields: [familyMemberId], references: [id])
  lenderName        String
  loanType          LoanType
  principalAmount   BigInt       @default(0)
  outstandingAmount BigInt       @default(0)
  emiAmount         BigInt       @default(0)
  interestRate      Float        @default(0)
  tenureMonths      Int          @default(0)
  startDate         DateTime
  endDate           DateTime?
  emiDueDate        Int
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@index([userId])
  @@index([familyMemberId])
}
```

Add inverse relations to `User` model: `creditCards CreditCard[]` and `loans Loan[]`

Add inverse relations to `FamilyMember` model: `creditCards CreditCard[]` and `loans Loan[]`

Run: `db:push`, `db:generate`, `type-check`

Commit: `git commit -m "feat: add CreditCard and Loan Prisma models"`

---

### Task 3: CreditCard CRUD API

**Files:**
- Create: `server/src/services/creditCards.ts`
- Create: `server/src/controllers/creditCards.ts`
- Create: `server/src/routes/creditCards.ts`
- Modify: `server/src/app.ts`

Follow exact same pattern as bankAccounts (service/controller/routes). Key differences:
- Fields: bankName, cardName, cardNumberLast4, creditLimit, currentDue, minimumDue, dueDate (int 1-31), billingCycleDate (int 1-31)
- All monetary fields (creditLimit, currentDue, minimumDue) sent as rupees from client, stored as paise BigInt
- Include familyMember in responses
- Soft-delete (isActive = false)
- Register as `/api/credit-cards`

Commit: `git commit -m "feat: add CreditCard CRUD API"`

---

### Task 4: Loan CRUD API

**Files:**
- Create: `server/src/services/loans.ts`
- Create: `server/src/controllers/loans.ts`
- Create: `server/src/routes/loans.ts`
- Modify: `server/src/app.ts`

Follow same pattern. Key differences:
- Fields: lenderName, loanType (enum), principalAmount, outstandingAmount, emiAmount, interestRate (float), tenureMonths (int), startDate, endDate?, emiDueDate (int 1-31)
- Monetary fields as paise BigInt
- loanType validated as z.enum(["home", "car", "personal", "education", "gold", "other"])
- Register as `/api/loans`

Commit: `git commit -m "feat: add Loan CRUD API"`

---

### Task 5: Dashboard Overview API

**Files:**
- Create: `server/src/services/dashboard.ts`
- Create: `server/src/controllers/dashboard.ts`
- Create: `server/src/routes/dashboard.ts`
- Modify: `server/src/app.ts`

The overview endpoint (`GET /api/dashboard/overview`) aggregates:
- **Net worth:** sum of bank balances (assets) minus sum of loan outstanding + card dues (liabilities)
- **Quick stats:** total bank balance, total card dues, next due date/days, total loan EMIs, family member count
- **Upcoming dues:** credit card dues + loan EMIs sorted by days until due date, using `daysUntil()` logic
- **Needs attention:** bank accounts with balanceUpdatedAt > 30 days old

All amounts returned as numbers (paise converted to rupees in the service for the dashboard response).

Register as `/api/dashboard`

Commit: `git commit -m "feat: add dashboard overview aggregation API"`

---

### Task 6: Credit Cards Page UI

**Files:**
- Create: `client/src/pages/finance/CreditCardsPage.tsx`

Full CRUD page following BankAccountsPage patterns:
- List cards grouped by family member
- Each card shows: bank + card name, last 4 digits, current due (formatINR), credit limit, utilization % bar, due date with daysUntil countdown
- Color-coded due dates: red if <=3 days, amber if <=7, green otherwise
- Add/edit form: bank name (INDIAN_BANKS select), card name, last 4 digits, credit limit (₹), current due (₹), minimum due (₹), due date (1-31), billing cycle date (1-31), family member
- Delete (soft)

Commit: `git commit -m "feat: add Credit Cards page with CRUD and due date tracking"`

---

### Task 7: Loans Page UI

**Files:**
- Create: `client/src/pages/finance/LoansPage.tsx`

Full CRUD page:
- List loans grouped by family member
- Each loan shows: lender, loan type badge, outstanding/principal with progress bar, EMI amount, interest rate, next EMI date with countdown
- Loan type badges with colors: home=blue, car=purple, personal=amber, education=green, gold=yellow, other=slate
- Add/edit form: lender name, loan type (select), principal (₹), outstanding (₹), EMI (₹), interest rate (%), tenure (months), start date, end date (optional), EMI due date (1-31), family member
- Delete (soft)

Commit: `git commit -m "feat: add Loans page with CRUD and EMI tracking"`

---

### Task 8: Overview Dashboard Page UI

**Files:**
- Modify: `client/src/pages/OverviewPage.tsx`

Replace placeholder with the full dashboard:
- Net worth hero card (dark gradient, shows total/assets/liabilities)
- 4 quick stat cards (bank balance, card dues with next due, loan EMIs, family count)
- Two-column: Upcoming Dues (sorted list) + Needs Attention (stale balances)
- All data from single API call: `GET /api/dashboard/overview`
- Uses formatINR for all amounts
- Color-coded due date urgency
- Stale balance warnings link to bank accounts page

Commit: `git commit -m "feat: add Overview dashboard with net worth, stats, and alerts"`

---

### Task 9: Update Routes in App.tsx

**Files:**
- Modify: `client/src/App.tsx`

Replace placeholder routes for credit-cards and loans with actual page components:

```tsx
import CreditCardsPage from "./pages/finance/CreditCardsPage";
import LoansPage from "./pages/finance/LoansPage";
```

Change:
```tsx
<Route path="credit-cards" element={<OverviewPage />} />
<Route path="loans" element={<OverviewPage />} />
```

To:
```tsx
<Route path="credit-cards" element={<CreditCardsPage />} />
<Route path="loans" element={<LoansPage />} />
```

Commit: `git commit -m "feat: wire up credit cards and loans routes"`

---

### Task 10: Documentation + Final Verification

Update `docs/architecture.md` with:
- CreditCard and Loan endpoints
- Dashboard endpoint
- New models in schema section

Run full quality checklist: lint, spell-check, type-check, build, test.

Commit: `git commit -m "docs: add credit cards, loans, and dashboard to architecture"`
