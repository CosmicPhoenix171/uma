// OCR Module - Handles image processing with Tesseract.js

let ocrWorker = null;

/**
 * Initialize Tesseract worker
 */
async function initOCR() {
    if (!ocrWorker) {
        try {
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js library not loaded');
            }
            
            console.log('Initializing OCR worker...');
            ocrWorker = await Tesseract.createWorker({
                logger: m => console.log('OCR:', m)
            });
            await ocrWorker.loadLanguage('eng');
            await ocrWorker.initialize('eng');
            console.log('OCR worker initialized successfully');
        } catch (error) {
            console.error('Error initializing OCR worker:', error);
            throw new Error('Failed to initialize OCR: ' + error.message);
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
            throw new Error('OCR worker failed to initialize');
        }

        console.log('Processing image with OCR...');
        
        // Process the image
        const result = await ocrWorker.recognize(file);
        const text = result.data.text;
        
        console.log('OCR text extracted:', text);
        
        // Parse the OCR text to extract placements
        const placements = parseOCRText(text);
        
        console.log('Parsed placements:', placements);
        
        hideLoading();
        return placements;
    } catch (error) {
        hideLoading();
        console.error('OCR processing error:', error);
        throw new Error(error.message || 'Failed to process image');
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
        console.log('Starting image upload processing...');
        const placements = await processImageWithOCR(file);
        showToast('Image processed successfully! Review the results below.', 'success');
        return placements;
    } catch (error) {
        console.error('Image upload error:', error);
        showToast('Error processing image: ' + (error.message || 'Unknown error'), 'error');
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