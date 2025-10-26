// OCR Module - Handles image processing with Tesseract.js

let ocrWorker = null;

/**
 * Initialize Tesseract worker
 */
async function initOCR() {
    if (!ocrWorker && typeof Tesseract !== 'undefined') {
        try {
            ocrWorker = await Tesseract.createWorker('eng');
        } catch (error) {
            console.error('Error initializing OCR worker:', error);
        }
    }
}

/**
 * Process image with OCR
 */
async function processImageWithOCR(file) {
    try {
        // Show loading indicator
        showLoading();

        // Initialize worker if not already done
        await initOCR();

        if (!ocrWorker) {
            throw new Error('OCR worker not initialized');
        }

        // Process the image
        const { data: { text } } = await ocrWorker.recognize(file);
        
        // Parse the OCR text to extract placements
        const placements = parseOCRText(text);
        
        hideLoading();
        return placements;
    } catch (error) {
        hideLoading();
        console.error('OCR processing error:', error);
        throw error;
    }
}

/**
 * Parse OCR text to extract placement numbers
 * Looks for patterns like "1st", "2nd", "3rd", "4th", etc.
 * or just numbers 1-18
 */
function parseOCRText(text) {
    const placements = [];
    
    // Clean up text
    const cleanText = text.replace(/[^\w\s]/g, ' ');
    
    // Look for placement patterns
    const patterns = [
        /(\d+)(?:st|nd|rd|th)/gi,  // Matches 1st, 2nd, 3rd, 4th, etc.
        /\b(\d+)\b/g                // Matches standalone numbers
    ];
    
    const foundNumbers = new Set();
    
    for (const pattern of patterns) {
        const matches = cleanText.matchAll(pattern);
        for (const match of matches) {
            const num = parseInt(match[1]);
            if (num >= 1 && num <= 18 && !foundNumbers.has(num)) {
                foundNumbers.add(num);
                placements.push(num);
            }
        }
    }
    
    // If we found exactly 15 numbers, return them
    if (placements.length >= 15) {
        return placements.slice(0, 15);
    }
    
    // Otherwise, return what we found and fill the rest with default values
    while (placements.length < 15) {
        // Find a number between 1-18 that hasn't been used
        for (let i = 1; i <= 18; i++) {
            if (!foundNumbers.has(i)) {
                placements.push(i);
                foundNumbers.add(i);
                break;
            }
        }
        // If all numbers 1-18 are used, just add a default
        if (placements.length < 15) {
            placements.push(1);
        }
    }
    
    return placements;
}

/**
 * Handle image file upload
 */
async function handleImageUpload(file) {
    if (!file) {
        showToast('Please select an image file', 'error');
        return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return null;
    }

    try {
        const placements = await processImageWithOCR(file);
        return placements;
    } catch (error) {
        showToast('Error processing image: ' + error.message, 'error');
        return null;
    }
}

/**
 * Cleanup OCR worker
 */
async function terminateOCR() {
    if (ocrWorker) {
        await ocrWorker.terminate();
        ocrWorker = null;
    }
}

document.getElementById('imageUpload').addEventListener('change', handleImageUpload);