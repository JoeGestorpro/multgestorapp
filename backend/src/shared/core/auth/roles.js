'use strict';

const BARBER_ADMIN_ROLES = ['admin', 'owner', 'collaborator'];
const BOOKING_CUSTOMER_ROLES = ['client', 'booking_customer'];
const MASTER_ROLES = ['master_admin'];

function inferAuthScope(role) {
  if (MASTER_ROLES.includes(role)) {
    return 'master';
  }

  if (BOOKING_CUSTOMER_ROLES.includes(role)) {
    return 'booking_customer';
  }

  if (BARBER_ADMIN_ROLES.includes(role)) {
    return 'barber_admin';
  }

  return null;
}

module.exports = {
  BARBER_ADMIN_ROLES,
  BOOKING_CUSTOMER_ROLES,
  MASTER_ROLES,
  inferAuthScope
};
