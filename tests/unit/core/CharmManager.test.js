/**
 * CharmManager Unit Tests
 * Tests drag-and-drop functionality, collision detection, and charm management
 */

import CharmManager from '../../../src/js/core/CharmManager.js';
import { mockCharms, mockNecklaces, createMockDOM } from '../../fixtures/testData.js';

// Mock Konva
jest.mock('konva', () => require('../../mocks/konvaMock.js'));

// Mock ImageLoader
jest.mock('../../../src/js/utils/ImageLoader.js', () => {
  return jest.fn().mockImplementation(() => ({
    loadImage: jest.fn().mockResolvedValue({
      width: 100,
      height: 100,
      src: 'mock-image-url',
      complete: true
    })
  }));
});

describe('CharmManager', () => {
  let charmManager;
  let mockLayer;

  beforeEach(() => {
    // Create mock stage first
    const MockStage = require('../../mocks/konvaMock.js').Stage;
    const mockStage = new MockStage({ width: 1000, height: 750 });
    
    // Create mock layer and connect to stage
    const MockLayer = require('../../mocks/konvaMock.js').Layer;
    mockLayer = new MockLayer();
    mockLayer.parent = mockStage;
    mockLayer.getStage = jest.fn(() => mockStage);
    
    // Create charm manager
    charmManager = new CharmManager(mockLayer, {
      maxCharms: 12,
      minCharmSpacing: 30
    });

    // Clear mocks after construction so selection indicator test can see the add() call
    jest.clearAllMocks();
  });

  afterEach(() => {
    charmManager = null;
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      expect(charmManager.charmLayer).toBe(mockLayer);
      expect(charmManager.charms).toBeInstanceOf(Map);
      expect(charmManager.attachmentZones).toEqual([]);
      expect(charmManager.selectionIndicator).toBeDefined();
    });

    test('should accept options', () => {
      const options = { maxCharms: 8, snapThreshold: 20 };
      const manager = new CharmManager(mockLayer, options);
      
      expect(manager.options).toEqual(options);
      expect(manager.snapThreshold).toBe(15); // Default value
    });

    test('should create selection indicator', () => {
      expect(charmManager.selectionIndicator).toBeDefined();
      expect(mockLayer.children).toContain(charmManager.selectionIndicator);
    });
  });

  describe('Attachment Zones', () => {
    test('should set attachment zones without necklace image', () => {
      const zones = [
        { x: 100, y: 100, radius: 30, occupied: false },
        { x: 200, y: 100, radius: 30, occupied: false }
      ];

      charmManager.setAttachmentZones(zones, null);

      expect(charmManager.attachmentZones).toEqual(zones);
    });

    test('should scale attachment zones with necklace image', () => {
      const zones = [
        { x: 100, y: 100, radius: 30, occupied: false }
      ];
      
      const mockNecklaceImage = {
        scaleX: jest.fn(() => 2),
        x: jest.fn(() => 50),
        y: jest.fn(() => 50)
      };

      charmManager.setAttachmentZones(zones, mockNecklaceImage);

      expect(charmManager.attachmentZones[0]).toEqual({
        x: 250, // 50 + (100 * 2)
        y: 250, // 50 + (100 * 2)
        radius: 60, // 30 * 2
        occupied: false
      });
    });
  });

  describe('Charm Addition', () => {
    test('should add charm successfully', async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      const result = await charmManager.addCharm(charmData, position);

      expect(charmManager.imageLoader.loadImage).toHaveBeenCalledWith(charmData.imageUrl);
      expect(result).toBeDefined();
      expect(result.id()).toBeDefined();
      expect(mockLayer.add).toHaveBeenCalled();
      expect(charmManager.charms.size).toBe(1);
    });

    test('should generate unique ID if not provided', async () => {
      const charmData = { ...mockCharms.charmOne };
      delete charmData.id;
      const position = { x: 100, y: 100 };

      const result = await charmManager.addCharm(charmData, position);

      expect(result.id()).toMatch(/^charm_\d+_[a-z0-9]+$/);
    });

    test('should position charm at given coordinates', async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 400, y: 300 };

      const result = await charmManager.addCharm(charmData, position);

      // Charm should be positioned at the given coordinates (not centered)
      expect(result.x()).toBe(position.x);
      expect(result.y()).toBe(position.y);
    });

    test('should set up drag event handlers', async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      const result = await charmManager.addCharm(charmData, position);

      expect(result.on).toHaveBeenCalledWith('dragstart', expect.any(Function));
      expect(result.on).toHaveBeenCalledWith('dragmove', expect.any(Function));
      expect(result.on).toHaveBeenCalledWith('dragend', expect.any(Function));
      expect(result.on).toHaveBeenCalledWith('click tap', expect.any(Function));
    });

    test('should handle image loading errors', async () => {
      charmManager.imageLoader.loadImage.mockRejectedValue(new Error('Load failed'));
      
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      await expect(charmManager.addCharm(charmData, position)).rejects.toThrow('Load failed');
    });
  });

  describe('Charm Removal', () => {
    beforeEach(async () => {
      // Add a charm first
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };
      await charmManager.addCharm(charmData, position);
    });

    test('should remove charm by ID', () => {
      const charmId = mockCharms.charmOne.id;
      
      const result = charmManager.removeCharm(charmId);

      expect(result).toBe(true);
      expect(charmManager.charms.size).toBe(0);
    });

    test('should return false for non-existent charm', () => {
      const result = charmManager.removeCharm('non-existent');

      expect(result).toBe(false);
      expect(charmManager.charms.size).toBe(1); // Original charm still there
    });

    test('should free up attachment zone when charm is removed', async () => {
      // Set up attachment zones
      const zones = [{ x: 100, y: 100, radius: 30, occupied: true }];
      charmManager.attachmentZones = zones;

      const charmId = mockCharms.charmOne.id;
      charmManager.removeCharm(charmId);

      expect(zones[0].occupied).toBe(false);
    });
  });

  describe('Charm Selection', () => {
    let charm;

    beforeEach(async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };
      charm = await charmManager.addCharm(charmData, position);
    });

    test('should show selection indicator', () => {
      charmManager.showSelection(charm);

      expect(charmManager.selectionIndicator.visible()).toBe(true);
      expect(charmManager.selectionIndicator.x()).toBeDefined();
      expect(charmManager.selectionIndicator.y()).toBeDefined();
    });

    test('should hide selection indicator', () => {
      charmManager.showSelection(charm);
      charmManager.hideSelection();

      expect(charmManager.selectionIndicator.visible()).toBe(false);
    });

    test('should position selection indicator correctly', () => {
      charmManager.showSelection(charm);

      const expectedX = charm.x() + charm.width() / 2;
      const expectedY = charm.y() + charm.height() / 2;

      expect(charmManager.selectionIndicator.x()).toBe(expectedX);
      expect(charmManager.selectionIndicator.y()).toBe(expectedY);
    });
  });

  describe('Collision Detection', () => {
    test('should detect collision between charms', () => {
      const charm1 = {
        x: () => 100,
        y: () => 100,
        width: () => 50,
        height: () => 50
      };

      const charm2 = {
        x: () => 120,
        y: () => 120,
        width: () => 50,
        height: () => 50
      };

      const collision = charmManager.checkCharmCollision(charm1, charm2);

      expect(collision).toBe(true);
    });

    test('should not detect collision when charms are apart', () => {
      const charm1 = {
        x: () => 100,
        y: () => 100,
        width: () => 50,
        height: () => 50
      };

      const charm2 = {
        x: () => 200,
        y: () => 200,
        width: () => 50,
        height: () => 50
      };

      const collision = charmManager.checkCharmCollision(charm1, charm2);

      expect(collision).toBe(false);
    });

    test('should detect collision with all charms', async () => {
      // Add two charms
      await charmManager.addCharm(mockCharms.charmOne, { x: 100, y: 100 });
      await charmManager.addCharm(mockCharms.charmTwo, { x: 200, y: 200 });

      const testCharm = {
        x: () => 110,
        y: () => 110,
        width: () => 50,
        height: () => 50,
        id: () => 'test-charm'
      };

      const hasCollision = charmManager.hasCollision(testCharm);

      expect(hasCollision).toBe(true);
    });
  });

  describe('Snap to Attachment Zones', () => {
    beforeEach(() => {
      charmManager.attachmentZones = [
        { x: 100, y: 100, radius: 30, occupied: false },
        { x: 200, y: 200, radius: 30, occupied: true }
      ];
    });

    test('should snap to nearby unoccupied zone', () => {
      const position = { x: 110, y: 110 };
      
      const snappedPosition = charmManager.snapToAttachmentZone(position);

      expect(snappedPosition.x).toBe(100);
      expect(snappedPosition.y).toBe(100);
    });

    test('should not snap to occupied zone', () => {
      const position = { x: 210, y: 210 };
      
      const snappedPosition = charmManager.snapToAttachmentZone(position);

      expect(snappedPosition.x).toBe(210);
      expect(snappedPosition.y).toBe(210);
    });

    test('should not snap if no zones are nearby', () => {
      const position = { x: 300, y: 300 };
      
      const snappedPosition = charmManager.snapToAttachmentZone(position);

      expect(snappedPosition.x).toBe(300);
      expect(snappedPosition.y).toBe(300);
    });

    test('should mark zone as occupied after snapping', () => {
      const position = { x: 110, y: 110 };
      
      charmManager.snapToAttachmentZone(position, 'test-charm');

      expect(charmManager.attachmentZones[0].occupied).toBe('test-charm');
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      // Add some charms
      await charmManager.addCharm(mockCharms.charmOne, { x: 100, y: 100 });
      await charmManager.addCharm(mockCharms.charmTwo, { x: 200, y: 200 });
    });

    test('should get current state', () => {
      const state = charmManager.getState();

      expect(state.charms).toHaveLength(2);
      expect(state.charms[0]).toEqual(expect.objectContaining({
        id: expect.any(String),
        x: expect.any(Number),
        y: expect.any(Number),
        data: expect.any(Object)
      }));
    });

    test('should load state', async () => {
      const state = {
        charms: [
          {
            id: 'loaded-charm',
            x: 150,
            y: 150,
            data: mockCharms.charmThree
          }
        ]
      };

      await charmManager.loadState(state);

      expect(charmManager.charms.size).toBe(1);
      expect(charmManager.charms.has('loaded-charm')).toBe(true);
    });

    test('should clear all charms', () => {
      charmManager.clearAll();

      expect(charmManager.charms.size).toBe(0);
      expect(mockLayer.draw).toHaveBeenCalled();
    });
  });

  describe('Event Callbacks', () => {
    beforeEach(async () => {
      charmManager.onCharmPlaced = jest.fn();
      charmManager.onCharmMoved = jest.fn();
      charmManager.onCharmSelected = jest.fn();
      charmManager.onError = jest.fn();
    });

    test('should trigger onCharmPlaced callback', async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      await charmManager.addCharm(charmData, position);

      expect(charmManager.onCharmPlaced).toHaveBeenCalled();
    });

    test('should trigger onError callback on failure', async () => {
      charmManager.imageLoader.loadImage.mockRejectedValue(new Error('Load failed'));
      
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      try {
        await charmManager.addCharm(charmData, position);
      } catch (error) {
        // Expected to throw
      }

      expect(charmManager.onError).toHaveBeenCalled();
    });
  });

  describe('Charm Data Retrieval', () => {
    beforeEach(async () => {
      await charmManager.addCharm(mockCharms.charmOne, { x: 100, y: 100 });
      await charmManager.addCharm(mockCharms.charmTwo, { x: 200, y: 200 });
    });

    test('should get charm count', () => {
      const count = charmManager.getCharmCount();
      expect(count).toBe(2);
    });

    test('should get charm data array', () => {
      const charmData = charmManager.getCharmData();
      
      expect(charmData).toHaveLength(2);
      expect(charmData[0]).toEqual(expect.objectContaining({
        id: expect.any(String),
        x: expect.any(Number),
        y: expect.any(Number),
        title: expect.any(String)
      }));
    });

    test('should find charm by ID', async () => {
      const charmId = mockCharms.charmOne.id;
      const foundCharm = charmManager.findCharmById(charmId);
      
      expect(foundCharm).toBeDefined();
      expect(foundCharm.id()).toBe(charmId);
    });

    test('should return null for non-existent charm ID', () => {
      const foundCharm = charmManager.findCharmById('non-existent');
      expect(foundCharm).toBeNull();
    });
  });

  describe('Drag Constraints', () => {
    let charm;

    beforeEach(async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };
      charm = await charmManager.addCharm(charmData, position);
    });

    test('should set drag constraints', () => {
      const constraints = {
        x: { min: 50, max: 950 },
        y: { min: 50, max: 700 }
      };

      charmManager.setDragConstraints(constraints);

      expect(charmManager.dragConstraints).toEqual(constraints);
    });

    test('should apply constraints during drag', () => {
      const constraints = {
        x: { min: 50, max: 950 },
        y: { min: 50, max: 700 }
      };
      charmManager.setDragConstraints(constraints);

      // Test position within bounds
      const boundedPos = charmManager.applyDragConstraints({ x: 100, y: 100 });
      expect(boundedPos).toEqual({ x: 100, y: 100 });

      // Test position outside bounds
      const constrainedPos = charmManager.applyDragConstraints({ x: 1000, y: 800 });
      expect(constrainedPos.x).toBe(950);
      expect(constrainedPos.y).toBe(700);
    });
  });
});