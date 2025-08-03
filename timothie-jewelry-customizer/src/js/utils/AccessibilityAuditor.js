/**
 * Accessibility Auditor - WCAG compliance testing and accessibility validation
 * for Timothie & Co Jewelry Customizer
 * 
 * Features:
 * - WCAG 2.1 AA compliance testing
 * - Keyboard navigation validation
 * - Screen reader compatibility
 * - Color contrast analysis
 * - Focus management testing
 * - ARIA attributes validation
 * - Semantic HTML structure analysis
 * - Automated accessibility issue detection
 */

class AccessibilityAuditor {
    constructor(options = {}) {
        this.options = {
            // WCAG compliance level
            wcagLevel: options.wcagLevel || 'AA',
            wcagVersion: options.wcagVersion || '2.1',
            
            // Test configuration
            timeout: options.timeout || 10000,
            retries: options.retries || 1,
            
            // Testing scope
            testPages: options.testPages || [
                { name: 'Home', url: '/src/home.html' },
                { name: 'Browse', url: '/src/browse.html' },
                { name: 'Product', url: '/src/product.html' },
                { name: 'Customizer', url: '/src/index.html' },
                { name: 'Checkout', url: '/src/checkout.html' }
            ],
            
            // Color contrast thresholds (WCAG AA)
            contrastThresholds: {
                normal: 4.5,
                large: 3.0,
                nonText: 3.0
            },
            
            // Test categories
            enableKeyboardTests: options.enableKeyboardTests !== false,
            enableColorContrastTests: options.enableColorContrastTests !== false,
            enableAriaTests: options.enableAriaTests !== false,
            enableSemanticTests: options.enableSemanticTests !== false,
            enableFocusTests: options.enableFocusTests !== false,
            
            ...options
        };

        this.auditResults = [];
        this.isRunning = false;
        this.currentPage = null;
        
        // WCAG guidelines and rules
        this.wcagGuidelines = this.initializeWCAGGuidelines();
        this.ariaRoles = this.initializeAriaRoles();
        this.semanticElements = this.initializeSemanticElements();
        
        this.setupTests();
    }

    setupTests() {
        this.tests = new Map([
            // Color and Contrast Tests
            ['color-contrast', { name: 'Color Contrast Analysis', test: this.testColorContrast.bind(this) }],
            ['color-only-information', { name: 'Color-Only Information', test: this.testColorOnlyInformation.bind(this) }],
            
            // Keyboard Navigation Tests
            ['keyboard-navigation', { name: 'Keyboard Navigation', test: this.testKeyboardNavigation.bind(this) }],
            ['focus-management', { name: 'Focus Management', test: this.testFocusManagement.bind(this) }],
            ['keyboard-traps', { name: 'Keyboard Trap Detection', test: this.testKeyboardTraps.bind(this) }],
            
            // ARIA and Labels Tests
            ['aria-labels', { name: 'ARIA Labels and Descriptions', test: this.testAriaLabels.bind(this) }],
            ['aria-roles', { name: 'ARIA Roles and Properties', test: this.testAriaRoles.bind(this) }],
            ['form-labels', { name: 'Form Labels and Instructions', test: this.testFormLabels.bind(this) }],
            
            // Semantic Structure Tests
            ['heading-structure', { name: 'Heading Structure and Hierarchy', test: this.testHeadingStructure.bind(this) }],
            ['landmark-regions', { name: 'Landmark Regions', test: this.testLandmarkRegions.bind(this) }],
            ['semantic-markup', { name: 'Semantic HTML Markup', test: this.testSemanticMarkup.bind(this) }],
            
            // Interactive Elements Tests
            ['interactive-elements', { name: 'Interactive Elements Accessibility', test: this.testInteractiveElements.bind(this) }],
            ['custom-controls', { name: 'Custom Controls Accessibility', test: this.testCustomControls.bind(this) }],
            
            // Media and Content Tests
            ['image-alt-text', { name: 'Image Alternative Text', test: this.testImageAltText.bind(this) }],
            ['media-captions', { name: 'Media Captions and Transcripts', test: this.testMediaCaptions.bind(this) }],
            
            // Error Handling and Feedback
            ['error-identification', { name: 'Error Identification and Feedback', test: this.testErrorIdentification.bind(this) }],
            ['status-messages', { name: 'Status Messages and Live Regions', test: this.testStatusMessages.bind(this) }],
            
            // Page Structure and Navigation
            ['page-titles', { name: 'Page Titles and Meta Information', test: this.testPageTitles.bind(this) }],
            ['skip-links', { name: 'Skip Links and Navigation', test: this.testSkipLinks.bind(this) }],
            ['breadcrumbs', { name: 'Breadcrumb Navigation', test: this.testBreadcrumbs.bind(this) }]
        ]);
    }

    // ===========================================
    // Main Audit Runner
    // ===========================================

    async runFullAudit() {
        if (this.isRunning) {
            throw new Error('Audit is already running');
        }

        this.isRunning = true;
        this.auditResults = [];
        
        console.log('Starting comprehensive accessibility audit...');
        
        try {
            // Test each page
            for (const page of this.options.testPages) {
                console.log(`Auditing page: ${page.name}`);
                await this.auditPage(page);
            }
            
            // Generate comprehensive report
            const report = this.generateAuditReport();
            console.log('Accessibility audit completed:', report);
            
            return report;
            
        } catch (error) {
            console.error('Accessibility audit failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async auditPage(page) {
        try {
            // Open page in new window for testing
            const pageWindow = await this.openPageForTesting(page.url);
            this.currentPage = page;
            
            const pageResults = {
                page: page.name,
                url: page.url,
                timestamp: Date.now(),
                tests: []
            };
            
            // Run all accessibility tests on this page
            for (const [testId, testConfig] of this.tests) {
                try {
                    const result = await this.runAccessibilityTest(pageWindow, testId, testConfig);
                    pageResults.tests.push({
                        testId,
                        name: testConfig.name,
                        status: 'passed',
                        result
                    });
                } catch (error) {
                    pageResults.tests.push({
                        testId,
                        name: testConfig.name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
            // Close test window
            pageWindow.close();
            
            this.auditResults.push(pageResults);
            
        } catch (error) {
            console.error(`Failed to audit page ${page.name}:`, error);
            this.auditResults.push({
                page: page.name,
                url: page.url,
                error: error.message,
                tests: []
            });
        }
    }

    async runAccessibilityTest(pageWindow, testId, testConfig) {
        const startTime = performance.now();
        
        try {
            const result = await Promise.race([
                testConfig.test(pageWindow),
                this.createTimeoutPromise(this.options.timeout)
            ]);
            
            const duration = performance.now() - startTime;
            
            return {
                ...result,
                duration: duration.toFixed(2),
                wcagLevel: this.options.wcagLevel
            };
            
        } catch (error) {
            throw new Error(`${testConfig.name} test failed: ${error.message}`);
        }
    }

    async openPageForTesting(url) {
        return new Promise((resolve, reject) => {
            const testWindow = window.open(url, '_blank');
            
            if (!testWindow) {
                reject(new Error('Failed to open test window'));
                return;
            }
            
            testWindow.addEventListener('load', () => {
                // Give page time to fully render
                setTimeout(() => resolve(testWindow), 1000);
            });
            
            testWindow.addEventListener('error', (error) => {
                testWindow.close();
                reject(error);
            });
        });
    }

    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Test timeout')), timeout);
        });
    }

    // ===========================================
    // Color and Contrast Tests
    // ===========================================

    async testColorContrast(pageWindow) {
        const doc = pageWindow.document;
        const contrastIssues = [];
        const textElements = doc.querySelectorAll('*');
        
        textElements.forEach(element => {
            if (this.hasTextContent(element)) {
                const styles = pageWindow.getComputedStyle(element);
                const backgroundColor = styles.backgroundColor;
                const color = styles.color;
                const fontSize = parseInt(styles.fontSize);
                
                if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    const contrast = this.calculateContrastRatio(color, backgroundColor);
                    const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= 700);
                    
                    const threshold = isLargeText ? 
                        this.options.contrastThresholds.large : 
                        this.options.contrastThresholds.normal;
                    
                    if (contrast < threshold) {
                        contrastIssues.push({
                            element: this.getElementIdentifier(element),
                            color,
                            backgroundColor,
                            contrast: contrast.toFixed(2),
                            threshold: threshold,
                            isLargeText,
                            wcagCriteria: '1.4.3'
                        });
                    }
                }
            }
        });
        
        return {
            contrastIssues,
            totalTextElements: textElements.length,
            passedElements: textElements.length - contrastIssues.length,
            wcagCompliant: contrastIssues.length === 0
        };
    }

    async testColorOnlyInformation(pageWindow) {
        const doc = pageWindow.document;
        const colorOnlyIssues = [];
        
        // Look for elements that might rely only on color
        const suspiciousElements = doc.querySelectorAll('.error, .success, .warning, .info, [style*="color"]');
        
        suspiciousElements.forEach(element => {
            const hasNonColorIndicator = this.hasNonColorIndicator(element);
            
            if (!hasNonColorIndicator) {
                colorOnlyIssues.push({
                    element: this.getElementIdentifier(element),
                    issue: 'May rely only on color for information',
                    wcagCriteria: '1.4.1'
                });
            }
        });
        
        return {
            colorOnlyIssues,
            wcagCompliant: colorOnlyIssues.length === 0
        };
    }

    // ===========================================
    // Keyboard Navigation Tests
    // ===========================================

    async testKeyboardNavigation(pageWindow) {
        const doc = pageWindow.document;
        const navigationIssues = [];
        
        // Find all interactive elements
        const interactiveElements = doc.querySelectorAll(
            'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"], [role="menuitem"]'
        );
        
        interactiveElements.forEach(element => {
            // Check if element is keyboard accessible
            const tabIndex = element.getAttribute('tabindex');
            const isHidden = element.style.display === 'none' || element.style.visibility === 'hidden';
            const isDisabled = element.disabled || element.getAttribute('aria-disabled') === 'true';
            
            if (!isHidden && !isDisabled) {
                // Check if element can receive keyboard focus
                if (tabIndex === '-1' && !this.isInherentlyFocusable(element)) {
                    navigationIssues.push({
                        element: this.getElementIdentifier(element),
                        issue: 'Interactive element not keyboard accessible',
                        wcagCriteria: '2.1.1'
                    });
                }
                
                // Check for keyboard event handlers
                if (!this.hasKeyboardHandlers(element)) {
                    navigationIssues.push({
                        element: this.getElementIdentifier(element),
                        issue: 'Interactive element lacks keyboard event handlers',
                        wcagCriteria: '2.1.1'
                    });
                }
            }
        });
        
        return {
            navigationIssues,
            totalInteractiveElements: interactiveElements.length,
            keyboardAccessible: interactiveElements.length - navigationIssues.length,
            wcagCompliant: navigationIssues.length === 0
        };
    }

    async testFocusManagement(pageWindow) {
        const doc = pageWindow.document;
        const focusIssues = [];
        
        // Check focus indicators
        const focusableElements = doc.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            const styles = pageWindow.getComputedStyle(element, ':focus');
            const hasFocusIndicator = this.hasFocusIndicator(styles);
            
            if (!hasFocusIndicator) {
                focusIssues.push({
                    element: this.getElementIdentifier(element),
                    issue: 'No visible focus indicator',
                    wcagCriteria: '2.4.7'
                });
            }
        });
        
        // Check for skip links
        const skipLinks = doc.querySelectorAll('a[href^="#"], .skip-link');
        const hasSkipLinks = skipLinks.length > 0;
        
        return {
            focusIssues,
            totalFocusableElements: focusableElements.length,
            hasSkipLinks,
            wcagCompliant: focusIssues.length === 0
        };
    }

    async testKeyboardTraps(pageWindow) {
        const doc = pageWindow.document;
        const trapIssues = [];
        
        // Look for modal dialogs and overlays
        const modals = doc.querySelectorAll('[role="dialog"], .modal, .overlay, .popup');
        
        modals.forEach(modal => {
            const focusableElements = modal.querySelectorAll(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                // Check if modal has proper focus trapping
                const hasProperFocusTrap = this.hasProperFocusTrap(modal);
                
                if (!hasProperFocusTrap) {
                    trapIssues.push({
                        element: this.getElementIdentifier(modal),
                        issue: 'Modal lacks proper focus trapping',
                        wcagCriteria: '2.1.2'
                    });
                }
            }
        });
        
        return {
            trapIssues,
            modalsChecked: modals.length,
            wcagCompliant: trapIssues.length === 0
        };
    }

    // ===========================================
    // ARIA and Labels Tests
    // ===========================================

    async testAriaLabels(pageWindow) {
        const doc = pageWindow.document;
        const labelIssues = [];
        
        // Check for missing ARIA labels
        const elementsNeedingLabels = doc.querySelectorAll(
            'button:not([aria-label]):not([aria-labelledby]), ' +
            'input:not([aria-label]):not([aria-labelledby]):not([id]), ' +
            '[role="button"]:not([aria-label]):not([aria-labelledby]), ' +
            '[role="link"]:not([aria-label]):not([aria-labelledby])'
        );
        
        elementsNeedingLabels.forEach(element => {
            if (!this.hasAccessibleName(element)) {
                labelIssues.push({
                    element: this.getElementIdentifier(element),
                    issue: 'Missing accessible name',
                    wcagCriteria: '4.1.2'
                });
            }
        });
        
        // Check ARIA labelledby references
        const labelledByElements = doc.querySelectorAll('[aria-labelledby]');
        labelledByElements.forEach(element => {
            const labelIds = element.getAttribute('aria-labelledby').split(' ');
            labelIds.forEach(id => {
                if (!doc.getElementById(id)) {
                    labelIssues.push({
                        element: this.getElementIdentifier(element),
                        issue: `aria-labelledby references non-existent ID: ${id}`,
                        wcagCriteria: '4.1.2'
                    });
                }
            });
        });
        
        return {
            labelIssues,
            elementsChecked: elementsNeedingLabels.length + labelledByElements.length,
            wcagCompliant: labelIssues.length === 0
        };
    }

    async testAriaRoles(pageWindow) {
        const doc = pageWindow.document;
        const roleIssues = [];
        
        // Check for invalid ARIA roles
        const elementsWithRoles = doc.querySelectorAll('[role]');
        
        elementsWithRoles.forEach(element => {
            const role = element.getAttribute('role');
            
            if (!this.isValidAriaRole(role)) {
                roleIssues.push({
                    element: this.getElementIdentifier(element),
                    issue: `Invalid ARIA role: ${role}`,
                    wcagCriteria: '4.1.2'
                });
            }
            
            // Check required ARIA properties for role
            const requiredProperties = this.getRequiredAriaProperties(role);
            requiredProperties.forEach(prop => {
                if (!element.hasAttribute(prop)) {
                    roleIssues.push({
                        element: this.getElementIdentifier(element),
                        issue: `Missing required ARIA property: ${prop}`,
                        wcagCriteria: '4.1.2'
                    });
                }
            });
        });
        
        return {
            roleIssues,
            elementsWithRoles: elementsWithRoles.length,
            wcagCompliant: roleIssues.length === 0
        };
    }

    async testFormLabels(pageWindow) {
        const doc = pageWindow.document;
        const formIssues = [];
        
        // Check form inputs for labels
        const formInputs = doc.querySelectorAll('input, select, textarea');
        
        formInputs.forEach(input => {
            const hasLabel = this.hasFormLabel(input);
            
            if (!hasLabel) {
                formIssues.push({
                    element: this.getElementIdentifier(input),
                    issue: 'Form control missing label',
                    wcagCriteria: '3.3.2'
                });
            }
        });
        
        // Check for form instructions
        const forms = doc.querySelectorAll('form');
        forms.forEach(form => {
            const hasInstructions = this.hasFormInstructions(form);
            
            if (!hasInstructions) {
                formIssues.push({
                    element: this.getElementIdentifier(form),
                    issue: 'Form lacks instructions or help text',
                    wcagCriteria: '3.3.2'
                });
            }
        });
        
        return {
            formIssues,
            formInputsChecked: formInputs.length,
            formsChecked: forms.length,
            wcagCompliant: formIssues.length === 0
        };
    }

    // ===========================================
    // Semantic Structure Tests
    // ===========================================

    async testHeadingStructure(pageWindow) {
        const doc = pageWindow.document;
        const headingIssues = [];
        
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            
            // Check for skipped heading levels
            if (level > previousLevel + 1) {
                headingIssues.push({
                    element: this.getElementIdentifier(heading),
                    issue: `Heading level skipped from h${previousLevel} to h${level}`,
                    wcagCriteria: '1.3.1'
                });
            }
            
            // Check for empty headings
            if (!heading.textContent.trim()) {
                headingIssues.push({
                    element: this.getElementIdentifier(heading),
                    issue: 'Empty heading element',
                    wcagCriteria: '1.3.1'
                });
            }
            
            previousLevel = level;
        });
        
        // Check for missing h1
        const h1Count = doc.querySelectorAll('h1').length;
        if (h1Count === 0) {
            headingIssues.push({
                issue: 'Page missing h1 heading',
                wcagCriteria: '1.3.1'
            });
        } else if (h1Count > 1) {
            headingIssues.push({
                issue: 'Multiple h1 headings found',
                wcagCriteria: '1.3.1'
            });
        }
        
        return {
            headingIssues,
            totalHeadings: headings.length,
            h1Count,
            wcagCompliant: headingIssues.length === 0
        };
    }

    async testLandmarkRegions(pageWindow) {
        const doc = pageWindow.document;
        const landmarkIssues = [];
        
        // Check for main landmark
        const mainLandmarks = doc.querySelectorAll('main, [role="main"]');
        if (mainLandmarks.length === 0) {
            landmarkIssues.push({
                issue: 'Page missing main landmark',
                wcagCriteria: '1.3.1'
            });
        } else if (mainLandmarks.length > 1) {
            landmarkIssues.push({
                issue: 'Multiple main landmarks found',
                wcagCriteria: '1.3.1'
            });
        }
        
        // Check for navigation landmarks
        const navLandmarks = doc.querySelectorAll('nav, [role="navigation"]');
        if (navLandmarks.length === 0) {
            landmarkIssues.push({
                issue: 'Page missing navigation landmark',
                wcagCriteria: '1.3.1'
            });
        }
        
        // Check for banner and contentinfo
        const banners = doc.querySelectorAll('header, [role="banner"]');
        const contentinfos = doc.querySelectorAll('footer, [role="contentinfo"]');
        
        return {
            landmarkIssues,
            landmarks: {
                main: mainLandmarks.length,
                navigation: navLandmarks.length,
                banner: banners.length,
                contentinfo: contentinfos.length
            },
            wcagCompliant: landmarkIssues.length === 0
        };
    }

    async testSemanticMarkup(pageWindow) {
        const doc = pageWindow.document;
        const semanticIssues = [];
        
        // Check for proper list markup
        const lists = doc.querySelectorAll('ul, ol, dl');
        lists.forEach(list => {
            const properChildren = this.hasProperListChildren(list);
            if (!properChildren) {
                semanticIssues.push({
                    element: this.getElementIdentifier(list),
                    issue: 'List contains non-list-item children',
                    wcagCriteria: '1.3.1'
                });
            }
        });
        
        // Check for table markup
        const tables = doc.querySelectorAll('table');
        tables.forEach(table => {
            const hasHeaders = table.querySelectorAll('th').length > 0;
            if (!hasHeaders) {
                semanticIssues.push({
                    element: this.getElementIdentifier(table),
                    issue: 'Table missing header cells',
                    wcagCriteria: '1.3.1'
                });
            }
        });
        
        return {
            semanticIssues,
            listsChecked: lists.length,
            tablesChecked: tables.length,
            wcagCompliant: semanticIssues.length === 0
        };
    }

    // ===========================================
    // Interactive Elements Tests
    // ===========================================

    async testInteractiveElements(pageWindow) {
        const doc = pageWindow.document;
        const interactiveIssues = [];
        
        // Check buttons
        const buttons = doc.querySelectorAll('button, [role="button"]');
        buttons.forEach(button => {
            if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                interactiveIssues.push({
                    element: this.getElementIdentifier(button),
                    issue: 'Button missing accessible text',
                    wcagCriteria: '4.1.2'
                });
            }
        });
        
        // Check links
        const links = doc.querySelectorAll('a, [role="link"]');
        links.forEach(link => {
            if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
                interactiveIssues.push({
                    element: this.getElementIdentifier(link),
                    issue: 'Link missing accessible text',
                    wcagCriteria: '4.1.2'
                });
            }
            
            // Check for vague link text
            const linkText = link.textContent.trim().toLowerCase();
            if (['click here', 'read more', 'more', 'here'].includes(linkText)) {
                interactiveIssues.push({
                    element: this.getElementIdentifier(link),
                    issue: 'Link has vague or non-descriptive text',
                    wcagCriteria: '2.4.4'
                });
            }
        });
        
        return {
            interactiveIssues,
            buttonsChecked: buttons.length,
            linksChecked: links.length,
            wcagCompliant: interactiveIssues.length === 0
        };
    }

    async testCustomControls(pageWindow) {
        const doc = pageWindow.document;
        const customControlIssues = [];
        
        // Check for custom controls (elements with ARIA roles)
        const customControls = doc.querySelectorAll(
            '[role="slider"], [role="spinbutton"], [role="combobox"], [role="listbox"], [role="tab"]'
        );
        
        customControls.forEach(control => {
            const role = control.getAttribute('role');
            
            // Check for required ARIA states
            const requiredStates = this.getRequiredAriaStates(role);
            requiredStates.forEach(state => {
                if (!control.hasAttribute(state)) {
                    customControlIssues.push({
                        element: this.getElementIdentifier(control),
                        issue: `Custom control missing required state: ${state}`,
                        wcagCriteria: '4.1.2'
                    });
                }
            });
        });
        
        return {
            customControlIssues,
            customControlsChecked: customControls.length,
            wcagCompliant: customControlIssues.length === 0
        };
    }

    // ===========================================
    // Media and Content Tests
    // ===========================================

    async testImageAltText(pageWindow) {
        const doc = pageWindow.document;
        const imageIssues = [];
        
        const images = doc.querySelectorAll('img');
        
        images.forEach(img => {
            const alt = img.getAttribute('alt');
            const isDecorative = img.getAttribute('role') === 'presentation' || 
                               img.getAttribute('aria-hidden') === 'true';
            
            if (!isDecorative) {
                if (alt === null) {
                    imageIssues.push({
                        element: this.getElementIdentifier(img),
                        issue: 'Image missing alt attribute',
                        wcagCriteria: '1.1.1'
                    });
                } else if (alt.trim() === '') {
                    // Empty alt is OK for decorative images
                } else if (this.isRedundantAltText(alt, img)) {
                    imageIssues.push({
                        element: this.getElementIdentifier(img),
                        issue: 'Image alt text appears redundant',
                        wcagCriteria: '1.1.1'
                    });
                }
            }
        });
        
        return {
            imageIssues,
            imagesChecked: images.length,
            wcagCompliant: imageIssues.length === 0
        };
    }

    async testMediaCaptions(pageWindow) {
        const doc = pageWindow.document;
        const mediaIssues = [];
        
        // Check video elements
        const videos = doc.querySelectorAll('video');
        videos.forEach(video => {
            const hasTrack = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
            if (!hasTrack) {
                mediaIssues.push({
                    element: this.getElementIdentifier(video),
                    issue: 'Video missing captions or subtitles',
                    wcagCriteria: '1.2.2'
                });
            }
        });
        
        // Check audio elements
        const audios = doc.querySelectorAll('audio');
        audios.forEach(audio => {
            // Audio should have transcript available
            const hasTranscript = this.hasAudioTranscript(audio);
            if (!hasTranscript) {
                mediaIssues.push({
                    element: this.getElementIdentifier(audio),
                    issue: 'Audio missing transcript',
                    wcagCriteria: '1.2.1'
                });
            }
        });
        
        return {
            mediaIssues,
            videosChecked: videos.length,
            audiosChecked: audios.length,
            wcagCompliant: mediaIssues.length === 0
        };
    }

    // ===========================================
    // Error Handling and Feedback Tests
    // ===========================================

    async testErrorIdentification(pageWindow) {
        const doc = pageWindow.document;
        const errorIssues = [];
        
        // Look for error messages and validation
        const errorElements = doc.querySelectorAll('.error, [role="alert"], [aria-live="assertive"]');
        
        errorElements.forEach(errorEl => {
            // Check if error is associated with form field
            const associatedField = this.findAssociatedFormField(errorEl);
            
            if (associatedField && !this.isErrorProperlyAssociated(errorEl, associatedField)) {
                errorIssues.push({
                    element: this.getElementIdentifier(errorEl),
                    issue: 'Error message not properly associated with form field',
                    wcagCriteria: '3.3.1'
                });
            }
        });
        
        return {
            errorIssues,
            errorElementsFound: errorElements.length,
            wcagCompliant: errorIssues.length === 0
        };
    }

    async testStatusMessages(pageWindow) {
        const doc = pageWindow.document;
        const statusIssues = [];
        
        // Check for live regions
        const liveRegions = doc.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
        
        liveRegions.forEach(region => {
            const ariaLive = region.getAttribute('aria-live');
            const role = region.getAttribute('role');
            
            // Validate live region properties
            if (role === 'alert' && ariaLive && ariaLive !== 'assertive') {
                statusIssues.push({
                    element: this.getElementIdentifier(region),
                    issue: 'Alert role should use aria-live="assertive"',
                    wcagCriteria: '4.1.3'
                });
            }
        });
        
        return {
            statusIssues,
            liveRegionsFound: liveRegions.length,
            wcagCompliant: statusIssues.length === 0
        };
    }

    // ===========================================
    // Page Structure and Navigation Tests
    // ===========================================

    async testPageTitles(pageWindow) {
        const doc = pageWindow.document;
        const titleIssues = [];
        
        const title = doc.querySelector('title');
        
        if (!title) {
            titleIssues.push({
                issue: 'Page missing title element',
                wcagCriteria: '2.4.2'
            });
        } else if (!title.textContent.trim()) {
            titleIssues.push({
                issue: 'Page title is empty',
                wcagCriteria: '2.4.2'
            });
        } else if (title.textContent.trim().length < 3) {
            titleIssues.push({
                issue: 'Page title is too short',
                wcagCriteria: '2.4.2'
            });
        }
        
        return {
            titleIssues,
            pageTitle: title ? title.textContent.trim() : null,
            wcagCompliant: titleIssues.length === 0
        };
    }

    async testSkipLinks(pageWindow) {
        const doc = pageWindow.document;
        
        const skipLinks = doc.querySelectorAll('a[href^="#"], .skip-link');
        const hasSkipLinks = skipLinks.length > 0;
        
        let skipLinkIssues = [];
        
        if (!hasSkipLinks) {
            skipLinkIssues.push({
                issue: 'Page missing skip links for keyboard navigation',
                wcagCriteria: '2.4.1'
            });
        } else {
            // Validate skip link targets
            skipLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const targetId = href.substring(1);
                    const target = doc.getElementById(targetId);
                    
                    if (!target) {
                        skipLinkIssues.push({
                            element: this.getElementIdentifier(link),
                            issue: `Skip link target not found: ${targetId}`,
                            wcagCriteria: '2.4.1'
                        });
                    }
                }
            });
        }
        
        return {
            skipLinkIssues,
            skipLinksFound: skipLinks.length,
            wcagCompliant: skipLinkIssues.length === 0
        };
    }

    async testBreadcrumbs(pageWindow) {
        const doc = pageWindow.document;
        
        const breadcrumbs = doc.querySelectorAll('nav[aria-label*="breadcrumb"], .breadcrumb, [role="navigation"] ol');
        const hasBreadcrumbs = breadcrumbs.length > 0;
        
        let breadcrumbIssues = [];
        
        breadcrumbs.forEach(breadcrumb => {
            // Check if breadcrumb is properly marked up
            const hasList = breadcrumb.querySelector('ol, ul');
            if (!hasList) {
                breadcrumbIssues.push({
                    element: this.getElementIdentifier(breadcrumb),
                    issue: 'Breadcrumb not marked up as list',
                    wcagCriteria: '1.3.1'
                });
            }
            
            // Check for proper ARIA labeling
            if (!breadcrumb.getAttribute('aria-label') && !breadcrumb.getAttribute('aria-labelledby')) {
                breadcrumbIssues.push({
                    element: this.getElementIdentifier(breadcrumb),
                    issue: 'Breadcrumb missing accessible label',
                    wcagCriteria: '4.1.2'
                });
            }
        });
        
        return {
            breadcrumbIssues,
            breadcrumbsFound: breadcrumbs.length,
            wcagCompliant: breadcrumbIssues.length === 0
        };
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    calculateContrastRatio(color1, color2) {
        // Simplified contrast calculation - in a real implementation,
        // you'd want a more robust color parsing and contrast calculation
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);
        
        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    parseColor(color) {
        // Simplified color parsing - would need to handle all CSS color formats
        const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgba) {
            return {
                r: parseInt(rgba[1]),
                g: parseInt(rgba[2]),
                b: parseInt(rgba[3])
            };
        }
        return { r: 0, g: 0, b: 0 };
    }

    getLuminance(rgb) {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    hasTextContent(element) {
        return element.textContent && element.textContent.trim().length > 0;
    }

    hasNonColorIndicator(element) {
        // Check for icons, text, borders, or other non-color indicators
        const hasIcon = element.querySelector('svg, img, .icon');
        const hasIndicatorText = /error|success|warning|info|required|invalid/i.test(element.textContent);
        const hasPattern = element.style.backgroundImage || element.style.borderStyle;
        
        return hasIcon || hasIndicatorText || hasPattern;
    }

    getElementIdentifier(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    isInherentlyFocusable(element) {
        const focusableElements = ['a', 'button', 'input', 'select', 'textarea'];
        return focusableElements.includes(element.tagName.toLowerCase());
    }

    hasKeyboardHandlers(element) {
        // Check for keyboard event attributes or listeners
        const keyboardEvents = ['onkeydown', 'onkeyup', 'onkeypress'];
        return keyboardEvents.some(event => element.hasAttribute(event)) ||
               element.tagName.toLowerCase() === 'button' ||
               element.tagName.toLowerCase() === 'a';
    }

    hasFocusIndicator(styles) {
        // Check for visible focus indicators
        return styles.outline !== 'none' && styles.outline !== '0' ||
               styles.border !== 'none' ||
               styles.boxShadow !== 'none';
    }

    hasProperFocusTrap(modal) {
        // Simplified check for focus trapping
        const focusableElements = modal.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return focusableElements.length > 0; // Simplified - would check for actual trap implementation
    }

    hasAccessibleName(element) {
        return element.getAttribute('aria-label') ||
               element.getAttribute('aria-labelledby') ||
               element.textContent.trim() ||
               element.getAttribute('title');
    }

    isValidAriaRole(role) {
        return this.ariaRoles.includes(role);
    }

    getRequiredAriaProperties(role) {
        // Simplified mapping of required properties per role
        const requirements = {
            'slider': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
            'progressbar': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
            'spinbutton': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
            'checkbox': ['aria-checked'],
            'radio': ['aria-checked']
        };
        return requirements[role] || [];
    }

    getRequiredAriaStates(role) {
        // Simplified mapping of required states per role
        const states = {
            'slider': ['aria-valuenow'],
            'checkbox': ['aria-checked'],
            'radio': ['aria-checked'],
            'button': [],
            'tab': ['aria-selected']
        };
        return states[role] || [];
    }

    hasFormLabel(input) {
        // Check for label association
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return true;
        }
        
        // Check for parent label
        const parentLabel = input.closest('label');
        if (parentLabel) return true;
        
        // Check for ARIA labeling
        return input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    }

    hasFormInstructions(form) {
        // Look for form instructions or help text
        const instructions = form.querySelector('.instructions, .help-text, [role="group"]');
        return !!instructions;
    }

    hasProperListChildren(list) {
        const tagName = list.tagName.toLowerCase();
        const expectedChildren = tagName === 'dl' ? ['dt', 'dd'] : ['li'];
        
        const directChildren = Array.from(list.children);
        return directChildren.every(child => 
            expectedChildren.includes(child.tagName.toLowerCase())
        );
    }

    isRedundantAltText(alt, img) {
        // Check if alt text is redundant with surrounding text
        const surroundingText = img.parentElement?.textContent || '';
        return surroundingText.toLowerCase().includes(alt.toLowerCase());
    }

    hasAudioTranscript(audio) {
        // Look for transcript link or content near audio element
        const parent = audio.parentElement;
        const transcript = parent?.querySelector('.transcript, [data-transcript]');
        return !!transcript;
    }

    findAssociatedFormField(errorElement) {
        // Find form field associated with error message
        const fieldId = errorElement.getAttribute('data-field') || 
                       errorElement.getAttribute('for');
        
        if (fieldId) {
            return document.getElementById(fieldId);
        }
        
        // Look for nearby form fields
        return errorElement.parentElement?.querySelector('input, select, textarea');
    }

    isErrorProperlyAssociated(errorElement, field) {
        // Check if error is properly associated via aria-describedby
        const describedBy = field.getAttribute('aria-describedby');
        return describedBy && describedBy.includes(errorElement.id);
    }

    initializeWCAGGuidelines() {
        return {
            '1.1.1': 'Non-text Content',
            '1.2.1': 'Audio-only and Video-only (Prerecorded)',
            '1.2.2': 'Captions (Prerecorded)',
            '1.3.1': 'Info and Relationships',
            '1.4.1': 'Use of Color',
            '1.4.3': 'Contrast (Minimum)',
            '2.1.1': 'Keyboard',
            '2.1.2': 'No Keyboard Trap',
            '2.4.1': 'Bypass Blocks',
            '2.4.2': 'Page Titled',
            '2.4.4': 'Link Purpose (In Context)',
            '2.4.7': 'Focus Visible',
            '3.3.1': 'Error Identification',
            '3.3.2': 'Labels or Instructions',
            '4.1.2': 'Name, Role, Value',
            '4.1.3': 'Status Messages'
        };
    }

    initializeAriaRoles() {
        return [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
            'contentinfo', 'definition', 'dialog', 'directory', 'document',
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
            'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
            'tooltip', 'tree', 'treegrid', 'treeitem'
        ];
    }

    initializeSemanticElements() {
        return [
            'article', 'aside', 'details', 'figcaption', 'figure', 'footer',
            'header', 'main', 'mark', 'nav', 'section', 'summary', 'time'
        ];
    }

    generateAuditReport() {
        const totalTests = this.auditResults.reduce((sum, page) => sum + page.tests.length, 0);
        const passedTests = this.auditResults.reduce((sum, page) => 
            sum + page.tests.filter(test => test.status === 'passed').length, 0);
        const failedTests = totalTests - passedTests;
        
        // Calculate issues by category
        const issuesByCategory = {};
        this.auditResults.forEach(page => {
            page.tests.forEach(test => {
                if (test.status === 'failed') {
                    const category = this.getTestCategory(test.testId);
                    issuesByCategory[category] = (issuesByCategory[category] || 0) + 1;
                }
            });
        });
        
        // Calculate WCAG compliance score
        const complianceScore = ((passedTests / totalTests) * 100).toFixed(1);
        
        return {
            summary: {
                totalPages: this.auditResults.length,
                totalTests,
                passedTests,
                failedTests,
                complianceScore: complianceScore + '%',
                wcagLevel: this.options.wcagLevel,
                wcagVersion: this.options.wcagVersion
            },
            issuesByCategory,
            pageResults: this.auditResults,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };
    }

    getTestCategory(testId) {
        if (testId.includes('color') || testId.includes('contrast')) return 'Color & Contrast';
        if (testId.includes('keyboard') || testId.includes('focus')) return 'Keyboard Navigation';
        if (testId.includes('aria') || testId.includes('label')) return 'ARIA & Labels';
        if (testId.includes('heading') || testId.includes('semantic') || testId.includes('landmark')) return 'Structure';
        if (testId.includes('image') || testId.includes('media')) return 'Media';
        if (testId.includes('error') || testId.includes('status')) return 'Feedback';
        if (testId.includes('interactive') || testId.includes('control')) return 'Interaction';
        return 'Other';
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze common issues across pages
        const allIssues = this.auditResults.flatMap(page => 
            page.tests.filter(test => test.status === 'failed')
        );
        
        const issueFrequency = {};
        allIssues.forEach(issue => {
            issueFrequency[issue.testId] = (issueFrequency[issue.testId] || 0) + 1;
        });
        
        // Generate recommendations based on most common issues
        Object.entries(issueFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([testId, count]) => {
                recommendations.push(this.getRecommendation(testId, count));
            });
        
        return recommendations;
    }

    getRecommendation(testId, count) {
        const recommendations = {
            'color-contrast': {
                priority: 'high',
                issue: 'Color contrast violations',
                solution: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)',
                impact: 'Users with low vision or color blindness may not be able to read content'
            },
            'keyboard-navigation': {
                priority: 'high',
                issue: 'Keyboard navigation issues',
                solution: 'Ensure all interactive elements are keyboard accessible and have visible focus indicators',
                impact: 'Users who rely on keyboard navigation cannot access all functionality'
            },
            'aria-labels': {
                priority: 'medium',
                issue: 'Missing or incorrect ARIA labels',
                solution: 'Add appropriate aria-label, aria-labelledby, or aria-describedby attributes',
                impact: 'Screen reader users may not understand the purpose of elements'
            },
            'heading-structure': {
                priority: 'medium',
                issue: 'Improper heading hierarchy',
                solution: 'Use headings in logical order (h1, h2, h3, etc.) without skipping levels',
                impact: 'Screen reader users may have difficulty navigating content structure'
            }
        };
        
        return {
            ...recommendations[testId],
            occurrences: count,
            testId
        } || {
            testId,
            priority: 'low',
            issue: 'Accessibility issue detected',
            solution: 'Review and fix accessibility violation',
            impact: 'May affect users with disabilities',
            occurrences: count
        };
    }

    stop() {
        this.isRunning = false;
        console.log('Accessibility audit stopped');
    }
}

// Export for both ES6 modules and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityAuditor;
} else {
    window.AccessibilityAuditor = AccessibilityAuditor;
}

export default AccessibilityAuditor;