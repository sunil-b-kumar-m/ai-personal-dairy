---
name: add-page
description: Use when adding a new frontend page to the React client. Scaffolds page component, route in App.tsx, navigation link in Header, and optional ProtectedRoute wrapper with permission guard.
---

# Add Frontend Page

Scaffold a new page in the React client with routing and navigation.

## Usage

```
/add-page <page-name> [--route <path>] [--protected] [--permission <name>]
```

**Examples:**
- `/add-page Entries --route /entries` — Public page
- `/add-page DiaryEditor --route /diary/new --protected` — Auth required
- `/add-page AdminSettings --route /admin/settings --protected --permission admin.dashboard` — Admin only

## What Gets Created/Modified

| File | Action |
|------|--------|
| `client/src/pages/<PageName>.tsx` | **Create**: Page component |
| `client/src/App.tsx` | **Modify**: Add Route (with ProtectedRoute if needed) |
| `client/src/components/layout/Header.tsx` | **Modify**: Add navigation link |

For admin pages (route starts with `/admin/`):
| `client/src/pages/admin/<PageName>.tsx` | **Create**: In admin subdirectory |

## Process

### Step 1: Gather Information

Ask the user (if not provided):
- Page name (PascalCase, e.g. "DiaryEntries")
- Route path (e.g. "/diary/entries")
- Whether it needs authentication
- Required permission (if any)
- Where the nav link goes (main nav, admin dropdown, or none)

### Step 2: Create Page Component

```tsx
// client/src/pages/DiaryEntriesPage.tsx

function DiaryEntriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Diary Entries</h1>
      {/* Page content */}
    </div>
  );
}

export default DiaryEntriesPage;
```

Convention: Page file name ends with `Page.tsx`, uses default export.

### Step 3: Add Route to App.tsx

**Public route:**
```tsx
<Route path="diary/entries" element={<DiaryEntriesPage />} />
```

**Protected route (auth only):**
```tsx
<Route
  path="diary/entries"
  element={
    <ProtectedRoute>
      <DiaryEntriesPage />
    </ProtectedRoute>
  }
/>
```

**Protected + permission:**
```tsx
<Route
  path="admin/settings"
  element={
    <ProtectedRoute permission="admin.dashboard">
      <AdminSettingsPage />
    </ProtectedRoute>
  }
/>
```

### Step 4: Add Navigation Link

**In Header.tsx main nav:**
```tsx
<Link to="/diary/entries" className="text-sm text-gray-600 hover:text-gray-900">
  Entries
</Link>
```

**In admin dropdown (if admin page):**
```tsx
{hasPermission("admin.dashboard") && (
  <Link to="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
    Settings
  </Link>
)}
```

**Conditional on permission:**
```tsx
{hasPermission("diary.read") && (
  <Link to="/diary/entries" ...>Entries</Link>
)}
```

### Step 5: Update Documentation

**MANDATORY:**
- `docs/architecture.md`: Add page to folder structure, add route to Route Structure

### Step 6: Verify

```bash
pnpm --filter @diary/client run type-check
pnpm --filter @diary/client run build
```

## Common Mistakes

- Forgetting to import the page in `App.tsx`
- Forgetting to import `ProtectedRoute` when using `--protected`
- Using `useAuth()` in a page without the `AuthProvider` wrapper (it's in `main.tsx`, so this works for all routes under Layout)
- Adding nav links without permission checks for protected pages
- Not updating docs
