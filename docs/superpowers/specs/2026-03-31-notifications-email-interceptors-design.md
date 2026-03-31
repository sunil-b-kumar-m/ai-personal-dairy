# Notifications, Email & Interceptors — Design Spec

## Overview

Add email infrastructure (Nodemailer/SMTP), email verification on signup, invite system (admin + user), client-side API interceptors with silent token refresh, structured server error handling, and notification improvements.

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email provider | Nodemailer + SMTP | Provider-agnostic, works with Gmail/Outlook/SES/any SMTP |
| Email templates | Simple inline-styled HTML | Professional look, no deps, works across email clients |
| Login verification | Email verification on signup only | Prevents fake signups without adding login friction |
| Invite model | Admin + user invites | Admins always can invite (with role pre-assignment); users can invite when feature flag is enabled |
| User invite control | Feature flag (admin toggle) | App-level on/off, no per-user permission needed. Unlimited invites when enabled. |
| 401 handling | Silent refresh + retry | Smooth UX, leverages existing refresh token infrastructure |
| Notification library | react-hot-toast (existing) | Already installed and used across the app |

---

## 1. Server — Email Infrastructure

### Environment Variables

All optional — if `SMTP_HOST` is not set, emails log to console instead of sending.

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `` | SMTP server hostname (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | `` | SMTP username |
| `SMTP_PASS` | `` | SMTP password |
| `SMTP_FROM` | `noreply@example.com` | Sender address for all emails |

Add to `server/src/config/env.ts` Zod schema with `.default("")` / `.default("587")`.

### Email Service

**File:** `server/src/services/email.ts`

```typescript
// Core
sendMail(to: string, subject: string, html: string): Promise<void>

// Specific emails
sendWelcomeEmail(user: { name: string; email: string }): Promise<void>
sendVerificationEmail(user: { name: string; email: string }, token: string): Promise<void>
sendInviteEmail(inviterName: string, email: string, token: string, roleName?: string): Promise<void>
```

**Behavior:**
- If `SMTP_HOST` is empty, log the email subject + recipient to console (dev mode)
- If `SMTP_HOST` is set, send via Nodemailer SMTP transport
- All sends are fire-and-forget (don't block the request) — log errors but don't throw

### Email Templates

**File:** `server/src/templates/email.ts`

Each function returns an HTML string. Shared layout wrapper with:
- App name header
- Content area
- CTA button (styled inline: background color, padding, rounded corners)
- Footer with "This email was sent by AI Personal Diary"

Templates:
- `welcomeEmailHtml(name: string): string`
- `verificationEmailHtml(name: string, verifyUrl: string): string`
- `inviteEmailHtml(inviterName: string, inviteUrl: string, roleName?: string): string`

---

## 2. Server — Structured Error Handling

### Error Classes

**File:** `server/src/utils/errors.ts`

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean; // true = expected error, false = programming bug
}

class NotFoundError extends AppError       // 404
class ValidationError extends AppError     // 400
class UnauthorizedError extends AppError   // 401
class ForbiddenError extends AppError      // 403
class ConflictError extends AppError       // 409
class RateLimitError extends AppError      // 429
```

### Updated Error Handler

**File:** `server/src/middleware/errorHandler.ts` (modify existing)

```typescript
if (err instanceof AppError) {
  return res.status(err.statusCode).json({
    success: false,
    error: err.message,
  });
}

if (err instanceof z.ZodError) {
  return res.status(400).json({
    success: false,
    error: err.errors.map(e => e.message).join(", "),
  });
}

// Unknown error — 500
res.status(500).json({
  success: false,
  error: env.NODE_ENV === "production" ? "Internal server error" : err.message,
});
```

### Controller Migration

Remove try/catch blocks that manually handle Zod errors from controllers. Instead:
- Throw `AppError` subclasses for business logic errors
- Let Zod errors propagate to the error handler
- Wrap async controllers with an `asyncHandler` utility:

**File:** `server/src/utils/asyncHandler.ts`

```typescript
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
```

Controllers become cleaner:
```typescript
// Before
export async function getUser(req, res, next) {
  try {
    const user = await usersService.getUser(id);
    if (!user) { res.status(404).json({...}); return; }
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400)... }
    next(error);
  }
}

// After
export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getUser(id);
  if (!user) throw new NotFoundError("User not found");
  res.json({ success: true, data: user });
});
```

---

## 3. Email Verification Flow

### Database Changes

Add to `User` model in `schema.prisma`:

```prisma
emailVerified      Boolean   @default(false)
verificationToken  String?
verificationExpiry DateTime?
```

### New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/auth/verify-email?token=xxx` | Public | Verify email, redirect to client |
| `POST` | `/api/auth/resend-verification` | Authenticated | Resend verification email |

### Flow

1. **Registration:** Create user with `emailVerified: false`. Generate crypto random token (32 bytes hex). Set `verificationExpiry` to 24 hours. Send verification email with link: `{CLIENT_URL}/auth/verify-email?token=xxx`
2. **Verification endpoint:** Validate token exists, not expired. Set `emailVerified: true`, clear token fields. Redirect to `{CLIENT_URL}/login?verified=true`.
3. **Resend:** Check user is not already verified. Rate limit: 1 resend per 2 minutes (check `verificationExpiry - 24h + 2min`). Generate new token, send new email.
4. **Unverified users:** Can log in and use the app. A banner is shown on the client prompting verification. No functionality is blocked.

### Verification Service

**File:** `server/src/services/verification.ts`

```typescript
generateVerificationToken(userId: string): Promise<string>
verifyEmail(token: string): Promise<User>
resendVerification(userId: string): Promise<void>
```

---

## 4. Invite System

### Database Changes

New model in `schema.prisma`:

```prisma
model Invite {
  id          String       @id @default(cuid())
  email       String
  token       String       @unique
  roleId      String?      // Pre-assigned role (admin invites only)
  role        Role?        @relation(fields: [roleId], references: [id])
  invitedById String
  invitedBy   User         @relation(fields: [invitedById], references: [id])
  status      InviteStatus @default(pending)
  expiresAt   DateTime
  createdAt   DateTime     @default(now())
}

enum InviteStatus {
  pending
  accepted
  expired
}

model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Add to `User` model:
```prisma
invites Invite[]
```

### Feature Flag

**Key:** `userInvitesEnabled` in `AppSetting` table.
- `"true"` = any authenticated user can send invites
- `"false"` = only admins can invite (default)

Seeded as `"false"` on first run.

### New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/invites` | Authenticated | Create invite. Non-admins blocked if feature flag is off. |
| `GET` | `/api/invites` | Authenticated | List invites sent by current user |
| `GET` | `/api/invites/accept?token=xxx` | Public | Validate invite, redirect to register with prefilled email |
| `GET` | `/api/admin/settings` | Admin (`admin.settings.read`) | Get all app settings |
| `PUT` | `/api/admin/settings` | Admin (`admin.settings.update`) | Update app setting |

### Invite Flow

1. **Create invite:** Validate email. Check feature flag (skip for admins). Generate token (32 bytes hex). Set expiry to 7 days. Create `Invite` record. Send invite email with link: `{CLIENT_URL}/auth/invite?token=xxx`.
2. **Accept invite:** Validate token, not expired, status is `pending`. Redirect to `{CLIENT_URL}/register?invite=xxx&email=yyy`. Registration page prefills email (read-only) from invite params.
3. **On registration with invite:** After user is created, update invite status to `accepted`. If invite has `roleId`, assign that role instead of default role.

### Invite Service

**File:** `server/src/services/invites.ts`

```typescript
createInvite(inviterId: string, email: string, roleId?: string): Promise<Invite>
getInvitesByUser(userId: string): Promise<Invite[]>
acceptInvite(token: string): Promise<{ email: string; roleId?: string }>
```

### App Settings Service

**File:** `server/src/services/appSettings.ts`

```typescript
getSetting(key: string): Promise<string | null>
getAllSettings(): Promise<Record<string, string>>
updateSetting(key: string, value: string): Promise<void>
```

---

## 5. Client — API Interceptor with Silent Refresh

### Upgraded API Service

**File:** `client/src/services/api.ts` (modify existing)

**401 interceptor logic:**

```
Request fails with 401
  → Is a refresh already in-flight?
    → Yes: Queue this request, wait for refresh result
    → No: Set refreshing flag, call POST /api/auth/refresh
      → Refresh succeeds: Retry all queued requests (including this one)
      → Refresh fails: Clear auth state, redirect to /login, reject all queued
```

**Implementation details:**
- `let isRefreshing = false` — module-level flag
- `let failedQueue: Array<{ resolve, reject }>` — queued requests waiting for refresh
- On 401: if not refreshing, start refresh. If refreshing, queue the retry.
- After refresh resolves/rejects, process the queue.
- Exclude `/api/auth/refresh` and `/api/auth/login` from the interceptor (avoid infinite loops).

**Global error toasts:**
- 500 errors: `toast.error("Something went wrong. Please try again.")`
- 403 errors: `toast.error("You don't have permission to do this.")`
- Network errors: `toast.error("Network error. Check your connection.")`
- Opt-out: `api.get("/endpoint", { silent: true })` suppresses auto-toast

Update the `request` function signature:
```typescript
interface RequestOptions extends RequestInit {
  silent?: boolean; // Suppress automatic error toasts
}
```

---

## 6. Client — UI Changes

### Email Verification Banner

**File:** `client/src/components/features/auth/VerificationBanner.tsx`

Shown in `Layout.tsx` when `user.emailVerified === false`:
- Yellow/amber banner at top of page
- Text: "Please verify your email address. Check your inbox for a verification link."
- "Resend" button — calls `/api/auth/resend-verification`, shows toast on success/cooldown

### Invite Page

**File:** `client/src/pages/InvitePage.tsx`

- Form: email input + "Send Invite" button
- For admins: optional role dropdown
- List of sent invites below the form (status, email, date)
- If user invites are disabled (feature flag), show a message instead of the form

**Route:** `/invites` — protected, any authenticated user

### Admin Settings

Add to existing admin panel (or new page):
- Toggle switch for "User Invites" feature flag
- Calls `PUT /api/admin/settings` with `{ key: "userInvitesEnabled", value: "true"/"false" }`

**Route:** `/admin/settings` — protected, `admin.settings.read` permission

### Registration Page Update

**File:** `client/src/pages/RegisterPage.tsx` (modify)

- Read `invite` and `email` from URL params
- If present: prefill email field (read-only), pass invite token to registration API
- Server handles role assignment from invite

### Auth Context Update

**File:** `client/src/hooks/useAuth.tsx` (modify)

- Add `emailVerified: boolean` to auth state (returned from `/api/auth/me`)
- Expose in context for `VerificationBanner` to consume

### Navigation Updates

**File:** `client/src/components/layout/Header.tsx` (modify)

- Add "Invites" link for authenticated users
- Add "Settings" link in admin dropdown

---

## 7. New Permissions

Add to seed:

| Permission | Module | Description |
|------------|--------|-------------|
| `admin.settings.read` | admin | View app settings |
| `admin.settings.update` | admin | Update app settings |
| `invite.create` | invite | Create invites (all authenticated users by default) |

Assign to roles:
- **Admin:** `admin.settings.read`, `admin.settings.update`, `invite.create`
- **User:** `invite.create`

---

## 8. File Structure Summary

### New Files

```
server/src/
├── utils/
│   ├── errors.ts              # AppError classes
│   └── asyncHandler.ts        # Async controller wrapper
├── services/
│   ├── email.ts               # Nodemailer email sending
│   ├── verification.ts        # Email verification logic
│   ├── invites.ts             # Invite CRUD + token logic
│   └── appSettings.ts         # Feature flags / app settings
├── controllers/
│   ├── invites.ts             # Invite endpoints
│   └── appSettings.ts         # Admin settings endpoints
├── routes/
│   ├── invites.ts             # Invite routes
│   └── appSettings.ts         # Admin settings routes
└── templates/
    └── email.ts               # HTML email templates

client/src/
├── components/features/auth/
│   └── VerificationBanner.tsx # Email verification banner
├── pages/
│   ├── InvitePage.tsx         # Send + list invites
│   └── admin/
│       └── AdminSettingsPage.tsx # Feature flag toggles
```

### Modified Files

```
server/
├── src/config/env.ts          # SMTP env vars
├── src/middleware/errorHandler.ts # AppError + Zod handling
├── src/controllers/auth.ts    # Verification flow, invite-aware registration
├── src/app.ts                 # Register new routes
├── prisma/schema.prisma       # User fields, Invite model, AppSetting model
└── prisma/seed.ts             # New permissions, default app settings

client/
├── src/services/api.ts        # 401 interceptor, silent refresh, global toasts
├── src/hooks/useAuth.tsx       # emailVerified in state
├── src/components/layout/Layout.tsx  # VerificationBanner
├── src/components/layout/Header.tsx  # Invites + Settings nav links
├── src/pages/RegisterPage.tsx  # Invite token handling
└── src/App.tsx                 # New routes
```

---

## 9. Dependencies

| Package | Workspace | Purpose |
|---------|-----------|---------|
| `nodemailer` | server | SMTP email sending |
| `@types/nodemailer` | server (dev) | TypeScript types |

No new client dependencies.

---

## 10. Testing Strategy

### Server Tests

- **Email service:** Mock nodemailer transport, verify `sendMail` called with correct args
- **Verification flow:** Test token generation, expiry, successful verification, resend cooldown
- **Invite flow:** Test create (admin vs user, feature flag), accept, expiry
- **App settings:** Test CRUD, permission checks
- **Error handling:** Test each error class returns correct status code
- **Auth with invite:** Test registration with invite token assigns correct role

### Client Tests

- **API interceptor:** Mock fetch, test 401 → refresh → retry flow, queue behavior
- **VerificationBanner:** Render when `emailVerified: false`, hide when `true`, resend button
- **InvitePage:** Form submission, invite list rendering, feature flag disabled state
- **RegisterPage:** Invite params prefill email
