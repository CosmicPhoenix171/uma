// OCR Module - Handles image processing with Tesseract.js

/**
 * Process image with OCR - Simplified approach using Tesseract.recognize
 */
async function processImageWithOCR(file) {
    try {
        // Show loading indicator
        showLoading();

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js library not loaded');
        }

        console.log('Processing image with OCR...');
        
        // Use Tesseract.recognize directly (simpler API)
        const result = await Tesseract.recognize(
            file,
            'eng',
            {
                logger: m => console.log('OCR Progress:', m)
            }
        );
        
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
 * Handles grid layout: reads left-to-right, top-to-bottom
 * Grid is 5 columns × 3 rows = 15 characters
 */
function parseOCRText(text) {
    console.log('Raw OCR text:', text);
    
    const placements = [];
    const lines = text.split('\n');
    
    // Store positions with their line numbers for sorting
    const positionsWithLines = [];
    
    // Enhanced pattern matching for rankings
    // Matches patterns like: "1st", "2nd", "3rd", "4th", "1 st", "2 nd", etc.
    const ordinalPattern = /(\d+)\s*(?:st|nd|rd|th)/gi;
    
    let lineNumber = 0;
    for (const line of lines) {
        lineNumber++;
        const matches = [...line.matchAll(ordinalPattern)];
        
        for (const match of matches) {
            const num = parseInt(match[1]);
            if (num >= 1 && num <= 18) {
                // Store the position with its line number (for top-to-bottom ordering)
                // and match index (for left-to-right ordering within the line)
                positionsWithLines.push({
                    placement: num,
                    line: lineNumber,
                    index: match.index
                });
            }
        }
    }
    
    // Sort by line first (top to bottom), then by index (left to right)
    positionsWithLines.sort((a, b) => {
        if (a.line !== b.line) {
            return a.line - b.line;
        }
        return a.index - b.index;
    });
    
    // Extract just the placement numbers in order
    const orderedPlacements = positionsWithLines.map(p => p.placement);
    
    console.log('Ordered placements found:', orderedPlacements);
    
    // If we found at least some placements, use them
    if (orderedPlacements.length > 0) {
        // Take up to 15 placements
        for (let i = 0; i < Math.min(15, orderedPlacements.length); i++) {
            placements.push(orderedPlacements[i]);
        }
    }
    
    // Fill remaining slots with reasonable defaults
    const usedNumbers = new Set(placements);
    while (placements.length < 15) {
        // Find the next unused number between 1-18
        for (let i = 1; i <= 18; i++) {
            if (!usedNumbers.has(i)) {
                placements.push(i);
                usedNumbers.add(i);
                break;
            }
        }
        // Safety: if all 1-18 are used, just use sequential numbers
        if (usedNumbers.size >= 18 && placements.length < 15) {
            placements.push(placements.length + 1);
        }
    }
    
    console.log('Final placements array (15 girls):', placements);
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