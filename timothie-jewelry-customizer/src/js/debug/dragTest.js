/**
 * Drag Test Helper - For debugging drag functionality
 * Add this to console to test basic Konva drag functionality
 */

window.testCharmDrag = function() {
    console.log('🧪 Starting comprehensive charm drag test...');
    
    // Get the app instance
    const app = window.JewelryApp;
    if (!app || !app.customizer) {
        console.error('❌ App not found or not initialized');
        return;
    }
    
    const customizer = app.customizer;
    const stage = customizer.stage;
    const charmLayer = customizer.charmLayer;
    
    console.log('📊 Current setup:', {
        stage: !!stage,
        charmLayer: !!charmLayer,
        stageListening: stage?.listening(),
        layerListening: charmLayer?.listening(),
        charmCount: charmLayer?.children.length
    });
    
    // Test 0: Check if overlay is blocking
    const overlay = document.querySelector('.canvas-overlay');
    console.log('🎭 Overlay check:', {
        exists: !!overlay,
        display: overlay?.style.display,
        zIndex: overlay ? window.getComputedStyle(overlay).zIndex : 'N/A'
    });
    
    // Test 1: Create a simple draggable rectangle
    console.log('🟩 Test 1: Creating simple draggable rectangle...');
    const testRect = new Konva.Rect({
        x: 50,
        y: 50,
        width: 60,
        height: 60,
        fill: 'red',
        draggable: true,
        name: 'test-rect'
    });
    
    testRect.on('dragstart', () => console.log('🟩 Test rect drag started'));
    testRect.on('dragmove', () => console.log('🟩 Test rect drag move'));
    testRect.on('dragend', () => console.log('🟩 Test rect drag ended'));
    testRect.on('mouseenter', () => console.log('🟩 Test rect mouse enter'));
    testRect.on('mouseleave', () => console.log('🟩 Test rect mouse leave'));
    testRect.on('click', () => console.log('🟩 Test rect clicked'));
    
    charmLayer.add(testRect);
    charmLayer.draw();
    
    // Test 2: Check existing charms
    console.log('🎯 Test 2: Checking existing charms...');
    const charms = charmLayer.find('.charm');
    console.log(`Found ${charms.length} charms:`, charms.map(c => ({
        id: c.id(),
        draggable: c.draggable(),
        listening: c.listening(),
        x: c.x(),
        y: c.y(),
        visible: c.visible()
    })));
    
    // Test 3: Try to make existing charms draggable again with clean setup
    charms.forEach((charm, index) => {
        console.log(`🔧 Re-enabling drag for charm ${index}: ${charm.id()}`);
        
        // Reset all properties
        charm.draggable(true);
        charm.listening(true);
        charm.visible(true);
        
        // Remove ALL old listeners and add new ones
        charm.off();
        charm.on('dragstart', function() { 
            console.log(`🎯 CHARM ${this.id()} DRAG START`);
            this.moveToTop();
        });
        charm.on('dragmove', function() { 
            console.log(`🎯 CHARM ${this.id()} DRAG MOVE to`, this.position());
        });
        charm.on('dragend', function() { 
            console.log(`🎯 CHARM ${this.id()} DRAG END at`, this.position());
        });
        charm.on('mouseenter', function() { 
            console.log(`🎯 CHARM ${this.id()} MOUSE ENTER`);
            document.body.style.cursor = 'grab';
        });
        charm.on('mouseleave', function() { 
            console.log(`🎯 CHARM ${this.id()} MOUSE LEAVE`);
            document.body.style.cursor = 'default';
        });
        charm.on('click', function() { 
            console.log(`🎯 CHARM ${this.id()} CLICKED`);
        });
    });
    
    charmLayer.draw();
    
    // Test 4: Add event listener to stage to see what's happening
    console.log('🎪 Test 4: Adding stage event listeners...');
    stage.off('mousedown mouseup mousemove');
    stage.on('mousedown', (e) => {
        console.log('🎪 STAGE mousedown:', e.target?.id?.() || e.target?.constructor?.name || 'unknown');
    });
    stage.on('mouseup', (e) => {
        console.log('🎪 STAGE mouseup:', e.target?.id?.() || e.target?.constructor?.name || 'unknown');
    });
    
    console.log('✅ Comprehensive drag test setup complete!');
    console.log('Try dragging the red square and charms. Check console for events.');
    
    return {
        testRect,
        charms,
        removeTest: () => {
            testRect.destroy();
            charmLayer.draw();
            console.log('🧹 Test cleaned up');
        }
    };
};

// Automatically run test if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🛠️ Drag test helper loaded. Use testCharmDrag() in console to test.');
}