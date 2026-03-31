# Clerk Authentication Middleware

All protected API routes now use Clerk for authentication instead of the custom JWT system.

---

## How It Works

### Global middleware (`app.js`)
`clerkMiddleware()` from `@clerk/express` is mounted globally after `express.json()`. It attaches Clerk's auth state to every request — it does **not** block unauthenticated requests on its own.

### Route protection (`middleware/clerk/clerkAuth.ts`)
This is the single file that handles all auth. Import from here in every route file.

| Export | What it does |
|--------|-------------|
| `clerkProtect` | Verifies the Clerk session token, fetches the MongoDB user by `clerk_id`, attaches to `req.user` |
| `requireRole(...roles)` | Role guard factory — 403 if user's role isn't in the list |
| `requireStaff` | Allows any of: `master_admin`, `supervisor`, `team_leader`, `admin` |
| `requireClient` | Allows only: `client` |
| `protect` | `[clerkProtect, requireStaff]` — drop-in for old staff `protect` |
| `protectClient` | `[clerkProtect, requireClient]` — drop-in for old client `protectClient` |

### Where the role comes from
The role is read from the Clerk session token's custom claims:
```
sessionClaims.metadata.role  →  e.g. "master_admin"
```
This is set up in the Clerk Dashboard under **Configure → Sessions → Customize session token**:
```json
{
  "metadata": "{{user.public_metadata}}"
}
```
When a user is invited, the backend stores their role in Clerk's `publicMetadata` via `createInvitation({ publicMetadata: { role } })`. After sign-up the role is embedded in every session token automatically.

### MongoDB user lookup
After token verification, `clerkProtect` looks up the MongoDB user by `clerk_id` in both `ZohoDmsUser` (staff) and `DmsZohoClient` (clients). The found document is attached to `req.user`, so all existing route handlers continue to work without changes.

### Account status check
Users with `account_status` of `inactive`, `suspended`, or `deleted` are blocked with a **403** even if their Clerk token is valid.

---

## Environment Variables

```env
CLERK_SECRET_KEY=sk_test_...           # required — Clerk backend secret
CLERK_PUBLISHABLE_KEY=pk_test_...      # required — used by clerkMiddleware()
CLERK_AUTHORIZED_PARTIES=https://dms.worldvisagroup.com   # prod only, comma-separated
CLERK_BOOTSTRAP_TOKEN=replace_with_strong_random_value     # required for one-time first staff invite
```

In development, `CLERK_AUTHORIZED_PARTIES` is not needed — `localhost:3000`, `localhost:3001`, and `localhost:3002` are allowed automatically.

---

## Using in Route Files

```js
const { protect, protectClient, requireRole } = require('../middleware/clerk/clerkAuth');

// Staff only (any staff role)
router.get('/clients', protect, getAllClients);

// Client only
router.post('/upload', protectClient, uploadDocument);

// Specific role only
router.delete('/user/:id', clerkProtect, requireRole('master_admin'), deleteUser);
```

---

## Testing API Endpoints

### Option A — Browser console (recommended for manual testing)

1. Sign in on the Next.js frontend at `http://localhost:3001`
2. Open browser DevTools → Console → run:
   ```js
   const token = await window.Clerk.session.getToken();
   console.log(token);
   ```
3. Copy the token
4. In Postman / Thunder Client, set the header:
   ```
   Authorization: Bearer <paste token here>
   ```

> **Note:** Clerk session tokens expire in ~60 seconds. Re-run `getToken()` whenever you get a 401.

---

### Option B — Test bypass (no browser needed)

Add `ENABLE_TEST_BYPASS=true` to your local `.env` (never set this in production), then send these headers instead of a Bearer token:

```
X-Test-Clerk-User-Id: <clerk_id value from MongoDB>
X-Test-Clerk-Role: master_admin
```

The middleware skips Clerk's API entirely and looks up the MongoDB user directly by `clerk_id`.

**How to find your `clerk_id`:**
After signing up via an invitation, check MongoDB — the user document will have a `clerk_id` field like `user_2abc123xyz`.

**This bypass only works when `ENABLE_TEST_BYPASS=true`** — never set this in production.

---

### Option C — Frontend utility page (for frequent testing)

Add a `/dev/token` page to the Next.js app:

```tsx
'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function DevTokenPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState('');

  useEffect(() => {
    getToken().then(t => setToken(t ?? ''));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dev Token</h2>
      <textarea
        value={token}
        readOnly
        style={{ width: '100%', height: 200, fontFamily: 'monospace', fontSize: 12 }}
      />
      <button onClick={() => navigator.clipboard.writeText(token)}>Copy</button>
    </div>
  );
}
```

Visit `http://localhost:3001/dev/token` → click Copy → paste into Postman.

---

## First Staff Bootstrap Invite (Production-safe)

Use this endpoint only when there is no staff account linked to Clerk yet.

```
POST /api/zoho_dms/users/bootstrap-invite
X-Bootstrap-Token: <CLERK_BOOTSTRAP_TOKEN>
Content-Type: application/json

{
  "email": "first.admin@company.com",
  "role": "master_admin",
  "username": "firstadmin"
}
```

Behavior:
- Uses the same invitation flow as normal staff invites, including Clerk `publicMetadata`.
- Rejects requests when token is missing/invalid.
- Rejects requests after first staff account has a `clerk_id` (one-time bootstrap).
- Keep this endpoint for bootstrap only; continue using protected `/invite` afterwards.

Recommended ops step after success:
- Rotate or remove `CLERK_BOOTSTRAP_TOKEN` from production env.

---

## Client Invitation Flow

### Inviting an existing client (backfill)
```
POST /api/zoho_dms/clients/invite
Authorization: Bearer <staff token>

{ "email": "client@example.com" }
```

### Auto-invite on new client signup
When staff creates a new client via `POST /api/zoho_dms/clients/signup`, the invitation is sent automatically. If Clerk's API fails, the client account is still created and the response includes a `warning` field.

### Revoking an invitation
```
DELETE /api/zoho_dms/users/invite?invitationId=inv_xxx
Authorization: Bearer <staff token>
```
Works for both staff and client invitations — MongoDB is updated for whichever model matches.

---

## Expected Responses

| Scenario | Status | Body |
|----------|--------|------|
| No token | 401 | `{ status: 'fail', message: 'Unauthorized' }` |
| Invalid / expired token | 401 | `{ status: 'fail', message: 'Authentication error' }` |
| Valid token, user not in DB | 401 | `{ status: 'fail', message: 'User not found in database' }` |
| Account inactive/suspended | 403 | `{ status: 'fail', message: 'Account is not active' }` |
| Wrong role | 403 | `{ status: 'fail', message: 'Insufficient permissions' }` |
| Bootstrap token missing/invalid | 401 | `{ status: 'fail', message: 'Invalid bootstrap token' }` |
| Bootstrap misconfigured in production | 503 | `{ status: 'fail', message: 'Bootstrap invite is not configured in production' }` |
| Bootstrap already used | 409 | `{ status: 'fail', message: 'Bootstrap invite is no longer allowed' }` |
| Success | 200/201 | Route-specific response |
