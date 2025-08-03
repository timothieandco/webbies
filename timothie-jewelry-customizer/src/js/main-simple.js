/**
 * Timothie & Co Jewelry Customizer - Simplified Main Entry Point
 * Basic customizer without backend dependencies
 */

import '../css/main.css';
import JewelryCustomizer from './core/JewelryCustomizer.js';
import { charmImages, necklaceImages } from './utils/images.js';

class SimpleCustomizerApp {
    constructor() {
        this.customizer = null;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Simple Jewelry Customizer...');
            
            // Initialize the customizer
            this.customizer = new JewelryCustomizer('jewelry-canvas', {
                width: 800,
                height: 600,
                maxCharms: 10,
                enableAnimation: true
            });

            // Load sample necklace
            if (necklaceImages.plainChain) {
                await this.customizer.loadNecklace(necklaceImages.plainChain);
            }

            // Setup charm sidebar with sample charms
            this.setupCharmSidebar();
            
            // Setup basic controls
            this.setupControls();
            
            console.log('Simple Jewelry Customizer initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize customizer:', error);
            this.showError('Failed to initialize the jewelry customizer. Please refresh the page.');
        }
    }

    setupCharmSidebar() {
        const sidebar = document.getElementById('charm-sidebar');
        if (!sidebar) return;

        // Create charm grid
        const charmGrid = document.createElement('div');
        charmGrid.className = 'charm-grid';

        // Add sample charms
        Object.entries(charmImages).forEach(([name, url]) => {
            const charmItem = document.createElement('div');
            charmItem.className = 'charm-item';
            charmItem.innerHTML = `
                <img src="${url}" alt="${name}" draggable="false">
                <span class="charm-name">${this.formatCharmName(name)}</span>
            `;
            
            // Add click handler
            charmItem.addEventListener('click', () => {
                if (this.customizer) {
                    this.customizer.addCharm(url, { name });
                }
            });
            
            charmGrid.appendChild(charmItem);
        });

        sidebar.appendChild(charmGrid);
    }

    setupControls() {
        // Clear button
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (this.customizer) {
                    this.customizer.clearAllCharms();
                }
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (this.customizer) {
                    this.customizer.exportAsImage();
                }
            });
        }

        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (this.customizer) {
                    this.customizer.undo();
                }
            });
        }

        // Redo button
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                if (this.customizer) {
                    this.customizer.redo();
                }
            });
        }
    }

    formatCharmName(name) {
        // Convert camelCase to Title Case
        return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SimpleCustomizerApp();
});