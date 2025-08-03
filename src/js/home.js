// =============================================================================
// Timothie & Co Home Page JavaScript
// =============================================================================

import '../css/home.css';
import { homeImages } from './utils/homeImages.js';

// =============================================================================
// Smooth Scrolling Navigation
// =============================================================================
class SmoothScrolling {
    constructor() {
        this.init();
    }

    init() {
        // Add smooth scrolling to navigation links
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', this.handleSmoothScroll.bind(this));
        });

        // Update active nav link on scroll
        window.addEventListener('scroll', this.updateActiveNavLink.bind(this));
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const headerHeight = document.querySelector('.nav-header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        const headerHeight = document.querySelector('.nav-header').offsetHeight;
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= headerHeight + 100 && rect.bottom >= headerHeight + 100) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
}

// =============================================================================
// Header Scroll Effect
// =============================================================================
class HeaderScrollEffect {
    constructor() {
        this.header = document.querySelector('.nav-header');
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            this.header.style.background = '#EFCAC8';
            this.header.style.boxShadow = '0 4px 20px rgba(210, 107, 101, 0.1)';
        } else {
            this.header.style.background = '#EFCAC8';
            this.header.style.boxShadow = 'none';
        }
    }
}

// =============================================================================
// Mobile Menu Toggle
// =============================================================================
class MobileMenu {
    constructor() {
        this.toggle = document.querySelector('.mobile-menu-toggle');
        this.menuLeft = document.querySelector('.nav-menu-left');
        this.menuRight = document.querySelector('.nav-menu-right');
        this.init();
    }

    init() {
        if (this.toggle && (this.menuLeft || this.menuRight)) {
            this.toggle.addEventListener('click', this.toggleMenu.bind(this));
            
            // Close menu when clicking on a link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.menuLeft) this.menuLeft.classList.remove('mobile-active');
                    if (this.menuRight) this.menuRight.classList.remove('mobile-active');
                    this.toggle.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.toggle.contains(e.target) && 
                    (!this.menuLeft || !this.menuLeft.contains(e.target)) &&
                    (!this.menuRight || !this.menuRight.contains(e.target))) {
                    if (this.menuLeft) this.menuLeft.classList.remove('mobile-active');
                    if (this.menuRight) this.menuRight.classList.remove('mobile-active');
                    this.toggle.classList.remove('active');
                }
            });
        }
    }

    toggleMenu() {
        if (this.menuLeft) this.menuLeft.classList.toggle('mobile-active');
        if (this.menuRight) this.menuRight.classList.toggle('mobile-active');
        this.toggle.classList.toggle('active');
    }
}

// =============================================================================
// Scroll Animations
// =============================================================================
class ScrollAnimations {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        // Add animation classes to elements
        const animateElements = document.querySelectorAll([
            '.step-card',
            '.product-card',
            '.about-content',
            '.section-header'
        ].join(', '));

        animateElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.transitionDelay = `${index * 0.1}s`;
            
            this.elements.push({
                element,
                animated: false
            });
        });

        // Set up intersection observer
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        this.elements.forEach(item => {
            this.observer.observe(item.element);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const elementData = this.elements.find(item => item.element === entry.target);
                if (elementData && !elementData.animated) {
                    this.animateElement(entry.target);
                    elementData.animated = true;
                }
            }
        });
    }

    animateElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }
}

// =============================================================================
// Parallax Effect for Hero Background
// =============================================================================
class ParallaxEffect {
    constructor() {
        this.heroBackground = document.querySelector('.hero-background');
        this.init();
    }

    init() {
        if (this.heroBackground) {
            window.addEventListener('scroll', this.handleParallax.bind(this));
        }
    }

    handleParallax() {
        const scrollY = window.scrollY;
        const rate = scrollY * -0.5;
        this.heroBackground.style.transform = `translate3d(0, ${rate}px, 0)`;
    }
}

// =============================================================================
// Performance Optimized Scroll Handler
// =============================================================================
class ScrollManager {
    constructor() {
        this.ticking = false;
        this.callbacks = [];
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    init() {
        window.addEventListener('scroll', this.requestTick.bind(this));
    }

    requestTick() {
        if (!this.ticking) {
            requestAnimationFrame(this.update.bind(this));
            this.ticking = true;
        }
    }

    update() {
        this.callbacks.forEach(callback => callback());
        this.ticking = false;
    }
}

// =============================================================================
// Loading Animation
// =============================================================================
class LoadingAnimation {
    constructor() {
        this.init();
    }

    init() {
        // Add loading class to body
        document.body.classList.add('loading');

        // Remove loading class after page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.classList.remove('loading');
                document.body.classList.add('loaded');
            }, 500);
        });
    }
}

// =============================================================================
// Image Loading Manager
// =============================================================================
class ImageManager {
    constructor() {
        this.images = homeImages;
        this.init();
    }

    init() {
        // Update logo images
        this.updateLogoImages();
        
        // Update product/collection images
        this.updateProductImages();
        
        // Update step images
        this.updateStepImages();
        
        // Update hero background
        this.updateHeroBackground();
        
        // Update about section image
        this.updateAboutImage();
    }

    updateLogoImages() {
        // Update navigation logo
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo && this.images.logoHorizontal) {
            navLogo.src = this.images.logoHorizontal;
        }

        // Update favicon if needed
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon && this.images.logoHorizontal) {
            favicon.href = this.images.logoHorizontal;
        }
    }

    updateProductImages() {
        const productImageMap = [
            { selector: '.product-card:nth-child(1) .product-image', image: this.images.artisanCraftsmanship },
            { selector: '.product-card:nth-child(2) .product-image', image: this.images.premiumMaterials },
            { selector: '.product-card:nth-child(3) .product-image', image: this.images.meaningfulDesigns }
        ];

        productImageMap.forEach(({ selector, image }) => {
            const element = document.querySelector(selector);
            if (element && image) {
                element.src = image;
            }
        });
    }

    updateStepImages() {
        const stepImageMap = [
            { selector: '.step-card:nth-child(1) .step-image', image: this.images.artisanCraftsmanship },
            { selector: '.step-card:nth-child(2) .step-image', image: this.images.customCreations },
            { selector: '.step-card:nth-child(3) .step-image', image: this.images.jewelryCustomizer }
        ];

        stepImageMap.forEach(({ selector, image }) => {
            const element = document.querySelector(selector);
            if (element && image) {
                element.src = image;
            }
        });
    }

    updateHeroBackground() {
        // Update hero background image via CSS custom property
        if (this.images.heroBackground) {
            document.documentElement.style.setProperty('--hero-bg-image', `url('${this.images.heroBackground}')`);
        }
    }

    updateAboutImage() {
        const aboutImage = document.querySelector('.about-image');
        if (aboutImage && this.images.aboutImage) {
            aboutImage.src = this.images.aboutImage;
        }
    }
}

// =============================================================================
// Announcement Bar Functionality
// =============================================================================
class AnnouncementBar {
    constructor() {
        this.arrow = document.querySelector('.announcement-arrow');
        this.init();
    }

    init() {
        if (this.arrow) {
            this.arrow.addEventListener('click', this.handleClick.bind(this));
        }
    }

    handleClick() {
        // Add functionality for announcement bar navigation
        console.log('Announcement bar clicked - navigate to private charmshop');
        // You can add actual navigation logic here
    }
}

// =============================================================================
// Initialize All Components
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize image manager first to load all images
    new ImageManager();
    
    // Initialize loading animation
    new LoadingAnimation();
    
    // Initialize scroll manager for performance
    const scrollManager = new ScrollManager();
    
    // Initialize smooth scrolling
    new SmoothScrolling();
    
    // Initialize header scroll effect
    const headerEffect = new HeaderScrollEffect();
    scrollManager.addCallback(() => headerEffect.handleScroll());
    
    // Initialize announcement bar
    new AnnouncementBar();
    
    // Initialize mobile menu
    new MobileMenu();
    
    // Initialize scroll animations
    new ScrollAnimations();
    
    // Initialize parallax effect
    const parallax = new ParallaxEffect();
    scrollManager.addCallback(() => parallax.handleParallax());
    
    // Start scroll manager
    scrollManager.init();

    // Add some additional CSS for loading states and mobile menu
    const additionalStyles = `
        <style>
            body.loading {
                overflow: hidden;
            }
            
            body.loading::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--background-cream);
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            
            body.loaded::before {
                opacity: 0;
                pointer-events: none;
            }
            
            @media (max-width: 1024px) {
                .nav-menu-left,
                .nav-menu-right {
                    position: fixed;
                    top: 124px;
                    left: 0;
                    right: 0;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(20px);
                    flex-direction: column;
                    padding: var(--spacing-md);
                    gap: 1rem;
                    transform: translateY(-100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                    border-bottom: 1px solid var(--border-light);
                    box-shadow: 0 8px 32px var(--shadow-medium);
                }
                
                .nav-menu-left.mobile-active,
                .nav-menu-right.mobile-active {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                .nav-menu-right.mobile-active {
                    top: 200px; /* Stack below left menu */
                }
                
                .mobile-menu-toggle.active {
                    color: var(--accent-coral);
                }
                
                .nav-link {
                    padding: 1rem;
                    text-align: center;
                    border-radius: var(--radius-sm);
                }
            }
            
            .nav-link.active {
                color: var(--accent-coral);
                background: rgba(239, 202, 200, 0.1);
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
});

// =============================================================================
// Export for potential use in other modules
// =============================================================================
export {
    SmoothScrolling,
    HeaderScrollEffect,
    MobileMenu,
    ScrollAnimations,
    ParallaxEffect,
    ImageManager,
    AnnouncementBar
};