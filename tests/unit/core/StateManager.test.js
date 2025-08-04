/**
 * StateManager Unit Tests
 * Tests undo/redo functionality and state persistence
 */

import StateManager from '../../../src/js/core/StateManager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(5); // Max 5 states for testing
  });

  describe('Constructor', () => {
    test('should initialize with default max history size', () => {
      const defaultManager = new StateManager();
      expect(defaultManager.maxHistorySize).toBe(50);
    });

    test('should initialize with custom max history size', () => {
      expect(stateManager.maxHistorySize).toBe(5);
      expect(stateManager.history).toEqual([]);
      expect(stateManager.currentIndex).toBe(-1);
    });

    test('should initialize with empty state', () => {
      expect(stateManager.canUndo()).toBe(false);
      expect(stateManager.canRedo()).toBe(false);
    });
  });

  describe('State Saving', () => {
    test('should save first state', () => {
      const state = { charms: [], necklace: null };
      
      stateManager.saveState(state);
      
      expect(stateManager.history).toHaveLength(1);
      expect(stateManager.currentIndex).toBe(0);
      // Check that the saved state contains the original data plus metadata
      expect(stateManager.history[0]).toMatchObject(state);
      expect(stateManager.history[0]).toHaveProperty('id');
      expect(stateManager.history[0]).toHaveProperty('timestamp');
    });

    test('should save multiple states', () => {
      const state1 = { charms: [], necklace: null };
      const state2 = { charms: [{ id: 'charm1' }], necklace: null };
      const state3 = { charms: [{ id: 'charm1' }, { id: 'charm2' }], necklace: null };

      stateManager.saveState(state1);
      stateManager.saveState(state2);
      stateManager.saveState(state3);

      expect(stateManager.history).toHaveLength(3);
      expect(stateManager.currentIndex).toBe(2);
    });

    test('should maintain max history size', () => {
      // Add 6 states when max is 5
      for (let i = 0; i < 6; i++) {
        stateManager.saveState({ charms: [], step: i });
      }

      expect(stateManager.history).toHaveLength(5);
      expect(stateManager.history[0].step).toBe(1); // First state should be removed
      expect(stateManager.history[4].step).toBe(5); // Last state should be preserved
      expect(stateManager.currentIndex).toBe(4);
    });

    test('should clear future states when saving after undo', () => {
      const state1 = { charms: [], step: 1 };
      const state2 = { charms: [{ id: 'charm1' }], step: 2 };
      const state3 = { charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 };

      stateManager.saveState(state1);
      stateManager.saveState(state2);
      stateManager.saveState(state3);

      // Undo once
      stateManager.undo();
      expect(stateManager.currentIndex).toBe(1);

      // Save new state - should clear state3
      const newState = { charms: [{ id: 'charm1' }, { id: 'charm3' }], step: 4 };
      stateManager.saveState(newState);

      expect(stateManager.history).toHaveLength(3);
      expect(stateManager.history[2]).toMatchObject(newState);
      expect(stateManager.history[2]).toHaveProperty('id');
      expect(stateManager.history[2]).toHaveProperty('timestamp');
      expect(stateManager.currentIndex).toBe(2);
    });

    test('should deep clone state to prevent mutations', () => {
      const originalState = { 
        charms: [{ id: 'charm1', position: { x: 100, y: 100 } }] 
      };
      
      stateManager.saveState(originalState);

      // Mutate original state
      originalState.charms[0].position.x = 200;

      // Saved state should not be affected
      expect(stateManager.history[0].charms[0].position.x).toBe(100);
    });
  });

  describe('Undo Functionality', () => {
    beforeEach(() => {
      // Set up some states
      stateManager.saveState({ charms: [], step: 1 });
      stateManager.saveState({ charms: [{ id: 'charm1' }], step: 2 });
      stateManager.saveState({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });
    });

    test('should undo to previous state', () => {
      const previousState = stateManager.undo();

      expect(previousState).toMatchObject({ charms: [{ id: 'charm1' }], step: 2 });
      expect(previousState).toHaveProperty('id');
      expect(previousState).toHaveProperty('timestamp');
      expect(stateManager.currentIndex).toBe(1);
    });

    test('should undo multiple times', () => {
      stateManager.undo(); // Go to state 2
      const previousState = stateManager.undo(); // Go to state 1

      expect(previousState).toMatchObject({ charms: [], step: 1 });
      expect(previousState).toHaveProperty('id');
      expect(previousState).toHaveProperty('timestamp');
      expect(stateManager.currentIndex).toBe(0);
    });

    test('should not undo beyond first state', () => {
      stateManager.undo(); // Go to state 2
      stateManager.undo(); // Go to state 1
      const result = stateManager.undo(); // Try to go before state 1

      expect(result).toBeNull();
      expect(stateManager.currentIndex).toBe(0);
    });

    test('should return null when no states to undo', () => {
      const emptyManager = new StateManager(50, false); // Disable storage
      const result = emptyManager.undo();

      expect(result).toBeNull();
    });

    test('should update canUndo status correctly', () => {
      expect(stateManager.canUndo()).toBe(true);

      stateManager.undo();
      expect(stateManager.canUndo()).toBe(true);

      stateManager.undo();
      expect(stateManager.canUndo()).toBe(false); // At first state
    });
  });

  describe('Redo Functionality', () => {
    beforeEach(() => {
      // Set up states and undo some
      stateManager.saveState({ charms: [], step: 1 });
      stateManager.saveState({ charms: [{ id: 'charm1' }], step: 2 });
      stateManager.saveState({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });
      stateManager.undo(); // Current index = 1 (state 2)
    });

    test('should redo to next state', () => {
      const nextState = stateManager.redo();

      expect(nextState).toMatchObject({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });
      expect(nextState).toHaveProperty('id');
      expect(nextState).toHaveProperty('timestamp');
      expect(stateManager.currentIndex).toBe(2);
    });

    test('should not redo beyond last state', () => {
      stateManager.redo(); // Go to state 3
      const result = stateManager.redo(); // Try to go beyond state 3

      expect(result).toBeNull();
      expect(stateManager.currentIndex).toBe(2);
    });

    test('should return null when no states to redo', () => {
      // Move to latest state first, then try to redo beyond
      stateManager.redo(); // Move to state 3 (latest)
      const result = stateManager.redo(); // Try to redo beyond latest

      expect(result).toBeNull();
    });

    test('should update canRedo status correctly', () => {
      expect(stateManager.canRedo()).toBe(true);

      stateManager.redo();
      expect(stateManager.canRedo()).toBe(false); // At last state
    });
  });

  describe('State Navigation', () => {
    beforeEach(() => {
      stateManager.saveState({ charms: [], step: 1 });
      stateManager.saveState({ charms: [{ id: 'charm1' }], step: 2 });
      stateManager.saveState({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });
    });

    test('should navigate backward and forward correctly', () => {
      // Start at state 3
      expect(stateManager.getCurrentState()).toMatchObject({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });

      // Go back to state 2
      stateManager.undo();
      expect(stateManager.getCurrentState()).toMatchObject({ charms: [{ id: 'charm1' }], step: 2 });

      // Go back to state 1
      stateManager.undo();
      expect(stateManager.getCurrentState()).toMatchObject({ charms: [], step: 1 });

      // Go forward to state 2
      stateManager.redo();
      expect(stateManager.getCurrentState()).toMatchObject({ charms: [{ id: 'charm1' }], step: 2 });

      // Go forward to state 3
      stateManager.redo();
      expect(stateManager.getCurrentState()).toMatchObject({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });
    });

    test('should handle mixed undo/redo operations', () => {
      stateManager.undo(); // Index 1
      stateManager.undo(); // Index 0
      stateManager.redo();  // Index 1
      stateManager.undo(); // Index 0
      stateManager.redo();  // Index 1
      stateManager.redo();  // Index 2

      expect(stateManager.currentIndex).toBe(2);
      expect(stateManager.getCurrentState()).toMatchObject({ charms: [{ id: 'charm1' }, { id: 'charm2' }], step: 3 });
    });
  });

  describe('Current State', () => {
    test('should return null when no states saved', () => {
      const emptyManager = new StateManager();
      expect(emptyManager.getCurrentState()).toBeNull();
    });

    test('should return current state correctly', () => {
      const state = { charms: [{ id: 'charm1' }] };
      stateManager.saveState(state);

      expect(stateManager.getCurrentState()).toMatchObject(state);
      expect(stateManager.getCurrentState()).toHaveProperty('id');
      expect(stateManager.getCurrentState()).toHaveProperty('timestamp');
    });

    test('should return correct state after navigation', () => {
      stateManager.saveState({ step: 1 });
      stateManager.saveState({ step: 2 });
      stateManager.saveState({ step: 3 });

      stateManager.undo();
      expect(stateManager.getCurrentState()).toMatchObject({ step: 2 });
      expect(stateManager.getCurrentState()).toHaveProperty('id');
      expect(stateManager.getCurrentState()).toHaveProperty('timestamp');
    });
  });

  describe('History Management', () => {
    test('should clear history', () => {
      stateManager.saveState({ step: 1 });
      stateManager.saveState({ step: 2 });

      stateManager.clearHistory();

      expect(stateManager.history).toEqual([]);
      expect(stateManager.currentIndex).toBe(-1);
      expect(stateManager.canUndo()).toBe(false);
      expect(stateManager.canRedo()).toBe(false);
    });

    test('should get history size', () => {
      expect(stateManager.getHistorySize()).toBe(0);

      stateManager.saveState({ step: 1 });
      expect(stateManager.getHistorySize()).toBe(1);

      stateManager.saveState({ step: 2 });
      expect(stateManager.getHistorySize()).toBe(2);
    });

    test('should get history info', () => {
      stateManager.saveState({ step: 1 });
      stateManager.saveState({ step: 2 });
      stateManager.saveState({ step: 3 });
      stateManager.undo(); // Current index = 1

      const info = stateManager.getHistoryInfo();

      expect(info).toEqual({
        size: 3,
        currentIndex: 1,
        canUndo: true,
        canRedo: true,
        maxSize: 5
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle identical consecutive states', () => {
      const state = { charms: [{ id: 'charm1' }] };
      
      stateManager.saveState(state);
      stateManager.saveState(state); // Same state

      expect(stateManager.history).toHaveLength(2);
    });

    test('should handle null states', () => {
      stateManager.saveState(null);
      
      expect(stateManager.history).toHaveLength(1);
      expect(stateManager.history[0]).toBeNull();
    });

    test('should handle undefined states', () => {
      stateManager.saveState(undefined);
      
      expect(stateManager.history).toHaveLength(1);
      expect(stateManager.history[0]).toBeUndefined();
    });

    test('should handle complex nested objects', () => {
      const complexState = {
        charms: [
          {
            id: 'charm1',
            data: {
              title: 'Heart Charm',
              properties: {
                color: 'gold',
                size: 'medium',
                tags: ['love', 'romantic']
              }
            },
            position: { x: 100, y: 200 }
          }
        ],
        necklace: {
          id: 'chain1',
          attachmentZones: [
            { x: 50, y: 50, occupied: false }
          ]
        }
      };

      stateManager.saveState(complexState);
      
      expect(stateManager.getCurrentState()).toMatchObject(complexState);
      expect(stateManager.getCurrentState()).toHaveProperty('id');
      expect(stateManager.getCurrentState()).toHaveProperty('timestamp');
      
      // Verify deep cloning
      complexState.charms[0].position.x = 300;
      expect(stateManager.getCurrentState().charms[0].position.x).toBe(100);
    });
  });

  describe('Performance', () => {
    test('should handle many state saves efficiently', () => {
      const startTime = performance.now();
      
      // Save 1000 states
      for (let i = 0; i < 1000; i++) {
        stateManager.saveState({ 
          charms: [{ id: `charm${i}`, x: i, y: i }],
          step: i 
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
      expect(stateManager.history).toHaveLength(5); // Max size maintained
    });

    test('should handle rapid undo/redo operations', () => {
      // Set up some states
      for (let i = 0; i < 5; i++) {
        stateManager.saveState({ step: i });
      }

      const startTime = performance.now();
      
      // Perform many undo/redo operations
      for (let i = 0; i < 100; i++) {
        stateManager.undo();
        stateManager.undo();
        stateManager.redo();
        stateManager.redo();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});