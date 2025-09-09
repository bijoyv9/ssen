export const ROLES = {
  ADMIN: 'admin',
  COMPUTER_OPERATOR: 'computer-operator',
  INSPECTOR: 'inspector'
};

export const ROLE_OPTIONS = [
  { value: ROLES.COMPUTER_OPERATOR, label: 'Computer Operator' },
  { value: ROLES.INSPECTOR, label: 'Inspector' },
  { value: ROLES.ADMIN, label: 'Admin' }
];

export const hasAdminAccess = (user) => {
  return user?.role === ROLES.ADMIN;
};

export const hasComputerOperatorAccess = (user) => {
  return user?.role === ROLES.COMPUTER_OPERATOR || hasAdminAccess(user);
};

export const canEditInvoice = (user, invoice) => {
  return hasAdminAccess(user) || 
         invoice.createdBy === user?.id || 
         invoice.reportMaker === user?.fullName;
};

export const canViewInvoice = (user, invoice) => {
  return canEditInvoice(user, invoice);
};