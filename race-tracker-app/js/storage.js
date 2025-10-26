// Storage Module - Manages localStorage for race data

const STORAGE_KEY = 'umaTeamRaces';

// Data structure: { races: [{ date: 'YYYY-MM-DD', placements: [1-18, ...] }] }

/**
 * Get all races from localStorage
 */
function getAllRaces() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return { races: [] };
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading races from storage:', error);
        return { races: [] };
    }
}

/**
 * Save all races to localStorage
 */
function saveAllRaces(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving races to storage:', error);
        return false;
    }
}

/**
 * Add a new race
 */
function addRace(date, placements) {
    // Validate placements
    if (!Array.isArray(placements) || placements.length !== 15) {
        throw new Error('Placements must be an array of 15 numbers');
    }

    for (const placement of placements) {
        const num = parseInt(placement);
        if (isNaN(num) || num < 1 || num > 18) {
            throw new Error('All placements must be numbers between 1 and 18');
        }
    }

    const data = getAllRaces();
    data.races.push({
        date,
        placements: placements.map(p => parseInt(p)),
        timestamp: Date.now()
    });

    return saveAllRaces(data);
}

/**
 * Calculate statistics for all girls
 */
function calculateStats() {
    const data = getAllRaces();
    const races = data.races;

    if (races.length === 0) {
        return [];
    }

    const stats = [];

    for (let girlNum = 1; girlNum <= 15; girlNum++) {
        const placements = races.map(race => race.placements[girlNum - 1]);
        
        const total = placements.reduce((sum, p) => sum + p, 0);
        const average = total / placements.length;
        
        const podiums = placements.filter(p => p <= 3).length;
        const fails = placements.filter(p => p >= 4).length;
        
        // Count individual podium positions
        const first = placements.filter(p => p === 1).length;
        const second = placements.filter(p => p === 2).length;
        const third = placements.filter(p => p === 3).length;

        stats.push({
            girl: girlNum,
            races: placements.length,
            average: average,
            podiums: podiums,
            fails: fails,
            first: first,
            second: second,
            third: third,
            placements: placements
        });
    }

    return stats;
}

/**
 * Get badge color based on average
 */
function getBadgeColor(average) {
    if (average <= 1.5) return 'green';
    if (average <= 2.5) return 'yellow';
    return 'red';
}

/**
 * Reset all data
 */
function resetAllData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error resetting data:', error);
        return false;
    }
}

/**
 * Import data from JSON
 */
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // Validate data structure
        if (!data.races || !Array.isArray(data.races)) {
            throw new Error('Invalid data format');
        }

        // Validate each race
        for (const race of data.races) {
            if (!race.date || !Array.isArray(race.placements) || race.placements.length !== 15) {
                throw new Error('Invalid race data');
            }
        }

        return saveAllRaces(data);
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
}

/**
 * Export data to JSON string
 */
function exportData() {
    const data = getAllRaces();
    return JSON.stringify(data, null, 2);
}