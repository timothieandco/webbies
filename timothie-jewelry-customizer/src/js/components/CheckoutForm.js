/**
 * CheckoutForm - Multi-step checkout form component
 * Handles customer information, shipping, billing, and payment
 * 
 * Features:
 * - Multi-step navigation with validation
 * - Customer information collection
 * - Shipping and billing address forms
 * - Payment method integration
 * - Form validation and error handling
 * - Guest checkout vs account creation
 * - Mobile-responsive design
 * - Accessibility compliance
 */

import { EVENTS } from '../config/supabase.js';

export default class CheckoutForm {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container element not found: ${containerId}`);
        }

        this.options = {
            allowGuestCheckout: options.allowGuestCheckout !== false,
            requirePhoneNumber: options.requirePhoneNumber || false,
            enableSavedAddresses: options.enableSavedAddresses !== false,
            enableStripe: options.enableStripe !== false,
            stripePublicKey: options.stripePublicKey || null,
            ...options
        };

        // Form steps
        this.steps = [
            { id: 'customer', title: 'Customer Information', isValid: false },
            { id: 'shipping', title: 'Shipping Address', isValid: false },
            { id: 'payment', title: 'Payment', isValid: false },
            { id: 'review', title: 'Review Order', isValid: false }
        ];

        // State
        this.currentStep = 0;
        this.formData = {
            customer: {},
            shipping: {},
            billing: {},
            payment: {},
            isGuestCheckout: true,
            billingIsSameAsShipping: true
        };

        this.validationErrors = {};
        this.isSubmitting = false;
        
        // Callbacks
        this.onStepChange = options.onStepChange || (() => {});
        this.onFormSubmit = options.onFormSubmit || (() => {});
        this.onFormValidation = options.onFormValidation || (() => {});

        this.initialize();
    }

    /**
     * Initialize the component
     */
    initialize() {
        this.render();
        this.attachEventListeners();
        console.log('CheckoutForm component initialized');
    }

    /**
     * Render the checkout form
     */
    render() {
        const html = `
            <div class="checkout-form">
                ${this.renderStepIndicator()}
                <div class="checkout-form-content">
                    ${this.renderCurrentStep()}
                </div>
                ${this.renderNavigationButtons()}
            </div>
        `;

        this.container.innerHTML = html;
        this.attachStepEventListeners();
    }

    /**
     * Render step indicator
     * @returns {string} HTML for step indicator
     */
    renderStepIndicator() {
        return `
            <div class="step-indicator">
                <div class="step-indicator-track" role="progressbar" 
                     aria-valuenow="${this.currentStep + 1}" 
                     aria-valuemin="1" 
                     aria-valuemax="${this.steps.length}"
                     aria-label="Checkout progress">
                    ${this.steps.map((step, index) => `
                        <div class="step-indicator-item ${this.getStepClass(index)}" 
                             data-step="${index}">
                            <div class="step-indicator-circle">
                                <span class="step-number">${index + 1}</span>
                                ${this.steps[index].isValid ? `
                                    <svg class="step-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                ` : ''}
                            </div>
                            <div class="step-indicator-label">
                                <span class="step-title">${step.title}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get CSS class for step indicator item
     * @param {number} stepIndex - Step index
     * @returns {string} CSS class
     */
    getStepClass(stepIndex) {
        const classes = [];
        
        if (stepIndex === this.currentStep) {
            classes.push('step-indicator-item--current');
        }
        
        if (stepIndex < this.currentStep) {
            classes.push('step-indicator-item--completed');
        }
        
        if (this.steps[stepIndex].isValid) {
            classes.push('step-indicator-item--valid');
        }
        
        return classes.join(' ');
    }

    /**
     * Render current step content
     * @returns {string} HTML for current step
     */
    renderCurrentStep() {
        const step = this.steps[this.currentStep];
        
        switch (step.id) {
            case 'customer':
                return this.renderCustomerStep();
            case 'shipping':
                return this.renderShippingStep();
            case 'payment':
                return this.renderPaymentStep();
            case 'review':
                return this.renderReviewStep();
            default:
                return '<div>Unknown step</div>';
        }
    }

    /**
     * Render customer information step
     * @returns {string} HTML for customer step
     */
    renderCustomerStep() {
        return `
            <div class="checkout-step checkout-step--customer">
                <div class="step-header">
                    <h2>Customer Information</h2>
                    <p>Provide your contact information for order updates.</p>
                </div>
                
                ${this.options.allowGuestCheckout ? `
                    <div class="checkout-type-selector">
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="checkout-type" value="guest" 
                                       ${this.formData.isGuestCheckout ? 'checked' : ''}>
                                <span class="radio-label">Guest Checkout</span>
                                <span class="radio-description">Checkout quickly without creating an account</span>
                            </label>
                            
                            <label class="radio-option">
                                <input type="radio" name="checkout-type" value="account" 
                                       ${!this.formData.isGuestCheckout ? 'checked' : ''}>
                                <span class="radio-label">Create Account</span>
                                <span class="radio-description">Save your information for faster future checkout</span>
                            </label>
                        </div>
                    </div>
                ` : ''}
                
                <div class="form-section">
                    <div class="form-row">
                        <div class="form-field">
                            <label for="customer-email" class="form-label required">Email Address</label>
                            <input type="email" 
                                   id="customer-email" 
                                   name="email"
                                   class="form-input"
                                   value="${this.formData.customer.email || ''}"
                                   required
                                   autocomplete="email"
                                   placeholder="your@email.com">
                            ${this.renderFieldError('customer.email')}
                        </div>
                    </div>
                    
                    <div class="form-row form-row--dual">
                        <div class="form-field">
                            <label for="customer-first-name" class="form-label required">First Name</label>
                            <input type="text" 
                                   id="customer-first-name" 
                                   name="firstName"
                                   class="form-input"
                                   value="${this.formData.customer.firstName || ''}"
                                   required
                                   autocomplete="given-name"
                                   placeholder="First name">
                            ${this.renderFieldError('customer.firstName')}
                        </div>
                        
                        <div class="form-field">
                            <label for="customer-last-name" class="form-label required">Last Name</label>
                            <input type="text" 
                                   id="customer-last-name" 
                                   name="lastName"
                                   class="form-input"
                                   value="${this.formData.customer.lastName || ''}"
                                   required
                                   autocomplete="family-name"
                                   placeholder="Last name">
                            ${this.renderFieldError('customer.lastName')}
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-field">
                            <label for="customer-phone" class="form-label ${this.options.requirePhoneNumber ? 'required' : ''}">Phone Number</label>
                            <input type="tel" 
                                   id="customer-phone" 
                                   name="phone"
                                   class="form-input"
                                   value="${this.formData.customer.phone || ''}"
                                   ${this.options.requirePhoneNumber ? 'required' : ''}
                                   autocomplete="tel"
                                   placeholder="(555) 123-4567">
                            ${this.renderFieldError('customer.phone')}
                        </div>
                    </div>
                    
                    ${!this.formData.isGuestCheckout ? `
                        <div class="form-row">
                            <div class="form-field">
                                <label for="customer-password" class="form-label required">Password</label>
                                <input type="password" 
                                       id="customer-password" 
                                       name="password"
                                       class="form-input"
                                       value="${this.formData.customer.password || ''}"
                                       required
                                       autocomplete="new-password"
                                       placeholder="Enter a secure password"
                                       minlength="8">
                                ${this.renderFieldError('customer.password')}
                                <div class="form-help">Password must be at least 8 characters long</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render shipping address step
     * @returns {string} HTML for shipping step
     */
    renderShippingStep() {
        return `
            <div class="checkout-step checkout-step--shipping">
                <div class="step-header">
                    <h2>Shipping Address</h2>
                    <p>Where should we send your order?</p>
                </div>
                
                <div class="form-section">
                    <div class="form-row">
                        <div class="form-field">
                            <label for="shipping-address1" class="form-label required">Address Line 1</label>
                            <input type="text" 
                                   id="shipping-address1" 
                                   name="addressLine1"
                                   class="form-input"
                                   value="${this.formData.shipping.addressLine1 || ''}"
                                   required
                                   autocomplete="shipping address-line1"
                                   placeholder="123 Main Street">
                            ${this.renderFieldError('shipping.addressLine1')}
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-field">
                            <label for="shipping-address2" class="form-label">Address Line 2</label>
                            <input type="text" 
                                   id="shipping-address2" 
                                   name="addressLine2"
                                   class="form-input"
                                   value="${this.formData.shipping.addressLine2 || ''}"
                                   autocomplete="shipping address-line2"
                                   placeholder="Apartment, suite, etc. (optional)">
                            ${this.renderFieldError('shipping.addressLine2')}
                        </div>
                    </div>
                    
                    <div class="form-row form-row--triple">
                        <div class="form-field">
                            <label for="shipping-city" class="form-label required">City</label>
                            <input type="text" 
                                   id="shipping-city" 
                                   name="city"
                                   class="form-input"
                                   value="${this.formData.shipping.city || ''}"
                                   required
                                   autocomplete="shipping address-level2"
                                   placeholder="City">
                            ${this.renderFieldError('shipping.city')}
                        </div>
                        
                        <div class="form-field">
                            <label for="shipping-state" class="form-label required">State</label>
                            <select id="shipping-state" 
                                    name="state"
                                    class="form-select"
                                    required
                                    autocomplete="shipping address-level1">
                                <option value="">Select State</option>
                                ${this.renderStateOptions(this.formData.shipping.state)}
                            </select>
                            ${this.renderFieldError('shipping.state')}
                        </div>
                        
                        <div class="form-field">
                            <label for="shipping-postal-code" class="form-label required">ZIP Code</label>
                            <input type="text" 
                                   id="shipping-postal-code" 
                                   name="postalCode"
                                   class="form-input"
                                   value="${this.formData.shipping.postalCode || ''}"
                                   required
                                   autocomplete="shipping postal-code"
                                   placeholder="12345"
                                   pattern="[0-9]{5}(-[0-9]{4})?">
                            ${this.renderFieldError('shipping.postalCode')}
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-field">
                            <label for="shipping-country" class="form-label required">Country</label>
                            <select id="shipping-country" 
                                    name="country"
                                    class="form-select"
                                    required
                                    autocomplete="shipping country">
                                <option value="US" ${this.formData.shipping.country === 'US' ? 'selected' : ''}>United States</option>
                                <option value="CA" ${this.formData.shipping.country === 'CA' ? 'selected' : ''}>Canada</option>
                            </select>
                            ${this.renderFieldError('shipping.country')}
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Billing Address</h3>
                    <div class="checkbox-field">
                        <label class="checkbox-option">
                            <input type="checkbox" 
                                   name="billingIsSameAsShipping"
                                   ${this.formData.billingIsSameAsShipping ? 'checked' : ''}>
                            <span class="checkbox-label">Same as shipping address</span>
                        </label>
                    </div>
                    
                    ${!this.formData.billingIsSameAsShipping ? this.renderBillingAddressFields() : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render billing address fields
     * @returns {string} HTML for billing address fields
     */
    renderBillingAddressFields() {
        return `
            <div class="billing-address-fields">
                <div class="form-row">
                    <div class="form-field">
                        <label for="billing-address1" class="form-label required">Address Line 1</label>
                        <input type="text" 
                               id="billing-address1" 
                               name="addressLine1"
                               class="form-input"
                               value="${this.formData.billing.addressLine1 || ''}"
                               required
                               autocomplete="billing address-line1"
                               placeholder="123 Main Street">
                        ${this.renderFieldError('billing.addressLine1')}
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-field">
                        <label for="billing-address2" class="form-label">Address Line 2</label>
                        <input type="text" 
                               id="billing-address2" 
                               name="addressLine2"
                               class="form-input"
                               value="${this.formData.billing.addressLine2 || ''}"
                               autocomplete="billing address-line2"
                               placeholder="Apartment, suite, etc. (optional)">
                        ${this.renderFieldError('billing.addressLine2')}
                    </div>
                </div>
                
                <div class="form-row form-row--triple">
                    <div class="form-field">
                        <label for="billing-city" class="form-label required">City</label>
                        <input type="text" 
                               id="billing-city" 
                               name="city"
                               class="form-input"
                               value="${this.formData.billing.city || ''}"
                               required
                               autocomplete="billing address-level2"
                               placeholder="City">
                        ${this.renderFieldError('billing.city')}
                    </div>
                    
                    <div class="form-field">
                        <label for="billing-state" class="form-label required">State</label>
                        <select id="billing-state" 
                                name="state"
                                class="form-select"
                                required
                                autocomplete="billing address-level1">
                            <option value="">Select State</option>
                            ${this.renderStateOptions(this.formData.billing.state)}
                        </select>
                        ${this.renderFieldError('billing.state')}
                    </div>
                    
                    <div class="form-field">
                        <label for="billing-postal-code" class="form-label required">ZIP Code</label>
                        <input type="text" 
                               id="billing-postal-code" 
                               name="postalCode"
                               class="form-input"
                               value="${this.formData.billing.postalCode || ''}"
                               required
                               autocomplete="billing postal-code"
                               placeholder="12345"
                               pattern="[0-9]{5}(-[0-9]{4})?">
                        ${this.renderFieldError('billing.postalCode')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render payment step
     * @returns {string} HTML for payment step
     */
    renderPaymentStep() {
        return `
            <div class="checkout-step checkout-step--payment">
                <div class="step-header">
                    <h2>Payment Information</h2>
                    <p>Choose your payment method and enter your payment details.</p>
                </div>
                
                <div class="form-section">
                    <div class="payment-methods">
                        <div class="radio-group">
                            <label class="radio-option payment-option">
                                <input type="radio" name="payment-method" value="card" checked>
                                <span class="radio-label">Credit or Debit Card</span>
                                <div class="payment-icons">
                                    <span class="payment-icon payment-icon--visa">Visa</span>
                                    <span class="payment-icon payment-icon--mastercard">Mastercard</span>
                                    <span class="payment-icon payment-icon--amex">Amex</span>
                                    <span class="payment-icon payment-icon--discover">Discover</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="payment-form" id="payment-form">
                        ${this.options.enableStripe ? this.renderStripeForm() : this.renderCardForm()}
                    </div>
                </div>
                
                <div class="form-section">
                    <div class="security-info">
                        <div class="security-icons">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="16" r="1"></circle>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Your payment information is encrypted and secure</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Stripe payment form
     * @returns {string} HTML for Stripe form
     */
    renderStripeForm() {
        return `
            <div class="stripe-payment-form">
                <div id="stripe-card-element" class="stripe-element">
                    <!-- Stripe Elements will create form elements here -->
                </div>
                <div id="stripe-card-errors" class="form-error" role="alert"></div>
            </div>
        `;
    }

    /**
     * Render standard card form
     * @returns {string} HTML for standard card form
     */
    renderCardForm() {
        return `
            <div class="card-payment-form">
                <div class="form-row">
                    <div class="form-field">
                        <label for="card-number" class="form-label required">Card Number</label>
                        <input type="text" 
                               id="card-number" 
                               name="cardNumber"
                               class="form-input"
                               value="${this.formData.payment.cardNumber || ''}"
                               required
                               autocomplete="cc-number"
                               placeholder="1234 5678 9012 3456"
                               maxlength="19">
                        ${this.renderFieldError('payment.cardNumber')}
                    </div>
                </div>
                
                <div class="form-row form-row--dual">
                    <div class="form-field">
                        <label for="card-expiry" class="form-label required">Expiry Date</label>
                        <input type="text" 
                               id="card-expiry" 
                               name="cardExpiry"
                               class="form-input"
                               value="${this.formData.payment.cardExpiry || ''}"
                               required
                               autocomplete="cc-exp"
                               placeholder="MM/YY"
                               maxlength="5">
                        ${this.renderFieldError('payment.cardExpiry')}
                    </div>
                    
                    <div class="form-field">
                        <label for="card-cvc" class="form-label required">Security Code</label>
                        <input type="text" 
                               id="card-cvc" 
                               name="cardCvc"
                               class="form-input"
                               value="${this.formData.payment.cardCvc || ''}"
                               required
                               autocomplete="cc-csc"
                               placeholder="123"
                               maxlength="4">
                        ${this.renderFieldError('payment.cardCvc')}
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-field">
                        <label for="card-name" class="form-label required">Cardholder Name</label>
                        <input type="text" 
                               id="card-name" 
                               name="cardName"
                               class="form-input"
                               value="${this.formData.payment.cardName || ''}"
                               required
                               autocomplete="cc-name"
                               placeholder="Name as it appears on card">
                        ${this.renderFieldError('payment.cardName')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render review step
     * @returns {string} HTML for review step
     */
    renderReviewStep() {
        return `
            <div class="checkout-step checkout-step--review">
                <div class="step-header">
                    <h2>Review Your Order</h2>
                    <p>Please review your order details before completing your purchase.</p>
                </div>
                
                <div class="review-sections">
                    <div class="review-section">
                        <h3>Customer Information</h3>
                        <div class="review-content">
                            <p><strong>Name:</strong> ${this.formData.customer.firstName} ${this.formData.customer.lastName}</p>
                            <p><strong>Email:</strong> ${this.formData.customer.email}</p>
                            ${this.formData.customer.phone ? `<p><strong>Phone:</strong> ${this.formData.customer.phone}</p>` : ''}
                        </div>
                        <button type="button" class="review-edit-btn" data-step="0">Edit</button>
                    </div>
                    
                    <div class="review-section">
                        <h3>Shipping Address</h3>
                        <div class="review-content">
                            <p>${this.formData.shipping.addressLine1}</p>
                            ${this.formData.shipping.addressLine2 ? `<p>${this.formData.shipping.addressLine2}</p>` : ''}
                            <p>${this.formData.shipping.city}, ${this.formData.shipping.state} ${this.formData.shipping.postalCode}</p>
                            <p>${this.formData.shipping.country === 'US' ? 'United States' : this.formData.shipping.country}</p>
                        </div>
                        <button type="button" class="review-edit-btn" data-step="1">Edit</button>
                    </div>
                    
                    <div class="review-section">
                        <h3>Payment Method</h3>
                        <div class="review-content">
                            ${this.renderPaymentSummary()}
                        </div>
                        <button type="button" class="review-edit-btn" data-step="2">Edit</button>
                    </div>
                </div>
                
                <div class="terms-section">
                    <div class="checkbox-field">
                        <label class="checkbox-option">
                            <input type="checkbox" name="agreeToTerms" required>
                            <span class="checkbox-label">
                                I agree to the <a href="/terms" target="_blank">Terms of Service</a> 
                                and <a href="/privacy" target="_blank">Privacy Policy</a>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render payment summary for review
     * @returns {string} HTML for payment summary
     */
    renderPaymentSummary() {
        if (this.options.enableStripe && this.formData.payment.stripeCard) {
            return `
                <p><strong>Card:</strong> •••• •••• •••• ${this.formData.payment.stripeCard.last4}</p>
                <p><strong>Expires:</strong> ${this.formData.payment.stripeCard.exp_month}/${this.formData.payment.stripeCard.exp_year}</p>
            `;
        } else if (this.formData.payment.cardNumber) {
            const last4 = this.formData.payment.cardNumber.slice(-4);
            return `
                <p><strong>Card:</strong> •••• •••• •••• ${last4}</p>
                <p><strong>Expires:</strong> ${this.formData.payment.cardExpiry}</p>
            `;
        }
        
        return '<p>No payment method selected</p>';
    }

    /**
     * Render state options
     * @param {string} selectedState - Currently selected state
     * @returns {string} HTML for state options
     */
    renderStateOptions(selectedState = '') {
        const states = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];

        return states.map(state => 
            `<option value="${state}" ${state === selectedState ? 'selected' : ''}>${state}</option>`
        ).join('');
    }

    /**
     * Render field error message
     * @param {string} fieldPath - Field path (e.g., 'customer.email')
     * @returns {string} HTML for error message
     */
    renderFieldError(fieldPath) {
        const error = this.getNestedValue(this.validationErrors, fieldPath);
        return error ? `<div class="form-error">${error}</div>` : '';
    }

    /**
     * Render navigation buttons
     * @returns {string} HTML for navigation buttons
     */
    renderNavigationButtons() {
        const isFirstStep = this.currentStep === 0;
        const isLastStep = this.currentStep === this.steps.length - 1;

        return `
            <div class="checkout-navigation">
                ${!isFirstStep ? `
                    <button type="button" class="btn btn-secondary checkout-nav-btn" data-action="back">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15,18 9,12 15,6"></polyline>
                        </svg>
                        Back
                    </button>
                ` : ''}
                
                <button type="button" 
                        class="btn btn-primary checkout-nav-btn" 
                        data-action="${isLastStep ? 'submit' : 'next'}"
                        ${this.isSubmitting ? 'disabled' : ''}>
                    ${this.isSubmitting ? 'Processing...' : isLastStep ? 'Complete Order' : 'Continue'}
                    ${!isLastStep ? `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    ` : ''}
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Navigation buttons
        this.container.addEventListener('click', (event) => {
            if (event.target.closest('.checkout-nav-btn')) {
                const action = event.target.closest('.checkout-nav-btn').dataset.action;
                this.handleNavigation(action);
            }
            
            if (event.target.closest('.review-edit-btn')) {
                const stepIndex = parseInt(event.target.closest('.review-edit-btn').dataset.step);
                this.goToStep(stepIndex);
            }
        });

        // Form input changes
        this.container.addEventListener('input', this.handleFormInput.bind(this));
        this.container.addEventListener('change', this.handleFormChange.bind(this));
    }

    /**
     * Attach step-specific event listeners
     */
    attachStepEventListeners() {
        // Customer step listeners
        if (this.currentStep === 0) {
            const checkoutTypeInputs = this.container.querySelectorAll('input[name="checkout-type"]');
            checkoutTypeInputs.forEach(input => {
                input.addEventListener('change', (event) => {
                    this.formData.isGuestCheckout = event.target.value === 'guest';
                    this.render();
                });
            });
        }

        // Shipping step listeners
        if (this.currentStep === 1) {
            const billingCheckbox = this.container.querySelector('input[name="billingIsSameAsShipping"]');
            if (billingCheckbox) {
                billingCheckbox.addEventListener('change', (event) => {
                    this.formData.billingIsSameAsShipping = event.target.checked;
                    this.render();
                });
            }
        }

        // Payment step listeners
        if (this.currentStep === 2) {
            this.setupPaymentFormListeners();
        }
    }

    /**
     * Setup payment form listeners
     */
    setupPaymentFormListeners() {
        if (this.options.enableStripe) {
            this.setupStripeElements();
        } else {
            this.setupCardFormatting();
        }
    }

    /**
     * Setup Stripe Elements (placeholder)
     */
    setupStripeElements() {
        // This would integrate with actual Stripe Elements
        console.log('Stripe Elements setup placeholder');
    }

    /**
     * Setup card number formatting
     */
    setupCardFormatting() {
        const cardNumberInput = this.container.querySelector('#card-number');
        const cardExpiryInput = this.container.querySelector('#card-expiry');

        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', this.formatCardNumber.bind(this));
        }

        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', this.formatCardExpiry.bind(this));
        }
    }

    /**
     * Format card number input
     * @param {Event} event - Input event
     */
    formatCardNumber(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        
        // Add spaces every 4 digits
        value = value.match(/.{1,4}/g)?.join(' ') || value;
        
        input.value = value;
        this.formData.payment.cardNumber = value;
    }

    /**
     * Format card expiry input
     * @param {Event} event - Input event
     */
    formatCardExpiry(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        
        // Add slash after 2 digits
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        input.value = value;
        this.formData.payment.cardExpiry = value;
    }

    /**
     * Handle form input events
     * @param {Event} event - Input event
     */
    handleFormInput(event) {
        const input = event.target;
        if (!input.name) return;

        const step = this.steps[this.currentStep].id;
        this.setNestedValue(this.formData[step], input.name, input.value);
        
        // Clear validation error for this field
        this.clearFieldError(`${step}.${input.name}`);
    }

    /**
     * Handle form change events
     * @param {Event} event - Change event
     */
    handleFormChange(event) {
        const input = event.target;
        if (!input.name) return;

        const step = this.steps[this.currentStep].id;
        
        if (input.type === 'checkbox') {
            this.setNestedValue(this.formData[step], input.name, input.checked);
        } else {
            this.setNestedValue(this.formData[step], input.name, input.value);
        }
        
        // Validate field on change
        this.validateField(step, input.name, input.value);
    }

    /**
     * Handle navigation button clicks
     * @param {string} action - Navigation action
     */
    async handleNavigation(action) {
        switch (action) {
            case 'back':
                this.goToPreviousStep();
                break;
            case 'next':
                await this.goToNextStep();
                break;
            case 'submit':
                await this.submitForm();
                break;
        }
    }

    /**
     * Go to previous step
     */
    goToPreviousStep() {
        if (this.currentStep > 0) {
            this.goToStep(this.currentStep - 1);
        }
    }

    /**
     * Go to next step
     */
    async goToNextStep() {
        if (await this.validateCurrentStep()) {
            this.goToStep(this.currentStep + 1);
        }
    }

    /**
     * Go to specific step
     * @param {number} stepIndex - Step index to go to
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.render();
            this.onStepChange(stepIndex, this.steps[stepIndex]);
            
            // Scroll to top of form
            this.container.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Validate current step
     * @returns {Promise<boolean>} Is valid
     */
    async validateCurrentStep() {
        const step = this.steps[this.currentStep];
        this.clearValidationErrors();
        
        let isValid = true;
        
        switch (step.id) {
            case 'customer':
                isValid = await this.validateCustomerStep();
                break;
            case 'shipping':
                isValid = await this.validateShippingStep();
                break;
            case 'payment':
                isValid = await this.validatePaymentStep();
                break;
            case 'review':
                isValid = await this.validateReviewStep();
                break;
        }
        
        this.steps[this.currentStep].isValid = isValid;
        
        if (!isValid) {
            this.render(); // Re-render to show errors
        }
        
        return isValid;
    }

    /**
     * Validate customer step
     * @returns {Promise<boolean>} Is valid
     */
    async validateCustomerStep() {
        let isValid = true;
        const customer = this.formData.customer;
        
        // Email validation
        if (!customer.email) {
            this.setValidationError('customer.email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(customer.email)) {
            this.setValidationError('customer.email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Name validation
        if (!customer.firstName) {
            this.setValidationError('customer.firstName', 'First name is required');
            isValid = false;
        }
        
        if (!customer.lastName) {
            this.setValidationError('customer.lastName', 'Last name is required');
            isValid = false;
        }
        
        // Phone validation (if required)
        if (this.options.requirePhoneNumber && !customer.phone) {
            this.setValidationError('customer.phone', 'Phone number is required');
            isValid = false;
        }
        
        // Password validation (if creating account)
        if (!this.formData.isGuestCheckout) {
            if (!customer.password) {
                this.setValidationError('customer.password', 'Password is required');
                isValid = false;
            } else if (customer.password.length < 8) {
                this.setValidationError('customer.password', 'Password must be at least 8 characters long');
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * Validate shipping step
     * @returns {Promise<boolean>} Is valid
     */
    async validateShippingStep() {
        let isValid = true;
        const shipping = this.formData.shipping;
        
        // Required shipping fields
        const requiredFields = ['addressLine1', 'city', 'state', 'postalCode', 'country'];
        
        for (const field of requiredFields) {
            if (!shipping[field]) {
                this.setValidationError(`shipping.${field}`, `${this.getFieldLabel(field)} is required`);
                isValid = false;
            }
        }
        
        // Postal code format validation
        if (shipping.postalCode && !this.isValidPostalCode(shipping.postalCode)) {
            this.setValidationError('shipping.postalCode', 'Please enter a valid ZIP code');
            isValid = false;
        }
        
        // Validate billing address if different from shipping
        if (!this.formData.billingIsSameAsShipping) {
            const billing = this.formData.billing;
            
            for (const field of requiredFields) {
                if (!billing[field]) {
                    this.setValidationError(`billing.${field}`, `${this.getFieldLabel(field)} is required`);
                    isValid = false;
                }
            }
        }
        
        return isValid;
    }

    /**
     * Validate payment step
     * @returns {Promise<boolean>} Is valid
     */
    async validatePaymentStep() {
        if (this.options.enableStripe) {
            return await this.validateStripePayment();
        } else {
            return this.validateCardPayment();
        }
    }

    /**
     * Validate Stripe payment
     * @returns {Promise<boolean>} Is valid
     */
    async validateStripePayment() {
        // This would validate Stripe Elements
        console.log('Stripe payment validation placeholder');
        return true;
    }

    /**
     * Validate card payment
     * @returns {boolean} Is valid
     */
    validateCardPayment() {
        let isValid = true;
        const payment = this.formData.payment;
        
        // Card number validation
        if (!payment.cardNumber) {
            this.setValidationError('payment.cardNumber', 'Card number is required');
            isValid = false;
        } else if (!this.isValidCardNumber(payment.cardNumber)) {
            this.setValidationError('payment.cardNumber', 'Please enter a valid card number');
            isValid = false;
        }
        
        // Expiry validation
        if (!payment.cardExpiry) {
            this.setValidationError('payment.cardExpiry', 'Expiry date is required');
            isValid = false;
        } else if (!this.isValidCardExpiry(payment.cardExpiry)) {
            this.setValidationError('payment.cardExpiry', 'Please enter a valid expiry date');
            isValid = false;
        }
        
        // CVC validation
        if (!payment.cardCvc) {
            this.setValidationError('payment.cardCvc', 'Security code is required');
            isValid = false;
        } else if (!this.isValidCardCvc(payment.cardCvc)) {
            this.setValidationError('payment.cardCvc', 'Please enter a valid security code');
            isValid = false;
        }
        
        // Cardholder name validation
        if (!payment.cardName) {
            this.setValidationError('payment.cardName', 'Cardholder name is required');
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * Validate review step
     * @returns {Promise<boolean>} Is valid
     */
    async validateReviewStep() {
        const agreeToTerms = this.container.querySelector('input[name="agreeToTerms"]')?.checked;
        
        if (!agreeToTerms) {
            this.setValidationError('review.agreeToTerms', 'You must agree to the terms of service');
            return false;
        }
        
        return true;
    }

    /**
     * Submit form
     */
    async submitForm() {
        if (this.isSubmitting) return;
        
        // Final validation
        if (!await this.validateCurrentStep()) {
            return;
        }
        
        this.isSubmitting = true;
        this.render(); // Update button state
        
        try {
            // Prepare form data for submission
            const submitData = this.prepareSubmissionData();
            
            // Call submission callback
            await this.onFormSubmit(submitData);
            
        } catch (error) {
            console.error('Form submission failed:', error);
            this.showError('Order submission failed. Please try again.');
        } finally {
            this.isSubmitting = false;
            this.render();
        }
    }

    /**
     * Prepare data for submission
     * @returns {Object} Submission data
     */
    prepareSubmissionData() {
        return {
            customer: {
                email: this.formData.customer.email,
                firstName: this.formData.customer.firstName,
                lastName: this.formData.customer.lastName,
                fullName: `${this.formData.customer.firstName} ${this.formData.customer.lastName}`,
                phone: this.formData.customer.phone || null,
                password: this.formData.isGuestCheckout ? null : this.formData.customer.password
            },
            shipping: {
                addressLine1: this.formData.shipping.addressLine1,
                addressLine2: this.formData.shipping.addressLine2 || null,
                city: this.formData.shipping.city,
                state: this.formData.shipping.state,
                postalCode: this.formData.shipping.postalCode,
                country: this.formData.shipping.country
            },
            billing: this.formData.billingIsSameAsShipping ? null : {
                addressLine1: this.formData.billing.addressLine1,
                addressLine2: this.formData.billing.addressLine2 || null,
                city: this.formData.billing.city,
                state: this.formData.billing.state,
                postalCode: this.formData.billing.postalCode,
                country: this.formData.billing.country
            },
            payment: {
                method: 'card',
                ...this.formData.payment
            },
            isGuestCheckout: this.formData.isGuestCheckout
        };
    }

    // ===========================================
    // Validation Helpers
    // ===========================================

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate postal code format
     * @param {string} postalCode - Postal code to validate
     * @returns {boolean} Is valid
     */
    isValidPostalCode(postalCode) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(postalCode);
    }

    /**
     * Validate card number
     * @param {string} cardNumber - Card number to validate
     * @returns {boolean} Is valid
     */
    isValidCardNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        return cleanNumber.length >= 13 && cleanNumber.length <= 19 && /^\d+$/.test(cleanNumber);
    }

    /**
     * Validate card expiry
     * @param {string} expiry - Expiry to validate (MM/YY format)
     * @returns {boolean} Is valid
     */
    isValidCardExpiry(expiry) {
        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;
        
        const month = parseInt(match[1]);
        const year = parseInt(match[2]) + 2000;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        return month >= 1 && month <= 12 && 
               (year > currentYear || (year === currentYear && month >= currentMonth));
    }

    /**
     * Validate card CVC
     * @param {string} cvc - CVC to validate
     * @returns {boolean} Is valid
     */
    isValidCardCvc(cvc) {
        return /^\d{3,4}$/.test(cvc);
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    /**
     * Set validation error
     * @param {string} fieldPath - Field path
     * @param {string} message - Error message
     */
    setValidationError(fieldPath, message) {
        this.setNestedValue(this.validationErrors, fieldPath, message);
    }

    /**
     * Clear field error
     * @param {string} fieldPath - Field path
     */
    clearFieldError(fieldPath) {
        this.setNestedValue(this.validationErrors, fieldPath, null);
    }

    /**
     * Clear all validation errors
     */
    clearValidationErrors() {
        this.validationErrors = {};
    }

    /**
     * Validate individual field
     * @param {string} step - Step name
     * @param {string} field - Field name
     * @param {*} value - Field value
     */
    validateField(step, field, value) {
        const fieldPath = `${step}.${field}`;
        
        // Clear existing error
        this.clearFieldError(fieldPath);
        
        // Basic validation based on field type
        if (field === 'email' && value && !this.isValidEmail(value)) {
            this.setValidationError(fieldPath, 'Please enter a valid email address');
        }
        
        // Update UI to show/hide error
        const errorElement = this.container.querySelector(`[data-field-path="${fieldPath}"] .form-error`);
        if (errorElement) {
            const error = this.getNestedValue(this.validationErrors, fieldPath);
            errorElement.textContent = error || '';
            errorElement.style.display = error ? 'block' : 'none';
        }
    }

    /**
     * Get nested value from object
     * @param {Object} obj - Object to search
     * @param {string} path - Path to value
     * @returns {*} Found value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Set nested value in object
     * @param {Object} obj - Object to modify
     * @param {string} path - Path to set
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        
        if (value === null || value === undefined) {
            delete target[lastKey];
        } else {
            target[lastKey] = value;
        }
    }

    /**
     * Get field label for error messages
     * @param {string} fieldName - Field name
     * @returns {string} Field label
     */
    getFieldLabel(fieldName) {
        const labels = {
            addressLine1: 'Address',
            addressLine2: 'Address Line 2',
            city: 'City',
            state: 'State',
            postalCode: 'ZIP Code',
            country: 'Country'
        };
        
        return labels[fieldName] || fieldName;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // This would show a global error message
        console.error('CheckoutForm Error:', message);
        
        // Could integrate with a toast notification system
        alert(message); // Placeholder
    }

    /**
     * Get current form data
     * @returns {Object} Current form data
     */
    getFormData() {
        return JSON.parse(JSON.stringify(this.formData));
    }

    /**
     * Get current step info
     * @returns {Object} Current step info
     */
    getCurrentStep() {
        return {
            index: this.currentStep,
            step: this.steps[this.currentStep],
            isValid: this.steps[this.currentStep].isValid
        };
    }

    /**
     * Check if form is complete
     * @returns {boolean} Is complete
     */
    isComplete() {
        return this.steps.every(step => step.isValid);
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        console.log('CheckoutForm component destroyed');
    }
}