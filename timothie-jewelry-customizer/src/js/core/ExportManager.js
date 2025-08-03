/**
 * ExportManager - Handles design export functionality
 * Generates high-resolution images, assembly instructions, and various export formats
 */

import Konva from 'konva';

export default class ExportManager {
    constructor(customizer) {
        this.customizer = customizer;
        this.exportFormats = {
            PNG: 'image/png',
            JPEG: 'image/jpeg',
            PDF: 'application/pdf',
            JSON: 'application/json'
        };
    }

    /**
     * Export design with specified options
     */
    async exportDesign(options = {}) {
        const {
            format = 'PNG',
            width = 1200,
            height = 900,
            quality = 1.0,
            includeInstructions = true,
            includeBackground = true,
            scaleFactor = null
        } = options;

        try {
            switch (format.toLowerCase()) {
                case 'png':
                case 'jpeg':
                    return await this.exportImage(options);
                case 'pdf':
                    return await this.exportPDF(options);
                case 'json':
                    return this.exportJSON(options);
                case 'cart':
                    return await this.exportToCart(options);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    /**
     * Export as high-resolution image
     */
    async exportImage(options = {}) {
        const {
            width = 1200,
            height = 900,
            quality = 1.0,
            format = 'PNG',
            includeInstructions = true,
            includeBackground = true,
            pixelRatio = 2
        } = options;

        // Create export stage
        const exportStage = new Konva.Stage({
            container: document.createElement('div'),
            width: width,
            height: height
        });

        try {
            // Calculate scale factor
            const originalWidth = this.customizer.stage.width();
            const originalHeight = this.customizer.stage.height();
            const scaleX = width / originalWidth;
            const scaleY = height / originalHeight;
            const scaleFactor = Math.min(scaleX, scaleY);

            // Clone and scale background layer
            if (includeBackground) {
                const backgroundLayer = this.cloneLayer(this.customizer.backgroundLayer, scaleFactor, width, height);
                exportStage.add(backgroundLayer);
            }

            // Clone and scale charm layer
            const charmLayer = this.cloneLayer(this.customizer.charmLayer, scaleFactor, width, height);
            exportStage.add(charmLayer);

            // Add instruction layer if requested
            if (includeInstructions) {
                const instructionLayer = this.createInstructionLayer(scaleFactor, width, height);
                exportStage.add(instructionLayer);
            }

            // Generate image
            const dataURL = exportStage.toDataURL({
                mimeType: this.exportFormats[format.toUpperCase()] || this.exportFormats.PNG,
                quality: quality,
                pixelRatio: pixelRatio
            });

            return {
                type: 'image',
                format: format.toLowerCase(),
                dataURL: dataURL,
                width: width * pixelRatio,
                height: height * pixelRatio,
                fileSize: this.estimateFileSize(dataURL),
                timestamp: Date.now()
            };

        } finally {
            // Clean up export stage
            exportStage.destroy();
        }
    }

    /**
     * Clone a layer with scaling
     */
    cloneLayer(originalLayer, scaleFactor, targetWidth, targetHeight) {
        const clonedLayer = new Konva.Layer();
        
        // Calculate centering offset
        const originalStageWidth = this.customizer.stage.width();
        const originalStageHeight = this.customizer.stage.height();
        const scaledWidth = originalStageWidth * scaleFactor;
        const scaledHeight = originalStageHeight * scaleFactor;
        const offsetX = (targetWidth - scaledWidth) / 2;
        const offsetY = (targetHeight - scaledHeight) / 2;

        // Clone each child node
        originalLayer.children.forEach(child => {
            const clonedChild = child.clone();
            
            // Apply scaling and centering
            clonedChild.scale({
                x: scaleFactor,
                y: scaleFactor
            });
            
            clonedChild.position({
                x: child.x() * scaleFactor + offsetX,
                y: child.y() * scaleFactor + offsetY
            });

            clonedLayer.add(clonedChild);
        });

        return clonedLayer;
    }

    /**
     * Create instruction layer with numbered markers
     */
    createInstructionLayer(scaleFactor, width, height) {
        const layer = new Konva.Layer();
        const charms = this.customizer.charmManager.getCharmData();
        
        // Calculate centering offset
        const originalStageWidth = this.customizer.stage.width();
        const originalStageHeight = this.customizer.stage.height();
        const scaledWidth = originalStageWidth * scaleFactor;
        const scaledHeight = originalStageHeight * scaleFactor;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        charms.forEach((charm, index) => {
            const markerRadius = 12 * scaleFactor;
            const fontSize = 14 * scaleFactor;
            
            // Calculate scaled position
            const scaledX = charm.x * scaleFactor + offsetX;
            const scaledY = charm.y * scaleFactor + offsetY;

            // Create marker circle
            const marker = new Konva.Circle({
                x: scaledX + (charm.width * scaleFactor) / 2,
                y: scaledY + (charm.height * scaleFactor) / 2,
                radius: markerRadius,
                fill: '#ff4444',
                stroke: '#ffffff',
                strokeWidth: 2 * scaleFactor
            });

            // Create number text
            const text = new Konva.Text({
                x: scaledX + (charm.width * scaleFactor) / 2 - fontSize / 2,
                y: scaledY + (charm.height * scaleFactor) / 2 - fontSize / 2,
                text: (index + 1).toString(),
                fontSize: fontSize,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
                align: 'center'
            });

            layer.add(marker, text);
        });

        // Add instruction box
        if (charms.length > 0) {
            this.addInstructionBox(layer, charms, scaleFactor, width, height);
        }

        return layer;
    }

    /**
     * Add instruction text box to export
     */
    addInstructionBox(layer, charms, scaleFactor, width, height) {
        const boxWidth = 280 * scaleFactor;
        const boxHeight = Math.min(200 * scaleFactor, height * 0.3);
        const padding = 15 * scaleFactor;
        const fontSize = 11 * scaleFactor;
        const lineHeight = fontSize * 1.4;

        // Position box in top-right corner
        const boxX = width - boxWidth - (20 * scaleFactor);
        const boxY = 20 * scaleFactor;

        // Background box
        const background = new Konva.Rect({
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            fill: 'rgba(255, 255, 255, 0.95)',
            stroke: '#ddd',
            strokeWidth: 1 * scaleFactor,
            cornerRadius: 8 * scaleFactor
        });

        layer.add(background);

        // Title
        const title = new Konva.Text({
            x: boxX + padding,
            y: boxY + padding,
            text: 'Assembly Instructions',
            fontSize: fontSize * 1.2,
            fill: '#333',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });

        layer.add(title);

        // Instructions
        const instructions = charms.slice(0, 8).map((charm, index) => {
            return `${index + 1}. ${charm.name || 'Charm'} at (${Math.round(charm.x)}, ${Math.round(charm.y)})`;
        });

        if (charms.length > 8) {
            instructions.push(`... and ${charms.length - 8} more charms`);
        }

        const instructionText = new Konva.Text({
            x: boxX + padding,
            y: boxY + padding + fontSize * 1.8,
            text: instructions.join('\n'),
            fontSize: fontSize,
            fill: '#666',
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1.4,
            width: boxWidth - padding * 2
        });

        layer.add(instructionText);

        // Add timestamp
        const timestamp = new Konva.Text({
            x: boxX + padding,
            y: boxY + boxHeight - padding - fontSize,
            text: `Generated: ${new Date().toLocaleDateString()}`,
            fontSize: fontSize * 0.9,
            fill: '#999',
            fontFamily: 'Arial, sans-serif'
        });

        layer.add(timestamp);
    }

    /**
     * Export as PDF (simplified - would need jsPDF library for full implementation)
     */
    async exportPDF(options = {}) {
        // For now, export as image and return data for PDF conversion
        const imageExport = await this.exportImage({
            ...options,
            format: 'PNG',
            width: 1200,
            height: 900
        });

        const assemblyData = this.generateAssemblyInstructions();

        return {
            type: 'pdf',
            image: imageExport,
            instructions: assemblyData,
            timestamp: Date.now(),
            // Note: Actual PDF generation would happen in a separate service or library
            note: 'PDF export requires server-side processing or client-side PDF library'
        };
    }

    /**
     * Export as JSON data
     */
    exportJSON(options = {}) {
        const designData = this.customizer.getDesignData();
        const assemblyInstructions = this.generateAssemblyInstructions();

        const exportData = {
            type: 'json',
            version: '1.0',
            timestamp: Date.now(),
            design: designData,
            assembly: assemblyInstructions,
            metadata: {
                exportOptions: options,
                canvasSize: {
                    width: this.customizer.stage.width(),
                    height: this.customizer.stage.height()
                },
                totalCharms: designData.charms.length,
                estimatedAssemblyTime: this.estimateAssemblyTime(designData.charms.length)
            }
        };

        return exportData;
    }

    /**
     * Generate detailed assembly instructions
     */
    generateAssemblyInstructions() {
        const charms = this.customizer.charmManager.getCharmData();
        const necklaceData = this.customizer.currentNecklace;

        // Sort charms by position (left to right, top to bottom)
        const sortedCharms = [...charms].sort((a, b) => {
            const yDiff = a.y - b.y;
            if (Math.abs(yDiff) < 20) {
                return a.x - b.x;
            }
            return yDiff;
        });

        const instructions = {
            necklace: {
                id: necklaceData?.id,
                name: necklaceData?.name,
                length: necklaceData?.length || '18 inches'
            },
            charms: sortedCharms.map((charm, index) => ({
                step: index + 1,
                charmId: charm.id,
                name: charm.name,
                position: {
                    x: Math.round(charm.x),
                    y: Math.round(charm.y)
                },
                attachmentMethod: charm.attachmentMethod || 'jump ring',
                instruction: `Attach ${charm.name || 'charm'} using ${charm.attachmentMethod || 'jump ring'} at position ${index + 1}`,
                estimatedTime: '2-3 minutes'
            })),
            summary: {
                totalCharms: charms.length,
                estimatedTime: this.estimateAssemblyTime(charms.length),
                toolsRequired: ['jump ring pliers', 'flat nose pliers'],
                materials: this.getMaterialsList(charms),
                difficulty: this.getDifficultyLevel(charms.length)
            },
            notes: [
                'Work on a clean, well-lit surface',
                'Handle charms carefully to avoid scratches',
                'Test each attachment before proceeding to the next',
                'Take breaks to avoid hand fatigue'
            ]
        };

        return instructions;
    }

    /**
     * Estimate assembly time based on charm count
     */
    estimateAssemblyTime(charmCount) {
        const baseTime = 10; // minutes for basic setup
        const timePerCharm = 3; // minutes per charm
        const totalMinutes = baseTime + (charmCount * timePerCharm);
        
        if (totalMinutes < 60) {
            return `${totalMinutes} minutes`;
        } else {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
    }

    /**
     * Get materials list from charms
     */
    getMaterialsList(charms) {
        const materials = new Set();
        
        charms.forEach(charm => {
            if (charm.material) materials.add(charm.material);
            if (charm.attachmentMethod) materials.add(charm.attachmentMethod);
        });

        return Array.from(materials);
    }

    /**
     * Determine difficulty level based on charm count
     */
    getDifficultyLevel(charmCount) {
        if (charmCount <= 3) return 'Beginner';
        if (charmCount <= 6) return 'Intermediate';
        return 'Advanced';
    }

    /**
     * Estimate file size from data URL
     */
    estimateFileSize(dataURL) {
        const base64Length = dataURL.split(',')[1].length;
        const sizeInBytes = (base64Length * 3) / 4;
        
        if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
        if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`;
        return `${Math.round(sizeInBytes / (1024 * 1024) * 10) / 10} MB`;
    }

    /**
     * Download exported data
     */
    downloadExport(exportData, filename) {
        let blob;
        let mimeType;
        let extension;

        switch (exportData.type) {
            case 'image':
                // Convert data URL to blob
                const [header, data] = exportData.dataURL.split(',');
                const bytes = atob(data);
                const buffer = new ArrayBuffer(bytes.length);
                const view = new Uint8Array(buffer);
                
                for (let i = 0; i < bytes.length; i++) {
                    view[i] = bytes.charCodeAt(i);
                }
                
                mimeType = exportData.format === 'jpeg' ? 'image/jpeg' : 'image/png';
                extension = exportData.format === 'jpeg' ? '.jpg' : '.png';
                blob = new Blob([buffer], { type: mimeType });
                break;

            case 'json':
                const jsonString = JSON.stringify(exportData, null, 2);
                blob = new Blob([jsonString], { type: 'application/json' });
                extension = '.json';
                break;

            default:
                throw new Error(`Cannot download export type: ${exportData.type}`);
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename + extension;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log(`Export downloaded: ${filename}${extension}`);
    }

    /**
     * Create shareable link (would require backend service)
     */
    async createShareableLink(exportData) {
        // This would typically involve uploading to a service
        // For now, return a mock response
        return {
            success: false,
            message: 'Shareable links require backend service integration',
            mockUrl: `https://timothie-co.com/designs/${Date.now()}`
        };
    }

    /**
     * Export design to cart
     */
    async exportToCart(options = {}) {
        if (!this.customizer.cartManager) {
            throw new Error('Cart functionality not available');
        }

        try {
            // Get current design state
            const currentState = this.getCurrentState();
            if (!currentState || !currentState.charms || currentState.charms.length === 0) {
                throw new Error('No design to export. Please add some charms first.');
            }

            // Calculate design pricing
            const designPrice = this.calculateDesignPrice(currentState);
            
            // Generate thumbnail
            const thumbnailDataURL = await this.exportAsDataURL({
                width: 200,
                height: 200,
                pixelRatio: 1,
                includeBackground: true,
                includeInstructions: false
            });

            // Create enhanced metadata
            const metadata = {
                name: options.name || `Custom Design ${new Date().toLocaleDateString()}`,
                description: options.description || `Custom jewelry design with ${currentState.charms.length} charms`,
                price: designPrice,
                category: 'custom-design',
                thumbnailUrl: thumbnailDataURL,
                designSpecs: this.generateDesignSpecs(currentState),
                assemblyInstructions: this.generateAssemblyInstructions(),
                ...options
            };

            // Export using the customizer's cart functionality
            const cartItem = await this.customizer.exportToCart(metadata);

            return {
                type: 'cart',
                cartItem: cartItem,
                designData: currentState,
                timestamp: Date.now(),
                success: true
            };

        } catch (error) {
            console.error('Failed to export to cart:', error);
            throw error;
        }
    }

    /**
     * Export design as data URL for thumbnails
     */
    exportAsDataURL(options = {}) {
        const {
            width = 200,
            height = 200,
            pixelRatio = 1,
            includeBackground = true,
            includeInstructions = false
        } = options;

        try {
            // Create export stage
            const exportStage = new Konva.Stage({
                container: document.createElement('div'),
                width: width,
                height: height
            });

            // Calculate scale factor
            const originalWidth = this.customizer.stage.width();
            const originalHeight = this.customizer.stage.height();
            const scaleX = width / originalWidth;
            const scaleY = height / originalHeight;
            const scaleFactor = Math.min(scaleX, scaleY);

            // Clone and scale background layer
            if (includeBackground) {
                const backgroundLayer = this.cloneLayer(this.customizer.backgroundLayer, scaleFactor, width, height);
                exportStage.add(backgroundLayer);
            }

            // Clone and scale charm layer
            const charmLayer = this.cloneLayer(this.customizer.charmLayer, scaleFactor, width, height);
            exportStage.add(charmLayer);

            // Generate data URL
            const dataURL = exportStage.toDataURL({
                mimeType: 'image/png',
                quality: 1.0,
                pixelRatio: pixelRatio
            });

            // Clean up
            exportStage.destroy();

            return dataURL;

        } catch (error) {
            console.error('Failed to generate data URL:', error);
            throw error;
        }
    }

    /**
     * Get current design state
     */
    getCurrentState() {
        return this.customizer.getDesignData();
    }

    /**
     * Calculate design price based on components
     */
    calculateDesignPrice(designState) {
        if (!designState || !designState.charms) return 0;

        // Base design creation fee
        let totalPrice = 25; // Custom design base price

        // Add charm costs (assuming $15 average per charm for custom work)
        totalPrice += designState.charms.length * 15;

        // Add necklace base cost
        if (designState.necklace) {
            totalPrice += 35; // Base necklace cost
        }

        return totalPrice;
    }

    /**
     * Generate design specifications
     */
    generateDesignSpecs(designState) {
        const specs = {
            type: 'Custom Jewelry Design',
            components: {
                necklace: designState.necklace ? {
                    id: designState.necklace.id,
                    name: designState.necklace.name
                } : null,
                charms: designState.charms.map(charm => ({
                    id: charm.id,
                    name: charm.name,
                    position: { x: charm.x, y: charm.y },
                    material: charm.material || 'sterling silver'
                }))
            },
            metadata: {
                charmCount: designState.charms.length,
                createdAt: designState.timestamp || Date.now(),
                estimatedAssemblyTime: this.estimateAssemblyTime(designState.charms.length),
                difficulty: this.getDifficultyLevel(designState.charms.length)
            }
        };

        return specs;
    }

    /**
     * Validate export options
     */
    validateExportOptions(options) {
        const errors = [];

        if (options.width && (options.width < 100 || options.width > 4000)) {
            errors.push('Width must be between 100 and 4000 pixels');
        }

        if (options.height && (options.height < 100 || options.height > 4000)) {
            errors.push('Height must be between 100 and 4000 pixels');
        }

        if (options.quality && (options.quality < 0.1 || options.quality > 1.0)) {
            errors.push('Quality must be between 0.1 and 1.0');
        }

        if (options.format && !Object.keys(this.exportFormats).includes(options.format.toUpperCase()) && options.format.toLowerCase() !== 'cart') {
            errors.push(`Unsupported format: ${options.format}`);
        }

        return errors;
    }
}