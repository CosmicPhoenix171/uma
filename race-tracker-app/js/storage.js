// This file manages data persistence using localStorage. It includes functions for saving, retrieving, and clearing race results.

const storageKey = 'raceResults';

// Save race results to localStorage
function saveRaceResults(results) {
    localStorage.setItem(storageKey, JSON.stringify(results));
}

// Retrieve race results from localStorage
function getRaceResults() {
    const results = localStorage.getItem(storageKey);
    return results ? JSON.parse(results) : [];
}

// Clear race results from localStorage
function clearRaceResults() {
    localStorage.removeItem(storageKey);
}