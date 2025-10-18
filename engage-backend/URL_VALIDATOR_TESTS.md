# URL Validator - Test Cases & Validation

## Overview

The updated URL validator now uses the **Public Suffix List (PSL)** via the `tldts` library to properly validate all public TLDs including:
- Country-code TLDs (ccTLDs): `.in`, `.uk`, `.au`, `.jp`, etc.
- Second-level registries: `.co.uk`, `.com.au`, `.co.in`, etc.
- New gTLDs: `.dev`, `.app`, `.tech`, etc.
- Internationalized Domain Names (IDNs): `xn--` encoded domains

## Key Changes

### ✅ What's New
- **HTTPS-only enforcement** (no HTTP allowed)
- **PSL-based domain validation** (supports all legitimate public TLDs)
- **Automatic Punycode normalization** for IDNs
- **File extension blocking** (.apk, .exe, .zip, .pdf, etc.)
- **Content-Disposition header check** (blocks file downloads)
- **Maximum 3 redirects** (reduced from 5)
- **Enhanced error messages** with clearer guidance

### 🚫 What's Blocked
- HTTP URLs (only HTTPS allowed)
- IP addresses (192.168.1.1, etc.)
- Localhost (127.0.0.1, localhost)
- Private IP ranges (RFC1918)
- Invalid/fake TLDs (non-ICANN domains)
- .onion domains (Tor hidden services)
- Direct file downloads (.apk, .exe, .zip, .pdf, etc.)
- Content-Disposition: attachment responses
- **Video platform URLs** (YouTube, Vimeo, TikTok, Instagram, Facebook, Twitter/X, etc.)

---

## Acceptance Tests

### ✅ Should PASS

#### 1. Valid Indian Domain (.in)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://mypeercloud.in/"}'
```
**Expected:** `"verdict": "VALID"`

#### 2. Valid UK Domain (.co.uk)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.co.uk/"}'
```
**Expected:** `"verdict": "VALID"`

#### 3. Valid Australian Domain (.com.au)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://brand.com.au/"}'
```
**Expected:** `"verdict": "VALID"`

#### 4. Valid New gTLD (.dev)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.example.dev/"}'
```
**Expected:** `"verdict": "VALID"`

#### 5. Valid Internationalized Domain (IDN)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://xn--e1afmkfd.xn--p1ai/"}'
```
**Expected:** `"verdict": "VALID"`
**Note:** This is "президент.рф" in Punycode

#### 6. Valid .com Domain
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```
**Expected:** `"verdict": "VALID"`

---

### ❌ Should FAIL

#### 1. HTTP Protocol (Not HTTPS)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://example.com"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "HTTPS_REQUIRED",
  "message": "Only HTTPS URLs are allowed for security. Please use https:// instead of http://",
  "user_friendly": true
}
```

#### 2. IP Address
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://192.168.0.5/"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "IP_ADDRESS_NOT_ALLOWED",
  "message": "Only public websites are allowed (no IPs or localhost).",
  "user_friendly": true
}
```

#### 3. Localhost
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://localhost/"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "LOCALHOST_NOT_ALLOWED",
  "message": "Only public websites are allowed (no IPs or localhost).",
  "user_friendly": true
}
```

#### 4. Private IP (10.x)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://10.0.0.1/"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "PRIVATE_IP_NOT_ALLOWED",
  "message": "Only public websites are allowed (no IPs or localhost).",
  "user_friendly": true
}
```

#### 5. File Download (.apk)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://site.com/app.apk"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "FILE_EXTENSION_NOT_ALLOWED",
  "message": "Direct file downloads are not allowed. Please provide a webpage URL.",
  "user_friendly": true
}
```

#### 6. File Download (.exe)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/setup.exe"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "FILE_EXTENSION_NOT_ALLOWED",
  "message": "Direct file downloads are not allowed. Please provide a webpage URL.",
  "user_friendly": true
}
```

#### 7. File Download (.zip)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/archive.zip"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "FILE_EXTENSION_NOT_ALLOWED",
  "message": "Direct file downloads are not allowed. Please provide a webpage URL.",
  "user_friendly": true
}
```

#### 8. Invalid TLD (.local)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.local/"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "INVALID_DOMAIN",
  "message": "Only public websites with a valid domain are allowed.",
  "user_friendly": true
}
```

#### 9. Tor Hidden Service (.onion)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.onion/"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "ONION_NOT_ALLOWED",
  "message": "Tor hidden services (.onion) are not allowed.",
  "user_friendly": true
}
```

#### 10. YouTube Watch URL
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "VIDEO_PLATFORM_NOT_ALLOWED",
  "message": "Video platform URLs (YouTube, Vimeo, etc.) are not allowed. Please provide your own website URL.",
  "user_friendly": true
}
```

#### 11. YouTube Shorts URL
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/shorts/abc123"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "VIDEO_PLATFORM_NOT_ALLOWED",
  "message": "Video platform URLs (YouTube, Vimeo, etc.) are not allowed. Please provide your own website URL.",
  "user_friendly": true
}
```

#### 12. YouTube Short Link (youtu.be)
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtu.be/dQw4w9WgXcQ"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "VIDEO_PLATFORM_NOT_ALLOWED",
  "message": "Video platform URLs (YouTube, Vimeo, etc.) are not allowed. Please provide your own website URL.",
  "user_friendly": true
}
```

#### 13. Vimeo URL
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vimeo.com/123456789"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "VIDEO_PLATFORM_NOT_ALLOWED",
  "message": "Video platform URLs (YouTube, Vimeo, etc.) are not allowed. Please provide your own website URL.",
  "user_friendly": true
}
```

#### 14. TikTok Video URL
```bash
curl -X POST http://localhost:5000/validator/check-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@username/video/1234567890"}'
```
**Expected:**
```json
{
  "verdict": "INVALID",
  "rejection_reason": "VIDEO_PLATFORM_NOT_ALLOWED",
  "message": "Video platform URLs (YouTube, Vimeo, etc.) are not allowed. Please provide your own website URL.",
  "user_friendly": true
}
```

---

## Complete Test Script

Run all tests at once:

```bash
#!/bin/bash
echo "=== URL Validator Test Suite ==="
echo

# Function to test URL
test_url() {
  local url=$1
  local expected=$2
  echo "Testing: $url"
  echo "Expected: $expected"

  response=$(curl -s -X POST http://localhost:5000/validator/check-url \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}")

  verdict=$(echo $response | grep -o '"verdict":"[^"]*"' | cut -d'"' -f4)

  if [ "$verdict" == "$expected" ]; then
    echo "✅ PASS"
  else
    echo "❌ FAIL - Got: $verdict"
    echo "Response: $response"
  fi
  echo
}

echo "=== SHOULD PASS ==="
test_url "https://mypeercloud.in/" "VALID"
test_url "https://example.co.uk/" "VALID"
test_url "https://brand.com.au/" "VALID"
test_url "https://docs.example.dev/" "VALID"
test_url "https://google.com" "VALID"

echo "=== SHOULD FAIL ==="
test_url "http://example.com" "INVALID"
test_url "https://192.168.0.5/" "INVALID"
test_url "https://localhost/" "INVALID"
test_url "https://10.0.0.1/" "INVALID"
test_url "https://site.com/app.apk" "INVALID"
test_url "https://example.com/setup.exe" "INVALID"
test_url "https://example.com/archive.zip" "INVALID"
test_url "https://example.local/" "INVALID"
test_url "https://example.onion/" "INVALID"
test_url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" "INVALID"
test_url "https://youtu.be/dQw4w9WgXcQ" "INVALID"
test_url "https://vimeo.com/123456789" "INVALID"
test_url "https://www.tiktok.com/@user/video/123" "INVALID"
```

Save as `test_validator.sh` and run:
```bash
chmod +x test_validator.sh
./test_validator.sh
```

---

## Frontend Testing

### Testing in the UI

1. Navigate to `/promote` page
2. Click "Create Campaign" tab
3. Enter various URLs in the "Target URL" field
4. Wait 500ms for debounced validation

### Test Cases for UI

**Valid URLs (should show green checkmark):**
- `https://mypeercloud.in/`
- `https://example.co.uk/`
- `https://docs.example.dev/`
- `https://google.com`

**Invalid URLs (should show red error):**
- `http://example.com` → "Only HTTPS URLs are allowed..."
- `https://192.168.1.1/` → "Only public websites are allowed..."
- `https://localhost/` → "Only public websites are allowed..."
- `https://example.com/app.apk` → "Direct file downloads are not allowed..."
- `https://www.youtube.com/watch?v=abc123` → "Video platform URLs (YouTube, Vimeo, etc.) are not allowed..."
- `https://youtu.be/abc123` → "Video platform URLs (YouTube, Vimeo, etc.) are not allowed..."

**Expected UI States:**
- **Blue + Spinner** = Verifying (during validation)
- **Green + ✅** = Valid URL
- **Red + ❌** = Invalid URL with error message
- **Yellow + ⚠️** = Retry needed (temporary error)

---

## PSL (Public Suffix List) Validation

### How PSL Works

The validator uses `tldts` library which:
1. Checks if hostname is an IP (`isIp === false`)
2. Validates it's an ICANN-recognized TLD (`isIcann === true`)
3. Ensures a registrable domain exists (`getDomain(host) !== null`)

### Supported TLDs

**All ICANN-recognized TLDs are supported:**
- **ccTLDs**: `.in`, `.uk`, `.au`, `.jp`, `.de`, `.fr`, `.ca`, etc.
- **Second-level**: `.co.uk`, `.com.au`, `.co.in`, `.co.jp`, etc.
- **Generic**: `.com`, `.org`, `.net`, `.edu`, `.gov`, etc.
- **New gTLDs**: `.dev`, `.app`, `.tech`, `.io`, `.ai`, etc.
- **IDNs**: Any internationalized domain with Punycode encoding

### Not Supported (Blocked)

- **Private use**: `.local`, `.internal`, `.home`, `.test`
- **Tor**: `.onion`
- **I2P**: `.i2p`
- **Non-ICANN**: Any non-standard TLD

---

## Blocked Video Platforms

The following video platforms are blocked to prevent users from gaming the system for video views:

### YouTube (all variants)
- `youtube.com/watch` - Watch pages
- `youtube.com/shorts` - Shorts videos
- `youtube.com/live` - Live streams
- `youtu.be/*` - Short links (all URLs)
- `m.youtube.com` - Mobile site
- `www.youtube.com` - Main site

### Other Video Platforms
- **Vimeo**: `vimeo.com/*`, `player.vimeo.com/*`
- **TikTok**: `tiktok.com/@*`, `tiktok.com/video/*`, `vm.tiktok.com/*`
- **Instagram**: `instagram.com/reel/*`, `instagram.com/tv/*`, `instagram.com/p/*`
- **Facebook**: `facebook.com/watch/*`, `facebook.com/reel/*`, `fb.watch/*`
- **Twitter/X**: `twitter.com/*/status/*`, `x.com/*/status/*`
- **Dailymotion**: `dailymotion.com/video/*`
- **Twitch**: `twitch.tv/videos/*`
- **Others**: Streamable, Wistia, Vidyard, Loom

**Note:** YouTube channel pages (e.g., `youtube.com/@channel`) are NOT blocked, only direct video links.

---

## Blocked File Extensions

The following extensions are blocked:

**Executables:**
- `.apk`, `.exe`, `.msi`, `.dmg`, `.pkg`, `.deb`, `.rpm`
- `.dll`, `.so`, `.sh`, `.bat`, `.cmd`, `.ps1`

**Archives:**
- `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`
- `.iso`, `.img`, `.bin`

**Documents:**
- `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`

**Media:**
- `.mp3`, `.mp4`, `.avi`, `.mkv`, `.mov`, `.flv`, `.wmv`
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`

**Other:**
- `.torrent`

---

## Monitoring Validation Results

### Check Recent Validations

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

### Check Rejection Reasons Distribution

```sql
SELECT
  rejection_reason,
  COUNT(*) as count
FROM url_validation_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY rejection_reason
ORDER BY count DESC;
```

### Check HTTPS vs HTTP Attempts

```sql
SELECT
  CASE
    WHEN url LIKE 'https://%' THEN 'HTTPS'
    WHEN url LIKE 'http://%' THEN 'HTTP'
    ELSE 'OTHER'
  END as protocol,
  COUNT(*) as count,
  SUM(CASE WHEN verdict = 'VALID' THEN 1 ELSE 0 END) as valid_count,
  SUM(CASE WHEN verdict = 'INVALID' THEN 1 ELSE 0 END) as invalid_count
FROM url_validation_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY protocol;
```

### Check TLD Distribution

```sql
SELECT
  SUBSTRING_INDEX(SUBSTRING_INDEX(url, '.', -1), '/', 1) as tld,
  COUNT(*) as count,
  SUM(CASE WHEN verdict = 'VALID' THEN 1 ELSE 0 END) as valid_count
FROM url_validation_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY tld
ORDER BY count DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: Valid .in domain is rejected

**Cause:** Old validator code still running or config not updated

**Fix:**
1. Verify `tldts` is installed: `npm list tldts`
2. Restart backend server
3. Clear config cache (wait 60 seconds or restart)

### Issue: HTTPS URLs rejected with "HTTPS_REQUIRED"

**Cause:** Database config still has `["http", "https"]`

**Fix:**
```sql
UPDATE url_validator_config
SET metadata = '{"schemes": ["https"]}'
WHERE rule_key = 'ALLOWED_SCHEMES';
```

### Issue: All validations return RETRY

**Cause:** Network connectivity or HTTPS probe failing

**Fix:**
1. Check server can make outbound HTTPS requests
2. Check firewall rules
3. Test manually: `curl -I https://google.com`

---

## Summary

✅ **PSL Integration Complete**
- Supports all ccTLDs (`.in`, `.co.uk`, `.dev`, etc.)
- Automatic Punycode normalization for IDNs
- Uses `tldts` library with full ICANN TLD database

✅ **Enhanced Security**
- HTTPS-only enforcement
- File extension blocking (35+ extensions)
- Content-Disposition header check
- Maximum 3 redirects
- IP and localhost blocking

✅ **Clear Error Messages**
- PSL failures: "Only public websites with a valid domain are allowed."
- IP/localhost: "Only public websites are allowed (no IPs or localhost)."
- HTTP: "Only HTTPS URLs are allowed for security..."
- Files: "Direct file downloads are not allowed..."

**The validator is production-ready and fully supports all legitimate public domains! 🎉**
