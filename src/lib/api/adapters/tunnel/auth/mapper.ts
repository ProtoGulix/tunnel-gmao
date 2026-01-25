/**
 * Auth Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/auth/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapAuthTokens = (raw: any) => ({
  accessToken: raw?.access_token || '',
  refreshToken: raw?.refresh_token || '',
  expires: raw?.expires,
});
