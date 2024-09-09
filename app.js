const fs = require('fs');
const path = require('path');
const { appRouter } = require('./appRouter');
const cors = require("cors");
const express = require("express");
const expressStatic = require('express').static;
const { exit } = require("process");

let id = [0];

// Function to load settings from a JSON file
async function loadSettings(settingsPath) {
    try {
        const data = await fs.promises.readFile(settingsPath, 'utf8');
        const settings = JSON.parse(data);
        return settings;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Settings file not found: ${settingsPath}`);
        } else if (error instanceof SyntaxError) {
            console.error(`Error decoding JSON from settings file: ${settingsPath}`);
        } else {
            console.error(`Error reading settings file: ${error.message}`);
        }
        return null;
    }
}

// Function to check if a directory or file should be ignored
function shouldIgnore(dirpath, ignorePaths, ignoreHiddenFiles) {
    // Ignore paths listed in the settings
    if (ignorePaths.some(ignorePath => dirpath.includes(ignorePath))) {
        return true;
    }

    // Ignore hidden files/folders if specified
    if (ignoreHiddenFiles) {
        const pathParts = dirpath.split(path.sep);
        for (const part of pathParts) {
            if (part.startsWith('.')) {
                return true;
            }
        }
    }

    return false;
}

// Recursively find all image files
async function findImages(baseDirectories, ignorePaths, ignoreHiddenFiles) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'];
    const imageData = [];

    for (const baseDirectory of baseDirectories) {
        // Recursively traverse the directory
        await traverseDirectory(baseDirectory, ignorePaths, ignoreHiddenFiles, imageExtensions, imageData, id);
    }

    return imageData;
}

// Traverse directory recursively and collect image files
async function traverseDirectory(dirpath, ignorePaths, ignoreHiddenFiles, imageExtensions, imageData, id) {
    try {
        const files = await fs.promises.readdir(dirpath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirpath, file.name);

            if (shouldIgnore(fullPath, ignorePaths, ignoreHiddenFiles)) {
                continue;
            }

            if (file.isDirectory()) {
                await traverseDirectory(fullPath, ignorePaths, ignoreHiddenFiles, imageExtensions, imageData, id);
            } else if (file.isFile() && imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
                id[0]++;
                imageData.push({
                    name: file.name,
                    path: fullPath,
                    id: id[0]
                });
                // console.log(`Found image: ${fullPath}`);
            }
        }
    } catch (error) {
        console.error(`Error reading directory: ${dirpath}`, error);
    }
}

// Write the image data to a JSON file
async function exportImageData(imageData, outputFile) {
    try {
        const jsonData = JSON.stringify(imageData, null, 4);
        await fs.promises.writeFile(outputFile, jsonData, 'utf8');
        console.log(`Image data exported to ${outputFile}`);
    } catch (error) {
        console.error(`Error writing to file: ${outputFile}`, error);
    }
}

// Main function to execute on startup
async function main() {
    const settings = await loadSettings('settings.json');

    if (!settings) {
        return;
    }

    const baseDirectories = settings.startingPaths;
    const ignorePaths = settings.ignorePaths;
    const ignoreHiddenFiles = settings.ignoreHiddenFiles;

    const imageData = await findImages(baseDirectories, ignorePaths, ignoreHiddenFiles);

    await exportImageData(imageData, 'image_data.json');
}

// Run the application on startup
main().then(() => {
    const settings = require('./settings.json');
    const port = settings.port || 3000;
    const staticHtmlPath = path.join(__dirname, './homepage');


    const app = express();
    app.set('trust proxy', true);
    app.use(cors());
    app.use(expressStatic(staticHtmlPath));
    app.use("/connect", appRouter);
    // start the Express server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}...`);
    }).on('error', (err) => {
        console.error('Server startup error:', err);
        exit(1);
    });
}).catch((error) => {
    console.error('Application error:', error);
    exit(1);
});





