// Mapper functions for auth domain

/**
 * Maps Directus auth tokens to domain AuthTokens DTO.
 */
export const mapAuthTokensToDomain = (data: Record<string, unknown> | null) => {
  if (!data) return null;
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
  };
};

/**
 * Maps Directus user to domain AuthUser DTO.
 */
export const mapAuthUserToDomain = (user: Record<string, unknown> | null) => {
  if (!user) return null;
  
  const role = user.role as Record<string, unknown> | undefined;
  
  return {
    id: user.id as string,
    email: user.email as string,
    firstName: user.first_name as string,
    lastName: user.last_name as string,
    role: role ? { id: role.id as string, name: role.name as string } : undefined,
  };
};
