import { useContext } from 'react';
import PERMISSIONS from './permissions';

// Custom hook to check permissions
export const usePermissions = () => {
  // Get user from localStorage or context
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const userRole = user?.type || 'user';
  const userPermissions = PERMISSIONS[userRole] || PERMISSIONS.user;

  const hasPermission = (module, action) => {
    if (!userPermissions[module]) return false;
    return userPermissions[module][action] === true;
  };

  const hasAnyPermission = (module, actions) => {
    if (!userPermissions[module]) return false;
    return actions.some(action => userPermissions[module][action] === true);
  };

  const hasAllPermissions = (module, actions) => {
    if (!userPermissions[module]) return false;
    return actions.every(action => userPermissions[module][action] === true);
  };

  return {
    role: userRole,
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: userRole === 'super_admin',
    isAdmin: userRole === 'admin',
    isTenant: userRole === 'tenant',
    isUser: userRole === 'user'
  };
};

export default usePermissions;
