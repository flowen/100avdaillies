# 100 Audiovisuals Challenge

A collection of 17 audiovisual experiments built with Three.js and Web Audio API.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
```bash
# Install all dependencies (only need to run once)
npm install
```

### Development
```bash
# Start development server for project 001
npm start

# Start development server for specific project
npm run start:001
npm run start:002
# ... up to start:017
```

**Note**: The development servers use `live-server` for compatibility with Node.js v23+. Each project runs on a different port (9966-9982) to avoid conflicts.

### Building
```bash
# Build all projects
npm run build

# Build specific project
npm run build:001
npm run build:002
# ... up to build:017
```

### Cleaning
```bash
# Clean all build files
npm run clean

# Clean specific project
npm run clean:001
npm run clean:002
# ... up to clean:017
```

## 📁 Project Structure

```
100avdaillies/
├── package.json          # Root package.json with all dependencies
├── build.js              # Unified build script
├── index.html            # Main landing page
├── 001/                  # Project 001
│   ├── src/
│   │   ├── index.js
│   │   ├── objects/
│   │   ├── utils/
│   │   └── vendor/
│   ├── assets/
│   └── index.html
├── 002/                  # Project 002
│   └── ...
└── ...                   # Projects 003-017
```

## 🛠️ Build System

The project uses a unified build system:

- **Single package.json**: All dependencies are managed in the root `package.json`
- **Parallel builds**: The `build.js` script builds all projects in parallel for faster builds
- **Individual builds**: You can still build specific projects using `npm run build:XXX`
- **Clean system**: Easy cleanup of build files with `npm run clean`

### Build Script Features

- **Parallel execution**: All projects build simultaneously
- **Progress tracking**: Shows build progress for each project
- **Error handling**: Stops on first error with clear messages
- **Timing**: Reports total build time
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🎵 Features

Each project includes:
- **Preloader system**: Shows loading progress and requires user interaction
- **Audio visualization**: Real-time audio analysis and visualization
- **Three.js scenes**: 3D graphics and animations
- **Responsive design**: Works on desktop and mobile
- **Web Audio API**: High-quality audio processing

## 🎨 Projects Overview

- **001-003**: Basic Three.js scenes with audio visualization
- **004-006**: 3D models and textures
- **007-009**: Advanced shaders and post-processing
- **010-012**: Particle systems and effects
- **013-015**: Complex geometries and animations
- **016-017**: Advanced audio-reactive visuals

## 🔧 Development

### Adding New Projects
1. Create a new directory (e.g., `018/`)
2. Add the project structure with `src/`, `assets/`, and `index.html`
3. Update `build.js` to include the new project number
4. Add start/build/clean scripts to `package.json`

### Dependencies
All dependencies are managed in the root `package.json`:
- **Three.js**: 3D graphics library
- **Web Audio API**: Audio processing
- **Browserify**: Module bundling
- **Babelify**: ES6+ transpilation
- **Glslify**: GLSL shader processing
- **UglifyJS**: Code minification

## 📝 License

BSD-2-Clause License

## 👨‍💻 Author

Lowen Flowen