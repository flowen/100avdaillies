#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get all project directories
const projectDirs = [];
for (let i = 1; i <= 17; i++) {
  const dir = i.toString().padStart(3, "0");
  if (fs.existsSync(dir)) {
    projectDirs.push(dir);
  }
}

console.log(`Found ${projectDirs.length} projects: ${projectDirs.join(", ")}`);

// Build function for a single project
function buildProject(projectDir) {
  return new Promise((resolve, reject) => {
    const command = `cd ${projectDir} && NODE_PATH=../node_modules browserify -v -d src/index.js -t babelify -t glslify | uglifyjs --compress --mangle > index.js`;

    console.log(`Building ${projectDir}...`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error building ${projectDir}:`, error);
        reject(error);
        return;
      }

      if (stderr) {
        console.log(`${projectDir} stderr:`, stderr);
      }

      console.log(`✅ ${projectDir} built successfully`);
      resolve(projectDir);
    });
  });
}

// Build all projects in parallel
async function buildAll() {
  console.log("Starting build process...");
  const startTime = Date.now();

  try {
    const results = await Promise.all(
      projectDirs.map((projectDir) => buildProject(projectDir))
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n🎉 All projects built successfully in ${duration}s!`);
    console.log(`Built: ${results.join(", ")}`);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

// Clean function for a single project
function cleanProject(projectDir) {
  return new Promise((resolve, reject) => {
    const indexPath = path.join(projectDir, "index.js");

    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath);
      console.log(`✅ Cleaned ${projectDir}/index.js`);
    } else {
      console.log(`ℹ️  No build file found in ${projectDir}`);
    }

    resolve(projectDir);
  });
}

// Clean all projects
async function cleanAll() {
  console.log("Cleaning all build files...");

  try {
    const results = await Promise.all(
      projectDirs.map((projectDir) => cleanProject(projectDir))
    );

    console.log(`\n🧹 Cleaned: ${results.join(", ")}`);
  } catch (error) {
    console.error("Clean failed:", error);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case "build":
  case undefined:
    buildAll();
    break;
  case "clean":
    cleanAll();
    break;
  case "help":
    console.log(`
Usage: node build.js [command]

Commands:
  build    Build all projects (default)
  clean    Clean all build files
  help     Show this help message

Examples:
  node build.js build
  node build.js clean
  npm run build
  npm run clean
`);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "node build.js help" for usage information');
    process.exit(1);
}
