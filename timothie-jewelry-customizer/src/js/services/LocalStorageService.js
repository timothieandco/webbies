/**
 * LocalStorageService.js
 * 
 * Local storage service for design persistence and user data.
 * Provides the same interface as cloud storage services but works
 * entirely offline with localStorage.
 */

import AppConfig from '../config/AppConfig.js';

class LocalStorageService {
    constructor() {
        this.prefix = AppConfig.get('storage.prefix');
        this.designsKey = this.prefix + AppConfig.get('storage.designsKey');
        this.preferencesKey = this.prefix + AppConfig.get('storage.preferencesKey');
        this.initialized = false;
        this.maxDesigns = 50; // Limit to prevent localStorage overflow
        this.maxDesignSize = 1024 * 1024; // 1MB per design
    }

    /**
     * Initialize the storage service
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        // Check localStorage availability
        if (!this.isStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Initialize storage structures if needed
        this.initializeStorage();
        
        this.initialized = true;
        console.log('✅ LocalStorageService initialized');
    }

    /**
     * Check if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Initialize storage structures
     */
    initializeStorage() {
        // Initialize designs array if not exists
        if (!localStorage.getItem(this.designsKey)) {
            localStorage.setItem(this.designsKey, JSON.stringify([]));
        }

        // Initialize preferences object if not exists
        if (!localStorage.getItem(this.preferencesKey)) {
            localStorage.setItem(this.preferencesKey, JSON.stringify({}));
        }
    }

    /**
     * Save a design
     * @param {Object} designData - Design data to save
     * @param {Object} options - Save options
     * @returns {Promise<string>} Design ID
     */
    async saveDesign(designData, options = {}) {
        const { name = null, description = null } = options;
        
        if (!designData) {
            throw new Error('Design data is required');
        }

        // Validate design size
        const designSize = JSON.stringify(designData).length;
        if (designSize > this.maxDesignSize) {
            throw new Error(`Design is too large (${designSize} bytes, max ${this.maxDesignSize})`);
        }

        const designs = this.getDesigns();
        
        // Check max designs limit
        if (designs.length >= this.maxDesigns) {
            // Remove oldest design
            designs.shift();
        }

        const design = {
            id: this.generateId(),
            name: name || `Design ${designs.length + 1}`,
            description: description || 'Custom jewelry design',
            data: designData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: '1.0'
        };

        designs.push(design);
        this.saveDesigns(designs);

        return design.id;
    }

    /**
     * Load a design by ID
     * @param {string} designId - Design ID
     * @returns {Promise<Object|null>} Design data
     */
    async loadDesign(designId) {
        const designs = this.getDesigns();
        const design = designs.find(d => d.id === designId);
        
        if (!design) {
            return null;
        }

        // Update access time
        design.last_accessed = new Date().toISOString();
        this.saveDesigns(designs);

        return design;
    }

    /**
     * Get all saved designs
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of designs
     */
    async getDesigns(options = {}) {
        const { 
            limit = null, 
            offset = 0,
            sortBy = 'updated_at',
            sortOrder = 'desc'
        } = options;

        let designs = this.getDesigns();

        // Sort designs
        designs.sort((a, b) => {
            const aVal = a[sortBy] || '';
            const bVal = b[sortBy] || '';
            
            if (sortOrder === 'desc') {
                return bVal.localeCompare(aVal);
            }
            return aVal.localeCompare(bVal);
        });

        // Apply pagination
        if (limit) {
            designs = designs.slice(offset, offset + limit);
        }

        return designs;
    }

    /**
     * Update an existing design
     * @param {string} designId - Design ID
     * @param {Object} designData - Updated design data
     * @param {Object} options - Update options
     * @returns {Promise<boolean>} Success status
     */
    async updateDesign(designId, designData, options = {}) {
        const { name = null, description = null } = options;
        const designs = this.getDesigns();
        const designIndex = designs.findIndex(d => d.id === designId);
        
        if (designIndex === -1) {
            return false;
        }

        const design = designs[designIndex];
        
        // Update design
        if (designData) {
            design.data = designData;
        }
        if (name) {
            design.name = name;
        }
        if (description !== null) {
            design.description = description;
        }
        
        design.updated_at = new Date().toISOString();
        
        this.saveDesigns(designs);
        return true;
    }

    /**
     * Delete a design
     * @param {string} designId - Design ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteDesign(designId) {
        const designs = this.getDesigns();
        const filteredDesigns = designs.filter(d => d.id !== designId);
        
        if (filteredDesigns.length === designs.length) {
            return false; // Design not found
        }
        
        this.saveDesigns(filteredDesigns);
        return true;
    }

    /**
     * Clear all designs
     * @returns {Promise<void>}
     */
    async clearDesigns() {
        localStorage.setItem(this.designsKey, JSON.stringify([]));
    }

    /**
     * Save user preferences
     * @param {Object} preferences - User preferences
     * @returns {Promise<void>}
     */
    async savePreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            throw new Error('Invalid preferences object');
        }

        localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
    }

    /**
     * Load user preferences
     * @returns {Promise<Object>} User preferences
     */
    async loadPreferences() {
        try {
            const stored = localStorage.getItem(this.preferencesKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load preferences:', error);
            return {};
        }
    }

    /**
     * Update specific preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     * @returns {Promise<void>}
     */
    async updatePreference(key, value) {
        const preferences = await this.loadPreferences();
        preferences[key] = value;
        await this.savePreferences(preferences);
    }

    /**
     * Export all data for backup
     * @returns {Promise<Object>} Export data
     */
    async exportData() {
        const designs = this.getDesigns();
        const preferences = await this.loadPreferences();
        
        return {
            designs,
            preferences,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import data from backup
     * @param {Object} importData - Data to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>} Import results
     */
    async importData(importData, options = {}) {
        const { overwrite = false } = options;
        
        if (!importData || typeof importData !== 'object') {
            throw new Error('Invalid import data');
        }

        const results = {
            designs: { imported: 0, skipped: 0 },
            preferences: { imported: false },
            errors: []
        };

        // Import designs
        if (importData.designs && Array.isArray(importData.designs)) {
            const existingDesigns = overwrite ? [] : this.getDesigns();
            
            for (const design of importData.designs) {
                try {
                    // Check if design already exists
                    const exists = existingDesigns.some(d => d.id === design.id);
                    
                    if (!exists || overwrite) {
                        if (exists) {
                            // Remove existing if overwriting
                            const index = existingDesigns.findIndex(d => d.id === design.id);
                            existingDesigns.splice(index, 1);
                        }
                        
                        existingDesigns.push(design);
                        results.designs.imported++;
                    } else {
                        results.designs.skipped++;
                    }
                } catch (error) {
                    results.errors.push(`Design ${design.id}: ${error.message}`);
                }
            }
            
            this.saveDesigns(existingDesigns);
        }

        // Import preferences
        if (importData.preferences) {
            try {
                if (overwrite) {
                    await this.savePreferences(importData.preferences);
                } else {
                    const existing = await this.loadPreferences();
                    const merged = { ...existing, ...importData.preferences };
                    await this.savePreferences(merged);
                }
                results.preferences.imported = true;
            } catch (error) {
                results.errors.push(`Preferences: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStats() {
        const designs = this.getDesigns();
        const preferences = await this.loadPreferences();
        
        const designsSize = JSON.stringify(designs).length;
        const preferencesSize = JSON.stringify(preferences).length;
        const totalSize = designsSize + preferencesSize;
        
        // Rough localStorage limit estimate (varies by browser)
        const estimatedLimit = 5 * 1024 * 1024; // 5MB
        const usagePercent = Math.round((totalSize / estimatedLimit) * 100);

        return {
            designCount: designs.length,
            designsSize,
            preferencesSize,
            totalSize,
            usagePercent,
            maxDesigns: this.maxDesigns,
            maxDesignSize: this.maxDesignSize
        };
    }

    /**
     * Clean up old or unused data
     * @param {Object} options - Cleanup options
     * @returns {Promise<Object>} Cleanup results
     */
    async cleanup(options = {}) {
        const { 
            maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
            keepCount = 10 
        } = options;

        const designs = this.getDesigns();
        const now = Date.now();
        const results = { removed: 0, kept: 0 };

        // Sort by last access time (or creation time if never accessed)
        designs.sort((a, b) => {
            const aTime = new Date(a.last_accessed || a.created_at).getTime();
            const bTime = new Date(b.last_accessed || b.created_at).getTime();
            return bTime - aTime; // Newest first
        });

        // Keep most recent designs and remove old ones
        const cleanedDesigns = designs.filter((design, index) => {
            if (index < keepCount) {
                results.kept++;
                return true;
            }

            const accessTime = new Date(design.last_accessed || design.created_at).getTime();
            const age = now - accessTime;
            
            if (age > maxAge) {
                results.removed++;
                return false;
            }

            results.kept++;
            return true;
        });

        this.saveDesigns(cleanedDesigns);
        return results;
    }

    /**
     * Get designs from localStorage
     * @private
     */
    getDesigns() {
        try {
            const stored = localStorage.getItem(this.designsKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load designs:', error);
            return [];
        }
    }

    /**
     * Save designs to localStorage
     * @private
     */
    saveDesigns(designs) {
        try {
            localStorage.setItem(this.designsKey, JSON.stringify(designs));
        } catch (error) {
            console.error('Failed to save designs:', error);
            throw new Error('Storage quota exceeded or localStorage unavailable');
        }
    }

    /**
     * Generate unique ID
     * @private
     */
    generateId() {
        return 'design_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get service status
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this.initialized,
            available: this.isStorageAvailable(),
            designCount: this.getDesigns().length,
            type: 'local',
            version: '1.0'
        };
    }
}

export default LocalStorageService;