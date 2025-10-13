# EngageSwap Backend

Minimal Node.js Express backend with MySQL connectivity.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - Database credentials (MySQL)
   - CORS origins (comma-separated)
   - JWT secret

4. Create MySQL database:
```sql
CREATE DATABASE engage_swap;
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## Environment Variables

Required:
- `PORT` - Server port (default: 5081)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - MySQL database name
- `CORS_ORIGIN` - Allowed origins (comma-separated)
- `JWT_SECRET` - JWT signing secret

## Database Setup

Run the migrations to create tables:
```bash
mysql -u root -p engage_swap < migrations/001_create_users_table.sql
mysql -u root -p engage_swap < migrations/002_add_email_verification.sql
mysql -u root -p engage_swap < migrations/003_create_campaigns_table.sql
mysql -u root -p engage_swap < migrations/004_create_visits_and_tokens.sql
mysql -u root -p engage_swap < migrations/005_add_public_id_users.sql
mysql -u root -p engage_swap < migrations/006_add_public_id_campaigns.sql
mysql -u root -p engage_swap < migrations/007_add_public_id_visits.sql
```

## Public IDs

All main tables (users, campaigns, visits) include a `public_id` field in addition to the numeric `id`:

- **Users**: Format `USR0001`, `USR0002`, etc.
- **Campaigns**: Format `CMP0001`, `CMP0002`, etc.
- **Visits**: Format `VIS0001`, `VIS0002`, etc.

Public IDs are:
- **Generated automatically** using MySQL STORED generated columns
- **Human-readable** and easy to reference in support/debugging
- **Unique** with a unique index to prevent duplicates
- **Backward compatible** - internal logic uses numeric `id`, external APIs expose both

Example:
```sql
-- Users table
id: 1          → public_id: "USR0001"
id: 42         → public_id: "USR0042"
id: 12345      → public_id: "USR12345"

-- Campaigns table
id: 1          → public_id: "CMP0001"
id: 99         → public_id: "CMP0099"
```

## API Endpoints

### Health Check
```
GET /healthz
```

**Success Response (200):**
```json
{
  "ok": true,
  "db": "up"
}
```

### Authentication

Rate limited to 5 requests per minute per IP.

#### Signup
```
POST /auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success (201):**
```json
{
  "pending": true
}
```

Note: User is created but unverified. OTP code is sent to email (or logged to console in development).

**Validation Error (422):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be at least 3 characters"
  }
}
```

**Duplicate User (409):**
```json
{
  "error": {
    "code": "DUPLICATE_USER",
    "message": "Username or email already exists"
  }
}
```

#### Verify Email
```
POST /auth/verify-email
Content-Type: application/json

{
  "emailOrUsername": "johndoe",  // or email
  "code": "123456"
}
```

**Success (200):**
```json
{
  "token": "eyJhbGc..."
}
```

**Invalid Code (401):**
```json
{
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid verification code"
  }
}
```

**Already Verified (409):**
```json
{
  "error": {
    "code": "ALREADY_VERIFIED",
    "message": "Email already verified"
  }
}
```

#### Resend OTP
```
POST /auth/resend-otp
Content-Type: application/json

{
  "emailOrUsername": "johndoe"  // or email
}
```

**Success (200):**
```json
{
  "ok": true
}
```

**Rate Limited (429):**
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Please wait 60 seconds before requesting another code"
  }
}
```

Note: Always returns 200 if user not found (to prevent user enumeration).

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "identifier": "johndoe",  // or email
  "password": "SecurePass123"
}
```

**Success (200):**
```json
{
  "token": "eyJhbGc..."
}
```

**Invalid Credentials (401):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

**Email Not Verified (403):**
```json
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Please verify your email before logging in"
  },
  "canResend": true
}
```

### User Profile

#### Get Current User
```
GET /me
Authorization: Bearer <token>
```

**Success (200):**
```json
{
  "id": 1,
  "public_id": "USR0001",
  "username": "johndoe",
  "email": "john@example.com",
  "coins": 0,
  "is_admin": false
}
```

**Unauthorized (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Campaigns

All campaign endpoints require authentication. Write operations (POST/PATCH/DELETE) are rate limited to 10 requests per minute per IP.

#### List My Campaigns
```
GET /campaigns
Authorization: Bearer <token>
```

**Success (200):**
```json
{
  "campaigns": [
    {
      "id": 1,
      "public_id": "CMP0001",
      "title": "My Product Landing",
      "url": "https://example.com",
      "coins_per_visit": 10,
      "daily_cap": 100,
      "is_paused": 0,
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Create Campaign
```
POST /campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Product Landing",
  "url": "https://example.com",
  "coins_per_visit": 10,
  "daily_cap": 100
}
```

**Success (201):**
```json
{
  "campaign": {
    "id": 1,
    "public_id": "CMP0001",
    "title": "My Product Landing",
    "url": "https://example.com",
    "coins_per_visit": 10,
    "daily_cap": 100,
    "is_paused": 0,
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Validation Error (422):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be at least 3 characters"
  }
}
```

Validation rules:
- `title`: 3-120 characters
- `url`: Valid HTTP/HTTPS URL, max 512 characters (no javascript:, data:, etc.)
- `coins_per_visit`: Integer, 1-1000
- `daily_cap`: Integer, 10-100000

#### Update Campaign
```
PATCH /campaigns/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "is_paused": 1
}
```

**Success (200):**
```json
{
  "campaign": {
    "id": 1,
    "public_id": "CMP0001",
    "title": "Updated Title",
    "url": "https://example.com",
    "coins_per_visit": 10,
    "daily_cap": 100,
    "is_paused": 1,
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Not Found (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Campaign not found"
  }
}
```

Note: Can only update campaigns you own. All fields are optional.

#### Delete Campaign
```
DELETE /campaigns/:id
Authorization: Bearer <token>
```

**Success (200):**
```json
{
  "ok": true
}
```

**Not Found (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Campaign not found"
  }
}
```

Note: Can only delete campaigns you own.

### Earn

#### Get Earn Queue
```
GET /earn/queue
Authorization: Bearer <token>
```

Returns up to 10 eligible campaigns for the authenticated user to visit. Excludes:
- Campaigns owned by the user
- Paused campaigns

**Success (200):**
```json
{
  "campaigns": [
    {
      "id": 2,
      "public_id": "CMP0002",
      "title": "Another Product",
      "url": "https://another.com",
      "coins_per_visit": 15,
      "daily_cap": 50,
      "created_at": "2025-01-15T09:00:00.000Z"
    }
  ]
}
```

#### Start Visit (Get Verification Token)
```
POST /earn/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "campaign_id": 2
}
```

Generates a time-bound verification token for visiting a campaign. Validates:
- Campaign exists and is active
- User doesn't own the campaign
- Campaign hasn't reached daily cap

**Success (200):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "expires_at": "2025-01-15T10:32:00.000Z",
  "coins_per_visit": 15
}
```

**Campaign Paused (400):**
```json
{
  "error": {
    "code": "CAMPAIGN_PAUSED",
    "message": "Campaign is paused"
  }
}
```

**Daily Cap Reached (400):**
```json
{
  "error": {
    "code": "DAILY_CAP_REACHED",
    "message": "Campaign has reached its daily cap"
  }
}
```

**Cannot Visit Own Campaign (400):**
```json
{
  "error": {
    "code": "INVALID_ACTION",
    "message": "Cannot visit your own campaign"
  }
}
```

Note: Token expires in 2 minutes and can only be used once.

#### Claim Visit Reward
```
POST /earn/claim
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6..."
}
```

Claims the reward for a verified visit. This endpoint:
- Validates the verification token
- Credits coins to the visitor
- Deducts coins from campaign owner
- Records the visit atomically

**Success (200):**
```json
{
  "success": true,
  "coins_earned": 15,
  "new_balance": 115
}
```

**Invalid Token (400):**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

Possible token errors:
- "Invalid or expired token" - Token doesn't exist or has expired
- "Token already used" - Token was already consumed
- "Token does not belong to this user" - Token belongs to different user

**Daily Cap Reached (400):**
```json
{
  "error": {
    "code": "DAILY_CAP_REACHED",
    "message": "Campaign daily cap reached"
  }
}
```

Note: All coin transfers and visit recording happen in a database transaction for consistency.

## Error Format

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

Common error codes:
- `NOT_FOUND` - Route not found (404)
- `VALIDATION_ERROR` - Invalid input (422)
- `UNAUTHORIZED` - Missing or invalid token (401)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `DB_DOWN` - Database unavailable (503)
- `INTERNAL` - Internal server error (500)
