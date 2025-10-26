// Main JavaScript file for the Race Tracker Application

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadRaceResults();
});

// Set up event listeners for buttons and other UI elements
function setupEventListeners() {
    document.getElementById('uploadButton').addEventListener('change', handleFileUpload);
    document.getElementById('exportButton').addEventListener('click', exportRaceResults);
    document.getElementById('clearButton').addEventListener('click', clearRaceResults);
}

// Handle file upload for OCR processing
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processImage(file);
    }
}

// Load race results from localStorage
function loadRaceResults() {
    const results = getRaceResultsFromStorage();
    if (results) {
        displayRaceResults(results);
    }
}

// Export race results to JSON
function exportRaceResults() {
    const results = getRaceResultsFromStorage();
    if (results) {
        const json = JSON.stringify(results);
        downloadJSON(json, 'race_results.json');
    }
}

// Clear race results from localStorage
function clearRaceResults() {
    clearRaceResultsInStorage();
    displayRaceResults([]);
}

// Function to download JSON file
function downloadJSON(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to display race results in the UI
function displayRaceResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = ''; // Clear previous results
    results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.textContent = `Name: ${result.name}, Time: ${result.time}`;
        resultsContainer.appendChild(resultElement);
    });
}