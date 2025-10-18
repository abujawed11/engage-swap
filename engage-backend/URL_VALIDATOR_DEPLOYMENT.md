# URL Validator System - Deployment Guide

## Overview

The URL validation system provides synchronous validation of campaign URLs against security and content policies. This ensures that only safe, accessible URLs are allowed in campaigns.

---

## Deployment Steps

### Step 1: Run the Database Migration

```bash
cd engage-backend
mysql -u engage_user -p"engage@25" engage_swap < migrations/026_add_url_validator_system.sql
```

This migration creates:
- `url_validator_config` - Configuration table for validation rules
- `url_validation_logs` - Audit trail for all validation attempts
- `url_validator_rate_limits` - Rate limiting tracking table
- Initial configuration with 8 validation rules (all enabled by default)

**Verify migration success:**
```bash
mysql -u engage_user -p"engage@25" engage_swap -e "SELECT rule_key, enabled FROM url_validator_config;"
```

Expected output:
```
+-------------------------+---------+
| rule_key                | enabled |
+-------------------------+---------+
| ALLOWED_SCHEMES         |       1 |
| BLOCK_IP_ADDRESSES      |       1 |
| BLOCK_PRIVATE_IPS       |       1 |
| FOLLOW_REDIRECTS        |       1 |
| MAX_URL_LENGTH          |       1 |
| REQUIRE_HTML_CONTENT    |       1 |
| REQUIRE_PUBLIC_SUFFIX   |       1 |
| VERIFY_ACCESSIBILITY    |       1 |
+-------------------------+---------+
```

### Step 2: Restart the Backend Server

The validator service and API endpoint are already integrated into the server.

```bash
# If using pm2
pm2 restart engage-backend

# Or if running manually
npm run dev
```

### Step 3: Verify API Endpoint

Test the validator endpoint:

```bash
# Test with a valid URL
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Expected response:
```json
{
  "verdict": "VALID",
  "message": "URL is valid and accessible",
  "correlation_id": "uuid-here",
  "validation_time_ms": 1234
}
```

### Step 4: Restart the Frontend

The frontend integration is complete. Just restart the frontend dev server:

```bash
cd engage-frontend
npm run dev
```

---

## Configuration Management

### Viewing Current Configuration

```sql
SELECT
  rule_key,
  enabled,
  description,
  JSON_PRETTY(metadata) as config
FROM url_validator_config
ORDER BY rule_key;
```

### Enabling/Disabling Rules

To disable a rule (e.g., disable IP address blocking):

```sql
UPDATE url_validator_config
SET enabled = 0
WHERE rule_key = 'BLOCK_IP_ADDRESSES';
```

To re-enable:

```sql
UPDATE url_validator_config
SET enabled = 1
WHERE rule_key = 'BLOCK_IP_ADDRESSES';
```

**Note:** Configuration changes take effect within 60 seconds (cache TTL).

### Available Configuration Rules

| Rule Key | Description | Default |
|----------|-------------|---------|
| `ALLOWED_SCHEMES` | Only allow HTTP/HTTPS protocols | Enabled |
| `BLOCK_IP_ADDRESSES` | Block numeric IP addresses (e.g., 192.168.1.1) | Enabled |
| `BLOCK_PRIVATE_IPS` | Block private IP ranges (RFC1918) | Enabled |
| `REQUIRE_PUBLIC_SUFFIX` | Require legitimate TLDs (.com, .org, etc.) | Enabled |
| `REQUIRE_HTML_CONTENT` | Only allow HTML content (no downloads) | Enabled |
| `VERIFY_ACCESSIBILITY` | Perform HTTP probe to check accessibility | Enabled |
| `FOLLOW_REDIRECTS` | Follow and validate redirect destinations | Enabled |
| `MAX_URL_LENGTH` | Enforce 2048 character limit | Enabled |

### Modifying Rule Parameters

Example: Change maximum URL length to 4096:

```sql
UPDATE url_validator_config
SET metadata = JSON_SET(metadata, '$.max_length', 4096)
WHERE rule_key = 'MAX_URL_LENGTH';
```

Example: Change redirect limit to 10:

```sql
UPDATE url_validator_config
SET metadata = JSON_SET(metadata, '$.max_redirects', 10)
WHERE rule_key = 'FOLLOW_REDIRECTS';
```

Example: Change HTTP probe timeout to 10 seconds:

```sql
UPDATE url_validator_config
SET metadata = JSON_SET(metadata, '$.timeout_ms', 10000)
WHERE rule_key = 'VERIFY_ACCESSIBILITY';
```

---

## Testing the System

### Test Cases

#### 1. Valid URL (Should Pass)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

Expected: `"verdict": "VALID"`

#### 2. IP Address (Should Fail)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://192.168.1.1"}'
```

Expected: `"verdict": "INVALID"`, `"rejection_reason": "IP_ADDRESS_NOT_ALLOWED"`

#### 3. Private IP (Should Fail)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:8080"}'
```

Expected: `"verdict": "INVALID"`, `"rejection_reason": "LOCALHOST_NOT_ALLOWED"`

#### 4. Invalid Domain (Should Fail)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://example.local"}'
```

Expected: `"verdict": "INVALID"`, `"rejection_reason": "INVALID_DOMAIN"`

#### 5. Non-HTML Content (Should Fail)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/file.pdf"}'
```

Expected: `"verdict": "INVALID"`, `"rejection_reason": "INVALID_CONTENT_TYPE"`

### Frontend Testing

1. Navigate to `/promote` page
2. Click "Create Campaign" tab
3. Enter a URL in the "Target URL" field
4. Wait 500ms (debounce delay)
5. Observe validation status:
   - **Blue** = Verifying
   - **Green** = Valid
   - **Red** = Invalid
   - **Yellow** = Retry needed

---

## Monitoring & Audit

### View Recent Validations

```sql
SELECT
  url,
  verdict,
  rejection_reason,
  validation_time_ms,
  created_at
FROM url_validation_logs
ORDER BY created_at DESC
LIMIT 20;
```

### View Validation Statistics

```sql
SELECT
  verdict,
  COUNT(*) as count,
  AVG(validation_time_ms) as avg_time_ms,
  MAX(validation_time_ms) as max_time_ms
FROM url_validation_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY verdict;
```

### View Rejection Reasons

```sql
SELECT
  rejection_reason,
  COUNT(*) as count
FROM url_validation_logs
WHERE verdict = 'INVALID'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY rejection_reason
ORDER BY count DESC;
```

### View Failed Rules

```sql
SELECT
  url,
  failed_rules,
  rejection_reason,
  created_at
FROM url_validation_logs
WHERE failed_rules IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
```

### View Rate Limit Status

```sql
SELECT
  identifier,
  identifier_type,
  request_count,
  window_start,
  TIMESTAMPDIFF(SECOND, window_start, NOW()) as seconds_elapsed
FROM url_validator_rate_limits
WHERE window_start >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)
ORDER BY window_start DESC;
```

---

## Rate Limiting

### Current Limits

- **Per User**: 10 requests per minute
- **Per IP**: 50 requests per minute

### Modifying Rate Limits

Edit `engage-backend/src/middleware/validatorRateLimit.js`:

```javascript
const LIMITS = {
  USER: 10,  // Change to desired limit
  IP: 50     // Change to desired limit
};
```

Then restart the server.

### Clearing Rate Limits (Emergency)

```sql
-- Clear all rate limits
DELETE FROM url_validator_rate_limits;

-- Clear rate limits for specific user
DELETE FROM url_validator_rate_limits
WHERE identifier = 'USER_ID' AND identifier_type = 'USER';

-- Clear rate limits for specific IP
DELETE FROM url_validator_rate_limits
WHERE identifier = 'IP_ADDRESS' AND identifier_type = 'IP';
```

---

## Troubleshooting

### Issue: All URLs Return RETRY Verdict

**Cause:** Database connection issue or configuration not loaded

**Fix:**
1. Check database connectivity
2. Verify configuration table exists:
   ```sql
   SHOW TABLES LIKE 'url_validator_config';
   ```
3. Verify rules are enabled:
   ```sql
   SELECT COUNT(*) FROM url_validator_config WHERE enabled = 1;
   ```

### Issue: Validation Takes Too Long (>2s)

**Cause:** Network latency or slow target servers

**Fix:** Reduce HTTP probe timeout:
```sql
UPDATE url_validator_config
SET metadata = JSON_SET(metadata, '$.timeout_ms', 3000)
WHERE rule_key = 'VERIFY_ACCESSIBILITY';
```

### Issue: Legitimate URLs Are Rejected

**Cause:** Overly strict rules

**Fix:** Temporarily disable specific rule to test:
```sql
-- Disable HTML-only requirement
UPDATE url_validator_config
SET enabled = 0
WHERE rule_key = 'REQUIRE_HTML_CONTENT';
```

### Issue: Frontend Shows "Network Error"

**Cause:** CORS or API endpoint not accessible

**Fix:**
1. Check backend server is running
2. Verify CORS settings in `engage-backend/src/config.js`
3. Check browser console for errors
4. Test API endpoint directly with curl

### Issue: Validation Never Completes

**Cause:** Frontend debounce delay or network issue

**Fix:**
1. Wait at least 500ms after typing
2. Check browser network tab for failed requests
3. Try clicking "Retry Validation" button if shown

---

## Performance Optimization

### Database Indexes

The migration creates these indexes automatically:
- `idx_correlation_id` - Fast lookup by correlation ID
- `idx_user_id` - Fast lookup by user
- `idx_verdict` - Fast filtering by verdict
- `idx_created_at` - Fast time-based queries
- `idx_user_verdict` - Composite index for user stats

### Log Cleanup

To prevent unbounded growth, schedule periodic cleanup:

```sql
-- Delete logs older than 30 days
DELETE FROM url_validation_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Keep only last 100,000 logs
DELETE FROM url_validation_logs
WHERE id < (
  SELECT id FROM (
    SELECT id FROM url_validation_logs
    ORDER BY id DESC
    LIMIT 1 OFFSET 100000
  ) tmp
);
```

Add to cron (daily at 3 AM):
```bash
0 3 * * * mysql -u engage_user -p"engage@25" engage_swap -e "DELETE FROM url_validation_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);"
```

---

## Security Considerations

### SSRF Protection

The validator blocks:
- Private IP ranges (10.x, 192.168.x, 172.16-31.x)
- Localhost (127.x, ::1)
- Link-local addresses (169.254.x)
- IPv6 unique local addresses (fc00::, fd00::)

### DoS Protection

- Rate limiting (10 req/min per user, 50 req/min per IP)
- Request timeout (5 seconds default)
- Maximum redirects (5 by default)
- URL length limit (2048 characters)

### DNS Rebinding Protection

The validator checks hostnames at validation time and after following redirects, preventing DNS rebinding attacks.

---

## API Reference

### POST /validator/check-url

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response (Valid):**
```json
{
  "verdict": "VALID",
  "message": "URL is valid and accessible",
  "correlation_id": "uuid",
  "validation_time_ms": 1234
}
```

**Response (Invalid):**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "IP_ADDRESS_NOT_ALLOWED",
  "message": "URLs with IP addresses are not allowed. Please use a domain name.",
  "user_friendly": true,
  "correlation_id": "uuid",
  "validation_time_ms": 123
}
```

**Response (Retry):**
```json
{
  "verdict": "RETRY",
  "rejection_reason": "VALIDATION_TIMEOUT",
  "message": "URL validation timed out. Please try again.",
  "user_friendly": false,
  "correlation_id": "uuid",
  "validation_time_ms": 5000
}
```

**Response (Rate Limited):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many validation requests. Please try again in 45 seconds.",
    "retry_after_seconds": 45,
    "limit": 10,
    "reset_at": "2025-10-18T12:35:00.000Z"
  }
}
```

---

## Summary

✅ **Database Migration**: Run `026_add_url_validator_system.sql`
✅ **Backend**: Already integrated (`/validator/check-url` endpoint)
✅ **Frontend**: Already integrated (Promote.jsx with live validation)
✅ **Configuration**: 8 rules, all enabled by default
✅ **Rate Limiting**: 10/min per user, 50/min per IP
✅ **Monitoring**: Full audit trail in `url_validation_logs`

**The system is production-ready!** 🎉

Run the migration and restart your servers to activate the URL validator.
