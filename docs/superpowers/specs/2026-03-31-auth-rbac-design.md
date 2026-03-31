# Authentication & Role-Based Access Control (RBAC) Design

**Date:** 2026-03-31
**Status:** Approved

## Overview

Add authentication (local + OAuth), JWT session management, and a fully dynamic RBAC system to the AI Personal Diary application. Includes an admin UI for managing users, roles, and permissions.

## Tech Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Auth framework | Passport.js | Battle-tested, strategy pattern for multiple providers |
| Password hashing | bcrypt | Industry standard, configurable salt rounds |
| Session tokens | JWT (access + refresh) in httpOnly cookies | Stateless, works with free-tier hosting, CSRF-safe |
| OAuth providers | Google (passport-google-oauth20), Microsoft (passport-microsoft) | Most common enterprise/personal providers |
| Validation | Zod | Already in the stack, type-safe request validation |
| ORM | Prisma | Already in the stack, type-safe DB queries |

## Database Schema

### Models

**User**
- `id` — String, cuid, primary key
- `email` — String, unique
- `passwordHash` — String, nullable (null for OAuth-only users)
- `name` — String
- `avatar` — String, nullable
- `provider` — Enum: `local`, `google`, `microsoft`
- `providerId` — String, nullable (OAuth provider's user ID)
- `isActive` — Boolean, default true
- `createdAt` — DateTime
- `updatedAt` — DateTime

**Role**
- `id` — String, cuid, primary key
- `name` — String, unique
- `description` — String, nullable
- `isDefault` — Boolean, default false (one role marked as default for new signups)
- `createdAt` — DateTime
- `updatedAt` — DateTime

**Permission**
- `id` — String, cuid, primary key
- `name` — String, unique (dot notation: `module.action`, e.g. `user.create`)
- `description` — String, nullable
- `module` — String (grouping key for admin UI, e.g. `user`, `diary`, `finance`)
- `createdAt` — DateTime

**UserRole** (many-to-many join)
- `userId` — String, foreign key → User
- `roleId` — String, foreign key → Role
- Composite primary key: (userId, roleId)

**RolePermission** (many-to-many join)
- `roleId` — String, foreign key → Role
- `permissionId` — String, foreign key → Permission
- Composite primary key: (roleId, permissionId)

**RefreshToken**
- `id` — String, cuid, primary key
- `token` — String, unique
- `userId` — String, foreign key → User
- `expiresAt` — DateTime
- `createdAt` — DateTime

### Relationships

```
User ←many-to-many→ Role (via UserRole)
Role ←many-to-many→ Permission (via RolePermission)
User ←one-to-many→ RefreshToken
```

## Authentication Flows

### Local Register

```
POST /api/auth/register { name, email, password }
→ Zod validate
→ Check email uniqueness
→ Hash password with bcrypt (12 salt rounds)
→ Create User (provider="local")
→ Assign default role (role where isDefault=true, initially "User")
→ Generate access token (JWT, 15min) + refresh token (crypto random, 7 days)
→ Store refresh token in DB
→ Set both as httpOnly, secure, sameSite=lax cookies
→ Return { success: true, data: { user, roles, permissions } }
```

### Local Login

```
POST /api/auth/login { email, password }
→ Passport local strategy
→ Find user by email, verify isActive
→ bcrypt.compare password
→ Issue JWT pair → Set cookies
→ Return { success: true, data: { user, roles, permissions } }
```

### OAuth (Google / Microsoft)

```
GET /api/auth/google → Passport redirects to Google consent
GET /api/auth/google/callback
→ Passport exchanges code for profile
→ Find user by (provider="google", providerId=googleId)
  → If exists: update name/avatar, proceed
  → If not: check if email exists with different provider
    → If yes: return error "Email already registered with {provider}"
    → If no: create User, assign default role
→ Issue JWT pair → Set cookies
→ Redirect to CLIENT_URL/auth/callback
```

Same flow for Microsoft at `/api/auth/microsoft` and `/api/auth/microsoft/callback`.

### Token Refresh

```
POST /api/auth/refresh
→ Read refresh_token cookie
→ Find in DB, verify not expired
→ Delete old refresh token (rotation)
→ Issue new access + refresh tokens → Set cookies
→ Return { success: true }
```

### Logout

```
POST /api/auth/logout
→ Read refresh_token cookie
→ Delete from DB
→ Clear both cookies
→ Return { success: true }
```

### Get Current User

```
GET /api/auth/me
→ authenticate middleware (verify access token)
→ Load user with roles and permissions
→ Return { success: true, data: { user, roles, permissions } }
```

## Token Specification

| Token | Type | Lifetime | Storage | Content |
|-------|------|----------|---------|---------|
| Access | JWT (HS256) | 15 minutes | httpOnly cookie `access_token` | { userId, email } |
| Refresh | Crypto random (64 bytes, hex) | 7 days | httpOnly cookie `refresh_token` + DB | Opaque string |

Cookie settings:
- `httpOnly: true`
- `secure: true` (production), `false` (development)
- `sameSite: "lax"`
- `path: "/"` for access, `path: "/api/auth"` for refresh

## Middleware

### authenticate

```typescript
// Extract access_token from cookie
// Verify JWT signature and expiration
// Attach { userId, email } to req.user
// If expired/invalid → 401 Unauthorized
```

### authorize(requiredPermission: string)

```typescript
// Load user's roles from DB (or from JWT cache)
// Aggregate all permissions from all user roles
// Check if requiredPermission is in the set
// If not → 403 Forbidden
```

## API Endpoints

### Auth Routes — `/api/auth/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register with email/password |
| POST | `/login` | No | Login with email/password |
| POST | `/logout` | Yes | Logout, clear tokens |
| POST | `/refresh` | No | Refresh access token |
| GET | `/me` | Yes | Get current user with roles/permissions |
| GET | `/google` | No | Start Google OAuth |
| GET | `/google/callback` | No | Google OAuth callback |
| GET | `/microsoft` | No | Start Microsoft OAuth |
| GET | `/microsoft/callback` | No | Microsoft OAuth callback |

### User Management — `/api/users/`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | `user.read` | List users (paginated, searchable) |
| GET | `/:id` | `user.read` | Get user with roles |
| PUT | `/:id` | `user.update` | Update user profile/status |
| DELETE | `/:id` | `user.delete` | Deactivate user |
| PUT | `/:id/roles` | `user.update` | Assign/remove roles |

### Role Management — `/api/roles/`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | `role.read` | List roles with permission counts |
| POST | `/` | `role.create` | Create role |
| GET | `/:id` | `role.read` | Get role with permissions |
| PUT | `/:id` | `role.update` | Update role |
| DELETE | `/:id` | `role.delete` | Delete role (blocked if users assigned) |
| PUT | `/:id/permissions` | `role.update` | Set role's permissions |

### Permission Management — `/api/permissions/`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | `permission.read` | List permissions (grouped by module) |
| POST | `/` | `permission.create` | Create permission |
| PUT | `/:id` | `permission.update` | Update permission |
| DELETE | `/:id` | `permission.delete` | Delete permission (blocked if assigned) |

## Frontend

### New Pages

| Page | Route | Auth | Permission |
|------|-------|------|------------|
| LoginPage | `/login` | No | — |
| RegisterPage | `/register` | No | — |
| AuthCallbackPage | `/auth/callback` | No | — |
| DashboardPage | `/dashboard` | Yes | — |
| AdminUsersPage | `/admin/users` | Yes | `user.read` |
| AdminRolesPage | `/admin/roles` | Yes | `role.read` |
| AdminPermissionsPage | `/admin/permissions` | Yes | `permission.read` |

### Components

```
components/features/auth/
  LoginForm.tsx           — Email + password fields
  RegisterForm.tsx        — Name + email + password + confirm password
  OAuthButtons.tsx        — "Sign in with Google" / "Sign in with Microsoft"
  ProtectedRoute.tsx      — Redirect to /login if not authenticated
                            Redirect to /dashboard if missing required permission

components/features/admin/
  UserTable.tsx           — Paginated user list, search, role badges, actions
  RoleManager.tsx         — Role CRUD, permission checkboxes matrix
  PermissionManager.tsx   — Permission CRUD grouped by module
```

### Auth State (hooks/useAuth.ts)

```typescript
interface AuthState {
  user: User | null;
  roles: Role[];
  permissions: string[];  // Flattened permission names
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Exposed functions:
// login(email, password) → POST /api/auth/login
// register(name, email, password) → POST /api/auth/register
// logout() → POST /api/auth/logout
// hasPermission(name: string) → boolean
// hasAnyPermission(names: string[]) → boolean
```

On app mount, calls `GET /api/auth/me` to hydrate state from existing cookies.

### ProtectedRoute

```tsx
<ProtectedRoute>                         // Just requires auth
<ProtectedRoute permission="user.read">  // Requires auth + specific permission
```

### Route Structure

```
/                    → Public layout
  /                  → HomePage
  /login             → LoginPage
  /register          → RegisterPage
  /auth/callback     → AuthCallbackPage

/dashboard           → Protected layout
  /dashboard         → DashboardPage
  /admin/users       → AdminUsersPage (user.read)
  /admin/roles       → AdminRolesPage (role.read)
  /admin/permissions → AdminPermissionsPage (permission.read)
```

## Seed Data

### Default Permissions (22 total)

| Module | Permissions |
|--------|------------|
| diary | `diary.create`, `diary.read`, `diary.update`, `diary.delete`, `diary.read_shared` |
| user | `user.create`, `user.read`, `user.update`, `user.delete` |
| role | `role.create`, `role.read`, `role.update`, `role.delete` |
| permission | `permission.create`, `permission.read`, `permission.update`, `permission.delete` |
| finance | `finance.create`, `finance.read`, `finance.update`, `finance.delete` |
| family | `family.invite` |
| admin | `admin.dashboard` |

### Default Roles & Assignments

**Admin** — All 22 permissions
**User** (isDefault: true) — `diary.create`, `diary.read`, `diary.update`, `diary.delete`, `diary.read_shared`, `family.invite`
**Financer** — `finance.create`, `finance.read`, `finance.update`, `finance.delete`
**Family** — `diary.read_shared`

### Seed Admin User

- Email: `admin@diary.app`
- Password: value of `ADMIN_SEED_PASSWORD` env var (default: `Admin@123456`)
- Role: Admin
- Only created if no user with Admin role exists

## New Environment Variables

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (required) | Secret key for signing JWTs |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime |
| `GOOGLE_CLIENT_ID` | (required for OAuth) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | (required for OAuth) | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `/api/auth/google/callback` | Google OAuth redirect URI |
| `MICROSOFT_CLIENT_ID` | (required for OAuth) | Microsoft OAuth client ID |
| `MICROSOFT_CLIENT_SECRET` | (required for OAuth) | Microsoft OAuth client secret |
| `MICROSOFT_CALLBACK_URL` | `/api/auth/microsoft/callback` | Microsoft OAuth redirect URI |
| `ADMIN_SEED_PASSWORD` | `Admin@123456` | Initial admin password for seed |

## New Dependencies

### Server

| Package | Purpose |
|---------|---------|
| `passport` | Auth framework |
| `passport-local` | Email/password strategy |
| `passport-google-oauth20` | Google OAuth strategy |
| `passport-microsoft` | Microsoft OAuth strategy |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT sign/verify |
| `cookie-parser` | Parse cookies from requests |
| `@types/passport`, `@types/passport-local`, `@types/passport-google-oauth20`, `@types/bcrypt`, `@types/jsonwebtoken`, `@types/cookie-parser` | Type definitions |

### Client

| Package | Purpose |
|---------|---------|
| `react-hot-toast` | Toast notifications for auth feedback |

## Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Invalid credentials | 401 | `{ success: false, error: "Invalid email or password" }` |
| Email already exists (register) | 409 | `{ success: false, error: "Email already registered" }` |
| Email exists with different provider | 409 | `{ success: false, error: "Email already registered with Google" }` |
| Access token expired | 401 | `{ success: false, error: "Token expired" }` |
| Refresh token invalid/expired | 401 | `{ success: false, error: "Invalid refresh token" }` |
| Missing permission | 403 | `{ success: false, error: "Insufficient permissions" }` |
| Account deactivated | 403 | `{ success: false, error: "Account is deactivated" }` |
| Delete role with users | 400 | `{ success: false, error: "Cannot delete role with assigned users" }` |
| Delete permission assigned to roles | 400 | `{ success: false, error: "Cannot delete permission assigned to roles" }` |
