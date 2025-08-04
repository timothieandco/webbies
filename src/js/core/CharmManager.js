/**
 * CharmManager - Handles all charm-related operations
 * Including drag-and-drop, collision detection, and visual feedback
 */

import Konva from 'konva';
import ImageLoader from '../utils/ImageLoader.js';

export default class CharmManager {
    constructor(charmLayer, options = {}) {
        this.charmLayer = charmLayer;
        this.options = options;
        
        // Charm storage
        this.charms = new Map();
        this.attachmentZones = [];
        this.necklaceImage = null;
        
        // Selection indicator
        this.selectionIndicator = null;
        
        // Drag state
        this.dragConstraints = null;
        this.snapThreshold = 15; // pixels
        
        // Event callbacks
        this.onCharmPlaced = null;
        this.onCharmMoved = null;
        this.onCharmSelected = null;
        this.onError = null;
        
        this.imageLoader = new ImageLoader();
        this.createSelectionIndicator();
    }

    /**
     * Set attachment zones for charm positioning
     */
    setAttachmentZones(zones, necklaceImage) {
        this.attachmentZones = zones;
        this.necklaceImage = necklaceImage;
        
        // Scale attachment zones to match necklace image scale
        if (necklaceImage && zones) {
            const imageScale = necklaceImage.scaleX();
            const imageX = necklaceImage.x();
            const imageY = necklaceImage.y();
            
            this.attachmentZones = zones.map(zone => ({
                ...zone,
                x: imageX + (zone.x * imageScale),
                y: imageY + (zone.y * imageScale),
                radius: zone.radius * imageScale
            }));
        }
    }

    /**
     * Add a charm to the canvas
     */
    async addCharm(charmData, position) {
        try {
            // Generate unique ID if not provided
            const charmId = charmData.id || `charm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Load charm image
            const imageObj = await this.imageLoader.loadImage(charmData.imageUrl);
            
            // Verify image is properly loaded
            console.log(`🖼️ Image loaded for ${charmId}:`, {
                width: imageObj.width,
                height: imageObj.height,
                complete: imageObj.complete,
                src: imageObj.src
            });
            
            // Calculate charm size (doubled size for zoom effect)
            const maxSize = 320; // Doubled from 160 to match necklace zoom scaling
            const scale = Math.min(maxSize / imageObj.width, maxSize / imageObj.height);
            const charmWidth = imageObj.width * scale;
            const charmHeight = imageObj.height * scale;
            
            // Create Konva image node with explicit drag configuration
            const charm = new Konva.Image({
                x: position.x - charmWidth / 2,
                y: position.y - charmHeight / 2,
                image: imageObj,
                width: charmWidth,
                height: charmHeight,
                id: charmId,
                draggable: true,
                name: 'charm',
                // Ensure charm is properly setup for interactions
                listening: true,
                perfectDrawEnabled: false,
                // Remove dragBoundFunc initially to test if it's interfering
                // dragBoundFunc: function(pos) {
                //     // Allow free dragging for now - we'll constrain in handlers
                //     console.log(`🔧 dragBoundFunc called for ${charmId}:`, pos);
                //     return pos;
                // }
            });
            
            console.log(`🎯 Created charm ${charmId} with config:`, {
                x: charm.x(),
                y: charm.y(),
                draggable: charm.draggable(),
                listening: charm.listening(),
                visible: charm.visible()
            });

            // Store charm data
            charm.charmData = {
                ...charmData,
                id: charmId,
                width: charmWidth,
                height: charmHeight
            };
            
            // Validate and adjust position
            const validPosition = this.validateCharmPosition(charm, position);
            charm.position(validPosition);
            
            // Add to layer and storage FIRST
            this.charmLayer.add(charm);
            this.charms.set(charmId, charm);
            
            // Ensure layer is listening to events
            this.charmLayer.listening(true);
            this.charmLayer.visible(true);
            
            // Draw layer to make charm visible
            this.charmLayer.draw();
            
            // DEBUG: Verify layer state after adding charm
            console.log(`📊 Layer state after adding charm ${charmId}:`, {
                layerListening: this.charmLayer.listening(),
                layerVisible: this.charmLayer.visible(),
                charmCount: this.charmLayer.children.length,
                charmInLayer: this.charmLayer.children.includes(charm),
                charmParent: charm.getParent()?.name()
            });
            
            // SIMPLE drag test - bypass our complex event system for now
            console.log(`🧪 Setting up SIMPLE drag events for ${charmId}`);
            
            // Clear any existing events
            charm.off();
            
            // Add minimal drag events
            charm.on('dragstart', function() {
                console.log(`✨ SIMPLE DRAG START: ${this.id()}`);
                this.moveToTop();
            });
            
            charm.on('dragmove', function() {
                console.log(`🚀 SIMPLE DRAG MOVE: ${this.id()} to`, this.position());
            });
            
            charm.on('dragend', function() {
                console.log(`🎯 SIMPLE DRAG END: ${this.id()} at`, this.position());
            });
            
            // Add basic hover for debugging
            charm.on('mouseenter', function() {
                console.log(`🐭 Mouse enter: ${this.id()}`);
                document.body.style.cursor = 'grab';
            });
            
            charm.on('mouseleave', function() {
                console.log(`🐭 Mouse leave: ${this.id()}`);
                document.body.style.cursor = 'default';
            });
            
            // Setup charm interactions AFTER charm is in the layer
            // this.setupCharmEvents(charm);
            
            // Visual feedback with animation - but don't interfere with events
            if (this.options.enableAnimation) {
                charm.scale({ x: 0.5, y: 0.5 });
                const tween = charm.to({
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.3,
                    easing: Konva.Easings.BackEaseOut,
                    onFinish: () => {
                        // Ensure events are still working after animation
                        console.log(`🎬 Animation finished for ${charmId}, re-checking drag:`, {
                            draggable: charm.draggable(),
                            listening: charm.listening()
                        });
                    }
                });
            }
            
            // Additional check to ensure charm is ready for interaction
            setTimeout(() => {
                console.log(`🔄 Final charm state check for ${charmId}:`, {
                    draggable: charm.draggable(),
                    listening: charm.listening(),
                    visible: charm.visible(),
                    hasStage: !!charm.getStage(),
                    hasLayer: !!charm.getLayer()
                });
            }, 100);
            
            // Final redraw to ensure everything is visible
            this.charmLayer.draw();
            
            // Trigger callback
            if (this.onCharmPlaced) {
                this.onCharmPlaced(charm);
            }
            
            console.log(`Charm added: ${charmId}`);
            return charm;
            
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    /**
     * Setup event handlers for a charm
     */
    setupCharmEvents(charm) {
        console.log(`Setting up events for charm: ${charm.id()}`);
        
        // DEBUG: Test all mouse events to see what's working
        charm.on('mouseenter', () => {
            console.log(`🐭 Mouse entered charm: ${charm.id()}`);
            if (!charm.isDragging()) {
                document.body.style.cursor = 'grab';
                charm.to({
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 0.1,
                    easing: Konva.Easings.EaseInOut
                });
            }
        });

        charm.on('mouseleave', () => {
            console.log(`🐭 Mouse left charm: ${charm.id()}`);
            if (!charm.isDragging()) {
                document.body.style.cursor = 'default';
                charm.to({
                    scaleX: 1,
                    scaleY: 1,
                    duration: 0.1,
                    easing: Konva.Easings.EaseInOut
                });
            }
        });

        charm.on('mousedown', (e) => {
            console.log(`🖱️ Mouse down on charm: ${charm.id()}`, e);
        });

        charm.on('mouseup', (e) => {
            console.log(`🖱️ Mouse up on charm: ${charm.id()}`, e);
        });

        // Click selection
        charm.on('click tap', (e) => {
            console.log(`👆 Click/tap on charm: ${charm.id()}`);
            e.cancelBubble = true; // Prevent stage click
            if (this.onCharmSelected) {
                this.onCharmSelected(charm);
            }
        });

        // Drag events with enhanced logging
        charm.on('dragstart', (e) => {
            console.log(`🚀 DRAG START for charm: ${charm.id()}`, {
                position: charm.position(),
                draggable: charm.draggable(),
                listening: charm.listening()
            });
            this.handleDragStart(charm, e);
        });

        charm.on('dragmove', (e) => {
            console.log(`🔄 DRAG MOVE for charm: ${charm.id()}`, charm.position());
            this.handleDragMove(charm, e);
        });

        charm.on('dragend', (e) => {
            console.log(`🛑 DRAG END for charm: ${charm.id()}`, charm.position());
            this.handleDragEnd(charm, e);
        });
        
        // Test if charm is properly configured
        console.log(`✅ Charm ${charm.id()} setup completed:`, {
            draggable: charm.draggable(),
            listening: charm.listening(),
            visible: charm.visible(),
            x: charm.x(),
            y: charm.y(),
            width: charm.width(),
            height: charm.height(),
            layerListening: charm.getLayer()?.listening(),
            stageListening: charm.getStage()?.listening()
        });
        
        // DEBUGGING: Force test drag capability
        setTimeout(() => {
            console.log(`🔍 Post-setup charm state for ${charm.id()}:`, {
                draggable: charm.draggable(),
                listening: charm.listening(),
                visible: charm.visible(),
                hasParent: !!charm.getParent(),
                layerName: charm.getLayer()?.name(),
                stageSize: charm.getStage() ? `${charm.getStage().width()}x${charm.getStage().height()}` : 'no stage'
            });
        }, 100);
    }

    /**
     * Handle drag start
     */
    handleDragStart(charm, e) {
        // Change cursor
        document.body.style.cursor = 'grabbing';
        
        // Calculate drag constraints
        this.dragConstraints = this.calculateDragBounds(charm);
        
        // Move to top
        charm.moveToTop();
        
        // Visual feedback
        charm.opacity(0.8);
        charm.shadowEnabled(true);
        charm.shadowColor('rgba(0, 0, 0, 0.3)');
        charm.shadowBlur(10);
        charm.shadowOffset({ x: 2, y: 2 });
        
        console.log(`Drag started for charm: ${charm.id()}`);
    }

    /**
     * Handle drag move with constraints and snap-to-zone
     */
    handleDragMove(charm, e) {
        console.log(`🔄 handleDragMove called for ${charm.id()}`, charm.position());
        
        // TEMPORARILY DISABLE constraints to test basic dragging
        // Apply drag constraints
        // const pos = charm.position();
        // const constrainedPos = this.constrainPosition(pos, this.dragConstraints);
        // charm.position(constrainedPos);
        
        // // Check for snap-to-zone
        // const snapZone = this.findNearestAttachmentZone(constrainedPos);
        // if (snapZone && this.calculateDistance(constrainedPos, snapZone) < this.snapThreshold) {
        //     // Visual feedback for snap zone
        //     this.showSnapFeedback(snapZone);
        // } else {
        //     this.hideSnapFeedback();
        // }
        
        // // Check for collisions with other charms
        // const hasCollision = this.checkCharmCollision(charm, constrainedPos);
        // if (hasCollision) {
        //     charm.opacity(0.5); // Visual feedback for collision
        // } else {
        //     charm.opacity(0.8);
        // }
    }

    /**
     * Handle drag end with position validation
     */
    handleDragEnd(charm, e) {
        // Reset cursor and visual state
        document.body.style.cursor = 'default';
        charm.opacity(1);
        charm.shadowEnabled(false);
        
        const finalPosition = charm.position();
        
        // Check for snap to attachment zone
        const snapZone = this.findNearestAttachmentZone(finalPosition);
        if (snapZone && this.calculateDistance(finalPosition, snapZone) < this.snapThreshold) {
            // Snap to zone center
            charm.to({
                x: snapZone.x - charm.width() / 2,
                y: snapZone.y - charm.height() / 2,
                duration: 0.2,
                easing: Konva.Easings.EaseInOut
            });
            console.log(`Charm snapped to attachment zone`);
        }
        
        // Validate final position
        const validPosition = this.validateCharmPosition(charm, finalPosition);
        if (validPosition.x !== finalPosition.x || validPosition.y !== finalPosition.y) {
            // Animate to valid position
            charm.to({
                x: validPosition.x,
                y: validPosition.y,
                duration: 0.3,
                easing: Konva.Easings.BackEaseOut
            });
        }
        
        this.hideSnapFeedback();
        
        // Trigger callback
        if (this.onCharmMoved) {
            this.onCharmMoved(charm);
        }
        
        console.log(`Drag ended for charm: ${charm.id()}`);
    }

    /**
     * Validate and adjust charm position to prevent invalid placement
     */
    validateCharmPosition(charm, position) {
        let validX = position.x;
        let validY = position.y;
        
        // Get stage bounds - use charmLayer's stage since charm might not be added yet
        const stage = this.charmLayer.getStage();
        if (!stage) {
            console.warn('Stage not available for position validation');
            return { x: validX, y: validY };
        }
        
        const stageBounds = {
            x: 0,
            y: 0,
            width: stage.width(),
            height: stage.height()
        };
        
        // Get charm dimensions safely
        const charmWidth = charm.width() || 320; // fallback to new default size
        const charmHeight = charm.height() || 320; // fallback to new default size
        
        // Keep charm within stage bounds
        validX = Math.max(0, Math.min(validX, stageBounds.width - charmWidth));
        validY = Math.max(0, Math.min(validY, stageBounds.height - charmHeight));
        
        // If necklace image exists, try to keep charms within reasonable area
        if (this.necklaceImage) {
            const necklaceBounds = this.necklaceImage.getClientRect();
            const margin = 50; // pixels outside necklace allowed
            
            validX = Math.max(necklaceBounds.x - margin, 
                     Math.min(validX, necklaceBounds.x + necklaceBounds.width + margin - charmWidth));
            validY = Math.max(necklaceBounds.y - margin, 
                     Math.min(validY, necklaceBounds.y + necklaceBounds.height + margin - charmHeight));
        }
        
        // Check for collisions with other charms
        const collision = this.checkCharmCollision(charm, { x: validX, y: validY });
        if (collision) {
            // Try to find a nearby free space
            const freeSpace = this.findNearestFreeSpace({ x: validX, y: validY }, charm);
            if (freeSpace) {
                validX = freeSpace.x;
                validY = freeSpace.y;
            }
        }
        
        return { x: validX, y: validY };
    }

    /**
     * Check if a charm would collide with others at given position
     */
    checkCharmCollision(currentCharm, position) {
        const charmBounds = {
            x: position.x,
            y: position.y,
            width: currentCharm.width() || 320,
            height: currentCharm.height() || 320
        };
        
        for (const [id, charm] of this.charms) {
            if (charm === currentCharm) continue;
            
            const otherBounds = {
                x: charm.x(),
                y: charm.y(),
                width: charm.width() || 320,
                height: charm.height() || 320
            };
            
            // Add minimum spacing
            const minSpacing = this.options.minCharmSpacing || 10; // default 10px spacing
            otherBounds.x -= minSpacing / 2;
            otherBounds.y -= minSpacing / 2;
            otherBounds.width += minSpacing;
            otherBounds.height += minSpacing;
            
            if (this.rectanglesIntersect(charmBounds, otherBounds)) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }

    /**
     * Find nearest free space for charm placement
     */
    findNearestFreeSpace(preferredPosition, charm) {
        const searchRadius = 100;
        const step = 10;
        
        for (let radius = step; radius <= searchRadius; radius += step) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const testX = preferredPosition.x + Math.cos(angle) * radius;
                const testY = preferredPosition.y + Math.sin(angle) * radius;
                
                if (!this.checkCharmCollision(charm, { x: testX, y: testY })) {
                    return { x: testX, y: testY };
                }
            }
        }
        
        return preferredPosition; // Fallback to original position
    }

    /**
     * Calculate drag boundaries
     */
    calculateDragBounds(charm) {
        const stage = charm.getStage() || this.charmLayer.getStage();
        if (!stage) {
            console.warn('Stage not available for drag bounds calculation');
            return { x: 0, y: 0, width: 800, height: 600 }; // fallback bounds
        }
        
        const charmWidth = charm.width() || 320;
        const charmHeight = charm.height() || 320;
        
        return {
            x: 0,
            y: 0,
            width: stage.width() - charmWidth,
            height: stage.height() - charmHeight
        };
    }

    /**
     * Constrain position within bounds
     */
    constrainPosition(position, bounds) {
        return {
            x: Math.max(bounds.x, Math.min(position.x, bounds.x + bounds.width)),
            y: Math.max(bounds.y, Math.min(position.y, bounds.y + bounds.height))
        };
    }

    /**
     * Find nearest attachment zone
     */
    findNearestAttachmentZone(position) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const zone of this.attachmentZones) {
            if (zone.occupied) continue;
            
            const distance = this.calculateDistance(position, zone);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = zone;
            }
        }
        
        return nearest;
    }

    /**
     * Snap position to nearest attachment zone
     */
    snapToAttachmentZone(position, charmId = null) {
        const nearestZone = this.findNearestAttachmentZone(position);
        
        if (!nearestZone) {
            return position; // No zone found, return original position
        }
        
        const distance = this.calculateDistance(position, nearestZone);
        
        // Check if within snap threshold
        if (distance <= this.snapThreshold) {
            // Mark zone as occupied if charmId provided
            if (charmId) {
                nearestZone.occupied = charmId;
            }
            
            return { x: nearestZone.x, y: nearestZone.y };
        }
        
        return position; // Too far, return original position
    }

    /**
     * Show visual feedback for snap zone
     */
    showSnapFeedback(zone) {
        // Remove existing feedback
        this.hideSnapFeedback();
        
        // Create snap indicator
        this.snapIndicator = new Konva.Circle({
            x: zone.x,
            y: zone.y,
            radius: zone.radius,
            stroke: '#667eea',
            strokeWidth: 3,
            dash: [5, 5],
            opacity: 0.7,
            name: 'snap-indicator'
        });
        
        // Add pulsing animation
        this.snapIndicator.to({
            radius: zone.radius + 5,
            opacity: 0.5,
            duration: 0.5,
            easing: Konva.Easings.EaseInOut,
            onFinish: () => {
                // Check if snapIndicator still exists before trying to animate it
                if (this.snapIndicator && !this.snapIndicator.isDestroyed()) {
                    this.snapIndicator.to({
                        radius: zone.radius,
                        opacity: 0.7,
                        duration: 0.5,
                        easing: Konva.Easings.EaseInOut
                    });
                }
            }
        });
        
        const stage = this.charmLayer.getStage();
        const uiLayer = (stage && stage.findOne('.ui')) || this.charmLayer;
        uiLayer.add(this.snapIndicator);
        uiLayer.draw();
    }

    /**
     * Hide snap feedback
     */
    hideSnapFeedback() {
        if (this.snapIndicator && !this.snapIndicator.isDestroyed()) {
            this.snapIndicator.destroy();
            this.snapIndicator = null;
        }
    }

    /**
     * Create selection indicator
     */
    createSelectionIndicator() {
        this.selectionIndicator = new Konva.Rect({
            stroke: '#667eea',
            strokeWidth: 2,
            dash: [4, 4],
            fill: 'transparent',
            visible: false,
            name: 'selection-indicator'
        });
        
        // Add to charm layer immediately for testing
        this.charmLayer.add(this.selectionIndicator);
    }

    /**
     * Show selection indicator around charm
     */
    showSelection(charm) {
        const padding = 5;
        
        this.selectionIndicator.setAttrs({
            x: charm.x() - padding,
            y: charm.y() - padding,
            width: charm.width() + padding * 2,
            height: charm.height() + padding * 2,
            visible: true
        });
        
        // Animate selection
        this.selectionIndicator.to({
            strokeWidth: 3,
            duration: 0.2,
            easing: Konva.Easings.EaseInOut
        });
        
        const uiLayer = this.selectionIndicator.getLayer();
        if (uiLayer) {
            uiLayer.draw();
        }
    }

    /**
     * Hide selection indicator
     */
    hideSelection() {
        this.selectionIndicator.visible(false);
        const uiLayer = this.selectionIndicator.getLayer();
        if (uiLayer) {
            uiLayer.draw();
        }
    }

    /**
     * Remove a charm
     */
    removeCharm(charmId) {
        const charm = this.charms.get(charmId);
        if (!charm) return false;
        
        // Animate removal
        if (this.options.enableAnimation) {
            charm.to({
                scaleX: 0,
                scaleY: 0,
                opacity: 0,
                duration: 0.3,
                easing: Konva.Easings.BackEaseIn,
                onFinish: () => {
                    charm.destroy();
                    this.charmLayer.draw();
                }
            });
        } else {
            charm.destroy();
            this.charmLayer.draw();
        }
        
        this.charms.delete(charmId);
        console.log(`Charm removed: ${charmId}`);
        return true;
    }

    /**
     * Clear all charms
     */
    clearAll() {
        for (const [id, charm] of this.charms) {
            charm.destroy();
        }
        this.charms.clear();
        this.hideSelection();
        this.charmLayer.draw();
        console.log('All charms cleared');
    }

    /**
     * Get charm count
     */
    getCharmCount() {
        return this.charms.size;
    }

    /**
     * Get all charm data for state management
     */
    getCharmData() {
        const charmData = [];
        for (const [id, charm] of this.charms) {
            charmData.push({
                ...charm.charmData,
                x: charm.x(),
                y: charm.y(),
                rotation: charm.rotation(),
                scaleX: charm.scaleX(),
                scaleY: charm.scaleY()
            });
        }
        return charmData;
    }

    /**
     * Get current state for undo/redo
     */
    getState() {
        return {
            charms: this.getCharmData(),
            timestamp: Date.now()
        };
    }

    /**
     * Load state for undo/redo
     */
    async loadState(state) {
        // Clear existing charms
        this.clearAll();
        
        // Recreate charms from state
        for (const charmData of state.charms) {
            await this.addCharm(charmData, { x: charmData.x, y: charmData.y });
        }
    }

    /**
     * Utility: Calculate distance between two points
     */
    calculateDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Utility: Check if two rectangles intersect
     */
    rectanglesIntersect(rect1, rect2) {
        return !(rect2.x > rect1.x + rect1.width || 
                rect2.x + rect2.width < rect1.x || 
                rect2.y > rect1.y + rect1.height ||
                rect2.y + rect2.height < rect1.y);
    }

    /**
     * Find charm by ID
     */
    findCharmById(charmId) {
        return this.charms.get(charmId) || null;
    }

    /**
     * Check if a charm has any collision
     */
    hasCollision(charm) {
        const position = charm.position();
        return this.checkCharmCollision(charm, position);
    }

    /**
     * Set drag constraints
     */
    setDragConstraints(constraints) {
        this.dragConstraints = constraints;
    }

    /**
     * Apply drag constraints to a position
     */
    applyDragConstraints(position) {
        if (!this.dragConstraints) {
            return position;
        }

        let constrainedX = position.x;
        let constrainedY = position.y;

        if (this.dragConstraints.x) {
            constrainedX = Math.max(this.dragConstraints.x.min, 
                          Math.min(position.x, this.dragConstraints.x.max));
        }

        if (this.dragConstraints.y) {
            constrainedY = Math.max(this.dragConstraints.y.min, 
                          Math.min(position.y, this.dragConstraints.y.max));
        }

        return { x: constrainedX, y: constrainedY };
    }
}