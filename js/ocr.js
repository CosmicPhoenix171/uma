// OCR Module - Handles image processing with Tesseract.js

/**
 * Process image with OCR - Simplified full-image approach with smart parsing
 */
async function processImageWithOCR(file) {
    try {
        // Show loading indicator
        showLoading();

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js library not loaded');
        }

        console.log('Processing image with OCR...');
        
        // Preprocess the image for better OCR accuracy
        const preprocessedImage = await preprocessImageForOCR(file);
        
        // Process the preprocessed image
        const result = await Tesseract.recognize(
            preprocessedImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                    }
                }
            }
        );
        
        const text = result.data.text;
        console.log('OCR text extracted:', text);
        console.log('OCR data:', result.data);
        
        // Parse the OCR text to extract placements using word positions
        const placements = parseOCRWithPositions(result.data);
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
 * Preprocess image for better OCR accuracy
 * Applies filters to enhance yellow/gold ranking text visibility
 */
async function preprocessImageForOCR(file) {
    console.log('Preprocessing image for OCR...');
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw original image
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Define the ranking area (45-75% of height where rankings appear)
                const rankingAreaTop = Math.floor(canvas.height * 0.45);
                const rankingAreaBottom = Math.floor(canvas.height * 0.75);
                
                console.log(`Preprocessing ranking area: y ${rankingAreaTop} to ${rankingAreaBottom}`);
                
                // Process each pixel
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const index = (y * canvas.width + x) * 4;
                        
                        // Only process pixels in the ranking area
                        if (y >= rankingAreaTop && y <= rankingAreaBottom) {
                            const r = data[index];
                            const g = data[index + 1];
                            const b = data[index + 2];
                            
                            // Detect yellow/gold text with more permissive thresholds
                            // Yellow rankings: high R and G, lower B
                            const isYellowText = (
                                // Bright yellow: R>180, G>150, B<120
                                (r > 180 && g > 150 && b < 120) ||
                                // Gold/darker yellow: R>150, G>120, B<80
                                (r > 150 && g > 120 && b < 80 && r > g * 0.9) ||
                                // Light yellow: all channels high but R,G > B
                                (r > 200 && g > 200 && b < 180 && r > b + 40)
                            ) && r > b + 50 && g > b + 30; // Ensure yellow dominance
                            
                            if (isYellowText) {
                                // Convert yellow text to black for better OCR
                                data[index] = 0;       // R
                                data[index + 1] = 0;   // G
                                data[index + 2] = 0;   // B
                            } else {
                                // Convert everything else to white (background)
                                data[index] = 255;     // R
                                data[index + 1] = 255; // G
                                data[index + 2] = 255; // B
                            }
                        }
                    }
                }
                
                // Put processed image data back
                ctx.putImageData(imageData, 0, 0);
                
                // Apply sharpening to enhance text edges
                ctx.filter = 'contrast(150%) brightness(110%)';
                ctx.drawImage(canvas, 0, 0);
                
                console.log('Image preprocessing complete');
                
                // Convert canvas to blob
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from preprocessed image'));
                    }
                }, 'image/png');
                
            } catch (err) {
                reject(err);
            }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
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
 * Parse OCR results using word positions to extract placements
 * Uses spatial positioning to map rankings to the 5x3 character grid
 */
function parseOCRWithPositions(ocrData) {
    console.log('Parsing OCR with position data...');
    console.log('Available OCR data properties:', Object.keys(ocrData));
    
    const imageHeight = ocrData.height || 2412;
    const imageWidth = ocrData.width || 1080;
    
    // Define the grid layout (5 columns x 3 rows)
    const cols = 5;
    const rows = 3;
    const placements = new Array(15).fill(10);  // Default to mid-pack
    
    // Define the area where rankings appear (middle section of image)
    const rankingAreaTop = imageHeight * 0.45;
    const rankingAreaBottom = imageHeight * 0.75;
    
    // Collect all ordinal numbers with their positions
    const rankings = [];
    
    // Try to get word-level data from different possible locations
    let words = null;
    
    if (ocrData.words && ocrData.words.length > 0) {
        words = ocrData.words;
        console.log('Using ocrData.words:', words.length, 'words found');
    } else if (ocrData.lines) {
        // Try extracting words from lines
        console.log('Using ocrData.lines');
        for (const line of ocrData.lines) {
            if (line.words) {
                if (!words) words = [];
                words.push(...line.words);
            }
        }
    } else if (ocrData.paragraphs) {
        // Try extracting from paragraphs
        console.log('Using ocrData.paragraphs');
        for (const para of ocrData.paragraphs) {
            if (para.lines) {
                for (const line of para.lines) {
                    if (line.words) {
                        if (!words) words = [];
                        words.push(...line.words);
                    }
                }
            }
        }
    }
    
    if (!words || words.length === 0) {
        console.warn('No word-level data found in OCR results');
        console.log('OCR data structure:', ocrData);
        // Fallback to basic text parsing
        return parseOCRTextFallback(ocrData.text, imageWidth, imageHeight);
    }
    
    console.log('Total words to process:', words.length);
    
    // Log first few words to understand the structure
    if (words.length > 0) {
        console.log('Sample word structure:', words[0]);
        console.log('First 10 words:', words.slice(0, 10).map(w => ({ 
            text: w.text, 
            bbox: w.bbox,
            hasOrdinal: /\d+\s*(?:st|nd|rd|th)/i.test(w.text)
        })));
        
        // Log words with ANY digits in the target area
        console.log(`Words with digits in target area (${rankingAreaTop}-${rankingAreaBottom}):`);
        words.forEach((w, i) => {
            if (w.text && /\d/.test(w.text) && w.bbox) {
                const centerY = (w.bbox.y0 + w.bbox.y1) / 2;
                if (centerY >= rankingAreaTop && centerY <= rankingAreaBottom) {
                    console.log(`  [${i}] "${w.text}" at (${w.bbox.x0},${w.bbox.y0})`);
                }
            }
        });
    }
    
    // Search through all words for ordinal rankings
    for (const word of words) {
        const text = word.text.trim();
        const bbox = word.bbox;
        
        if (!bbox) continue; // Skip words without position data
        
        const centerX = (bbox.x0 + bbox.x1) / 2;
        const centerY = (bbox.y0 + bbox.y1) / 2;
        
        // Only process words in the target ranking area
        if (centerY < rankingAreaTop || centerY > rankingAreaBottom) {
            continue;
        }
        
        let rankNum = null;
        let matchType = null;
        
        // Try standard ordinal pattern (1st, 2nd, 3rd, 4th)
        let ordinalMatch = text.match(/(\d+)\s*(?:st|nd|rd|th)/i);
        if (ordinalMatch) {
            rankNum = parseInt(ordinalMatch[1]);
            matchType = 'ordinal';
        }
        
        // Try alternative patterns for misread text (3], 2], 1|, etc.)
        if (!rankNum) {
            ordinalMatch = text.match(/(\d+)[\]\[|)(!]/);
            if (ordinalMatch) {
                rankNum = parseInt(ordinalMatch[1]);
                matchType = 'alternative';
                console.log('Found alternative pattern:', text, '-> treating as', rankNum);
            }
        }
        
        // Try standalone numbers 1-18
        if (!rankNum && /^\d{1,2}$/.test(text)) {
            const num = parseInt(text);
            if (num >= 1 && num <= 18) {
                rankNum = num;
                matchType = 'standalone';
                console.log('Found standalone number in target area:', text);
            }
        }
        
        // If we found a valid ranking, add it
        if (rankNum && rankNum >= 1 && rankNum <= 18) {
            rankings.push({
                rank: rankNum,
                x: centerX,
                y: centerY,
                text: text
            });
            console.log(`  -> ACCEPTED (${matchType}): Rank ${rankNum} "${text}" at (${Math.round(centerX)}, ${Math.round(centerY)})`);
        }
    }
    
    console.log('Total rankings found:', rankings.length);
    
    // Map rankings to grid positions based on spatial location
    if (rankings.length > 0) {
        for (const ranking of rankings) {
            // Determine which column (0-4) and row (0-2) this ranking belongs to
            const col = Math.floor((ranking.x / imageWidth) * cols);
            const normalizedY = (ranking.y - rankingAreaTop) / (rankingAreaBottom - rankingAreaTop);
            const row = Math.floor(normalizedY * rows);
            
            // Calculate grid index (0-14)
            const gridIndex = Math.max(0, Math.min(14, row * cols + col));
            
            placements[gridIndex] = ranking.rank;
            console.log(`Mapped ${ranking.text} to grid position ${gridIndex} (row ${row}, col ${col})`);
        }
    }
    
    console.log('Final placements:', placements);
    return placements;
}

/**
 * Fallback text parsing when word-level position data is not available
 */
function parseOCRTextFallback(text, imageWidth, imageHeight) {
    console.log('Using fallback text parsing...');
    
    const placements = [];
    const lines = text.split('\n');
    
    // Store positions with their line numbers for sorting
    const positionsWithLines = [];
    
    // Enhanced pattern matching for rankings
    const ordinalPattern = /(\d+)\s*(?:st|nd|rd|th)/gi;
    
    let lineNumber = 0;
    for (const line of lines) {
        lineNumber++;
        const matches = [...line.matchAll(ordinalPattern)];
        
        for (const match of matches) {
            const num = parseInt(match[1]);
            if (num >= 1 && num <= 18) {
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
    console.log('Ordered placements found (fallback):', orderedPlacements);
    
    // Take first 15 placements
    const finalPlacements = orderedPlacements.slice(0, 15);
    
    // Fill remaining with defaults
    while (finalPlacements.length < 15) {
        finalPlacements.push(10);
    }
    
    console.log('Final placements (fallback):', finalPlacements);
    return finalPlacements;
}

/**
 * Process specific regions of the image for better OCR accuracy
 * Focuses on placement rankings (1st, 2nd, 3rd, etc.) which appear below each character
 */
async function processImageRegions(img) {
    const width = img.width;
    const height = img.height;
    
    console.log('Processing image regions for placement rankings...');
    console.log('Image size:', width, 'x', height);
    
    // Create canvas for cropping
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
                // Set canvas to the crop size
                canvas.width = regionWidth;
                canvas.height = regionH;
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw only the specific region of the source image
                // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
                ctx.drawImage(
                    img,                    // source image
                    regionLeft, regionY,    // source x, y (where to start cropping)
                    regionWidth, regionH,   // source width, height (size of crop)
                    0, 0,                   // destination x, y (where to place on canvas)
                    regionWidth, regionH    // destination width, height (size on canvas)
                );
                
                // Convert canvas to blob
                const croppedBlob = await new Promise((resolve, reject) => {
                    canvas.toBlob(blob => {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to create blob from canvas'));
                    });
                });
                
                console.log(`Region ${index + 1} blob size:`, croppedBlob.size, 'bytes');
                
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