# EngageSwap URL Validator - Technical Specification

## 1. Overview

A synchronous URL validation service that runs when users paste campaign URLs, blocking unsafe/policy-violating destinations before campaign creation.

**Design Principles:**
- **Synchronous only** (no async deep scans in MVP)
- **Sub-2s response time** (95th percentile)
- **Fail-closed** (default deny, explicit allow)
- **User-friendly** (clear, actionable error messages)
- **Configurable** (policy switches, no code changes)

---

## 2. API Contract

### 2.1 Request

**Endpoint:** `POST /api/campaigns/validate-url`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "url": "https://example.com/landing-page"
}
```

**Validation:**
- `url` required, string, 1-2048 characters
- Must be well-formed URL (parseable)

### 2.2 Response

**Success (200 OK):**
```json
{
  "status": "VALID" | "INVALID" | "RETRY",
  "url": "https://example.com/landing-page",
  "final_url": "https://example.com/final-destination",
  "reason": null | "Human-readable reason string",
  "details": {
    "redirects": 2,
    "content_type": "text/html; charset=utf-8",
    "duration_ms": 1234,
    "checks_passed": ["https", "public_host", "html_content"],
    "checks_failed": []
  },
  "verified_at": "2025-10-18T12:34:56.789Z"
}
```

**Status Meanings:**

| Status | Meaning | Frontend Action |
|--------|---------|-----------------|
| `VALID` | URL passed all checks | Enable "Create Campaign" button, show ✓ |
| `INVALID` | URL violated policy | Keep button disabled, show reason |
| `RETRY` | Network timeout/error | Show "Retry" button, allow manual retry |

**Error (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid URL format"
  }
}
```

**Error (429 Too Many Requests):**
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many validation requests. Try again in 60 seconds."
  }
}
```

---

## 3. Validation Rules Engine

### 3.1 Rule Categories

**Category 1: URL Structure**
- Length ≤ 2048 characters
- Valid URL syntax
- HTTPS scheme only
- No credentials in URL (`user:pass@`)
- No fragments that look like exploits

**Category 2: Hostname Security**
- Must be valid public hostname
- No IP addresses (IPv4/IPv6)
- No private ranges (RFC1918, link-local)
- No localhost/loopback
- No `.local` TLD
- Valid public suffix (from Public Suffix List)
- Not in domain denylist

**Category 3: Content Security**
- Final response is HTML
- No `Content-Disposition: attachment`
- No direct file extensions
- No auto-download triggers
- Redirect chain ≤ 3 hops
- All redirects HTTPS → HTTPS only

**Category 4: Policy Restrictions**
- YouTube watch URL blocking (configurable)
- Category-based blocking (adult/gambling/piracy)
- Keyword-based screening
- Malware/phishing domain check

### 3.2 Validation Flow

```
Input URL
    ↓
┌─────────────────────────────────────┐
│ Phase 1: Pre-Flight Checks          │
│ - Parse & normalize                 │
│ - Length check (≤2048)              │
│ - Scheme check (https:// only)      │
│ - URL syntax validation             │
└────────────┬────────────────────────┘
             ↓ PASS
┌─────────────────────────────────────┐
│ Phase 2: Hostname Validation        │
│ - Extract hostname                  │
│ - IP address check (reject)         │
│ - Private IP check (reject)         │
│ - Localhost check (reject)          │
│ - Public suffix validation          │
│ - Domain denylist check             │
└────────────┬────────────────────────┘
             ↓ PASS
┌─────────────────────────────────────┐
│ Phase 3: Extension Block Check      │
│ - Check for direct file extensions  │
│   (.exe .apk .zip .pdf etc.)        │
│ - Reject if matched                 │
└────────────┬────────────────────────┘
             ↓ PASS
┌─────────────────────────────────────┐
│ Phase 4: HTTP Probe                 │
│ - HEAD request first (with timeout) │
│ - Follow ≤3 HTTPS redirects         │
│ - Check Content-Type header         │
│ - Check Content-Disposition         │
│ - Fallback to GET if HEAD fails     │
│ - Total timeout: 2000ms             │
└────────────┬────────────────────────┘
             ↓ PASS
┌─────────────────────────────────────┐
│ Phase 5: Content Analysis           │
│ - Verify Content-Type = text/html   │
│ - Sniff first ~20KB if needed       │
│ - Extract <title> if possible       │
│ - Check for category keywords       │
│ - Platform-specific checks          │
│   (e.g., YouTube watch block)       │
└────────────┬────────────────────────┘
             ↓ PASS
┌─────────────────────────────────────┐
│ Result: VALID                       │
│ - Return final URL                  │
│ - Return verification details       │
└─────────────────────────────────────┘

ANY FAILURE → INVALID with reason
TIMEOUT/ERROR → RETRY with retry flag
```

---

## 4. Rejection Reasons (User-Facing Messages)

### 4.1 Standard Rejection Messages

```javascript
const REJECTION_REASONS = {
  // Security
  NO_HTTPS: "Only HTTPS URLs are allowed for security.",
  PRIVATE_IP: "Private IP addresses are not allowed. Use a public domain.",
  LOCALHOST: "Localhost URLs are not allowed.",
  IP_ADDRESS: "Direct IP addresses are not allowed. Use a domain name.",

  // Content
  DIRECT_FILE: "Direct file downloads are not allowed. Link to an HTML landing page instead.",
  AUTO_DOWNLOAD: "URLs that trigger automatic downloads are not allowed.",
  NON_HTML: "Only HTML web pages are allowed. This appears to be {type}.",
  ATTACHMENT: "URLs with forced downloads (Content-Disposition: attachment) are not allowed.",

  // Policy
  YOUTUBE_WATCH: "Direct YouTube watch URLs are not allowed. Create a landing page that embeds your video.",
  RESTRICTED_CATEGORY: "This category ({category}) is not permitted on EngageSwap.",
  ADULT_CONTENT: "Adult content is not permitted on EngageSwap.",
  GAMBLING: "Gambling sites are not permitted on EngageSwap.",
  PIRACY: "Piracy or copyright violation sites are not permitted.",
  MALWARE: "This URL has been flagged as potentially malicious.",

  // Denylists
  BLOCKED_DOMAIN: "This domain is not allowed on EngageSwap.",
  BLOCKED_TLD: "URLs with .{tld} domains are not allowed.",

  // Technical
  TOO_MANY_REDIRECTS: "Too many redirects ({count}). Maximum allowed: 3.",
  MIXED_PROTOCOL: "Redirects must stay on HTTPS. HTTP redirects are not allowed.",
  URL_TOO_LONG: "URL is too long. Maximum: 2048 characters.",
  INVALID_FORMAT: "Invalid URL format.",

  // Network
  TIMEOUT: "Could not verify URL (timeout). Please try again.",
  DNS_FAILED: "Could not resolve domain. Check the URL and try again.",
  CONNECTION_FAILED: "Could not connect to the URL. Please verify it's accessible.",
  UNKNOWN_ERROR: "An error occurred during verification. Please try again."
};
```

### 4.2 Reason Template System

```javascript
function formatReason(reasonKey, params = {}) {
  let message = REJECTION_REASONS[reasonKey];

  // Replace placeholders
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key]);
  });

  return message;
}

// Usage examples:
formatReason('NON_HTML', { type: 'application/pdf' })
// → "Only HTML web pages are allowed. This appears to be application/pdf."

formatReason('RESTRICTED_CATEGORY', { category: 'gambling' })
// → "This category (gambling) is not permitted on EngageSwap."

formatReason('TOO_MANY_REDIRECTS', { count: 5 })
// → "Too many redirects (5). Maximum allowed: 3."
```

---

## 5. Configuration Schema

### 5.1 Validator Configuration Table

**Database Table:** `url_validator_config`

```sql
CREATE TABLE url_validator_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value JSON NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Configuration Keys

```sql
-- Timeouts and limits
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'timeouts',
  JSON_OBJECT(
    'total_ms', 2000,
    'connect_ms', 1000,
    'read_ms', 1500
  ),
  'HTTP request timeout settings (milliseconds)'
),
(
  'redirect_limits',
  JSON_OBJECT(
    'max_redirects', 3,
    'allow_http_redirect', false
  ),
  'Redirect following limits and rules'
),
(
  'rate_limits',
  JSON_OBJECT(
    'per_user_per_minute', 10,
    'per_user_per_hour', 50
  ),
  'Rate limiting for validation requests'
);

-- Blocked file extensions
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'blocked_extensions',
  JSON_ARRAY(
    'exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm',
    'apk', 'ipa', 'app',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'iso', 'img', 'bin'
  ),
  'File extensions that are blocked (direct downloads)'
);

-- Blocked TLDs
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'blocked_tlds',
  JSON_ARRAY('xxx', 'adult', 'porn', 'sex', 'local'),
  'Top-level domains that are completely blocked'
);

-- Domain denylist
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'domain_denylist',
  JSON_ARRAY(
    'example-malware.com',
    'known-phishing-site.net'
  ),
  'Specific domains that are blocked'
);

-- Category keywords (for content screening)
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'category_keywords',
  JSON_OBJECT(
    'adult', JSON_ARRAY('xxx', 'porn', 'adult', 'sex', 'nsfw', 'erotic'),
    'gambling', JSON_ARRAY('casino', 'poker', 'betting', 'gamble', 'lottery', 'slots'),
    'piracy', JSON_ARRAY('torrent', 'crack', 'keygen', 'warez', 'pirate')
  ),
  'Keywords for category detection (checked in title + first 20KB HTML)'
);

-- Platform-specific policies
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'platform_policies',
  JSON_OBJECT(
    'block_youtube_watch', true,
    'block_direct_social_posts', false,
    'require_landing_page', true
  ),
  'Platform-specific validation policies'
);

-- Private IP ranges (RFC1918 + others)
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'private_ip_ranges',
  JSON_ARRAY(
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16',
    'fc00::/7',
    'fe80::/10',
    '::1/128'
  ),
  'Private IP address ranges to block (CIDR notation)'
);

-- Content-Type allowlist
INSERT INTO url_validator_config (config_key, config_value, description) VALUES
(
  'allowed_content_types',
  JSON_ARRAY(
    'text/html',
    'application/xhtml+xml'
  ),
  'Content-Types that are allowed for campaign URLs'
);
```

### 5.3 Configuration Access Pattern

```javascript
// Cache configuration for 5 minutes
let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000;

async function getValidatorConfig() {
  const now = Date.now();

  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return configCache;
  }

  const [rows] = await db.query(
    'SELECT config_key, config_value FROM url_validator_config'
  );

  const config = {};
  rows.forEach(row => {
    config[row.config_key] = row.config_value;
  });

  configCache = config;
  configCacheTime = now;

  return config;
}
```

---

## 6. Validation Logging & Audit

### 6.1 Audit Log Table

```sql
CREATE TABLE url_validation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  input_url VARCHAR(2048) NOT NULL,
  final_url VARCHAR(2048),
  status ENUM('VALID', 'INVALID', 'RETRY') NOT NULL,
  reason VARCHAR(500),
  duration_ms INT NOT NULL,
  redirect_count INT DEFAULT 0,
  content_type VARCHAR(100),
  checks_passed JSON,
  checks_failed JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  KEY idx_user_id (user_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  KEY idx_user_date (user_id, created_at),

  CONSTRAINT fk_validation_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto-cleanup old logs (7 days retention)
CREATE EVENT cleanup_url_validation_logs
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM url_validation_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### 6.2 Log Entry Format

```javascript
{
  user_id: 5,
  input_url: "https://example.com/page",
  final_url: "https://example.com/final",
  status: "VALID",
  reason: null,
  duration_ms: 1234,
  redirect_count: 1,
  content_type: "text/html; charset=utf-8",
  checks_passed: [
    "https_scheme",
    "public_hostname",
    "valid_suffix",
    "no_blocked_extension",
    "html_content",
    "no_attachment",
    "category_safe"
  ],
  checks_failed: [],
  created_at: "2025-10-18T12:34:56.789Z"
}
```

---

## 7. Frontend Integration

### 7.1 UX States

```javascript
const URL_VERIFICATION_STATES = {
  IDLE: {
    message: null,
    icon: null,
    canCreate: false,
    showRetry: false
  },

  VERIFYING: {
    message: "Verifying URL...",
    icon: "⏳",
    canCreate: false,
    showRetry: false
  },

  VALID: {
    message: "URL verified ✓",
    icon: "✓",
    color: "green",
    canCreate: true,
    showRetry: false
  },

  INVALID: {
    message: "{reason}", // Dynamic from API
    icon: "✗",
    color: "red",
    canCreate: false,
    showRetry: false
  },

  RETRY: {
    message: "Could not verify URL. Please try again.",
    icon: "⚠",
    color: "yellow",
    canCreate: false,
    showRetry: true
  }
};
```

### 7.2 Component Logic (React Example)

```javascript
const [urlState, setUrlState] = useState('IDLE');
const [urlMessage, setUrlMessage] = useState(null);
const [verifiedUrl, setVerifiedUrl] = useState(null);

// Debounced validation on URL change
useEffect(() => {
  if (!url || url.length < 10) {
    setUrlState('IDLE');
    return;
  }

  const timer = setTimeout(() => {
    validateUrl(url);
  }, 500); // 500ms debounce

  return () => clearTimeout(timer);
}, [url]);

async function validateUrl(inputUrl) {
  setUrlState('VERIFYING');
  setUrlMessage(null);

  try {
    const response = await api.post('/campaigns/validate-url', {
      url: inputUrl
    });

    if (response.status === 'VALID') {
      setUrlState('VALID');
      setVerifiedUrl(response.final_url);
      setUrlMessage("URL verified ✓");
    } else if (response.status === 'INVALID') {
      setUrlState('INVALID');
      setUrlMessage(response.reason);
    } else if (response.status === 'RETRY') {
      setUrlState('RETRY');
      setUrlMessage("Could not verify URL. Please try again.");
    }
  } catch (error) {
    setUrlState('RETRY');
    setUrlMessage("Verification failed. Please try again.");
  }
}

function handleRetry() {
  validateUrl(url);
}
```

### 7.3 UI Component Structure

```jsx
<div className="url-validation-section">
  {/* URL Input */}
  <input
    type="url"
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    placeholder="https://example.com/landing-page"
    className={getInputClass(urlState)}
  />

  {/* Verification Status */}
  {urlState !== 'IDLE' && (
    <div className={`validation-message ${urlState.toLowerCase()}`}>
      <span className="icon">{getIcon(urlState)}</span>
      <span className="message">{urlMessage}</span>

      {urlState === 'RETRY' && (
        <button onClick={handleRetry} className="retry-btn">
          Retry
        </button>
      )}
    </div>
  )}

  {/* Create Button */}
  <button
    onClick={handleCreateCampaign}
    disabled={urlState !== 'VALID'}
    className="create-campaign-btn"
  >
    Create Campaign
  </button>
</div>
```

### 7.4 Visual Feedback

**State: IDLE**
```
┌─────────────────────────────────────┐
│ Campaign URL                        │
│ https://example.com/page        [ ]│
└─────────────────────────────────────┘
[ Create Campaign ] (disabled, gray)
```

**State: VERIFYING**
```
┌─────────────────────────────────────┐
│ Campaign URL                        │
│ https://example.com/page        [✓]│
└─────────────────────────────────────┘
⏳ Verifying URL...

[ Create Campaign ] (disabled, gray)
```

**State: VALID**
```
┌─────────────────────────────────────┐
│ Campaign URL                        │
│ https://example.com/page        [✓]│
└─────────────────────────────────────┘
✓ URL verified (green)

[ Create Campaign ] (enabled, blue)
```

**State: INVALID**
```
┌─────────────────────────────────────┐
│ Campaign URL                        │
│ https://example.com/file.pdf    [✗]│
└─────────────────────────────────────┘
✗ Direct file downloads are not allowed.
  Link to an HTML landing page instead.
  (red)

[ Create Campaign ] (disabled, gray)
```

**State: RETRY**
```
┌─────────────────────────────────────┐
│ Campaign URL                        │
│ https://example.com/page        [⚠]│
└─────────────────────────────────────┘
⚠ Could not verify URL. Please try again.
  (yellow)                    [Retry]

[ Create Campaign ] (disabled, gray)
```

---

## 8. Performance Requirements

### 8.1 Response Time SLAs

| Percentile | Target | Maximum |
|------------|--------|---------|
| P50 | ≤ 800ms | 1200ms |
| P95 | ≤ 1500ms | 2000ms |
| P99 | ≤ 2000ms | 3000ms |

### 8.2 Optimization Strategies

**DNS Caching:**
- Cache successful DNS lookups for 5 minutes
- Reduce repeated lookups for same domain

**Connection Pooling:**
- Reuse HTTP connections where possible
- Keep-alive for multiple requests to same host

**Early Rejection:**
- Check cheap rules first (scheme, extension)
- Defer expensive checks (HTTP probe) to last

**Parallel Checks:**
- Run independent checks concurrently
- DNS + extension check in parallel

**HEAD Before GET:**
- Try HEAD first (lighter)
- Fallback to GET only if HEAD fails
- Limit GET response to first 20KB

**Timeout Hierarchy:**
```
Total timeout: 2000ms
  ├─ DNS resolution: 500ms
  ├─ TCP connect: 500ms
  ├─ TLS handshake: 500ms
  └─ HTTP request/response: 500ms
```

---

## 9. Rate Limiting

### 9.1 Rate Limit Rules

```javascript
const RATE_LIMITS = {
  // Per user
  PER_USER_PER_MINUTE: 10,
  PER_USER_PER_HOUR: 50,
  PER_USER_PER_DAY: 200,

  // Per IP (prevents abuse)
  PER_IP_PER_MINUTE: 20,
  PER_IP_PER_HOUR: 100
};
```

### 9.2 Rate Limit Implementation

Use existing rate-limiting middleware or implement with Redis:

```javascript
async function checkRateLimit(userId, ip) {
  const userKey = `url_validate:user:${userId}`;
  const ipKey = `url_validate:ip:${ip}`;

  const [userCount, ipCount] = await Promise.all([
    redis.incr(userKey),
    redis.incr(ipKey)
  ]);

  if (userCount === 1) {
    await redis.expire(userKey, 60); // 1 minute window
  }

  if (ipCount === 1) {
    await redis.expire(ipKey, 60);
  }

  if (userCount > RATE_LIMITS.PER_USER_PER_MINUTE) {
    throw new Error('RATE_LIMIT_USER');
  }

  if (ipCount > RATE_LIMITS.PER_IP_PER_MINUTE) {
    throw new Error('RATE_LIMIT_IP');
  }
}
```

---

## 10. Test Cases

### 10.1 Must-Reject URLs

```javascript
const MUST_REJECT = [
  {
    url: 'http://example.com/page',
    reason: 'NO_HTTPS',
    description: 'No HTTPS'
  },
  {
    url: 'https://192.168.0.5/page',
    reason: 'PRIVATE_IP',
    description: 'Private IP address'
  },
  {
    url: 'https://site.com/app.apk',
    reason: 'DIRECT_FILE',
    description: 'Direct file download'
  },
  {
    url: 'https://youtube.com/watch?v=abc123',
    reason: 'YOUTUBE_WATCH',
    description: 'YouTube watch URL (if policy enabled)'
  },
  {
    url: 'https://example.com/download?attachment=1',
    reason: 'AUTO_DOWNLOAD',
    description: 'Auto-download trigger'
  },
  {
    url: 'https://gamble-now.xxx/',
    reason: 'BLOCKED_TLD',
    description: 'Restricted TLD'
  },
  {
    url: 'https://localhost/page',
    reason: 'LOCALHOST',
    description: 'Localhost'
  },
  {
    url: 'https://127.0.0.1/api',
    reason: 'LOCALHOST',
    description: 'Loopback IP'
  },
  {
    url: 'https://site.com/file.exe',
    reason: 'DIRECT_FILE',
    description: 'Executable file'
  },
  {
    url: 'https://10.0.0.1/admin',
    reason: 'PRIVATE_IP',
    description: 'RFC1918 private range'
  }
];
```

### 10.2 Must-Allow URLs (if HTML + category-safe)

```javascript
const MUST_ALLOW = [
  {
    url: 'https://brand.com/product/alpha',
    description: 'Standard HTTPS landing page'
  },
  {
    url: 'https://blog.example.com/launch-post',
    description: 'Blog post subdomain'
  },
  {
    url: 'https://apps.apple.com/app/id123456789',
    description: 'App Store link'
  },
  {
    url: 'https://notion.site/your-landing',
    description: 'Notion public page'
  },
  {
    url: 'https://twitter.com/brand/status/123',
    description: 'Twitter status page'
  },
  {
    url: 'https://github.com/user/repo',
    description: 'GitHub repository'
  }
];
```

### 10.3 Edge Cases

```javascript
const EDGE_CASES = [
  {
    url: 'https://example.com/page?param=value#section',
    expected: 'VALID',
    description: 'URL with query params and fragment'
  },
  {
    url: 'https://sub.sub.example.co.uk/path',
    expected: 'VALID',
    description: 'Multi-level subdomain with ccTLD'
  },
  {
    url: 'https://example.com/' + 'a'.repeat(2048),
    expected: 'INVALID',
    description: 'URL too long'
  },
  {
    url: 'https://example.com:8080/page',
    expected: 'VALID',
    description: 'Custom HTTPS port (allowed)'
  },
  {
    url: 'https://example.com/page.html',
    expected: 'VALID',
    description: '.html extension (allowed, is HTML)'
  },
  {
    url: 'https://example.com/page.PHP',
    expected: 'VALID',
    description: 'Dynamic page extension (allowed if returns HTML)'
  }
];
```

---

## 11. Implementation Phases

### Phase 1: Core Validator (Week 1)
- [x] URL parsing & normalization
- [x] Pre-flight checks (scheme, length, syntax)
- [x] Hostname validation (IP, private ranges)
- [x] Extension blocking
- [x] Configuration loader
- [x] Basic logging

### Phase 2: HTTP Probing (Week 1-2)
- [x] HTTP HEAD/GET with redirects
- [x] Timeout management
- [x] Content-Type validation
- [x] Content-Disposition check
- [x] Redirect chain tracking

### Phase 3: Content Analysis (Week 2)
- [x] HTML sniffing
- [x] Title extraction
- [x] Category keyword matching
- [x] Platform-specific checks (YouTube, etc.)

### Phase 4: Frontend Integration (Week 2-3)
- [x] API endpoint implementation
- [x] Rate limiting
- [x] Frontend component
- [x] Debounced validation
- [x] Error handling & retry logic

### Phase 5: Testing & Polish (Week 3)
- [x] Unit tests for all rules
- [x] Integration tests
- [x] Performance testing
- [x] Edge case validation
- [x] Documentation

---

## 12. Success Metrics

### 12.1 Performance Metrics
- 95% of validations complete in <2s
- 99% of validations complete in <3s
- DNS cache hit rate >80%
- Connection reuse rate >60%

### 12.2 Accuracy Metrics
- False positive rate <1% (valid URLs wrongly rejected)
- False negative rate <0.1% (policy-violating URLs wrongly accepted)
- Category detection accuracy >95%

### 12.3 User Experience Metrics
- Campaign creation abandonment rate (track before/after)
- Average time from paste to create
- Retry button click rate (should be <5%)
- Support tickets about URL validation

---

## 13. Future Enhancements (V2+)

### 13.1 Async Deep Scanning
- Submit URL for background malware/phishing check
- Queue-based processing
- Update validation status asynchronously
- Notify user if previously-validated URL becomes flagged

### 13.2 Machine Learning
- Train model on approved vs. rejected URLs
- Content similarity detection
- Anomaly detection for new attack vectors

### 13.3 URL Reputation System
- Track validation history per domain
- Auto-approve known-good domains
- Flag domains with high rejection rate

### 13.4 Advanced Category Detection
- Computer vision for screenshot analysis
- NLP for content classification
- External API integration (Google Safe Browsing, etc.)

---

## 14. Security Considerations

### 14.1 SSRF Prevention
- Never follow redirects to private IPs
- Block cloud metadata endpoints
- Validate final URL again after redirects

### 14.2 DoS Prevention
- Rate limiting per user/IP
- Timeout all HTTP requests
- Limit response body size
- Connection pooling limits

### 14.3 Privacy
- Don't log sensitive URL parameters
- Hash URLs in analytics
- Auto-delete logs after retention period

### 14.4 Configuration Security
- Audit log all config changes
- Require admin role for config updates
- Version control configuration
- Test config changes in staging first

---

## 15. Monitoring & Alerts

### 15.1 Key Metrics to Monitor

```javascript
const METRICS = {
  // Performance
  'validator.duration.p50': 'Median validation time',
  'validator.duration.p95': '95th percentile validation time',
  'validator.duration.p99': '99th percentile validation time',

  // Results
  'validator.result.valid': 'Count of VALID results',
  'validator.result.invalid': 'Count of INVALID results',
  'validator.result.retry': 'Count of RETRY results',

  // Errors
  'validator.error.timeout': 'Count of timeout errors',
  'validator.error.dns': 'Count of DNS failures',
  'validator.error.connection': 'Count of connection failures',

  // Rules
  'validator.rule.no_https': 'Count of HTTP scheme rejections',
  'validator.rule.private_ip': 'Count of private IP rejections',
  'validator.rule.direct_file': 'Count of file extension rejections',
  'validator.rule.youtube_watch': 'Count of YouTube rejections',

  // Rate limiting
  'validator.rate_limit.user': 'Count of user rate limit hits',
  'validator.rate_limit.ip': 'Count of IP rate limit hits'
};
```

### 15.2 Alert Conditions

```javascript
const ALERTS = {
  HIGH_ERROR_RATE: {
    condition: 'error_rate > 10% over 5 minutes',
    severity: 'warning',
    action: 'Investigate validator service health'
  },

  SLOW_RESPONSE: {
    condition: 'p95_duration > 3000ms over 10 minutes',
    severity: 'warning',
    action: 'Check external site responsiveness'
  },

  HIGH_REJECTION_RATE: {
    condition: 'rejection_rate > 80% over 15 minutes',
    severity: 'info',
    action: 'Review recent rejections for patterns'
  },

  RATE_LIMIT_SPIKE: {
    condition: 'rate_limit_hits > 100 over 5 minutes',
    severity: 'warning',
    action: 'Potential abuse or misconfigured client'
  }
};
```

---

## 16. Summary

This specification provides:

✅ **Synchronous validation** (<2s, 95th percentile)
✅ **Clear verdicts** (VALID/INVALID/RETRY)
✅ **User-friendly messages** (actionable, specific)
✅ **Configurable policies** (no code changes)
✅ **Comprehensive logging** (7-day retention)
✅ **Frontend integration** (debounced, retry-able)
✅ **Performance optimized** (caching, early rejection)
✅ **Security hardened** (SSRF prevention, rate limiting)
✅ **Test coverage** (must-reject, must-allow, edge cases)
✅ **Monitoring ready** (metrics, alerts)

The validator is **framework-agnostic**, **policy-driven**, and **ready for future enhancements** (async deep scans, ML, reputation system).
