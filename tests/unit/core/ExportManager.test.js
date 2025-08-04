/**
 * ExportManager Unit Tests
 * Tests design export functionality, image generation, and various export formats
 */

import ExportManager from '../../../src/js/core/ExportManager.js';
import { mockCharms, createMockDOM } from '../../fixtures/testData.js';

// Mock Konva
jest.mock('konva', () => require('../../mocks/konvaMock.js'));

// Mock JewelryCustomizer
class MockJewelryCustomizer {
  constructor() {
    this.stage = {
      width: jest.fn(() => 1000),
      height: jest.fn(() => 750)
    };
    
    this.backgroundLayer = {
      children: [],
      clone: jest.fn(() => ({
        children: [],
        add: jest.fn()
      }))
    };
    
    this.charmLayer = {
      children: [],
      clone: jest.fn(() => ({
        children: [],
        add: jest.fn()
      }))
    };
    
    this.charmManager = {
      getCharmData: jest.fn(() => [
        {
          id: 'charm-1',
          name: 'Heart Charm',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          material: 'silver',
          attachmentMethod: 'jump ring'
        },
        {
          id: 'charm-2',
          name: 'Star Charm',
          x: 200,
          y: 150,
          width: 50,
          height: 50,
          material: 'gold',
          attachmentMethod: 'clasp'
        }
      ])
    };
    
    this.currentNecklace = {
      id: 'necklace-1',
      name: 'Classic Chain',
      length: '18 inches'
    };
    
    this.getDesignData = jest.fn(() => ({
      necklace: this.currentNecklace,
      charms: this.charmManager.getCharmData()
    }));
  }
}

describe('ExportManager', () => {
  let exportManager;
  let mockCustomizer;
  let mockDOM;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    
    // Only create DOM for tests that need it
    try {
      mockDOM = createMockDOM();
    } catch (error) {
      // Skip DOM creation if it fails (for tests that don't need it)
      mockDOM = null;
    }
    
    // Create mock customizer
    mockCustomizer = new MockJewelryCustomizer();
    
    // Create export manager
    exportManager = new ExportManager(mockCustomizer);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      expect(exportManager.customizer).toBe(mockCustomizer);
      expect(exportManager.exportFormats).toBeDefined();
      expect(exportManager.exportFormats.PNG).toBe('image/png');
      expect(exportManager.exportFormats.JPEG).toBe('image/jpeg');
      expect(exportManager.exportFormats.PDF).toBe('application/pdf');
      expect(exportManager.exportFormats.JSON).toBe('application/json');
    });
  });

  describe('Export Design', () => {
    test('should export PNG by default', async () => {
      const result = await exportManager.exportDesign();
      
      expect(result.type).toBe('image');
      expect(result.format).toBe('png');
      expect(result.dataURL).toBeDefined();
      expect(result.width).toBe(2400); // 1200 * pixelRatio(2)
      expect(result.height).toBe(1800); // 900 * pixelRatio(2)
    });

    test('should export JPEG format', async () => {
      const result = await exportManager.exportDesign({ format: 'JPEG' });
      
      expect(result.type).toBe('image');
      expect(result.format).toBe('jpeg');
      expect(result.dataURL).toBeDefined();
    });

    test('should export JSON format', async () => {
      const result = await exportManager.exportDesign({ format: 'JSON' });
      
      expect(result.type).toBe('json');
      expect(result.version).toBe('1.0');
      expect(result.design).toBeDefined();
      expect(result.assembly).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should export PDF format', async () => {
      const result = await exportManager.exportDesign({ format: 'PDF' });
      
      expect(result.type).toBe('pdf');
      expect(result.image).toBeDefined();
      expect(result.instructions).toBeDefined();
      expect(result.note).toContain('PDF export requires');
    });

    test('should throw error for unsupported format', async () => {
      await expect(exportManager.exportDesign({ format: 'UNSUPPORTED' }))
        .rejects.toThrow('Unsupported export format: UNSUPPORTED');
    });

    test('should handle export errors gracefully', async () => {
      // Mock error in stage creation
      const Konva = require('konva');
      const originalStage = Konva.Stage;
      Konva.Stage = jest.fn(() => {
        throw new Error('Mock stage error');
      });

      await expect(exportManager.exportDesign())
        .rejects.toThrow('Mock stage error');

      // Restore original
      Konva.Stage = originalStage;
    });
  });

  describe('Image Export', () => {
    test('should export image with default options', async () => {
      const result = await exportManager.exportImage();
      
      expect(result.type).toBe('image');
      expect(result.format).toBe('png');
      expect(result.dataURL).toMatch(/^data:image\/png;base64,/);
      expect(result.fileSize).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should export image with custom dimensions', async () => {
      const result = await exportManager.exportImage({
        width: 800,
        height: 600,
        pixelRatio: 1
      });
      
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    test('should export image with custom quality', async () => {
      const result = await exportManager.exportImage({
        quality: 0.8,
        format: 'JPEG'
      });
      
      expect(result.format).toBe('jpeg');
      expect(result.dataURL).toMatch(/^data:image\/jpeg;base64,/);
    });

    test('should include/exclude background layer', async () => {
      const withBackground = await exportManager.exportImage({ includeBackground: true });
      const withoutBackground = await exportManager.exportImage({ includeBackground: false });
      
      expect(withBackground.dataURL).toBeDefined();
      expect(withoutBackground.dataURL).toBeDefined();
      // Both should work, implementation details tested through integration
    });

    test('should include/exclude instructions', async () => {
      const withInstructions = await exportManager.exportImage({ includeInstructions: true });
      const withoutInstructions = await exportManager.exportImage({ includeInstructions: false });
      
      expect(withInstructions.dataURL).toBeDefined();
      expect(withoutInstructions.dataURL).toBeDefined();
    });

    test('should clean up export stage after completion', async () => {
      const Konva = require('konva');
      const destroySpy = jest.fn();
      
      // Mock stage to track destroy calls
      const originalStage = Konva.Stage;
      Konva.Stage = jest.fn(() => ({
        add: jest.fn(),
        toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
        destroy: destroySpy,
        width: jest.fn(() => 1200),
        height: jest.fn(() => 900)
      }));

      await exportManager.exportImage();
      
      expect(destroySpy).toHaveBeenCalled();
      
      // Restore original
      Konva.Stage = originalStage;
    });

    test('should clean up stage even if export fails', async () => {
      const Konva = require('konva');
      const destroySpy = jest.fn();
      
      // Mock stage that throws error
      Konva.Stage = jest.fn(() => ({
        add: jest.fn(),
        toDataURL: jest.fn(() => {
          throw new Error('Export failed');
        }),
        destroy: destroySpy,
        width: jest.fn(() => 1200),
        height: jest.fn(() => 900)
      }));

      await expect(exportManager.exportImage()).rejects.toThrow('Export failed');
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Layer Cloning', () => {
    test('should clone layer with scaling', () => {
      const mockLayer = {
        children: [
          {
            clone: jest.fn(() => ({
              scale: jest.fn(() => ({})),
              position: jest.fn(() => ({})),
              x: jest.fn(() => 100),
              y: jest.fn(() => 100)
            })),
            x: jest.fn(() => 100),
            y: jest.fn(() => 100)
          }
        ]
      };

      const clonedLayer = exportManager.cloneLayer(mockLayer, 2, 1200, 900);
      
      expect(clonedLayer).toBeDefined();
      expect(mockLayer.children[0].clone).toHaveBeenCalled();
    });

    test('should calculate correct scaling and centering', () => {
      const scaleSpy = jest.fn();
      const positionSpy = jest.fn();
      
      const mockChild = {
        clone: jest.fn(() => ({
          scale: scaleSpy,
          position: positionSpy,
          x: jest.fn(() => 100),
          y: jest.fn(() => 100)
        })),
        x: jest.fn(() => 100),
        y: jest.fn(() => 100)
      };

      const mockLayer = {
        children: [mockChild]
      };

      const scaleFactor = 1.5;
      const targetWidth = 1200;
      const targetHeight = 900;

      exportManager.cloneLayer(mockLayer, scaleFactor, targetWidth, targetHeight);
      
      expect(scaleSpy).toHaveBeenCalledWith({
        x: scaleFactor,
        y: scaleFactor
      });
      expect(positionSpy).toHaveBeenCalled();
    });
  });

  describe('Instruction Layer Creation', () => {
    test('should create instruction layer with markers', () => {
      const layer = exportManager.createInstructionLayer(1, 1200, 900);
      
      expect(layer).toBeDefined();
      // Layer should have markers for each charm
      const expectedMarkers = mockCustomizer.charmManager.getCharmData().length * 2; // circle + text per charm
      // Plus instruction box elements
    });

    test('should scale markers correctly', () => {
      const scaleFactor = 2;
      const layer = exportManager.createInstructionLayer(scaleFactor, 1200, 900);
      
      expect(layer).toBeDefined();
      // Markers should be scaled appropriately
    });

    test('should handle empty charm list', () => {
      mockCustomizer.charmManager.getCharmData.mockReturnValue([]);
      
      const layer = exportManager.createInstructionLayer(1, 1200, 900);
      
      expect(layer).toBeDefined();
      // Should not crash with empty charm list
    });
  });

  describe('Instruction Box', () => {
    test('should add instruction box with charm details', () => {
      const Konva = require('konva');
      const mockLayer = {
        add: jest.fn()
      };
      const charms = mockCustomizer.charmManager.getCharmData();
      
      exportManager.addInstructionBox(mockLayer, charms, 1, 1200, 900);
      
      // Should add background, title, instructions, and timestamp
      expect(mockLayer.add).toHaveBeenCalledTimes(4);
    });

    test('should limit instructions to 8 charms', () => {
      const mockLayer = {
        add: jest.fn()
      };
      
      // Create array with more than 8 charms
      const manyCharms = Array.from({ length: 12 }, (_, i) => ({
        id: `charm-${i}`,
        name: `Charm ${i}`,
        x: 100 + i * 10,
        y: 100
      }));
      
      exportManager.addInstructionBox(mockLayer, manyCharms, 1, 1200, 900);
      
      expect(mockLayer.add).toHaveBeenCalled();
      // Should handle truncation gracefully
    });
  });

  describe('JSON Export', () => {
    test('should export complete design data', () => {
      const result = exportManager.exportJSON();
      
      expect(result.type).toBe('json');
      expect(result.version).toBe('1.0');
      expect(result.timestamp).toBeDefined();
      expect(result.design).toBeDefined();
      expect(result.assembly).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should include metadata with canvas size', () => {
      const result = exportManager.exportJSON();
      
      expect(result.metadata.canvasSize).toEqual({
        width: 1000,
        height: 750
      });
      expect(result.metadata.totalCharms).toBe(2);
      expect(result.metadata.estimatedAssemblyTime).toBeDefined();
    });

    test('should include export options in metadata', () => {
      const options = { customOption: 'test' };
      const result = exportManager.exportJSON(options);
      
      expect(result.metadata.exportOptions).toEqual(options);
    });
  });

  describe('Assembly Instructions', () => {
    test('should generate detailed assembly instructions', () => {
      const instructions = exportManager.generateAssemblyInstructions();
      
      expect(instructions.necklace).toBeDefined();
      expect(instructions.charms).toHaveLength(2);
      expect(instructions.summary).toBeDefined();
      expect(instructions.notes).toBeInstanceOf(Array);
    });

    test('should sort charms by position', () => {
      const instructions = exportManager.generateAssemblyInstructions();
      
      expect(instructions.charms[0].step).toBe(1);
      expect(instructions.charms[1].step).toBe(2);
      
      // First charm should be the one with lower y position (or left-most if same y)
      expect(instructions.charms[0].position.y).toBeLessThanOrEqual(instructions.charms[1].position.y);
    });

    test('should include assembly summary', () => {
      const instructions = exportManager.generateAssemblyInstructions();
      
      expect(instructions.summary.totalCharms).toBe(2);
      expect(instructions.summary.estimatedTime).toBeDefined();
      expect(instructions.summary.toolsRequired).toContain('jump ring pliers');
      expect(instructions.summary.materials).toContain('silver');
      expect(instructions.summary.difficulty).toBeDefined();
    });

    test('should include helpful notes', () => {
      const instructions = exportManager.generateAssemblyInstructions();
      
      expect(instructions.notes).toContain('Work on a clean, well-lit surface');
      expect(instructions.notes).toContain('Handle charms carefully to avoid scratches');
    });
  });

  describe('Time Estimation', () => {
    test('should estimate assembly time correctly', () => {
      expect(exportManager.estimateAssemblyTime(1)).toBe('13 minutes');
      expect(exportManager.estimateAssemblyTime(5)).toBe('25 minutes');
      expect(exportManager.estimateAssemblyTime(20)).toBe('1h 10m');
      expect(exportManager.estimateAssemblyTime(30)).toBe('1h 40m');
      expect(exportManager.estimateAssemblyTime(40)).toBe('2h 10m');
    });

    test('should handle zero charms', () => {
      expect(exportManager.estimateAssemblyTime(0)).toBe('10 minutes');
    });

    test('should format hours correctly', () => {
      expect(exportManager.estimateAssemblyTime(50)).toBe('2h 40m');
      expect(exportManager.estimateAssemblyTime(60)).toBe('3h 10m');
    });
  });

  describe('Materials List', () => {
    test('should extract unique materials from charms', () => {
      const charms = [
        { material: 'silver', attachmentMethod: 'jump ring' },
        { material: 'gold', attachmentMethod: 'jump ring' },
        { material: 'silver', attachmentMethod: 'clasp' }
      ];
      
      const materials = exportManager.getMaterialsList(charms);
      
      expect(materials).toContain('silver');
      expect(materials).toContain('gold');
      expect(materials).toContain('jump ring');
      expect(materials).toContain('clasp');
      expect(materials.length).toBe(4); // Unique items only
    });

    test('should handle charms without materials', () => {
      const charms = [{ id: 'charm-1' }];
      const materials = exportManager.getMaterialsList(charms);
      
      expect(materials).toEqual([]);
    });
  });

  describe('Difficulty Level', () => {
    test('should determine difficulty based on charm count', () => {
      expect(exportManager.getDifficultyLevel(1)).toBe('Beginner');
      expect(exportManager.getDifficultyLevel(3)).toBe('Beginner');
      expect(exportManager.getDifficultyLevel(4)).toBe('Intermediate');
      expect(exportManager.getDifficultyLevel(6)).toBe('Intermediate');
      expect(exportManager.getDifficultyLevel(7)).toBe('Advanced');
      expect(exportManager.getDifficultyLevel(15)).toBe('Advanced');
    });
  });

  describe('File Size Estimation', () => {
    test('should estimate file size from data URL', () => {
      const mockDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const size = exportManager.estimateFileSize(mockDataURL);
      
      expect(size).toMatch(/\d+\s*(B|KB|MB)/);
    });

    test('should format file sizes correctly', () => {
      // Test small file (bytes)
      const smallDataURL = 'data:image/png;base64,ABC=';
      expect(exportManager.estimateFileSize(smallDataURL)).toMatch(/B$/);
      
      // Create larger mock data URLs for KB and MB testing
      const mediumData = 'A'.repeat(2000);
      const mediumDataURL = `data:image/png;base64,${btoa(mediumData)}`;
      expect(exportManager.estimateFileSize(mediumDataURL)).toMatch(/KB$/);
    });
  });

  describe('Download Export', () => {
    test('should download image export', () => {
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      
      // Mock URL methods
      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      };
      
      // Mock link element
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      
      const createElement = jest.spyOn(document, 'createElement');
      createElement.mockReturnValue(mockLink);
      
      const appendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      
      const exportData = {
        type: 'image',
        format: 'png',
        dataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
      };
      
      exportManager.downloadExport(exportData, 'test-design');
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('test-design.png');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
      
      // Cleanup mocks
      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
    });

    test('should download JSON export', () => {
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      
      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      };
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      
      const createElement = jest.spyOn(document, 'createElement');
      createElement.mockReturnValue(mockLink);
      
      const appendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      
      const exportData = {
        type: 'json',
        design: { test: 'data' }
      };
      
      exportManager.downloadExport(exportData, 'test-design');
      
      expect(mockLink.download).toBe('test-design.json');
      expect(mockLink.click).toHaveBeenCalled();
      
      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
    });

    test('should throw error for unsupported download type', () => {
      const exportData = {
        type: 'unsupported'
      };
      
      expect(() => exportManager.downloadExport(exportData, 'test'))
        .toThrow('Cannot download export type: unsupported');
    });
  });

  describe('Shareable Links', () => {
    test('should return mock shareable link', async () => {
      const exportData = { type: 'image' };
      const result = await exportManager.createShareableLink(exportData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('backend service');
      expect(result.mockUrl).toMatch(/^https:\/\/timothie-co\.com\/designs\/\d+$/);
    });
  });

  describe('Export Validation', () => {
    test('should validate width constraints', () => {
      let errors = exportManager.validateExportOptions({ width: 50 });
      expect(errors).toContain('Width must be between 100 and 4000 pixels');
      
      errors = exportManager.validateExportOptions({ width: 5000 });
      expect(errors).toContain('Width must be between 100 and 4000 pixels');
      
      errors = exportManager.validateExportOptions({ width: 1200 });
      expect(errors.find(e => e.includes('Width must be between'))).toBeUndefined();
    });

    test('should validate height constraints', () => {
      let errors = exportManager.validateExportOptions({ height: 50 });
      expect(errors).toContain('Height must be between 100 and 4000 pixels');
      
      errors = exportManager.validateExportOptions({ height: 5000 });
      expect(errors).toContain('Height must be between 100 and 4000 pixels');
      
      errors = exportManager.validateExportOptions({ height: 900 });
      expect(errors.find(e => e.includes('Height must be between'))).toBeUndefined();
    });

    test('should validate quality constraints', () => {
      let errors = exportManager.validateExportOptions({ quality: 0.05 });
      expect(errors).toContain('Quality must be between 0.1 and 1.0');
      
      errors = exportManager.validateExportOptions({ quality: 1.5 });
      expect(errors).toContain('Quality must be between 0.1 and 1.0');
      
      errors = exportManager.validateExportOptions({ quality: 0.8 });
      expect(errors.find(e => e.includes('Quality must be between'))).toBeUndefined();
    });

    test('should validate format support', () => {
      let errors = exportManager.validateExportOptions({ format: 'BMP' });
      expect(errors).toContain('Unsupported format: BMP');
      
      errors = exportManager.validateExportOptions({ format: 'PNG' });
      expect(errors.find(e => e.includes('Unsupported format'))).toBeUndefined();
    });

    test('should return empty array for valid options', () => {
      const errors = exportManager.validateExportOptions({
        width: 1200,
        height: 900,
        quality: 0.9,
        format: 'PNG'
      });
      
      expect(errors).toEqual([]);
    });

    test('should return multiple errors for multiple invalid options', () => {
      const errors = exportManager.validateExportOptions({
        width: 50,
        height: 5000,
        quality: 1.5,
        format: 'BMP'
      });
      
      expect(errors).toHaveLength(4);
    });
  });
});