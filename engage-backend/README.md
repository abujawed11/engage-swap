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

**Database Down (503):**
```json
{
  "ok": false,
  "error": {
    "code": "DB_DOWN",
    "message": "Database connection failed"
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
