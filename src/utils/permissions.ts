import { UserPermissions } from '../types/permissions';

const PERMISSIONS_CACHE_KEY = 'user_permissions';
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory storage for permissions
let userPermissions: UserPermissions | null = null;

export const setUserPermissions = (permissions: UserPermissions) => {
  userPermissions = permissions;
  try {
    localStorage.setItem(
      PERMISSIONS_CACHE_KEY,
      JSON.stringify({ data: permissions, timestamp: Date.now() })
    );
  } catch {
    // localStorage may be unavailable
  }
};

export const getUserPermissions = (): UserPermissions | null => {
  return userPermissions;
};

export const clearUserPermissions = () => {
  userPermissions = null;
  try {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  } catch {
    // ignore
  }
};

export const hasPermission = (permission: keyof UserPermissions): boolean => {
  if (!userPermissions) return false;
  return userPermissions[permission] === true;
};

export const fetchUserPermissions = async (token: string): Promise<UserPermissions | null> => {
  try {
    if (userPermissions) {
      return userPermissions;
    }

    try {
      const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (timestamp && Date.now() - timestamp < PERMISSIONS_CACHE_TTL) {
          userPermissions = data;
          return data;
        }
      }
    } catch {
      // ignore JSON/localStorage errors
    }

    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/usuarios/permissoes/get',
      {
        headers: { token }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user permissions');
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const permissions = data[0];
      setUserPermissions(permissions);
      return permissions;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return null;
  }
};