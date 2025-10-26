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
 * Enhanced for Uma Musume Team Trials result screens
 * Looks for patterns like "1st", "2nd", "3rd", "4th", etc.
 */
function parseOCRText(text) {
    const placements = [];
    
    // Enhanced cleaning - preserve important characters
    const cleanText = text.replace(/[^\w\s]/g, ' ').toLowerCase();
    
    // Look for ordinal patterns (1st, 2nd, 3rd, etc.)
    const ordinalPattern = /(\d+)(?:st|nd|rd|th)/gi;
    const matches = [...text.matchAll(ordinalPattern)];
    
    // Extract numbers from ordinal matches
    const foundNumbers = new Set();
    for (const match of matches) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 18 && !foundNumbers.has(num)) {
            foundNumbers.add(num);
            placements.push(num);
        }
    }
    
    // If we didn't find enough, try standalone numbers
    if (placements.length < 15) {
        const numberPattern = /\b(\d{1,2})\b/g;
        const numberMatches = [...cleanText.matchAll(numberPattern)];
        
        for (const match of numberMatches) {
            const num = parseInt(match[1]);
            if (num >= 1 && num <= 18 && !foundNumbers.has(num) && placements.length < 15) {
                foundNumbers.add(num);
                placements.push(num);
            }
        }
    }
    
    // Fill remaining slots with sequential numbers that haven't been used
    while (placements.length < 15) {
        for (let i = 1; i <= 18; i++) {
            if (!foundNumbers.has(i)) {
                placements.push(i);
                foundNumbers.add(i);
                break;
            }
        }
        // Safety break if we run out of numbers
        if (placements.length < 15 && foundNumbers.size >= 18) {
            // Just fill with reasonable defaults
            const remaining = 15 - placements.length;
            for (let j = 0; j < remaining; j++) {
                placements.push(Math.min(18, j + 1));
            }
            break;
        }
    }
    
    return placements.slice(0, 15);
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