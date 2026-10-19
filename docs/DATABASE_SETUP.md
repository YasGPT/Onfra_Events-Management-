# Database Setup & Initial Configuration

## ⚠️ Important: No Hardcoded Data

**All data is stored in database tables. There are NO hardcoded admin credentials or events.**

The system automatically creates only the Admin role metadata. Admin accounts and events must be created manually via API or direct database operations.

---

## Database Tables

### Central Tables (Public Schema)

| Table | Purpose | Notes |
|-------|---------|-------|
| `admin_roles` | Role definitions | Auto-seeds "Admin" role on startup |
| `admins` | Admin user accounts | Must be created manually |
| `events` | Event records | Must be created manually |
| `admin_sessions` | Admin session tokens | Stores refresh tokens |
| `admin_password_reset_tokens` | Password reset tokens | For password reset flow |
| `audit_log` | System audit trail | Tracks admin actions |

### Event-Scoped Tables (Public Schema with event_id)

| Table | Purpose |
|-------|---------|
| `attendees` | Event attendees |
| `event_days` | Event schedule days |
| `tracks` | Session tracks |
| `venues` | Event venues |
| `sessions` | Session agenda |
| `speakers` | Session speakers |
| `exhibitors` | Exhibitor companies |
| `sponsorship_tiers` | Sponsorship tiers (Gold, Silver, Bronze) |
| `sponsors` | Event sponsors |
| `meetings` | 1-on-1 networking meetings |
| `media_assets` | Uploaded media files |
| `event_settings` | Event configuration settings |
| `attendee_privacy_settings` | Attendee privacy preferences |

---

## Initial Setup

### Step 1: Start the Backend

```bash
cd apps/backend
npm install
npm run dev
```

The backend will:
1. Connect to PostgreSQL database
2. Create all tables if they don't exist
3. Seed the "Admin" role (metadata only)

### Step 2: Create Your First Admin Account

**Option A: Via API (Recommended)**

```bash
POST /api/v1/admins
{
  "full_name": "Your Name",
  "email": "your@email.com",
  "phone": "+1234567890",
  "business_code": "YOURBIZ2026",
  "password": "YourSecurePassword123!",
  "role_id": "admin-role-id"
}
```

**Option B: Direct Database Insert**

```sql
INSERT INTO admins (id, role_id, business_code, full_name, email, phone, password_hash, is_active, email_verified_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM admin_roles WHERE name = 'Admin' LIMIT 1),
  'YOURBIZ2026',
  'Your Name',
  'your@email.com',
  '+1234567890',
  '$2b$10$hashedpasswordhere', -- Use bcrypt to hash your password
  true,
  NOW(),
  NOW(),
  NOW()
);
```

### Step 3: Create Your First Event

**Option A: Via API (Recommended)**

```bash
POST /api/v1/events
Headers: Authorization: Bearer <your-jwt-token>
{
  "name": "Your Event Name",
  "business_code": "YOURBIZ2026",
  "description": "Event description",
  "starts_at": "2026-03-15T09:00:00Z",
  "ends_at": "2026-03-17T18:00:00Z",
  "timezone": "UTC",
  "venue_name": "Venue Name",
  "venue_address": "Full Address",
  "organizer_name": "Organizer Name",
  "organizer_email": "organizer@email.com",
  "organizer_phone": "+1234567890"
}
```

**Option B: Direct Database Insert**

```sql
INSERT INTO events (id, created_by_admin_id, business_code, name, description, starts_at, ends_at, timezone, venue_name, venue_address, organizer_name, organizer_email, organizer_phone, status, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM admins WHERE email = 'your@email.com'),
  'YOURBIZ2026',
  'Your Event Name',
  'Event description',
  '2026-03-15 09:00:00',
  '2026-03-17 18:00:00',
  'UTC',
  'Venue Name',
  'Full Address',
  'Organizer Name',
  'organizer@email.com',
  '+1234567890',
  'published',
  true,
  NOW(),
  NOW()
);
```

---

## Business Code System

Each admin has a unique `business_code` that links them to their events:

- **Admins** are linked to events via `business_code`
- **Admin Login**: Requires `business_code + email + password`
- **Event Creation**: Events must match admin's `business_code`
- **Access Control**: Admins can only manage events with matching `business_code`

Example:
```
Admin: email=admin@company.com, business_code=COMPANY2026
Event: business_code=COMPANY2026, name="Company Annual Conference"
Result: Admin can manage this event
```

---

## Password Hashing

All passwords are hashed using **bcrypt**. Never store plain text passwords.

To hash a password manually:

```javascript
const bcrypt = require('bcrypt');
const password = 'YourPassword123!';
const hash = await bcrypt.hash(password, 10);
console.log(hash); // Use this hash in database
```

---

## Security Best Practices

1. **Change Default Passwords**: If you use the seed function for testing, change passwords immediately
2. **Use Strong Passwords**: Minimum 8 characters, uppercase, lowercase, numbers, special characters
3. **Unique Business Codes**: Each admin must have a unique business_code
4. **HTTPS in Production**: Always use HTTPS for API calls
5. **Environment Variables**: Store database credentials in `.env` file (never commit to git)
6. **Regular Backups**: Backup your PostgreSQL database regularly

---

## Environment Variables

Create `.env` file in `apps/backend/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onfra_events
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
SYNC_DB=true
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key
```

---

## Database Migration

If you need to sync tables after schema changes:

```bash
cd apps/backend
# Force sync (use with caution in development only)
SYNC_DB=true npm run dev
```

---

## Reset Database (Development Only)

⚠️ **WARNING: This will delete all data!**

```sql
-- Drop all tables
DROP TABLE IF EXISTS admin_role_permissions CASCADE;
DROP TABLE IF EXISTS admin_password_reset_tokens CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS attendee_privacy_settings CASCADE;
DROP TABLE IF EXISTS attendees CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS sponsorship_tiers CASCADE;
DROP TABLE IF EXISTS exhibitors CASCADE;
DROP TABLE IF EXISTS speakers CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS event_days CASCADE;
DROP TABLE IF EXISTS event_settings CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;

-- Restart backend to recreate tables
```

---

## Common Issues

### Q: I can't login after creating admin account
**A**: Ensure:
- Business code matches exactly (case-insensitive, converted to uppercase)
- Email is correct
- Password is correct
- Admin is active (`is_active = true`)

### Q: Event not showing for admin
**A**: Check:
- Admin's `business_code` matches Event's `business_code`
- Event is active (`is_active = true`)
- Event status is published

### Q: Multiple admins with same business code
**A**: This is NOT allowed. Each admin must have a unique `business_code`.

---

## API Endpoints for Data Management

### Admin Management
- `POST /api/v1/admins` - Create new admin
- `GET /api/v1/admins` - List all admins
- `GET /api/v1/admins/roles` - List available roles

### Event Management
- `POST /api/v1/events` - Create new event
- `GET /api/v1/events` - List events (filtered by admin's business_code)
- `GET /api/v1/events/:id` - Get event details

### Authentication
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/attendee/login` - Attendee login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user profile

---

## Support

For issues or questions:
- Check database logs
- Verify environment variables
- Review API responses for error messages
