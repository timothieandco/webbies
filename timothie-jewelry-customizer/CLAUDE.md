# Timothie & Co Jewelry Customizer

## Project Overview

A complete web application for Timothie & Co that allows customers to design custom jewelry pieces through an interactive drag-and-drop interface. The project includes both a branded home page that mirrors the official timothieandco.com website and a fully functional jewelry customizer tool.

## Project Structure

```
timothie-jewelry-customizer/
├── src/
│   ├── assets/
│   │   ├── fonts/                 # Authentic brand fonts
│   │   │   ├── Cinzel-VariableFont_wght.ttf
│   │   │   ├── DMSerifDisplay-*.ttf
│   │   │   ├── DancingScript-VariableFont_wght.ttf
│   │   │   └── PlayfairDisplay-*.ttf
│   │   └── images/
│   │       ├── charms/            # 8 charm PNG files
│   │       ├── necklaces/         # plainChain.png base
│   │       └── ui/                # Brand logos, photography
│   ├── css/
│   │   ├── home.css              # Home page styling
│   │   └── main.css              # Customizer styling
│   ├── js/
│   │   ├── core/
│   │   │   ├── JewelryCustomizer.js    # Main customizer logic
│   │   │   ├── CharmManager.js         # Drag-and-drop functionality
│   │   │   ├── StateManager.js         # Undo/redo system
│   │   │   └── ExportManager.js        # Export functionality
│   │   ├── utils/
│   │   │   ├── images.js               # Customizer image imports
│   │   │   ├── homeImages.js           # Home page image imports
│   │   │   └── ImageLoader.js          # Image loading utilities
│   │   ├── home.js               # Home page JavaScript
│   │   └── main.js               # Customizer entry point
│   ├── home.html                 # Home page
│   └── index.html                # Jewelry customizer
├── webpack.config.js             # Multi-page webpack config
├── package.json                  # Dependencies and scripts
└── CLAUDE.md                     # This documentation
```

## Key Features

### Home Page
- **Authentic Branding**: Uses actual Timothie & Co fonts, logo, and professional photography
- **Responsive Design**: Mobile-first approach with smooth animations
- **Hero Section**: Parallax effects with compelling brand messaging
- **How It Works**: 3-step process guide for customers
- **Our Collection**: Product showcase with professional jewelry photography
- **About Section**: Brand story highlighting craftsmanship and community
- **Navigation**: Seamless transition to jewelry customizer

### Jewelry Customizer
- **Interactive Canvas**: Konva.js-powered drag-and-drop interface
- **Charm Management**: 8 different charm types with 320px display size
- **Necklace Base**: 2x scaled display with perfect proportions
- **Sidebar Design**: 4-column grid with hover tooltips showing name/price
- **Brand Styling**: Consistent color palette and typography
- **Responsive Layout**: Optimized for desktop, tablet, and mobile

## Technical Implementation

### Frontend Architecture
- **Vanilla JavaScript**: No framework dependencies for lightweight performance
- **Konva.js**: 2D canvas library for jewelry visualization and interaction
- **Webpack**: Multi-page application with optimized asset bundling
- **ES6 Modules**: Clean code organization and tree-shaking optimization

### Key Classes
- **JewelryCustomizer**: Main application controller managing canvas and layers
- **CharmManager**: Handles drag-and-drop, collision detection, and charm placement
- **StateManager**: Undo/redo functionality for design changes
- **ExportManager**: High-resolution image export capabilities
- **ImageLoader**: Optimized image loading with caching and error handling

### Brand Design System
- **Colors**: 
  - Primary: Soft pink `rgb(239, 202, 200)`
  - Secondary: Dusty rose `rgb(245, 222, 221)`
  - Accent: Coral `rgb(210, 107, 101)`
  - Neutral: Dark charcoal `rgb(18, 18, 18)`
- **Typography**: Cinzel (headings), Playfair Display (subheadings), Quicksand (body)
- **Aesthetic**: Romantic, elegant, minimalist with generous white space

## Development Workflow

### Setup
```bash
npm install
npm run dev    # Development server on localhost:3000
npm run build  # Production build
```

### Key Development Commands
- `npm run dev`: Start webpack dev server with hot reload
- `npm run build`: Create production build in /dist directory
- `npm run test`: Run test suite (when implemented)

### Pages
- **Home**: http://localhost:3000/home.html
- **Customizer**: http://localhost:3000/index.html

## Asset Management

### Images
All images use ES6 imports for webpack optimization:
- **Customizer**: `src/js/utils/images.js` exports `necklaceImages` and `charmImages`
- **Home Page**: `src/js/utils/homeImages.js` exports logo, collection, and background images
- **Processing**: Webpack generates hashed filenames for cache optimization

### Fonts
Authentic brand fonts loaded via `@font-face` declarations:
- Loaded locally for performance and brand consistency
- Fallback web-safe fonts for compatibility

## Responsive Design

### Breakpoints
- **480px**: Small mobile devices
- **768px**: Tablets and large mobile
- **1024px**: Small desktop/laptop
- **1200px**: Large desktop

### Layout Strategy
- **Mobile-first**: Base styles for mobile, enhanced for larger screens
- **Progressive Enhancement**: Core functionality works on all devices
- **Touch-friendly**: Appropriate sizing for touch interactions

## Performance Optimization

### Bundle Optimization
- **Code Splitting**: Separate bundles for home page and customizer
- **Tree Shaking**: Unused code eliminated in production builds
- **Asset Optimization**: Images and fonts processed with webpack loaders

### Runtime Performance
- **Canvas Optimization**: Efficient layer management in Konva.js
- **Image Caching**: Loaded images cached for instant reuse
- **Smooth Animations**: Hardware-accelerated CSS transitions

## Implementation History

### Phase 1: Core Functionality (Completed)
- [x] Project setup with webpack and development environment
- [x] Konva.js canvas implementation with stage/layer architecture
- [x] Drag-and-drop charm placement with collision detection
- [x] Image loading system with webpack asset processing
- [x] Responsive canvas layout and basic styling

### Phase 2: UX/UI Polish (Completed)
- [x] Sidebar redesign with compact grid layout
- [x] Hover tooltips for charm information
- [x] Optimal sizing: 320px charms, 2x scaled necklace
- [x] Charm image negative space removal via CSS scaling
- [x] Brand color palette and typography implementation

### Phase 3: Brand Integration (Completed)
- [x] Authentic font integration from uploaded files
- [x] Professional photography integration
- [x] Home page creation mirroring timothieandco.com
- [x] Logo and brand asset implementation
- [x] Multi-page navigation and user flow

### Phase 4: Final Polish (Completed)
- [x] Image loading fixes for both pages
- [x] Cross-browser compatibility testing
- [x] Performance optimization and build process
- [x] Documentation and version control setup

## Future Enhancements

### Potential Features
- [ ] Additional jewelry types (bracelets, earrings)
- [ ] Advanced customization options (chain length, materials)
- [ ] User account system for saving designs
- [ ] Integration with e-commerce platform
- [ ] Social sharing functionality
- [ ] Advanced export options (3D visualization)

### Technical Improvements
- [ ] Unit testing implementation
- [ ] End-to-end testing with Cypress
- [ ] Progressive Web App (PWA) features
- [ ] Advanced analytics integration
- [ ] Performance monitoring and optimization

## Browser Support

### Supported Browsers
- **Chrome**: 88+ (recommended)
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

### Required Features
- ES6 module support
- Canvas 2D API
- CSS Grid and Flexbox
- Touch events (mobile)

## Deployment Considerations

### Production Build
- Run `npm run build` to create optimized production files
- Deploy `/dist` directory contents to web server
- Ensure proper MIME types for font files
- Configure CDN for optimal asset delivery

### Environment Variables
- Update webpack configuration for production URLs
- Configure analytics tracking IDs
- Set up error logging and monitoring

## Troubleshooting

### Common Issues
1. **Images not loading**: Ensure ES6 imports in utils/images.js files
2. **Canvas not rendering**: Check Konva.js stage container dimensions
3. **Mobile touch issues**: Verify touch event handling in CharmManager
4. **Font loading failures**: Confirm font file paths and MIME types

### Debug Tools
- Browser dev tools for canvas inspection
- Webpack bundle analyzer for optimization
- Console logging in development mode
- Hot reload for rapid iteration

## Contributing

### Code Style
- Use ES6+ features consistently
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Maintain responsive design principles

### Testing
- Test on multiple browsers and devices
- Verify touch interactions on mobile
- Check accessibility compliance
- Validate brand consistency

This documentation serves as a comprehensive guide for development, deployment, and future enhancements of the Timothie & Co Jewelry Customizer application.