# CONFRA Auth Design (Milestone 2.1)

Status: register/login + access tokens implemented. Refresh-token **schema only** —
endpoints land in Increment 2.2. Cookie transport **not implemented** (gaps below).

## Access tokens
- HS256 JWT, 15-minute expiry (`ACCESS_TOKEN_TTL` overridable, default `15m`).
- Claims: `sub` (user id), `iss` (`confra-api`), `aud` (`confra-clients`), `iat`, `exp`. Nothing else.
- Verification pins `algorithms: ['HS256']` — the header's claimed algorithm is never trusted.
- `JWT_SECRET` (>= 32 random chars) is **required at startup**; the server refuses to boot without it or with placeholder-looking values. Generate:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Passwords
- bcryptjs, work factor 12. Plaintext is never logged or stored.
- Login compares against a dummy hash when the email is unknown, so response
  timing does not reveal account existence. Both cases return the same
  `401 Invalid email or password.`
- Duplicate registration races are resolved by the DB unique constraint on
  `users.email` (single INSERT, no check-then-create).

## Refresh tokens (schema applied; endpoints in 2.2)
`refresh_tokens` stores only the **SHA-256 hash** of a 256-bit `crypto.randomBytes` token.

Columns: `id`, `user_id` (FK CASCADE), `token_hash` (unique), `family_id`,
`parent_id` (self FK, rotation chain), `expires_at`, `revoked_at`, timestamps.
Indexes on `user_id`, `family_id`, `expires_at`. CHECK `expires_at > created_at`.

### Rotation & replay detection (to implement in 2.2)
A family = all tokens descended from one interactive login. Rotation is single-use:
presenting a token revokes it and mints a successor in the same family.

Atomicity strategy (per refresh request, one DB transaction):

1. `SELECT ... FROM refresh_tokens WHERE token_hash = :hash FOR UPDATE` —
   row lock serializes concurrent replays of the same token; the loser blocks,
   then sees `revoked_at` set and treats it as replay.
2. If row missing, `revoked_at IS NOT NULL`, or `expires_at < now()` →
   **replay/expired path**: if the row exists and was revoked, revoke the whole
   family (`UPDATE ... SET revoked_at = now() WHERE family_id = :f AND revoked_at IS NULL`),
   return 401. The legitimate user is forced to re-login; a stolen token is dead.
3. Otherwise: `UPDATE` the row `SET revoked_at = now()`, `INSERT` the successor
   `(family_id = same, parent_id = this.id)` with fresh random token + hash.
   Commit. Two concurrent requests cannot both pass step 1 thanks to the row lock.

Logout: revoke the presented token's family. Password change: revoke all of the
user's families. Refresh TTL target: 30 days (decide in 2.2).

## Client transport (design only — NOT implemented yet)
- **Admin Web**: refresh token in `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`
  cookie; access token in memory only. **Blocked gaps to close first:**
  1. CORS is currently `cors()` (any origin, no credentials). Must become an
     explicit allowed-origins list with `credentials: true` — never `origin: '*'`
     with credentials.
  2. HTTPS termination + `Secure` cookies in production; dev localhost plan documented then.
  3. CSRF: SameSite=Lax is not sufficient for the POST refresh endpoint —
     add a double-submit CSRF token or require a custom header on refresh.
- **Attendee Mobile**: JSON transport. Client sends `X-Client-Type: mobile`;
  server returns tokens in the JSON body for SecureStore. **This header is a
  transport preference only and must never be consulted for authentication or
  authorization decisions.**

## Environment variables
| Key | Required | Notes |
|---|---|---|
| `PORT` | no (5000) | |
| `DATABASE_URL` | yes | |
| `JWT_SECRET` | yes | >= 32 random chars; never commit; rotate = all access tokens die (15 min blast radius) |
| `NODE_ENV` | no | `development` locally |
| `ACCESS_TOKEN_TTL` | no (15m) | |
