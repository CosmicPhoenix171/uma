// UI Module - Manages user interface interactions

/**
 * Show manual entry panel
 */
function showManualEntry() {
    const panel = document.getElementById('manual-entry-panel');
    const ocrPanel = document.getElementById('ocr-review-panel');
    
    // Hide OCR panel if open
    ocrPanel.classList.add('hidden');
    
    // Show manual panel
    panel.classList.remove('hidden');
    
    // Set default date to today
    const dateInput = document.getElementById('race-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Clear all inputs
    for (let i = 1; i <= 15; i++) {
        document.getElementById(`girl-${i}`).value = '';
    }
    
    // Scroll to panel
    panel.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide manual entry panel
 */
function hideManualEntry() {
    document.getElementById('manual-entry-panel').classList.add('hidden');
}

/**
 * Show OCR review panel with prefilled values
 */
function showOCRReview(placements) {
    const panel = document.getElementById('ocr-review-panel');
    const manualPanel = document.getElementById('manual-entry-panel');
    const grid = document.getElementById('ocr-girls-grid');
    
    // Hide manual panel if open
    manualPanel.classList.add('hidden');
    
    // Clear grid
    grid.innerHTML = '';
    
    // Create dropdowns for each girl
    for (let i = 1; i <= 15; i++) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = `Girl ${i}:`;
        label.setAttribute('for', `ocr-girl-${i}`);
        
        const select = document.createElement('select');
        select.id = `ocr-girl-${i}`;
        select.className = 'form-control';
        
        // Add 'E' option for error/unknown first
        const optE = document.createElement('option');
        optE.value = 'E';
        optE.textContent = 'E (error)';
        if (placements[i - 1] === 'E') {
            optE.selected = true;
        }
        select.appendChild(optE);

        // Add options 1-18
        for (let j = 1; j <= 18; j++) {
            const option = document.createElement('option');
            option.value = j;
            option.textContent = j;
            if (placements[i - 1] === j) {
                option.selected = true;
            }
            select.appendChild(option);
        }
        
        formGroup.appendChild(label);
        formGroup.appendChild(select);
        grid.appendChild(formGroup);
    }
    
    // Set default date to today
    const dateInput = document.getElementById('ocr-race-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Show panel
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide OCR review panel
 */
function hideOCRReview() {
    document.getElementById('ocr-review-panel').classList.add('hidden');
}

/**
 * Get placements from manual entry form
 */
function getManualPlacements() {
    const placements = [];
    for (let i = 1; i <= 15; i++) {
        const value = document.getElementById(`girl-${i}`).value;
        placements.push(parseInt(value));
    }
    return placements;
}

/**
 * Get placements from OCR review form
 */
function getOCRPlacements() {
    const placements = [];
    for (let i = 1; i <= 15; i++) {
        const value = document.getElementById(`ocr-girl-${i}`).value;
        if (value === 'E') {
            placements.push('E');
        } else {
            placements.push(parseInt(value));
        }
    }
    return placements;
}

/**
 * Validate placements
 */
function validatePlacements(placements) {
    // Check if all are valid numbers between 1 and 18
    for (const placement of placements) {
        if (isNaN(placement) || placement < 1 || placement > 18) {
            return false;
        }
    }
    return true;
}

/**
 * Update summary table
 */
function updateSummaryTable() {
    const stats = calculateStats();
    const tbody = document.getElementById('summary-tbody');
    const noDataMessage = document.getElementById('no-data-message');
    
    if (stats.length === 0) {
        tbody.innerHTML = '';
        noDataMessage.classList.remove('hidden');
        return;
    }
    
    noDataMessage.classList.add('hidden');
    tbody.innerHTML = '';
    
    for (const stat of stats) {
        const row = document.createElement('tr');
        
        // Girl number
        const girlCell = document.createElement('td');
        girlCell.textContent = `Girl ${stat.girl}`;
        row.appendChild(girlCell);
        
        // Races count
        const racesCell = document.createElement('td');
        racesCell.textContent = stat.races;
        row.appendChild(racesCell);
        
        // Average with badge
        const avgCell = document.createElement('td');
        const avgBadge = document.createElement('span');
        avgBadge.className = `badge badge-${getBadgeColor(stat.average)}`;
        avgBadge.textContent = stat.average.toFixed(2);
        avgCell.appendChild(avgBadge);
        row.appendChild(avgCell);
        
        // Podiums with emojis
        const podiumsCell = document.createElement('td');
        let podiumText = `${stat.podiums}`;
        if (stat.first > 0 || stat.second > 0 || stat.third > 0) {
            podiumText += ' (';
            if (stat.first > 0) podiumText += `🥇${stat.first} `;
            if (stat.second > 0) podiumText += `🥈${stat.second} `;
            if (stat.third > 0) podiumText += `🥉${stat.third}`;
            podiumText += ')';
        }
        podiumsCell.textContent = podiumText;
        row.appendChild(podiumsCell);
        
        // Fails
        const failsCell = document.createElement('td');
        failsCell.textContent = stat.fails;
        row.appendChild(failsCell);
        
        tbody.appendChild(row);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * Show loading indicator
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    // Reset progress bar when showing
    updateOCRProgress(0, 'Starting OCR...');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Update OCR progress in the loading screen
 */
function updateOCRProgress(percentage, message) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const loadingText = document.getElementById('loading-text');
    
    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressText) progressText.textContent = percentage + '%';
    if (loadingText && message) loadingText.textContent = message;
}

/**
 * Show confirmation dialog
 */
function showConfirmation(message) {
    return confirm(message);
}