// OCR Module - Handles image processing with Tesseract.js

/**
 * Process image with OCR - Enhanced approach with region focusing
 */
async function processImageWithOCR(file) {
    try {
        // Show loading indicator
        showLoading();

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js library not loaded');
        }

        console.log('Processing image with OCR...');
        
        // First, create an image element to get dimensions
        const img = await createImageFromFile(file);
        console.log('Image dimensions:', img.width, 'x', img.height);
        
        // Try region-based OCR for better accuracy
        const placements = await processImageRegions(file, img.width, img.height);
        
        hideLoading();
        return placements;
    } catch (error) {
        hideLoading();
        console.error('OCR processing error:', error);
        throw new Error(error.message || 'Failed to process image');
    }
}

/**
 * Create image element from file
 */
function createImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Process specific regions of the image for better OCR accuracy
 * Focuses on placement rankings (1st, 2nd, 3rd, etc.) which appear below each character
 */
async function processImageRegions(file, width, height) {
    console.log('Processing image regions for placement rankings...');
    console.log('Image size:', width, 'x', height);
    
    // Create image element and canvas for cropping
    const img = await createImageFromFile(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Define regions based on the typical Uma Musume result screen layout
    // The placement rankings (1st, 2nd, 3rd) appear below each character portrait
    // Grid is 5 columns × 3 rows
    // Focus on the area where "1st", "2nd", etc. text appears
    const resultsAreaTop = Math.floor(height * 0.50); // Middle section where rankings appear
    const resultsAreaHeight = Math.floor(height * 0.25); // Height of rankings area
    
    const cols = 5;
    const rows = 3;
    const allResults = [];
    
    // Process each character position
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const index = row * cols + col;
            const regionWidth = Math.floor(width / cols);
            const regionLeft = col * regionWidth;
            const regionY = resultsAreaTop + (row * Math.floor(resultsAreaHeight / rows));
            const regionH = Math.floor(resultsAreaHeight / rows);
            
            console.log(`Processing region ${index + 1}/${cols * rows}:`, {
                left: regionLeft, top: regionY, width: regionWidth, height: regionH
            });
            
            try {
                // Crop the image to this region
                canvas.width = regionWidth;
                canvas.height = regionH;
                ctx.drawImage(img, regionLeft, regionY, regionWidth, regionH, 0, 0, regionWidth, regionH);
                
                // Convert canvas to blob
                const croppedBlob = await new Promise(resolve => canvas.toBlob(resolve));
                
                // Run OCR on the cropped image
                const result = await Tesseract.recognize(
                    croppedBlob,
                    'eng',
                    {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                console.log(`Region ${index + 1} OCR Progress:`, Math.round(m.progress * 100) + '%');
                            }
                        }
                    }
                );
                
                const text = result.data.text.trim();
                console.log(`Region ${index + 1} text:`, text);
                
                // Extract numbers from this region
                const numbers = extractNumbersFromRegionText(text);
                console.log(`Region ${index + 1} numbers found:`, numbers);
                
                allResults.push({
                    region: index,
                    text: text,
                    numbers: numbers
                });
                
            } catch (error) {
                console.error(`Error processing region ${index + 1}:`, error);
                allResults.push({
                    region: index,
                    text: '',
                    numbers: []
                });
            }
        }
    }
    
    // Parse all results to get placements
    const placements = parseRegionResults(allResults);
    console.log('Final parsed placements:', placements);
    
    return placements;
}

/**
 * Extract placement numbers from region text
 * Focuses ONLY on ordinal placements (1st, 2nd, 3rd, etc.)
 */
function extractNumbersFromRegionText(text) {
    // Look only for placement rankings
    const numbers = [];
    
    // Pattern 1: Ordinal numbers (1st, 2nd, 3rd, 4th, etc.) - PRIMARY FOCUS
    const ordinalPattern = /(\d+)\s*(?:st|nd|rd|th)/gi;
    const ordinalMatches = [...text.matchAll(ordinalPattern)];
    for (const match of ordinalMatches) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 18) {
            numbers.push({ value: num, type: 'ordinal', confidence: 1.0 });
        }
    }
    
    // If no ordinal found, try plain numbers that could be placements
    // but EXCLUDE numbers that look like fan counts (> 18 or with + sign)
    if (numbers.length === 0) {
        const plainNumberPattern = /\b(\d{1,2})\b/g;
        const plainMatches = [...text.matchAll(plainNumberPattern)];
        for (const match of plainMatches) {
            const num = parseInt(match[1]);
            // Only accept numbers 1-18 as potential placements
            if (num >= 1 && num <= 18) {
                // Skip if this looks like it's part of a fan count (e.g., near a + sign)
                const context = text.substring(Math.max(0, match.index - 2), match.index + match[0].length + 2);
                if (!context.includes('+')) {
                    numbers.push({ value: num, type: 'plain', confidence: 0.6 });
                }
            }
        }
    }
    
    return numbers;
}

/**
 * Parse results from all regions to determine placements
 */
function parseRegionResults(regionResults) {
    console.log('Parsing region results:', regionResults);
    
    const placements = new Array(15).fill(10); // Default to mid-pack
    
    // Process each region result
    for (const result of regionResults) {
        if (result.region < 15 && result.numbers.length > 0) {
            // Sort numbers by confidence and type priority
            const sortedNumbers = result.numbers.sort((a, b) => {
                // Prioritize ordinals over other types
                if (a.type === 'ordinal' && b.type !== 'ordinal') return -1;
                if (b.type === 'ordinal' && a.type !== 'ordinal') return 1;
                // Then by confidence
                return b.confidence - a.confidence;
            });
            
            // Use the best number found
            const bestNumber = sortedNumbers[0];
            placements[result.region] = bestNumber.value;
            
            console.log(`Region ${result.region}: Using ${bestNumber.value} (${bestNumber.type}, confidence: ${bestNumber.confidence})`);
        }
    }
    
    console.log('Final placements from regions:', placements);
    return placements;
}

/**
 * Fallback: Parse OCR text to extract placement numbers (original method)
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
    
    console.log('Positions with lines:', positionsWithLines);
    console.log('Ordered placements found:', orderedPlacements);
    
    // Use the ordered placements directly - these ARE the race results!
    // Girl 1 finished in orderedPlacements[0] place
    // Girl 2 finished in orderedPlacements[1] place, etc.
    const finalPlacements = orderedPlacements.slice(0, 15);
    
    // If we didn't find enough placements, fill with reasonable middle values
    while (finalPlacements.length < 15) {
        finalPlacements.push(10); // Default to mid-pack placement
    }
    
    console.log('Final placements array (15 girls):', finalPlacements);
    return finalPlacements;
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