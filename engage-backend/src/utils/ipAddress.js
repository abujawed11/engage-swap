/**
 * Get client IP address from request
 * Handles proxies and various IP header formats
 */
function getClientIp(req) {
  // Check for common proxy headers
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0]; // Return first IP (client IP)
  }

  // Check other common headers
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown';
}

module.exports = { getClientIp };
