# Timothie & Co Jewelry Customizer

A drag-and-drop jewelry customizer built with Konva.js that allows customers to design custom jewelry by positioning charms on necklaces and generate assembly instructions.

## Features

- **Drag-and-Drop Interface**: Intuitive charm placement with visual feedback
- **Responsive Design**: Works on desktop and mobile devices
- **High-Resolution Export**: Generate assembly references in PNG, PDF, and JSON formats
- **Undo/Redo**: Full history management with state persistence
- **Collision Detection**: Prevent charm overlap with smart positioning
- **Mobile Touch Support**: Optimized for touch interactions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── js/
│   ├── core/                 # Core application classes
│   │   ├── JewelryCustomizer.js
│   │   ├── CharmManager.js
│   │   ├── StateManager.js
│   │   └── ExportManager.js
│   ├── utils/                # Utility classes
│   │   └── ImageLoader.js
│   └── main.js              # Application entry point
├── css/
│   └── main.css             # Styles
├── assets/
│   └── images/              # Necklace and charm images
└── index.html               # Main HTML file
```

## Usage

1. **Select Base Necklace**: Choose from available necklace styles
2. **Browse Charms**: Use categories and search to find charms
3. **Add Charms**: Drag charms onto the necklace or click to add
4. **Position Charms**: Drag placed charms to perfect positions
5. **Export Design**: Generate high-resolution assembly references

## Development

### Key Classes

- **JewelryCustomizer**: Main application controller
- **CharmManager**: Handles charm operations and interactions
- **StateManager**: Manages undo/redo and state persistence
- **ExportManager**: Generates export files and assembly instructions
- **ImageLoader**: Handles image loading with caching and error handling

### Adding New Features

1. **New Necklace Types**: Add to necklace data configuration
2. **New Charm Categories**: Update charm categorization system
3. **Export Formats**: Extend ExportManager with new format support
4. **UI Enhancements**: Modify CSS and HTML structure

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers with Canvas support

## License

© 2024 Timothie & Co. All rights reserved.