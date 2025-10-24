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

    // Get all asset files from the assets folder
    this.assetFiles = await this.getAssetFiles();

    if (this.assetFiles.length === 0) {
      // No assets to load, call complete immediately
      if (onComplete) onComplete();
      return;
    }

    // Load each asset type
    this.assetFiles.forEach((file) => {
      const extension = file.split(".").pop().toLowerCase();

      if (extension === "mp3") {
        this.loadAudio(file);
      } else if (extension === "json") {
        this.loadJSON(file);
      } else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
        this.loadTexture(file);
      }
    });
  }

  // Get list of asset files by scanning the assets folder
  async getAssetFiles() {
    const assetFiles = [];

    // Common asset filenames based on the project structure
    const commonAssets = [
      // Audio files
      "Devotion podcast 019 with Fernanda Martins-sample.mp3",
      "Lorn - Suicide Note.mp3",
      "Clouds - Complete Control.mp3",
      "egbert - haasten.mp3",
      "Malaa - Pregnant.mp3",
      "Pinch -  Qawwali.mp3",
      "Ellen Alien - boiler room set.mp3",
      "aphex twin live at field day.mp3",
      "Joseph Capriati - Fratello (original mix).mp3",
      "Joseph Capriati - Selfportrait.mp3",
      "erik - BBB.mp3",
      "Joseph Capriati - the gallery.mp3",
      "nicolasjaar-and-moderat-mix.mp3",
      "Lorn - Unfolding.mp3",
      "Tommy Four Seven - Bactria [47006].mp3",

      // 3D Models
      "Harpago_Chiragra.decimate0.025.json",
      "Harpago_Chiragra.decimate0.125.json",
      "Harpago_Chiragra.decimate0.25.json",
      "Bearded Man.decimate0.5.json",
      "hyophorbe.json",
      "cube.json",
      "mandala.json",

      // Textures
      "bump.jpg",
      "texture.jpg",
      "normalmap.jpg",
    ];

    // Check which assets exist by trying to load them
    for (const asset of commonAssets) {
      try {
        const response = await fetch(`assets/${asset}`, { method: "HEAD" });
        if (response.ok) {
          assetFiles.push(asset);
        }
      } catch (error) {
        // Asset doesn't exist, skip it
      }
    }

    return assetFiles;
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
