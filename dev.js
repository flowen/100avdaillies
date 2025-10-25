#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get project number from command line argument
const projectNumber = process.argv[2];
const port = 9966 + parseInt(projectNumber) - 1;

if (!projectNumber || !projectNumber.match(/^\d{3}$/)) {
  console.error("Usage: node dev.js [project-number]");
  console.error("Example: node dev.js 001");
  process.exit(1);
}

const projectDir = projectNumber;
const indexPath = path.join(projectDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error(`Project ${projectNumber} not found`);
  process.exit(1);
}

console.log(`Starting development server for project ${projectNumber}...`);

// Build the project first
console.log(`Building ${projectNumber}...`);
const buildCommand = `cd ${projectDir} && browserify -v -d src/index.js -t babelify -t glslify | uglifyjs --compress --mangle > index.js`;

exec(buildCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error:`, error);
    return;
  }

  if (stderr) {
    console.log(`Build warnings:`, stderr);
  }

  console.log(`✅ ${projectNumber} built successfully`);

  // Start live server
  console.log(`Starting live server on port ${port}...`);
  const serverCommand = `live-server --port=${port} --no-browser`;

  exec(serverCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Server error:`, error);
      return;
    }

    console.log(stdout);
  });
});
