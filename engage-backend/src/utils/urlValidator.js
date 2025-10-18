/**
 * URL Validator Service
 *
 * Synchronous URL validation service for EngageSwap campaigns.
 * Validates URLs against security policies and content requirements.
 *
 * Performance target: P95 < 2 seconds
 * Uses Public Suffix List for proper TLD validation (supports .in, .co.uk, etc.)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { parse: parseDomain, fromUrl } = require('tldts');
const db = require('../db');
const crypto = require('crypto');

// ============================================================================
// CONSTANTS
// ============================================================================

const VERDICT = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  RETRY: 'RETRY'
};

const REJECTION_REASONS = {
  // URL Structure Issues
  INVALID_URL_FORMAT: {
    code: 'INVALID_URL_FORMAT',
    message: 'The URL format is invalid. Please check for typos.',
    userFriendly: true
  },
  HTTPS_REQUIRED: {
    code: 'HTTPS_REQUIRED',
    message: 'Only HTTPS URLs are allowed for security. Please use https:// instead of http://',
    userFriendly: true
  },
  URL_TOO_LONG: {
    code: 'URL_TOO_LONG',
    message: 'URL exceeds maximum length of 2048 characters.',
    userFriendly: true
  },
  FILE_EXTENSION_NOT_ALLOWED: {
    code: 'FILE_EXTENSION_NOT_ALLOWED',
    message: 'Direct file downloads are not allowed. Please provide a webpage URL.',
    userFriendly: true
  },

  // Hostname Security Issues
  IP_ADDRESS_NOT_ALLOWED: {
    code: 'IP_ADDRESS_NOT_ALLOWED',
    message: 'Only public websites are allowed (no IPs or localhost).',
    userFriendly: true
  },
  LOCALHOST_NOT_ALLOWED: {
    code: 'LOCALHOST_NOT_ALLOWED',
    message: 'Only public websites are allowed (no IPs or localhost).',
    userFriendly: true
  },
  PRIVATE_IP_NOT_ALLOWED: {
    code: 'PRIVATE_IP_NOT_ALLOWED',
    message: 'Only public websites are allowed (no IPs or localhost).',
    userFriendly: true
  },
  INVALID_DOMAIN: {
    code: 'INVALID_DOMAIN',
    message: 'Only public websites with a valid domain are allowed.',
    userFriendly: true
  },
  ONION_NOT_ALLOWED: {
    code: 'ONION_NOT_ALLOWED',
    message: 'Tor hidden services (.onion) are not allowed.',
    userFriendly: true
  },
  VIDEO_PLATFORM_NOT_ALLOWED: {
    code: 'VIDEO_PLATFORM_NOT_ALLOWED',
    message: 'Video platform URLs (YouTube, Vimeo, etc.) are not allowed. Please provide your own website URL.',
    userFriendly: true
  },

  // Content Security Issues
  NOT_ACCESSIBLE: {
    code: 'NOT_ACCESSIBLE',
    message: 'The URL is not accessible. Please check if the website is online.',
    userFriendly: true
  },
  INVALID_CONTENT_TYPE: {
    code: 'INVALID_CONTENT_TYPE',
    message: 'Only HTML web pages are allowed (no downloads, images, or videos).',
    userFriendly: true
  },
  ATTACHMENT_NOT_ALLOWED: {
    code: 'ATTACHMENT_NOT_ALLOWED',
    message: 'File downloads are not allowed. Please provide a webpage URL.',
    userFriendly: true
  },
  REDIRECT_TO_UNSAFE_URL: {
    code: 'REDIRECT_TO_UNSAFE_URL',
    message: 'This URL redirects to an unsafe destination.',
    userFriendly: true
  },

  // System Issues
  VALIDATION_TIMEOUT: {
    code: 'VALIDATION_TIMEOUT',
    message: 'URL validation timed out. Please try again.',
    userFriendly: false
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'An error occurred while validating the URL. Please try again.',
    userFriendly: false
  }
};

// Private IP ranges (RFC1918 + localhost + link-local)
const PRIVATE_IP_RANGES = [
  /^127\./,          // 127.0.0.0/8 - localhost
  /^10\./,           // 10.0.0.0/8 - private
  /^192\.168\./,     // 192.168.0.0/16 - private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 - private
  /^169\.254\./,     // 169.254.0.0/16 - link-local
  /^::1$/,           // IPv6 localhost
  /^fe80:/,          // IPv6 link-local
  /^fc00:/,          // IPv6 unique local
  /^fd00:/           // IPv6 unique local
];

// Blocked file extensions (downloads, executables, archives)
const BLOCKED_FILE_EXTENSIONS = [
  '.apk', '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
  '.iso', '.img', '.bin', '.dll', '.so',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp3', '.mp4', '.avi', '.mkv', '.mov', '.flv', '.wmv',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
  '.torrent', '.sh', '.bat', '.cmd', '.ps1'
];

// Blocked video platforms (YouTube, Vimeo, TikTok, etc.)
const BLOCKED_VIDEO_PLATFORMS = [
  // YouTube
  { hostname: 'youtube.com', patterns: ['/watch', '/shorts', '/live'] },
  { hostname: 'www.youtube.com', patterns: ['/watch', '/shorts', '/live'] },
  { hostname: 'youtu.be', patterns: ['/'] }, // All youtu.be URLs are video links
  { hostname: 'm.youtube.com', patterns: ['/watch', '/shorts'] },

  // Vimeo
  { hostname: 'vimeo.com', patterns: ['/'] },
  { hostname: 'player.vimeo.com', patterns: ['/'] },

  // TikTok
  { hostname: 'tiktok.com', patterns: ['/@', '/video'] },
  { hostname: 'www.tiktok.com', patterns: ['/@', '/video'] },
  { hostname: 'vm.tiktok.com', patterns: ['/'] },

  // Instagram
  { hostname: 'instagram.com', patterns: ['/reel', '/tv', '/p/'] },
  { hostname: 'www.instagram.com', patterns: ['/reel', '/tv', '/p/'] },

  // Facebook
  { hostname: 'facebook.com', patterns: ['/watch', '/reel'] },
  { hostname: 'www.facebook.com', patterns: ['/watch', '/reel'] },
  { hostname: 'fb.watch', patterns: ['/'] },

  // Twitter/X
  { hostname: 'twitter.com', patterns: ['/status', '/video'] },
  { hostname: 'x.com', patterns: ['/status', '/video'] },

  // Dailymotion
  { hostname: 'dailymotion.com', patterns: ['/video'] },
  { hostname: 'www.dailymotion.com', patterns: ['/video'] },

  // Twitch
  { hostname: 'twitch.tv', patterns: ['/videos'] },
  { hostname: 'www.twitch.tv', patterns: ['/videos'] },

  // Other video platforms
  { hostname: 'streamable.com', patterns: ['/'] },
  { hostname: 'wistia.com', patterns: ['/'] },
  { hostname: 'vidyard.com', patterns: ['/'] },
  { hostname: 'loom.com', patterns: ['/share'] }
];

// ============================================================================
// CONFIGURATION CACHE
// ============================================================================

let configCache = null;
let configCacheTimestamp = null;
const CONFIG_CACHE_TTL = 60000; // 60 seconds

/**
 * Load validation configuration from database
 */
async function loadConfig() {
  const now = Date.now();

  // Return cached config if still valid
  if (configCache && configCacheTimestamp && (now - configCacheTimestamp < CONFIG_CACHE_TTL)) {
    return configCache;
  }

  try {
    const [rows] = await db.query(
      'SELECT rule_key, enabled, metadata FROM url_validator_config WHERE enabled = 1'
    );

    configCache = {};
    rows.forEach(row => {
      configCache[row.rule_key] = {
        enabled: row.enabled === 1,
        metadata: row.metadata ? JSON.parse(JSON.stringify(row.metadata)) : {}
      };
    });

    configCacheTimestamp = now;
    return configCache;
  } catch (error) {
    console.error('Failed to load URL validator config:', error);
    // Return default config on error
    return getDefaultConfig();
  }
}

/**
 * Get default configuration (fallback)
 */
function getDefaultConfig() {
  return {
    BLOCK_IP_ADDRESSES: { enabled: true, metadata: {} },
    BLOCK_PRIVATE_IPS: { enabled: true, metadata: {} },
    REQUIRE_PUBLIC_SUFFIX: { enabled: true, metadata: {} },
    REQUIRE_HTML_CONTENT: { enabled: true, metadata: {} },
    FOLLOW_REDIRECTS: { enabled: true, metadata: { max_redirects: 3 } },
    VERIFY_ACCESSIBILITY: { enabled: true, metadata: { timeout_ms: 5000 } },
    MAX_URL_LENGTH: { enabled: true, metadata: { max_length: 2048 } },
    ALLOWED_SCHEMES: { enabled: true, metadata: { schemes: ['https'] } }
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Parse and normalize URL with Punycode support
 */
function parseURL(urlString) {
  try {
    // Node.js URL constructor automatically handles Punycode conversion
    const url = new URL(urlString);

    // Additional validation for malformed URLs
    if (!url.hostname || url.hostname.length === 0) {
      return {
        success: false,
        error: REJECTION_REASONS.INVALID_URL_FORMAT
      };
    }

    return {
      success: true,
      url,
      normalized: url.href
    };
  } catch (error) {
    return {
      success: false,
      error: REJECTION_REASONS.INVALID_URL_FORMAT
    };
  }
}

/**
 * Check if hostname is an IP address using tldts
 */
function isIPAddress(hostname) {
  const parsed = parseDomain(hostname);
  return parsed.isIp === true;
}

/**
 * Check if IP is in private range
 */
function isPrivateIP(hostname) {
  return PRIVATE_IP_RANGES.some(pattern => pattern.test(hostname));
}

/**
 * Check if URL ends with blocked file extension
 */
function hasBlockedFileExtension(url) {
  const pathname = url.pathname.toLowerCase();
  return BLOCKED_FILE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

/**
 * Check if URL is from a blocked video platform
 */
function isBlockedVideoPlatform(url) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  for (const platform of BLOCKED_VIDEO_PLATFORMS) {
    if (hostname === platform.hostname) {
      // Check if any pattern matches
      for (const pattern of platform.patterns) {
        if (pathname.startsWith(pattern)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Validate domain using Public Suffix List (tldts)
 */
function validateDomainWithPSL(hostname) {
  // Parse domain with tldts
  const parsed = parseDomain(hostname);

  // Check if it's an IP address
  if (parsed.isIp) {
    return {
      valid: false,
      reason: REJECTION_REASONS.IP_ADDRESS_NOT_ALLOWED,
      failedRules: ['BLOCK_IP_ADDRESSES']
    };
  }

  // Check for .onion (Tor)
  if (parsed.publicSuffix === 'onion') {
    return {
      valid: false,
      reason: REJECTION_REASONS.ONION_NOT_ALLOWED,
      failedRules: ['REQUIRE_PUBLIC_SUFFIX']
    };
  }

  // Check for valid ICANN domain
  if (!parsed.isIcann) {
    return {
      valid: false,
      reason: REJECTION_REASONS.INVALID_DOMAIN,
      failedRules: ['REQUIRE_PUBLIC_SUFFIX']
    };
  }

  // Check if registrable domain exists
  if (!parsed.domain || parsed.domain === null) {
    return {
      valid: false,
      reason: REJECTION_REASONS.INVALID_DOMAIN,
      failedRules: ['REQUIRE_PUBLIC_SUFFIX']
    };
  }

  // Valid public domain
  return {
    valid: true,
    failedRules: [],
    domainInfo: parsed
  };
}

/**
 * Validate URL structure (scheme, length, format, file extensions)
 */
function validateStructure(url, config) {
  const failedRules = [];

  // Check URL length
  if (config.MAX_URL_LENGTH?.enabled) {
    const maxLength = config.MAX_URL_LENGTH.metadata.max_length || 2048;
    if (url.href.length > maxLength) {
      return {
        valid: false,
        reason: REJECTION_REASONS.URL_TOO_LONG,
        failedRules: ['MAX_URL_LENGTH']
      };
    }
  }

  // Check scheme - HTTPS ONLY (enforce secure connections)
  if (config.ALLOWED_SCHEMES?.enabled) {
    const allowedSchemes = config.ALLOWED_SCHEMES.metadata.schemes || ['https'];
    const scheme = url.protocol.replace(':', '');

    if (!allowedSchemes.includes(scheme)) {
      // Special message for http:// -> https://
      if (scheme === 'http' && allowedSchemes.includes('https')) {
        return {
          valid: false,
          reason: REJECTION_REASONS.HTTPS_REQUIRED,
          failedRules: ['ALLOWED_SCHEMES']
        };
      }
      return {
        valid: false,
        reason: REJECTION_REASONS.HTTPS_REQUIRED,
        failedRules: ['ALLOWED_SCHEMES']
      };
    }
  }

  // Check for blocked file extensions
  if (hasBlockedFileExtension(url)) {
    return {
      valid: false,
      reason: REJECTION_REASONS.FILE_EXTENSION_NOT_ALLOWED,
      failedRules: ['FILE_EXTENSION_CHECK']
    };
  }

  // Check for blocked video platforms
  if (isBlockedVideoPlatform(url)) {
    return {
      valid: false,
      reason: REJECTION_REASONS.VIDEO_PLATFORM_NOT_ALLOWED,
      failedRules: ['VIDEO_PLATFORM_CHECK']
    };
  }

  return { valid: true, failedRules };
}

/**
 * Validate hostname security (IP checks, private ranges, PSL validation)
 */
function validateHostname(url, config) {
  const hostname = url.hostname;

  // Check for localhost explicitly
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return {
      valid: false,
      reason: REJECTION_REASONS.LOCALHOST_NOT_ALLOWED,
      failedRules: ['BLOCK_PRIVATE_IPS']
    };
  }

  // Check for private IPs
  if (config.BLOCK_PRIVATE_IPS?.enabled && isPrivateIP(hostname)) {
    return {
      valid: false,
      reason: REJECTION_REASONS.PRIVATE_IP_NOT_ALLOWED,
      failedRules: ['BLOCK_PRIVATE_IPS']
    };
  }

  // Validate domain using PSL (Public Suffix List)
  if (config.REQUIRE_PUBLIC_SUFFIX?.enabled) {
    const pslResult = validateDomainWithPSL(hostname);
    if (!pslResult.valid) {
      return pslResult;
    }
  }

  return { valid: true, failedRules: [] };
}

/**
 * Perform HTTPS HEAD request to check accessibility and content type
 */
function probeURL(urlString, timeoutMs = 5000, maxRedirects = 3) {
  return new Promise((resolve) => {
    const redirectChain = [];
    let redirectCount = 0;

    const makeRequest = (currentURL) => {
      try {
        const parsedURL = new URL(currentURL);

        // Only allow HTTPS for probing
        if (parsedURL.protocol !== 'https:') {
          return resolve({
            success: false,
            error: 'Only HTTPS URLs are allowed',
            redirectChain
          });
        }

        const options = {
          method: 'HEAD',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'EngageSwap-URL-Validator/2.0',
            'Accept': 'text/html,application/xhtml+xml'
          }
        };

        const req = https.request(currentURL, options, (res) => {
          const statusCode = res.statusCode;
          const contentType = res.headers['content-type'] || '';
          const contentDisposition = res.headers['content-disposition'] || '';
          const location = res.headers['location'];

          // Handle redirects
          if (statusCode >= 300 && statusCode < 400 && location) {
            redirectChain.push(currentURL);
            redirectCount++;

            if (redirectCount > maxRedirects) {
              return resolve({
                success: false,
                statusCode,
                contentType,
                contentDisposition,
                redirectChain,
                error: 'Too many redirects'
              });
            }

            // Resolve relative redirects
            const nextURL = location.startsWith('http')
              ? location
              : new URL(location, currentURL).href;

            return makeRequest(nextURL);
          }

          // Success - return result
          resolve({
            success: statusCode >= 200 && statusCode < 300,
            statusCode,
            contentType,
            contentDisposition,
            redirectChain,
            finalURL: currentURL
          });
        });

        req.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
            redirectChain
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            error: 'Request timeout',
            redirectChain
          });
        });

        req.end();
      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          redirectChain
        });
      }
    };

    makeRequest(urlString);
  });
}

/**
 * Validate content accessibility and type
 */
async function validateContent(url, config) {
  const failedRules = [];

  // Skip if verification is disabled
  if (!config.VERIFY_ACCESSIBILITY?.enabled) {
    return { valid: true, failedRules, probeResult: null };
  }

  const timeoutMs = config.VERIFY_ACCESSIBILITY.metadata.timeout_ms || 5000;
  const maxRedirects = config.FOLLOW_REDIRECTS?.enabled
    ? (config.FOLLOW_REDIRECTS.metadata.max_redirects || 3)
    : 0;

  try {
    const probeResult = await probeURL(url.href, timeoutMs, maxRedirects);

    // Check if accessible
    if (!probeResult.success) {
      return {
        valid: false,
        reason: REJECTION_REASONS.NOT_ACCESSIBLE,
        failedRules: ['VERIFY_ACCESSIBILITY'],
        probeResult
      };
    }

    // Check redirect destination using PSL
    if (probeResult.redirectChain.length > 0 && probeResult.finalURL) {
      const finalURL = new URL(probeResult.finalURL);

      // Validate final destination hostname with PSL
      const hostnameCheck = validateHostname(finalURL, config);
      if (!hostnameCheck.valid) {
        return {
          valid: false,
          reason: REJECTION_REASONS.REDIRECT_TO_UNSAFE_URL,
          failedRules: ['FOLLOW_REDIRECTS', ...hostnameCheck.failedRules],
          probeResult
        };
      }

      // Check for file extensions in final URL
      if (hasBlockedFileExtension(finalURL)) {
        return {
          valid: false,
          reason: REJECTION_REASONS.FILE_EXTENSION_NOT_ALLOWED,
          failedRules: ['FOLLOW_REDIRECTS', 'FILE_EXTENSION_CHECK'],
          probeResult
        };
      }

      // Check for video platforms in final URL
      if (isBlockedVideoPlatform(finalURL)) {
        return {
          valid: false,
          reason: REJECTION_REASONS.VIDEO_PLATFORM_NOT_ALLOWED,
          failedRules: ['FOLLOW_REDIRECTS', 'VIDEO_PLATFORM_CHECK'],
          probeResult
        };
      }
    }

    // Check Content-Disposition header for attachments
    if (probeResult.contentDisposition && probeResult.contentDisposition.toLowerCase().includes('attachment')) {
      return {
        valid: false,
        reason: REJECTION_REASONS.ATTACHMENT_NOT_ALLOWED,
        failedRules: ['REQUIRE_HTML_CONTENT'],
        probeResult
      };
    }

    // Check content type
    if (config.REQUIRE_HTML_CONTENT?.enabled) {
      const contentType = probeResult.contentType.toLowerCase();
      const isHTML = contentType.includes('text/html') || contentType.includes('application/xhtml');

      if (!isHTML && contentType !== '') {
        return {
          valid: false,
          reason: REJECTION_REASONS.INVALID_CONTENT_TYPE,
          failedRules: ['REQUIRE_HTML_CONTENT'],
          probeResult
        };
      }
    }

    return { valid: true, failedRules, probeResult };

  } catch (error) {
    // On error, return RETRY verdict
    return {
      valid: false,
      reason: REJECTION_REASONS.VALIDATION_ERROR,
      failedRules: ['VERIFY_ACCESSIBILITY'],
      probeResult: { error: error.message },
      shouldRetry: true
    };
  }
}

/**
 * Log validation attempt to database
 */
async function logValidation(logData) {
  try {
    await db.query(
      `INSERT INTO url_validation_logs (
        correlation_id, user_id, url, verdict, rejection_reason,
        validation_time_ms, http_status_code, content_type,
        redirect_chain, failed_rules, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logData.correlationId,
        logData.userId || null,
        logData.url,
        logData.verdict,
        logData.rejectionReason || null,
        logData.validationTimeMs,
        logData.httpStatusCode || null,
        logData.contentType || null,
        logData.redirectChain ? JSON.stringify(logData.redirectChain) : null,
        logData.failedRules ? JSON.stringify(logData.failedRules) : null,
        logData.ipAddress || null,
        logData.userAgent || null
      ]
    );
  } catch (error) {
    console.error('Failed to log URL validation:', error);
    // Don't throw - logging failure shouldn't break validation
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a URL against all configured rules
 *
 * Decision Flow:
 * 1. Parse URL (with Punycode normalization)
 * 2. Validate Structure (HTTPS-only, length, file extensions)
 * 3. Validate Hostname (PSL check, IP blocking, private ranges)
 * 4. Validate Content (HTTP probe, Content-Type, Content-Disposition)
 * 5. Return VALID / INVALID(reason) / RETRY
 *
 * @param {string} urlString - The URL to validate
 * @param {object} options - Validation options
 * @param {number} options.userId - User ID (optional)
 * @param {string} options.ipAddress - IP address (optional)
 * @param {string} options.userAgent - User agent (optional)
 * @returns {Promise<object>} Validation result
 */
async function validateURL(urlString, options = {}) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  const failedRules = [];

  let verdict = VERDICT.VALID;
  let rejectionReason = null;
  let probeResult = null;

  try {
    // Load configuration
    const config = await loadConfig();

    // Step 1: Parse URL (Punycode handled automatically by URL constructor)
    const parseResult = parseURL(urlString);
    if (!parseResult.success) {
      verdict = VERDICT.INVALID;
      rejectionReason = parseResult.error.code;
      failedRules.push('URL_PARSE');
    } else {
      const url = parseResult.url;

      // Step 2: Validate structure (HTTPS-only, length, file extensions)
      const structureCheck = validateStructure(url, config);
      if (!structureCheck.valid) {
        verdict = VERDICT.INVALID;
        rejectionReason = structureCheck.reason.code;
        failedRules.push(...structureCheck.failedRules);
      } else {
        // Step 3: Validate hostname (PSL, IP blocking, private ranges)
        const hostnameCheck = validateHostname(url, config);
        if (!hostnameCheck.valid) {
          verdict = VERDICT.INVALID;
          rejectionReason = hostnameCheck.reason.code;
          failedRules.push(...hostnameCheck.failedRules);
        } else {
          // Step 4: Validate content (HTTP probe, Content-Type, Content-Disposition)
          const contentCheck = await validateContent(url, config);
          probeResult = contentCheck.probeResult;

          if (!contentCheck.valid) {
            verdict = contentCheck.shouldRetry ? VERDICT.RETRY : VERDICT.INVALID;
            rejectionReason = contentCheck.reason.code;
            failedRules.push(...contentCheck.failedRules);
          }
        }
      }
    }

    const validationTimeMs = Date.now() - startTime;

    // Log the validation
    await logValidation({
      correlationId,
      userId: options.userId,
      url: urlString,
      verdict,
      rejectionReason,
      validationTimeMs,
      httpStatusCode: probeResult?.statusCode,
      contentType: probeResult?.contentType,
      redirectChain: probeResult?.redirectChain,
      failedRules: failedRules.length > 0 ? failedRules : null,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    });

    // Build response
    const response = {
      verdict,
      correlation_id: correlationId,
      validation_time_ms: validationTimeMs
    };

    if (verdict === VERDICT.INVALID || verdict === VERDICT.RETRY) {
      const reason = REJECTION_REASONS[rejectionReason] || REJECTION_REASONS.VALIDATION_ERROR;
      response.rejection_reason = reason.code;
      response.message = reason.message;
      response.user_friendly = reason.userFriendly;
    }

    if (verdict === VERDICT.VALID) {
      response.message = 'URL is valid and accessible';
    }

    return response;

  } catch (error) {
    console.error('URL validation error:', error);

    const validationTimeMs = Date.now() - startTime;

    // Log the error
    await logValidation({
      correlationId,
      userId: options.userId,
      url: urlString,
      verdict: VERDICT.RETRY,
      rejectionReason: 'VALIDATION_ERROR',
      validationTimeMs,
      failedRules: ['SYSTEM_ERROR'],
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    });

    return {
      verdict: VERDICT.RETRY,
      correlation_id: correlationId,
      rejection_reason: 'VALIDATION_ERROR',
      message: 'An error occurred while validating the URL. Please try again.',
      user_friendly: false,
      validation_time_ms: validationTimeMs
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  validateURL,
  VERDICT,
  REJECTION_REASONS,
  loadConfig
};
