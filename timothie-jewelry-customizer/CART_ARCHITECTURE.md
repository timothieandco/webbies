# Cart State Management Architecture - Timothie & Co Jewelry Customizer

## Overview

This document describes the comprehensive cart state management architecture integrated into the Timothie & Co Jewelry Customizer. The cart system seamlessly integrates with the existing StateManager patterns while providing robust e-commerce functionality.

## Architecture Components

### 1. CartManager (`/src/js/core/CartManager.js`)

The core cart management class that handles all cart operations with sophisticated state management:

**Key Features:**
- Undo/redo functionality (similar to StateManager)
- Guest cart support with localStorage persistence
- User cart support with Supabase backend sync
- Real-time inventory validation
- Design export functionality
- Cross-page persistence
- Event-driven architecture

**Core Methods:**
```javascript
// Cart Operations
addItem(item, quantity, options)
removeItem(cartId)
updateQuantity(cartId, quantity)
clearCart()

// Design Integration
exportDesignToCart(designData, metadata)

// State Management
getCartState()
getCartSummary()
saveCartState()
loadCartState()

// History Management
undo()
redo()

// Validation
validateInventory()
```

### 2. CartAPI (`/src/js/services/CartAPI.js`)

Backend cart operations service that integrates with the existing InventoryAPI architecture:

**Key Features:**
- User cart persistence in Supabase
- Guest cart temporary storage
- Cart merging when users log in
- Inventory validation against current stock
- Abandoned cart recovery
- Real-time synchronization

**Core Methods:**
```javascript
// User Cart Operations
saveUserCart(cartState, userId)
getUserCart(userId)
deleteUserCart(userId)

// Guest Cart Operations
saveGuestCart(cartState, sessionId)
getGuestCart(sessionId)
transferGuestCartToUser(sessionId, userId)

// Validation & Analytics
validateCartItems(cartItems)
getAbandonedCarts(daysAgo)
cleanupExpiredGuestCarts()
```

### 3. CartSidebar (`/src/js/components/CartSidebar.js`)

Interactive cart sidebar component with real-time updates:

**Key Features:**
- Real-time cart updates
- Quantity editing
- Item removal
- Totals calculation
- Free shipping indicators
- Custom design badges
- Responsive design
- Accessibility support

**Usage:**
```javascript
const cartSidebar = new CartSidebar('cart-sidebar-container', cartManager, {
    position: 'right',
    showTotals: true,
    enableQuantityEdit: true,
    enableRemove: true,
    showThumbnails: true
});
```

### 4. CartIcon (`/src/js/components/CartIcon.js`)

Navigation cart icon with animated updates:

**Key Features:**
- Real-time item count display
- Animated state changes
- Multiple display styles
- Hover effects
- Accessibility features
- Click actions (sidebar, page, dropdown)

**Usage:**
```javascript
const cartIcon = new CartIcon('cart-icon-container', cartManager, {
    showCount: true,
    showTotal: false,
    animateUpdates: true,
    size: 'medium',
    style: 'default',
    clickAction: 'sidebar'
});
```

### 5. Enhanced StateManager Integration

The existing StateManager has been enhanced with cart awareness:

**New Features:**
- Design-to-cart export tracking
- Cart context in design states
- Design bundles with cart state
- Auto-save on cart changes
- Export milestone tracking

**New Methods:**
```javascript
// Cart Integration
initializeCartIntegration(cartManager)
exportDesignToCart(designState, metadata)
createDesignBundle(bundleName)
loadDesignBundle(bundle)
markStateAsExported(cartItemId)
```

## Database Schema

### User Carts Table
```sql
CREATE TABLE user_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cart_data JSONB NOT NULL,
    item_count INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Guest Carts Table
```sql
CREATE TABLE guest_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    cart_data JSONB NOT NULL,
    item_count INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Event System

The cart system uses a comprehensive event system for real-time updates:

### Cart Events
```javascript
// Core cart events
CART_UPDATED: 'cart-updated'
CART_ITEM_ADDED: 'cart-item-added'
CART_ITEM_REMOVED: 'cart-item-removed'
CART_ITEM_UPDATED: 'cart-item-updated'
CART_CLEARED: 'cart-cleared'
CART_ERROR: 'cart-error'

// History events
CART_UNDONE: 'cart-undone'
CART_REDONE: 'cart-redone'

// User events
CART_USER_LOGGED_IN: 'cart-user-logged-in'
CART_USER_LOGGED_OUT: 'cart-user-logged-out'

// Sync events
CART_SYNCED: 'cart-synced'
CART_VALIDATION_FAILED: 'cart-validation-failed'
```

### Usage Example
```javascript
cartManager.subscribe('cart-updated', (cartSummary) => {
    console.log('Cart updated:', cartSummary);
    updateCartIcon(cartSummary.itemCount);
});
```

## JewelryCustomizer Integration

The main JewelryCustomizer class now includes comprehensive cart functionality:

### Initialization
```javascript
const customizer = new JewelryCustomizer('canvas-container', {
    enableCart: true,
    cartSidebarContainer: 'cart-sidebar-container',
    cartIconContainer: 'cart-icon-container',
    autoShowCartOnAdd: true,
    enableCartIntegration: true
});
```

### Public API Methods
```javascript
// Design Export
await customizer.exportToCart({ name: 'My Design' });

// Cart Management
await customizer.addItemToCart(inventoryItem, 2);
customizer.showCart();
customizer.hideCart();
customizer.toggleCart();

// State Management
const cartState = customizer.getCartState();
const cartSummary = customizer.getCartSummary();
await customizer.clearCart();

// Validation
const validation = await customizer.validateCart();

// Design Bundles
const bundle = customizer.createDesignBundle('My Bundle');
await customizer.loadDesignBundle(bundle);
```

## Usage Examples

### Basic Cart Implementation

1. **HTML Structure:**
```html
<div id="cart-icon-container"></div>
<div id="cart-sidebar-container"></div>
<div id="canvas-container"></div>
```

2. **JavaScript Initialization:**
```javascript
import JewelryCustomizer from './src/js/core/JewelryCustomizer.js';

const customizer = new JewelryCustomizer('canvas-container', {
    enableCart: true,
    cartSidebarContainer: 'cart-sidebar-container',
    cartIconContainer: 'cart-icon-container'
});
```

### Adding Items to Cart

1. **From Inventory:**
```javascript
const inventoryItem = {
    id: 'charm_001',
    title: 'Heart Charm',
    price: 25.99,
    image_url: '/images/heart-charm.jpg',
    category: 'charms',
    quantity_available: 10
};

await customizer.addItemToCart(inventoryItem, 1);
```

2. **Export Design:**
```javascript
await customizer.exportToCart({
    name: 'My Custom Necklace',
    description: 'Beautiful custom design with heart charms'
});
```

### Cart Event Handling

```javascript
// Listen for cart events
document.addEventListener('cart-updated', (event) => {
    const cartSummary = event.detail;
    console.log(`Cart has ${cartSummary.itemCount} items, total: $${cartSummary.total}`);
});

// Listen for design exports
document.addEventListener('design-exported-to-cart', (event) => {
    const { designData, cartItem } = event.detail;
    console.log('Design exported:', cartItem);
});
```

### Advanced Cart Management

```javascript
// Get cart manager for advanced operations
const cartManager = customizer.getCartManager();

// Subscribe to specific events
cartManager.subscribe('cart-item-added', (data) => {
    console.log('Item added:', data.item);
});

// Manual cart operations
await cartManager.addItem(item, quantity);
await cartManager.updateQuantity(cartId, newQuantity);
await cartManager.removeItem(cartId);

// Validation
const validation = await cartManager.validateInventory();
if (!validation.isValid) {
    console.log('Cart validation errors:', validation.errors);
}
```

## Configuration Options

### CartManager Options
```javascript
{
    storageKey: 'timothie_shopping_cart',
    maxItems: 50,
    enableRealTime: true,
    autoSave: true,
    taxRate: 0.08,
    shippingThreshold: 75,
    shippingCost: 12.99
}
```

### CartSidebar Options
```javascript
{
    position: 'right', // 'left' or 'right'
    width: '320px',
    collapsible: true,
    showTotals: true,
    enableQuantityEdit: true,
    enableRemove: true,
    showThumbnails: true,
    animationDuration: 300
}
```

### CartIcon Options
```javascript
{
    showCount: true,
    showTotal: false,
    animateUpdates: true,
    position: 'relative', // 'fixed', 'absolute', 'relative'
    size: 'medium', // 'small', 'medium', 'large'
    style: 'default', // 'default', 'minimal', 'fancy'
    clickAction: 'sidebar' // 'sidebar', 'page', 'dropdown'
}
```

## Best Practices

### 1. Error Handling
Always wrap cart operations in try-catch blocks:
```javascript
try {
    await customizer.addItemToCart(item, quantity);
} catch (error) {
    console.error('Failed to add item to cart:', error);
    // Show user-friendly error message
}
```

### 2. Validation
Validate cart before checkout:
```javascript
const validation = await customizer.validateCart();
if (!validation.isValid) {
    // Handle validation errors
    validation.errors.forEach(error => console.log(error));
    return;
}
// Proceed to checkout
```

### 3. State Persistence
The cart automatically persists state, but you can manually save:
```javascript
await cartManager.saveCartState();
```

### 4. Performance
For large catalogs, use pagination and lazy loading:
```javascript
// Only load cart data when needed
if (cartSummary.hasItems) {
    customizer.showCart();
}
```

## Security Considerations

### 1. Input Validation
All cart inputs are validated on both client and server:
- Quantity limits
- Price verification
- Inventory availability
- User permissions

### 2. Authentication
Cart operations respect authentication state:
- Guest carts are temporary
- User carts require authentication
- Automatic cart migration on login

### 3. Rate Limiting
Cart operations are rate-limited to prevent abuse:
- Maximum items per cart
- Maximum operations per minute
- Inventory validation

## Troubleshooting

### Common Issues

1. **Cart not initializing:**
   - Check container element IDs
   - Verify enableCart option
   - Check console for errors

2. **Items not adding to cart:**
   - Verify item format
   - Check inventory availability
   - Validate user permissions

3. **Cart not persisting:**
   - Check localStorage availability
   - Verify Supabase connection
   - Check authentication state

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('cart_debug', 'true');
```

## Future Enhancements

### Planned Features
1. **Advanced Discounts:**
   - Coupon codes
   - Bulk discounts
   - Loyalty rewards

2. **Social Features:**
   - Cart sharing
   - Wishlist integration
   - Social login

3. **Analytics:**
   - Cart abandonment tracking
   - Conversion analytics
   - A/B testing support

4. **Mobile Optimization:**
   - Swipe gestures
   - Mobile-specific UI
   - Offline support

## Support

For questions or issues with the cart system:
1. Check the console for error messages
2. Verify configuration options
3. Review the event system logs
4. Test with different browsers
5. Check network connectivity for backend features

The cart state management architecture provides a solid foundation for e-commerce functionality while maintaining the sophisticated patterns established in the existing codebase.