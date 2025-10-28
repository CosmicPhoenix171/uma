// Main App Module - Coordinates all modules and handles event listeners

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load and display existing data
    updateSummaryTable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize theme
    initTheme();
});

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Update theme icon
 */
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            console.log('Theme toggle clicked');
            toggleTheme();
        });
    }
    
    // Manual entry button
    document.getElementById('btn-manual').addEventListener('click', () => {
        showManualEntry();
    });
    
    // Upload screenshot button
    document.getElementById('btn-upload').addEventListener('click', () => {
        document.getElementById('screenshot-upload').click();
    });
    
    // Screenshot upload handler
    document.getElementById('screenshot-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const placements = await handleImageUpload(file);
            if (placements) {
                showOCRReview(placements);
            }
        }
        // Reset file input
        e.target.value = '';
    });
    
    // Export button
    document.getElementById('btn-export').addEventListener('click', () => {
        exportToJSON();
    });
    
    // Import button
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('json-import').click();
    });
    
    // Import file handler
    document.getElementById('json-import').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFromJSON(file);
        }
        // Reset file input
        e.target.value = '';
    });
    
    // Copy Discord table button
    document.getElementById('btn-copy-discord').addEventListener('click', () => {
        copyDiscordTable();
    });
    
    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        if (showConfirmation('Are you sure you want to reset all data? This cannot be undone.')) {
            if (resetAllData()) {
                showToast('All data has been reset', 'success');
                updateSummaryTable();
            } else {
                showToast('Error resetting data', 'error');
            }
        }
    });

    // Run test images (dev helper)
    const runTestsBtn = document.getElementById('btn-run-tests');
    if (runTestsBtn) {
        runTestsBtn.addEventListener('click', async () => {
            try {
                console.log('Running OCR on sample test images...');
                const testUrls = [
                    'assets/images/test1.jpg',
                    'assets/images/test2.jpg',
                    'assets/images/test3.jpg'
                ];
                const results = [];
                for (const url of testUrls) {
                    console.log('Processing', url);
                    const placements = await handleImageFromURL(url);
                    results.push({ url, placements });
                    console.log('Result for', url, placements);
                }
                // Show last test in the OCR review panel for quick adjustment
                if (results.length > 0 && results[results.length - 1].placements) {
                    showOCRReview(results[results.length - 1].placements);
                }
                showToast('Test images processed. Check console for details.', 'success');
            } catch (err) {
                console.error('Error running test images:', err);
                showToast('Error running test images: ' + (err.message || 'Unknown error'), 'error');
            }
        });
    }
    
    // Manual entry - Add Race button
    document.getElementById('btn-add-race').addEventListener('click', () => {
        handleManualRaceSubmit();
    });
    
    // Manual entry - Cancel button
    document.getElementById('btn-cancel-manual').addEventListener('click', () => {
        hideManualEntry();
    });
    
    // OCR review - Add Race button
    document.getElementById('btn-add-ocr-race').addEventListener('click', () => {
        handleOCRRaceSubmit();
    });
    
    // OCR review - Cancel button
    document.getElementById('btn-cancel-ocr').addEventListener('click', () => {
        hideOCRReview();
    });
}

/**
 * Handle manual race submission
 */
function handleManualRaceSubmit() {
    try {
        const date = document.getElementById('race-date').value;
        
        if (!date) {
            showToast('Please select a race date', 'error');
            return;
        }
        
        const placements = getManualPlacements();
        
        if (!validatePlacements(placements)) {
            showToast('Please enter valid placements (1-18) for all girls', 'error');
            return;
        }
        
        if (addRace(date, placements)) {
            showToast('Race added successfully!', 'success');
            hideManualEntry();
            updateSummaryTable();
        } else {
            showToast('Error adding race', 'error');
        }
    } catch (error) {
        console.error('Error submitting race:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

/**
 * Handle OCR race submission
 */
function handleOCRRaceSubmit() {
    try {
        const date = document.getElementById('ocr-race-date').value;
        
        if (!date) {
            showToast('Please select a race date', 'error');
            return;
        }
        
        const placements = getOCRPlacements();
        
        if (!validatePlacements(placements)) {
            showToast('Please select valid placements (1-18) for all girls', 'error');
            return;
        }
        
        if (addRace(date, placements)) {
            showToast('Race added successfully!', 'success');
            hideOCRReview();
            updateSummaryTable();
        } else {
            showToast('Error adding race', 'error');
        }
    } catch (error) {
        console.error('Error submitting race:', error);
        showToast('Error: ' + error.message, 'error');
    }
}