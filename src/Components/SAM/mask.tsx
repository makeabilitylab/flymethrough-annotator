import SAM2Encoder from './encoder.js';
import SAM2Predictor from './decoder.js';

/**
 * Resize mask tensor to match the original image resolution
 * @param {Object} maskData - Mask data tensor from the predictor
 * @param {number} origWidth - Original image width
 * @param {number} origHeight - Original image height
 * @returns {Uint8ClampedArray} Resized mask data matching the original image size
 */
function resizeMaskToOriginal(maskData, origWidth, origHeight) {
    const width = maskData.dims[3];
    const height = maskData.dims[2];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Convert mask tensor data into ImageData
    const maskImageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const value = maskData.data[i] > 0.5 ? 255 : 0; // Thresholding
        maskImageData[i * 4] = value;       // R
        maskImageData[i * 4 + 1] = value;   // G
        maskImageData[i * 4 + 2] = value;   // B
        maskImageData[i * 4 + 3] = 255;     // Alpha
    }

    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(maskImageData, width, height);
    ctx.putImageData(imageData, 0, 0);

    // Resize the canvas to the original dimensions
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = origWidth;
    resizedCanvas.height = origHeight;
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCtx.drawImage(canvas, 0, 0, origWidth, origHeight);

    // Extract resized mask data
    const resizedImageData = resizedCtx.getImageData(0, 0, origWidth, origHeight).data;
    const maskArray = new Uint8ClampedArray(origWidth * origHeight);
    for (let i = 0; i < origWidth * origHeight; i++) {
        maskArray[i] = resizedImageData[i * 4] > 128 ? 1 : 0; // Extract R channel and threshold
    }

    return maskArray;
}

/**
 * Create NPY file header with correct shape format
 * @param {Array} shape - Shape of the array as a tuple (height, width)
 * @param {string} dtype - Data type of the array
 * @returns {Uint8Array} Encoded header
 */
function createNpyHeader(height, width, dtype = '<b1') {
    // Use tuple format for shape
    const header = `{'descr': '${dtype}', 'fortran_order': False, 'shape': (${height}, ${width}), }`;
    const padding = 64 - ((10 + header.length + 1) % 64); // 10 bytes for magic string and header metadata, +1 for newline
    const paddedHeader = header + ' '.repeat(padding) + '\n'; // Ensure 64-byte alignment and add newline
    const headerBytes = new TextEncoder().encode(paddedHeader);
    return Uint8Array.from([0x93, 0x4E, 0x55, 0x4D, 0x50, 0x59, 0x01, 0x00, ...Array.from(new Uint16Array([headerBytes.length])), ...headerBytes]);
}

/**
 * Convert mask array to NPY format with correct header
 * @param {Uint8Array} maskArray - The mask array
 * @param {number} width - Width of the mask
 * @param {number} height - Height of the mask
 * @param {string} dtype - Data type of the array
 * @returns {Uint8Array} NPY formatted data
 */
function maskToNpy(maskArray, width, height, dtype = '<b1') {
    const header = createNpyHeader(height, width, dtype);
    const npyData = new Uint8Array(header.length + maskArray.length);
    npyData.set(header, 0);
    npyData.set(maskArray, header.length);
    return npyData;
}

function saveMaskAsCsv(maskArray, width, height, fileName = "mask.csv") {
    // Step 1: Create metadata (e.g., width and height)
    const metadata = `width,height\n${width},${height}`;

    // Step 2: Create mask rows
    const rows = [];
    for (let i = 0; i < height; i++) {
        const start = i * width;
        const end = start + width;
        rows.push(maskArray.slice(start, end).join(","));
    }

    // Combine metadata and mask data
    const csvContent = [metadata, ...rows].join("\n");

    // Step 3: Save the CSV file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generate the final mask where all true mask regions are set to True
 * @param {HTMLImageElement} image - Input image element
 * @param {Array} points - User interaction points
 * @returns {Uint8Array} Mask in NPY format
 */
export async function generateMaskWithRegion(image, currentMask) {
    // const encoder = new SAM2Encoder();
    // await encoder.initialize();

    // const predictor = new SAM2Predictor();
    // await predictor.initialize();

    // // Step 1: Generate the full-resolution mask
    // const embedding = await encoder.encode(image);
    // const results = await predictor.predict(embedding, points, image.height, image.width);
    // const maskTensor = results['masks'];
    console.log(currentMask)
    // Resize the mask to match the original image size
    const highResMask = resizeMaskToOriginal(currentMask, image.width, image.height);
    console.log(highResMask)

    // Step 2: Convert the mask to a boolean array
    const boolMask = new Uint8Array(highResMask.length);
    for (let i = 0; i < highResMask.length; i++) {
        boolMask[i] = highResMask[i] > 0 ? 1 : 0; // Convert to boolean True/False
    }
    console.log(boolMask)

    // Step 3: Convert the boolean mask to NPY format
    //return maskToNpy(boolMask, image.width, image.height, '<b1'); // '<b1' for boolean
    return saveMaskAsCsv(boolMask, image.width, image.height, "mask.csv");
}



