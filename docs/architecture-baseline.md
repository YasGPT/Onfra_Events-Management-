# Confra — Architecture Baseline

This document records the foundational architecture decisions, conventions, and database schema for **Confra**.

---

## 1. Project Overview & Identity

* **Project Name:** Confra
* **Purpose:** Multi-event management, networking, and scheduling platform for organizers and attendees.
* **Architecture Style:** Event-scoped access boundaries (`/:eventId/...`) where each event forms a security and tenant boundary.
* **Separation Notice:** Confra is an independent platform with its own repository, database, schemas, and configurations.

---

## 2. Technology Stack Baseline

* **Backend:** Node.js (v24 LTS), Express 5.x, JavaScript (CommonJS).
* **Database:** PostgreSQL.
* **ORM:** Sequelize 6.x.
* **Migration Tooling:** Umzug 3.x using `SequelizeStorage` (persisting applied migrations in table `sequelize_meta`).
* **Admin Web:** React 19, Vite, TypeScript.
* **Attendee Mobile:** React Native, Expo SDK 57, Expo Router, TypeScript.

---

## 3. Database Conventions

1. **Primary Keys:** UUIDs across all core tables (`gen_random_uuid()` in PostgreSQL / `DataTypes.UUIDV4` in Sequelize).
2. **Column Naming:** `snake_case` in the database (`underscored: true` in Sequelize), mapping automatically to camelCase model properties.
3. **Timestamps & Timezones:**
   * All timestamps (`created_at`, `updated_at`, `start_time`, `end_time`) are stored as `TIMESTAMPTZ` in UTC (`timezone: '+00:00'`).
   * Each event retains its organizer-defined IANA timezone name (e.g., `'Asia/Kolkata'`, `'America/New_York'`) in `events.timezone`.
4. **Directory Privacy:**
   * Attendee profile directory visibility is **opt-in by default** (`directory_opt_in = false` on `users`, and `directory_visibility = 'opt_in'` on `event_settings`).
5. **Event Isolation & Scoping:**
   * Downstream queries for event data must require an explicit `eventId` boundary.

---

## 4. Initial Core Database Schema (Milestone 1)

### Table 1: `users`
Represents user accounts (organizers, staff, and attendees).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `gen_random_uuid()` | Unique user identifier |
| `email` | VARCHAR(255) | NOT NULL, Unique (lower-case index) | User email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password (e.g. bcrypt) |
| `full_name` | VARCHAR(255) | NOT NULL | User's full display name |
| `avatar_url` | TEXT | NULLABLE | Profile picture URL |
| `directory_opt_in` | BOOLEAN | NOT NULL, Default `false` | Whether user opts into public event directory |
| `created_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record creation timestamp (UTC) |
| `updated_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record update timestamp (UTC) |

### Table 2: `events`
Represents conferences or events created by an organizer.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `gen_random_uuid()` | Unique event identifier |
| `organizer_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE RESTRICT | Creator/organizer of the event |
| `title` | VARCHAR(255) | NOT NULL | Event title |
| `slug` | VARCHAR(255) | NOT NULL, Unique index | Unique URL slug for the event |
| `description` | TEXT | NULLABLE | Detailed description |
| `timezone` | VARCHAR(64) | NOT NULL, Default `'UTC'` | Event IANA timezone (e.g., `'Asia/Kolkata'`) |
| `status` | VARCHAR(32) | NOT NULL, Default `'draft'` | Status: `draft`, `published`, `archived` |
| `start_time` | TIMESTAMPTZ | NULLABLE | Event start datetime in UTC |
| `end_time` | TIMESTAMPTZ | NULLABLE | Event end datetime in UTC |
| `created_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record creation timestamp (UTC) |
| `updated_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record update timestamp (UTC) |

### Table 3: `event_users`
Connects users to events, enforcing event membership and role-based access.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `gen_random_uuid()` | Membership record identifier |
| `event_id` | UUID | NOT NULL, FK -> `events(id)` ON DELETE CASCADE | Associated event |
| `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Associated user |
| `role` | VARCHAR(32) | NOT NULL, Default `'attendee'` | Role: `attendee`, `exhibitor`, `speaker`, `organizer`, `admin` |
| `status` | VARCHAR(32) | NOT NULL, Default `'active'` | Membership status: `invited`, `active`, `cancelled` |
| `created_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record creation timestamp (UTC) |
| `updated_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record update timestamp (UTC) |

* **Unique Constraint:** `(event_id, user_id)` — ensures a user cannot have duplicate memberships in the same event.
* **Indexes:** on `event_id` and on `user_id`.

### Table 4: `event_settings`
1-to-1 event configuration, feature toggles, and privacy controls.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `gen_random_uuid()` | Settings record identifier |
| `event_id` | UUID | NOT NULL, Unique, FK -> `events(id)` ON DELETE CASCADE | Associated event (1:1) |
| `allow_connections` | BOOLEAN | NOT NULL, Default `true` | Toggle attendee networking connections |
| `allow_meetings` | BOOLEAN | NOT NULL, Default `true` | Toggle 1-on-1 meeting scheduling |
| `directory_visibility` | VARCHAR(32) | NOT NULL, Default `'opt_in'` | Mode: `opt_in`, `attendees_only`, `hidden` |
| `features` | JSONB | NOT NULL, Default `{}` | Flexible feature flags for future milestones |
| `created_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record creation timestamp (UTC) |
| `updated_at` | TIMESTAMPTZ | NOT NULL, Default `CURRENT_TIMESTAMP` | Record update timestamp (UTC) |

---

## 5. Migration Workflow

Migrations are managed with **Umzug** and stored in `apps/backend/src/db/migrations/`.

### File Naming Convention
`YYYYMMDDHHmmss_descriptive_name.js` (e.g., `20261015120000_create_initial_core_schema.js`).

### CLI Commands
* `npm run db:migrate` — Executes all pending migrations.
* `npm run db:undo` — Reverts the most recent migration.
* `npm run db:status` — Displays executed vs pending migrations.

### Safety Rules
* Migrations applied in shared or production environments must **never** be edited. Subsequent schema changes require a new timestamped migration.
* Always define both `up` (applying) and `down` (reverting) steps.

---

## 6. Next Milestones (Roadmap)

* **Milestone 2 (Phase 3):** User Authentication (Register, Login, Password Hashing, JWT verification) and Centralized Event Authorization Middleware (`/:eventId/...`).
* **Milestone 3 (Phase 4):** Repository-layer event scoping helpers and automated tenant isolation test suite.
* **Milestone 4 (Phases 5 & 6):** Core features: sessions, attendee networking, booking-conflict protection, and push notifications.
