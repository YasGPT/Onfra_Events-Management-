# Attendee Registration & Approval Flow

## Overview

This document explains the complete attendee registration flow, from QR code scanning to account activation.

---

## Flow Diagram

```
┌─────────────────┐
│  Admin Creates  │
│     Event       │
└────────┬────────┘
         │
         │ Event ID generated
         │ Business Code = Admin's Business Code
         ▼
┌─────────────────┐
│  Generate QR    │
│  Code (Event ID)│
└────────┬────────┘
         │
         │ QR Code shared publicly
         ▼
┌─────────────────┐
│  Attendee Scans │
│    QR Code      │
└────────┬────────┘
         │
         │ Redirect to registration form
         ▼
┌─────────────────┐
│ Registration    │
│     Form        │
│ (No password)   │
└────────┬────────┘
         │
         │ Submit form
         ▼
┌─────────────────┐
│ Create Pending  │
│   Attendee      │
│ Status: pending │
│ is_active: false│
└────────┬────────┘
         │
         │ Notify admin
         ▼
┌─────────────────┐
│  Admin Reviews  │
│   & Approves    │
└────────┬────────┘
         │
         │ Generate password setup token
         │ Send email with setup link
         ▼
┌─────────────────┐
│  Attendee Sets  │
│   Password     │
└────────┬────────┘
         │
         │ Status: registered
         │ is_active: true
         ▼
┌─────────────────┐
│  Attendee Can  │
│     Login      │
└─────────────────┘
```

---

## Step 1: Admin Creates Event

### Backend Changes
- **Business Code**: Automatically uses admin's `business_code` (no longer from form)
- **Event ID**: Auto-generated UUID
- **Event Days**: Automatically created for multi-day events
- **Initial Venue**: Created if venue_name provided
- **Sponsorship Tiers**: Gold, Silver, Bronze auto-seeded

### API Endpoint
```http
POST /api/v1/events
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Annual Conference 2026",
  "description": "Event description",
  "starts_at": "2026-03-15T09:00:00Z",
  "ends_at": "2026-03-17T18:00:00Z",
  "timezone": "Asia/Kolkata",
  "venue_name": "Chennai Trade Centre",
  "venue_address": "Full address",
  "organizer_name": "Organization Name",
  "organizer_email": "contact@example.com",
  "organizer_phone": "+1234567890",
  "meeting_request_expiry_hours": 24,
  "allow_personal_photo_uploads": false
}
```

### Response
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "uuid-here",
    "business_code": "EVENT2026",
    "name": "Annual Conference 2026",
    "status": "draft",
    "is_active": true
  }
}
```

---

## Step 2: Generate QR Code

### What to Include in QR Code
- **Event ID**: The UUID from the response above
- **Format**: `https://yourdomain.com/register/{eventId}`

### Example
```
QR Code URL: https://yourdomain.com/register/123e4567-e89b-12d3-a456-426614174000
```

---

## Step 3: Public Registration Form

### Frontend (Public URL)
Create a public registration page at `/register/:eventId`

### API Endpoint
```http
POST /api/v1/public/events/:eventId/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company_name": "Acme Corp",
  "job_title": "Software Engineer",
  "bio": "Professional bio",
  "website_url": "https://example.com",
  "whatsapp_url": "https://wa.me/1234567890"
}
```

### Response
```json
{
  "success": true,
  "message": "Registration submitted successfully. Your registration is pending approval.",
  "data": {
    "id": "attendee-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "registration_status": "pending",
    "is_active": false
  }
}
```

---

## Step 4: Admin Approval

### Backend Changes
- New endpoint: `POST /api/v1/attendees/:id/approve`
- Generates password setup token (valid for 24 hours)
- Sends email with setup link

### API Endpoint
```http
POST /api/v1/attendees/:id/approve
Authorization: Bearer <admin-token>
```

### Response
```json
{
  "success": true,
  "message": "Attendee approved successfully",
  "data": {
    "attendee": {
      "id": "attendee-uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "registration_status": "approved",
      "is_active": true
    },
    "passwordSetupToken": "random-token-here",
    "passwordSetupExpiry": "2026-03-16T09:00:00Z"
  }
}
```

### Email Template
```
Subject: Your registration for [Event Name] has been approved!

Dear [Attendee Name],

Your registration for [Event Name] has been approved by the event organizer.

To complete your registration and set your password, please click the link below:

https://yourdomain.com/setup-password?token={passwordSetupToken}&attendeeId={attendeeId}

This link will expire in 24 hours.

If you did not request this registration, please ignore this email.

Best regards,
[Event Name] Team
```

---

## Step 5: Password Setup

### Frontend (Public URL)
Create a password setup page at `/setup-password?token=xxx&attendeeId=xxx`

### API Endpoint
```http
POST /api/v1/attendees/:id/set-password
Content-Type: application/json

{
  "token": "password-setup-token",
  "password": "SecurePassword123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Password set successfully",
  "data": {
    "id": "attendee-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "registration_status": "registered",
    "is_active": true
  }
}
```

---

## Step 6: Attendee Login

### Existing Login Endpoint
```http
POST /api/v1/auth/attendee/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Attendee login successful",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "attendee": {
      "id": "attendee-uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "registration_status": "registered"
    },
    "event": {
      "id": "event-uuid",
      "name": "Annual Conference 2026",
      "business_code": "EVENT2026"
    }
  }
}
```

---

## Database Schema Changes

### Attendee Table Updates
```sql
ALTER TABLE attendees
ADD COLUMN password_setup_token TEXT,
ADD COLUMN password_setup_token_expires_at DATE;

ALTER TABLE attendees
ALTER COLUMN password_hash DROP NOT NULL;
```

### Attendee Registration Status Values
- `pending` - Initial registration, waiting for approval
- `approved` - Approved by admin, waiting for password setup
- `registered` - Password set, can login
- `rejected` - Rejected by admin

---

## Security Considerations

1. **Password Setup Token**
   - Random 32-byte hex string
   - Valid for 24 hours only
   - Single-use (cleared after password set)

2. **Public Endpoints**
   - Event details: No auth required
   - Registration: No auth required
   - Password setup: No auth required (only token validation)

3. **Email Security**
   - Tokens sent via email only
   - Never log tokens in backend
   - Use HTTPS for all links

---

## Admin UI Changes

### Attendees Page
Add new column: "Registration Status"

### Actions per Attendee
- **Approve**: Approve pending attendee, sends password setup email
- **Reject**: Reject pending attendee (optional)
- **Activate/Deactivate**: Toggle `is_active` for registered attendees

### Filter Options
- Show pending attendees
- Show approved attendees
- Show registered attendees
- Show all

---

## Mobile App Changes

### Mobile App Configuration
Mobile app needs:
- Event ID (from QR code or config)
- Backend API URL
- No business code input needed

### Attendee Registration
1. Scan QR code → Get Event ID
2. Fetch event details: `GET /api/v1/public/events/:eventId`
3. Show registration form
4. Submit registration: `POST /api/v1/public/events/:eventId/register`
5. Show "Pending Approval" message

### Attendee Login
- Use existing login endpoint
- Email + password only (no business code)

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events` | POST | Admin | Create event (uses admin's business_code) |
| `/api/v1/public/events/:eventId` | GET | None | Get public event details |
| `/api/v1/public/events/:eventId/register` | POST | None | Public registration |
| `/api/v1/attendees/:id/approve` | POST | Admin | Approve attendee & send email |
| `/api/v1/attendees/:id/set-password` | POST | None | Set password with token |
| `/api/v1/auth/attendee/login` | POST | None | Attendee login |

---

## Testing Checklist

- [ ] Admin creates event (business_code auto from admin)
- [ ] QR code generated with event ID
- [ ] Public registration form works
- [ ] Pending attendee created in database
- [ ] Admin can approve attendee
- [ ] Password setup token generated
- [ ] Email sent with setup link
- [ ] Password setup works with valid token
- [ ] Password setup fails with invalid/expired token
- [ ] Attendee can login after password set
- [ ] Mobile app can fetch event details by ID
- [ ] Mobile app can register attendee
- [ ] Mobile app can login attendee

---

## Future Enhancements

1. **Email Service Integration**
   - SendGrid/Mailgun for transactional emails
   - Email templates management
   - Bounce handling

2. **QR Code Generation**
   - Backend endpoint to generate QR code image
   - Event branding on QR code
   - Batch QR generation

3. **Admin Notifications**
   - Real-time notifications for new registrations
   - Bulk approval feature
   - Rejection with reason

4. **Attendee Features**
   - Resend password setup email
   - Profile photo upload after approval
   - Event agenda preview before registration
