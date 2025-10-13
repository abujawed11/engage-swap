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
- `DB_DOWN` - Database unavailable (503)
- `INTERNAL` - Internal server error (500)
