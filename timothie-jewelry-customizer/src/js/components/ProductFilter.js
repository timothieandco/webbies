// =============================================================================
// ProductFilter Component - Manages product filtering sidebar
// =============================================================================

export class ProductFilter {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onFilterChange: options.onFilterChange || (() => {}),
            initialFilters: options.initialFilters || {},
            categories: options.categories || ['Necklaces', 'Bracelets', 'Charms', 'Keychains', 'Earrings', 'Accessories'],
            materials: options.materials || ['Sterling Silver', 'Gold Filled', '14K Gold', 'Rose Gold', 'Stainless Steel', 'Leather', 'Cotton'],
            priceRange: options.priceRange || { min: 0, max: 200 },
            ...options
        };
        
        this.currentFilters = {
            category: null,
            priceMin: null,
            priceMax: null,
            materials: [],
            inStockOnly: true,
            ...this.options.initialFilters
        };
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('ProductFilter: Container element not found');
            return;
        }
        
        this.render();
        this.attachEventListeners();
        this.initializePriceSliders();
    }

    render() {
        this.container.innerHTML = `
            <div class="filters-header">
                <h3 class="filters-title">Filters</h3>
                <button class="filters-clear" id="filters-clear">Clear All</button>
            </div>
            
            ${this.renderCategoryFilter()}
            ${this.renderPriceFilter()}
            ${this.renderMaterialFilter()}
            ${this.renderAvailabilityFilter()}
        `;
    }

    renderCategoryFilter() {
        return `
            <div class="filter-group">
                <h4 class="filter-title">Category</h4>
                <div class="filter-options" id="category-filters">
                    ${this.options.categories.map(category => `
                        <label class="filter-checkbox">
                            <input type="radio" 
                                   name="category" 
                                   value="${category.toLowerCase()}" 
                                   ${this.currentFilters.category === category.toLowerCase() ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            ${category}
                        </label>
                    `).join('')}
                    <label class="filter-checkbox">
                        <input type="radio" 
                               name="category" 
                               value="" 
                               ${!this.currentFilters.category ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        All Categories
                    </label>
                </div>
            </div>
        `;
    }

    renderPriceFilter() {
        const { priceRange } = this.options;
        const { priceMin, priceMax } = this.currentFilters;
        
        return `
            <div class="filter-group">
                <h4 class="filter-title">Price Range</h4>
                <div class="price-filter">
                    <div class="price-inputs">
                        <input type="number" 
                               id="price-min" 
                               placeholder="Min" 
                               min="${priceRange.min}" 
                               max="${priceRange.max}"
                               step="0.01"
                               value="${priceMin || ''}">
                        <span class="price-separator">-</span>
                        <input type="number" 
                               id="price-max" 
                               placeholder="Max" 
                               min="${priceRange.min}" 
                               max="${priceRange.max}"
                               step="0.01"
                               value="${priceMax || ''}">
                    </div>
                    <div class="price-range-slider">
                        <input type="range" 
                               id="price-range-min" 
                               min="${priceRange.min}" 
                               max="${priceRange.max}" 
                               value="${priceMin || priceRange.min}" 
                               step="5">
                        <input type="range" 
                               id="price-range-max" 
                               min="${priceRange.min}" 
                               max="${priceRange.max}" 
                               value="${priceMax || priceRange.max}" 
                               step="5">
                    </div>
                    <div class="price-display">
                        <span class="price-min-display">$${priceMin || priceRange.min}</span>
                        <span class="price-max-display">$${priceMax || priceRange.max}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderMaterialFilter() {
        return `
            <div class="filter-group">
                <h4 class="filter-title">Material</h4>
                <div class="filter-options" id="material-filters">
                    ${this.options.materials.map(material => `
                        <label class="filter-checkbox">
                            <input type="checkbox" 
                                   value="${material.toLowerCase()}" 
                                   ${this.currentFilters.materials.includes(material.toLowerCase()) ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            ${material}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderAvailabilityFilter() {
        return `
            <div class="filter-group">
                <h4 class="filter-title">Availability</h4>
                <div class="filter-options">
                    <label class="filter-checkbox">
                        <input type="checkbox" 
                               id="filter-in-stock" 
                               ${this.currentFilters.inStockOnly ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        In Stock Only
                    </label>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Clear all filters
        const clearButton = this.container.querySelector('#filters-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Category filters (radio buttons)
        const categoryFilters = this.container.querySelectorAll('input[name="category"]');
        categoryFilters.forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value || null;
                this.notifyFilterChange();
            });
        });

        // Material filters (checkboxes)
        const materialFilters = this.container.querySelectorAll('#material-filters input[type="checkbox"]');
        materialFilters.forEach(input => {
            input.addEventListener('change', (e) => {
                const material = e.target.value;
                if (e.target.checked) {
                    if (!this.currentFilters.materials.includes(material)) {
                        this.currentFilters.materials.push(material);
                    }
                } else {
                    this.currentFilters.materials = this.currentFilters.materials.filter(m => m !== material);
                }
                this.notifyFilterChange();
            });
        });

        // Stock filter
        const stockFilter = this.container.querySelector('#filter-in-stock');
        if (stockFilter) {
            stockFilter.addEventListener('change', (e) => {
                this.currentFilters.inStockOnly = e.target.checked;
                this.notifyFilterChange();
            });
        }

        // Price input filters
        const priceMinInput = this.container.querySelector('#price-min');
        const priceMaxInput = this.container.querySelector('#price-max');
        
        if (priceMinInput) {
            priceMinInput.addEventListener('change', (e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                this.currentFilters.priceMin = value;
                this.updatePriceSlider('min', value);
                this.notifyFilterChange();
            });
        }
        
        if (priceMaxInput) {
            priceMaxInput.addEventListener('change', (e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                this.currentFilters.priceMax = value;
                this.updatePriceSlider('max', value);
                this.notifyFilterChange();
            });
        }
    }

    initializePriceSliders() {
        const priceMinSlider = this.container.querySelector('#price-range-min');
        const priceMaxSlider = this.container.querySelector('#price-range-max');
        const priceMinDisplay = this.container.querySelector('.price-min-display');
        const priceMaxDisplay = this.container.querySelector('.price-max-display');

        if (!priceMinSlider || !priceMaxSlider) return;

        // Handle min slider changes
        priceMinSlider.addEventListener('input', (e) => {
            const minValue = parseInt(e.target.value);
            const maxValue = parseInt(priceMaxSlider.value);
            
            if (minValue > maxValue) {
                priceMaxSlider.value = minValue;
                this.currentFilters.priceMax = minValue;
                if (priceMaxDisplay) priceMaxDisplay.textContent = `$${minValue}`;
                
                const priceMaxInput = this.container.querySelector('#price-max');
                if (priceMaxInput) priceMaxInput.value = minValue;
            }
            
            this.currentFilters.priceMin = minValue;
            if (priceMinDisplay) priceMinDisplay.textContent = `$${minValue}`;
            
            const priceMinInput = this.container.querySelector('#price-min');
            if (priceMinInput) priceMinInput.value = minValue;
            
            this.updateSliderBackground();
        });

        // Handle max slider changes
        priceMaxSlider.addEventListener('input', (e) => {
            const maxValue = parseInt(e.target.value);
            const minValue = parseInt(priceMinSlider.value);
            
            if (maxValue < minValue) {
                priceMinSlider.value = maxValue;
                this.currentFilters.priceMin = maxValue;
                if (priceMinDisplay) priceMinDisplay.textContent = `$${maxValue}`;
                
                const priceMinInput = this.container.querySelector('#price-min');
                if (priceMinInput) priceMinInput.value = maxValue;
            }
            
            this.currentFilters.priceMax = maxValue;
            if (priceMaxDisplay) priceMaxDisplay.textContent = `$${maxValue}`;
            
            const priceMaxInput = this.container.querySelector('#price-max');
            if (priceMaxInput) priceMaxInput.value = maxValue;
            
            this.updateSliderBackground();
        });

        // Handle slider change events (when user releases)
        priceMinSlider.addEventListener('change', () => this.notifyFilterChange());
        priceMaxSlider.addEventListener('change', () => this.notifyFilterChange());

        // Initialize slider background
        this.updateSliderBackground();
    }

    updateSliderBackground() {
        const priceMinSlider = this.container.querySelector('#price-range-min');
        const priceMaxSlider = this.container.querySelector('#price-range-max');
        
        if (!priceMinSlider || !priceMaxSlider) return;

        const min = parseInt(priceMinSlider.min);
        const max = parseInt(priceMinSlider.max);
        const minVal = parseInt(priceMinSlider.value);
        const maxVal = parseInt(priceMaxSlider.value);

        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;

        // Update the background to show selected range
        const track = priceMinSlider.parentElement;
        if (track) {
            track.style.background = `linear-gradient(
                to right,
                var(--border-light) 0%,
                var(--border-light) ${minPercent}%,
                var(--accent-coral) ${minPercent}%,
                var(--accent-coral) ${maxPercent}%,
                var(--border-light) ${maxPercent}%,
                var(--border-light) 100%
            )`;
        }
    }

    updatePriceSlider(type, value) {
        const slider = this.container.querySelector(`#price-range-${type}`);
        const display = this.container.querySelector(`.price-${type}-display`);
        
        if (slider && value !== null) {
            slider.value = value;
        }
        
        if (display) {
            const displayValue = value !== null ? value : (type === 'min' ? this.options.priceRange.min : this.options.priceRange.max);
            display.textContent = `$${displayValue}`;
        }
        
        this.updateSliderBackground();
    }

    notifyFilterChange() {
        // Debounce the filter change notification
        if (this.filterChangeTimeout) {
            clearTimeout(this.filterChangeTimeout);
        }
        
        this.filterChangeTimeout = setTimeout(() => {
            this.options.onFilterChange({ ...this.currentFilters });
        }, 300);
    }

    clearAllFilters() {
        // Reset filters to initial state
        this.currentFilters = {
            category: this.options.initialFilters.category || null,
            priceMin: null,
            priceMax: null,
            materials: [],
            inStockOnly: true
        };
        
        // Update UI elements
        this.updateUI();
        this.notifyFilterChange();
    }

    updateUI() {
        // Update category radio buttons
        const categoryInputs = this.container.querySelectorAll('input[name="category"]');
        categoryInputs.forEach(input => {
            input.checked = input.value === (this.currentFilters.category || '');
        });

        // Update material checkboxes
        const materialInputs = this.container.querySelectorAll('#material-filters input[type="checkbox"]');
        materialInputs.forEach(input => {
            input.checked = this.currentFilters.materials.includes(input.value);
        });

        // Update stock filter
        const stockInput = this.container.querySelector('#filter-in-stock');
        if (stockInput) {
            stockInput.checked = this.currentFilters.inStockOnly;
        }

        // Update price inputs and sliders
        const priceMinInput = this.container.querySelector('#price-min');
        const priceMaxInput = this.container.querySelector('#price-max');
        const priceMinSlider = this.container.querySelector('#price-range-min');
        const priceMaxSlider = this.container.querySelector('#price-range-max');

        if (priceMinInput) priceMinInput.value = this.currentFilters.priceMin || '';
        if (priceMaxInput) priceMaxInput.value = this.currentFilters.priceMax || '';
        
        if (priceMinSlider) {
            priceMinSlider.value = this.currentFilters.priceMin || this.options.priceRange.min;
        }
        if (priceMaxSlider) {
            priceMaxSlider.value = this.currentFilters.priceMax || this.options.priceRange.max;
        }

        // Update price displays
        const priceMinDisplay = this.container.querySelector('.price-min-display');
        const priceMaxDisplay = this.container.querySelector('.price-max-display');
        
        if (priceMinDisplay) {
            priceMinDisplay.textContent = `$${this.currentFilters.priceMin || this.options.priceRange.min}`;
        }
        if (priceMaxDisplay) {
            priceMaxDisplay.textContent = `$${this.currentFilters.priceMax || this.options.priceRange.max}`;
        }

        this.updateSliderBackground();
    }

    // Public methods
    getFilters() {
        return { ...this.currentFilters };
    }

    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.updateUI();
    }

    addCategory(category) {
        if (!this.options.categories.includes(category)) {
            this.options.categories.push(category);
            this.render();
            this.attachEventListeners();
            this.initializePriceSliders();
        }
    }

    addMaterial(material) {
        if (!this.options.materials.includes(material)) {
            this.options.materials.push(material);
            this.render();
            this.attachEventListeners();
            this.initializePriceSliders();
        }
    }

    updatePriceRange(min, max) {
        this.options.priceRange = { min, max };
        this.render();
        this.attachEventListeners();
        this.initializePriceSliders();
    }

    // Method to get active filter count for UI display
    getActiveFilterCount() {
        let count = 0;
        
        if (this.currentFilters.category) count++;
        if (this.currentFilters.priceMin !== null) count++;
        if (this.currentFilters.priceMax !== null) count++;
        if (this.currentFilters.materials.length > 0) count++;
        if (!this.currentFilters.inStockOnly) count++; // Count when NOT showing in-stock only
        
        return count;
    }

    // Method to get filter summary for display
    getFilterSummary() {
        const summary = [];
        
        if (this.currentFilters.category) {
            summary.push(`Category: ${this.currentFilters.category}`);
        }
        
        if (this.currentFilters.priceMin !== null || this.currentFilters.priceMax !== null) {
            const min = this.currentFilters.priceMin || this.options.priceRange.min;
            const max = this.currentFilters.priceMax || this.options.priceRange.max;
            summary.push(`Price: $${min} - $${max}`);
        }
        
        if (this.currentFilters.materials.length > 0) {
            summary.push(`Materials: ${this.currentFilters.materials.join(', ')}`);
        }
        
        if (!this.currentFilters.inStockOnly) {
            summary.push('Including out of stock');
        }
        
        return summary;
    }

    // Cleanup method
    destroy() {
        if (this.filterChangeTimeout) {
            clearTimeout(this.filterChangeTimeout);
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default ProductFilter;