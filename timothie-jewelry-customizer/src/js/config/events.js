/**
 * Event names for custom events
 * Separated to avoid circular dependencies
 */
export const EVENTS = {
  INVENTORY_UPDATED: 'inventory-updated',
  DESIGN_SAVED: 'design-saved',
  ORDER_CREATED: 'order-created',
  USER_AUTHENTICATED: 'user-authenticated',
  USER_SIGNED_OUT: 'user-signed-out',
  REAL_TIME_ERROR: 'real-time-error',
  // Cart events
  CART_UPDATED: 'cart-updated',
  CART_ITEM_ADDED: 'cart-item-added',
  CART_ITEM_REMOVED: 'cart-item-removed',
  CART_ITEM_UPDATED: 'cart-item-updated',
  CART_CLEARED: 'cart-cleared',
  CART_ERROR: 'cart-error',
  CART_UNDONE: 'cart-undone',
  CART_REDONE: 'cart-redone',
  CART_USER_LOGGED_IN: 'cart-user-logged-in',
  CART_USER_LOGGED_OUT: 'cart-user-logged-out',
  CART_SYNCED: 'cart-synced',
  CART_VALIDATION_FAILED: 'cart-validation-failed'
};

export default EVENTS;