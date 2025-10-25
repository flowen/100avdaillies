import * as THREE from "three";

class Preloader {
  constructor() {
    this.loadedAssets = {};
    this.totalAssets = 0;
    this.loadedCount = 0;
    this.onProgress = null;
    this.onComplete = null;
    this.loader = new THREE.LoadingManager();
    this.assetFiles = [];

    // Set up loading manager callbacks
    this.loader.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadedCount = itemsLoaded;
      this.totalAssets = itemsTotal;

      if (this.onProgress) {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        this.onProgress(progress);
      }
    };

    this.loader.onLoad = () => {
      if (this.onComplete) {
        this.onComplete();
      }
    };
  }

  // Load all assets from the assets folder
  async loadAssets(onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    // For now, let's just complete immediately to test if the issue is with asset loading
    console.log("Preloader: Skipping asset loading for now");
    
    // Simulate loading progress
    if (onProgress) {
      onProgress(100);
    }
    
    // Complete immediately
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 100);
  }

  // Get list of asset files by scanning the assets folder
  async getAssetFiles() {
    // Return empty array for now to test
    return [];
  }

  // Load audio file
  loadAudio(filename) {
    const audio = new Audio(`assets/${filename}`);
    audio.preload = "auto";

    audio.addEventListener("canplaythrough", () => {
      this.loadedAssets[filename] = audio;
    });

    audio.addEventListener("error", () => {
      console.warn(`Failed to load audio: ${filename}`);
    });

    // Trigger loading
    audio.load();
  }

  // Load JSON file (3D models)
  loadJSON(filename) {
    const loader = new THREE.ObjectLoader(this.loader);

    loader.load(
      `assets/${filename}`,
      (object) => {
        this.loadedAssets[filename] = object;
      },
      undefined,
      (error) => {
        console.warn(`Failed to load JSON: ${filename}`, error);
      }
    );
  }

  // Load texture file
  loadTexture(filename) {
    const loader = new THREE.TextureLoader(this.loader);

    loader.load(
      `assets/${filename}`,
      (texture) => {
        this.loadedAssets[filename] = texture;
      },
      undefined,
      (error) => {
        console.warn(`Failed to load texture: ${filename}`, error);
      }
    );
  }

  // Get loaded asset by filename
  getAsset(filename) {
    return this.loadedAssets[filename];
  }

  // Get all loaded assets
  getAllAssets() {
    return this.loadedAssets;
  }
}

// Create and export singleton instance
const preloader = new Preloader();
export default preloader;