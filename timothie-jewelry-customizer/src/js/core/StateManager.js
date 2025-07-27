/**
 * StateManager - Handles undo/redo functionality and state persistence
 * Manages application state history with localStorage integration
 */

export default class StateManager {
    constructor(maxHistorySize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
        this.storageKey = 'timothie_jewelry_customizer_state';
        
        // Load existing state from localStorage if available
        this.loadFromStorage();
    }

    /**
     * Save a new state to history
     */
    saveState(state) {
        // Don't save if state is identical to current
        if (this.currentIndex >= 0 && this.statesEqual(state, this.history[this.currentIndex])) {
            return false;
        }

        // Remove any future history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add timestamp to state
        const timestampedState = {
            ...state,
            timestamp: Date.now(),
            id: this.generateStateId()
        };

        // Add new state
        this.history.push(timestampedState);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        // Save to localStorage
        this.saveToStorage();

        console.log(`State saved (${this.currentIndex + 1}/${this.history.length})`);
        return true;
    }

    /**
     * Undo to previous state
     */
    undo() {
        if (!this.canUndo()) {
            return null;
        }

        this.currentIndex--;
        const state = this.history[this.currentIndex];
        
        console.log(`Undo to state ${this.currentIndex + 1}/${this.history.length}`);
        return this.cloneState(state);
    }

    /**
     * Redo to next state
     */
    redo() {
        if (!this.canRedo()) {
            return null;
        }

        this.currentIndex++;
        const state = this.history[this.currentIndex];
        
        console.log(`Redo to state ${this.currentIndex + 1}/${this.history.length}`);
        return this.cloneState(state);
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get current state
     */
    getCurrentState() {
        if (this.currentIndex >= 0) {
            return this.cloneState(this.history[this.currentIndex]);
        }
        return null;
    }

    /**
     * Get history information
     */
    getHistoryInfo() {
        return {
            total: this.history.length,
            current: this.currentIndex + 1,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            states: this.history.map((state, index) => ({
                id: state.id,
                timestamp: state.timestamp,
                isCurrent: index === this.currentIndex,
                charmCount: state.charms ? state.charms.length : 0
            }))
        };
    }

    /**
     * Jump to specific state by index
     */
    jumpToState(index) {
        if (index < 0 || index >= this.history.length) {
            throw new Error(`Invalid state index: ${index}`);
        }

        this.currentIndex = index;
        const state = this.history[this.currentIndex];
        
        console.log(`Jumped to state ${this.currentIndex + 1}/${this.history.length}`);
        return this.cloneState(state);
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveToStorage();
        console.log('State history cleared');
    }

    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            const dataToSave = {
                history: this.history,
                currentIndex: this.currentIndex,
                lastUpdated: Date.now()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const data = JSON.parse(saved);
            
            // Validate loaded data
            if (data.history && Array.isArray(data.history) && typeof data.currentIndex === 'number') {
                this.history = data.history;
                this.currentIndex = data.currentIndex;
                
                // Ensure currentIndex is valid
                if (this.currentIndex >= this.history.length) {
                    this.currentIndex = this.history.length - 1;
                }
                
                console.log(`State loaded from storage: ${this.history.length} states`);
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
            this.clearHistory();
        }
    }

    /**
     * Export history as JSON
     */
    exportHistory() {
        return {
            history: this.history,
            currentIndex: this.currentIndex,
            exportTime: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Import history from JSON
     */
    importHistory(data) {
        try {
            if (!data.history || !Array.isArray(data.history)) {
                throw new Error('Invalid history data format');
            }

            this.history = data.history;
            this.currentIndex = Math.min(data.currentIndex || 0, this.history.length - 1);
            
            // Limit to max size
            if (this.history.length > this.maxHistorySize) {
                const excess = this.history.length - this.maxHistorySize;
                this.history = this.history.slice(excess);
                this.currentIndex = Math.max(0, this.currentIndex - excess);
            }

            this.saveToStorage();
            console.log(`History imported: ${this.history.length} states`);
            return true;
        } catch (error) {
            console.error('Failed to import history:', error);
            return false;
        }
    }

    /**
     * Create a branch from current state
     */
    createBranch(branchName) {
        if (this.currentIndex < 0) {
            throw new Error('No current state to branch from');
        }

        const currentState = this.cloneState(this.history[this.currentIndex]);
        currentState.branch = branchName;
        currentState.branchedFrom = this.history[this.currentIndex].id;
        
        return currentState;
    }

    /**
     * Get memory usage information
     */
    getMemoryUsage() {
        const jsonString = JSON.stringify(this.history);
        const sizeInBytes = new Blob([jsonString]).size;
        
        return {
            states: this.history.length,
            sizeBytes: sizeInBytes,
            sizeKB: Math.round(sizeInBytes / 1024),
            sizeMB: Math.round(sizeInBytes / (1024 * 1024) * 100) / 100
        };
    }

    /**
     * Optimize history by removing redundant states
     */
    optimizeHistory() {
        const originalLength = this.history.length;
        const optimized = [];
        let lastState = null;

        for (let i = 0; i < this.history.length; i++) {
            const state = this.history[i];
            
            // Keep state if it's significantly different from the last one
            if (!lastState || !this.statesEqual(state, lastState) || this.isImportantState(state)) {
                optimized.push(state);
                lastState = state;
            }
        }

        // Always keep the last state
        if (this.history.length > 0 && !optimized.includes(this.history[this.history.length - 1])) {
            optimized.push(this.history[this.history.length - 1]);
        }

        this.history = optimized;
        this.currentIndex = Math.min(this.currentIndex, this.history.length - 1);
        
        const removed = originalLength - optimized.length;
        if (removed > 0) {
            console.log(`History optimized: removed ${removed} redundant states`);
            this.saveToStorage();
        }
        
        return removed;
    }

    /**
     * Check if two states are equal (deep comparison of important properties)
     */
    statesEqual(state1, state2) {
        if (!state1 || !state2) return false;
        if (!state1.charms || !state2.charms) return false;
        if (state1.charms.length !== state2.charms.length) return false;

        // Compare charm data
        for (let i = 0; i < state1.charms.length; i++) {
            const charm1 = state1.charms[i];
            const charm2 = state2.charms[i];
            
            if (charm1.id !== charm2.id ||
                Math.abs(charm1.x - charm2.x) > 1 ||
                Math.abs(charm1.y - charm2.y) > 1 ||
                charm1.rotation !== charm2.rotation) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a state is considered important (should not be optimized away)
     */
    isImportantState(state) {
        // Consider states with major changes as important
        return state.branch || 
               state.milestone || 
               (state.charms && state.charms.length === 0) || // Empty state
               state.exported; // Exported state
    }

    /**
     * Create a deep clone of a state
     */
    cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    /**
     * Generate unique ID for state
     */
    generateStateId() {
        return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Mark current state as milestone
     */
    markMilestone(name) {
        if (this.currentIndex >= 0) {
            this.history[this.currentIndex].milestone = name;
            this.saveToStorage();
            console.log(`State marked as milestone: ${name}`);
        }
    }

    /**
     * Get all milestone states
     */
    getMilestones() {
        return this.history
            .map((state, index) => ({ ...state, index }))
            .filter(state => state.milestone);
    }

    /**
     * Clean up old states based on age
     */
    cleanupOldStates(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const now = Date.now();
        const cutoffTime = now - maxAge;
        
        // Find first state to keep (including milestones)
        let keepFromIndex = 0;
        for (let i = 0; i < this.history.length; i++) {
            if (this.history[i].timestamp > cutoffTime || this.history[i].milestone) {
                keepFromIndex = i;
                break;
            }
        }

        if (keepFromIndex > 0) {
            const removed = keepFromIndex;
            this.history = this.history.slice(keepFromIndex);
            this.currentIndex = Math.max(0, this.currentIndex - removed);
            
            console.log(`Cleaned up ${removed} old states`);
            this.saveToStorage();
            return removed;
        }

        return 0;
    }
}