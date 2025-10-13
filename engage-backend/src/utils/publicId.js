/**
 * Generate formatted public IDs for entities
 */

/**
 * Generate a public ID from numeric ID
 * @param {string} prefix - Prefix (e.g., 'USR', 'CMP', 'VIS')
 * @param {number} id - Numeric ID
 * @returns {string} Formatted public ID (e.g., 'USR0001')
 */
function generatePublicId(prefix, id) {
  return prefix + String(id).padStart(4, '0');
}

module.exports = {
  generatePublicId,
};
