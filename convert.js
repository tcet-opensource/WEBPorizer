const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Function to convert an image to WebP and save it in the same location
async function convertToWebp(inputFile) {
    try {
        // Generate the output path in the same directory
        const inputPathInfo = path.parse(inputFile);
        const outputPath = path.join(inputPathInfo.dir, inputPathInfo.name + '.webp');

        // Create a WebP version of the image
        await sharp(inputFile).webp({ quality: 10 }).toFile(outputPath);
        console.log(`Converted ${inputFile} to ${outputPath}`);

        // Delete the original image (JPG or PNG)
        await fs.promises.unlink(inputFile);
        console.log(`Deleted ${inputFile}`);
    } catch (e) {
        console.error(`Error converting ${inputFile}: ${e.message}`);
    }
}

// Function to update image references in a file
async function updateImageReferences(filePath) {
    try {
        // Read the file content
        let content = await readFile(filePath, 'utf-8');

        // Define regular expressions to match <img src="xyz.jpg"> and <img src="xyz.png">
        const jpgPattern = /<img\s+src="([^"]+\.jpg)"\s*>/g;
        const pngPattern = /<img\s+src="([^"]+\.png)"\s*>/g;

        // Find all image references in the file
        const imageMatches = [...content.matchAll(jpgPattern), ...content.matchAll(pngPattern)];

        if (imageMatches.length > 0) {
            for (const [, imageFile] of imageMatches) {
                // Determine the image type (jpg or png) based on the file extension
                const imageType = path.extname(imageFile).toLowerCase();
                // Replace the image reference with .webp based on the image type
                const webpFile = imageFile.replace(imageType, '.webp');
                content = content.replace(imageFile, webpFile);
            }

            // Write the modified content back to the file
            await writeFile(filePath, content, 'utf-8');
            console.log(`Updated image references in ${filePath}`);
        }
    } catch (e) {
        console.error(`Error updating image references in ${filePath}: ${e.message}`);
    }
}

// Function to recursively process files in a directory
async function processDirectory(directory) {
    try {
        const files = await readdir(directory);

        for (const file of files) {
            const filePath = path.join(directory, file);
            const fileStat = await stat(filePath);

            if (fileStat.isDirectory()) {
                await processDirectory(filePath); // Recursively process subdirectories
            } else if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')) {
                await convertToWebp(filePath);
            } else if (file.toLowerCase().endsWith('.html') || file.toLowerCase().endsWith('.jsx')) {
                await updateImageReferences(filePath);
            }
        }
    } catch (e) {
        console.error(`Error processing files in ${directory}: ${e.message}`);
    }
}

// Specify the directory containing images
const imageCodeDirectory = 'C:/Users/Rahul/Documents/rahulvsc/tcet-opensource/webporizerjs';

// Main function to start processing
async function main() {
    await processDirectory(imageCodeDirectory);
}


