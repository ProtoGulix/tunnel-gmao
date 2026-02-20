/**
 * Domain Contract: Auth
 * Pure types (via JSDoc) with zero technical dependencies.
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string=} refreshToken
 */

/**
 * @typedef {Object} AuthRole
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {AuthRole=} role
 */
