import React from 'react';
import usePermissions from './usePermissions';

const PermissionWrapper = ({ 
  module, 
  action, 
  children, 
  fallback = null,
  requireAll = false,
  actions = []
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  let hasAccess = false;

  if (requireAll && actions.length > 0) {
    hasAccess = hasAllPermissions(module, actions);
  } else if (actions.length > 0) {
    hasAccess = hasAnyPermission(module, actions);
  } else if (action) {
    hasAccess = hasPermission(module, action);
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

export default PermissionWrapper;
