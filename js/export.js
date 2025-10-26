// Export Module - Handles JSON export/import and Discord table generation

/**
 * Export data to JSON file
 */
function exportToJSON() {
    try {
        const jsonData = exportData();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `uma-team-races-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting data: ' + error.message, 'error');
    }
}

/**
 * Import data from JSON file
 */
function importFromJSON(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = e.target.result;
            importData(jsonData);
            showToast('Data imported successfully!', 'success');
            updateSummaryTable();
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing data: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * Generate Discord-formatted table
 */
function generateDiscordTable() {
    const stats = calculateStats();
    
    if (stats.length === 0) {
        return 'No race data available.';
    }

    // Build Discord markdown table
    let table = '```\n';
    table += 'Uma Team Trials Summary\n';
    table += '═══════════════════════════════════════════\n';
    table += 'Girl | Races | Avg   | Podiums | Fails\n';
    table += '─────┼───────┼───────┼─────────┼──────\n';
    
    for (const stat of stats) {
        const avgStr = stat.average.toFixed(2).padStart(5);
        const girl = `${stat.girl}`.padStart(4);
        const races = `${stat.races}`.padStart(5);
        const podiums = `${stat.podiums}`.padStart(7);
        const fails = `${stat.fails}`.padStart(5);
        
        // Add badge emoji based on average
        const badge = stat.average <= 1.5 ? '🟩' : stat.average <= 2.5 ? '🟨' : '🟥';
        
        // Add podium emojis
        let podiumStr = '';
        if (stat.first > 0) podiumStr += `🥇${stat.first} `;
        if (stat.second > 0) podiumStr += `🥈${stat.second} `;
        if (stat.third > 0) podiumStr += `🥉${stat.third}`;
        
        table += `${girl} │${races} │${avgStr} ${badge} │${podiums} │${fails}\n`;
        if (podiumStr) {
            table += `     │       │       │ ${podiumStr}\n`;
        }
    }
    
    table += '```';
    
    return table;
}

/**
 * Copy Discord table to clipboard
 */
async function copyDiscordTable() {
    try {
        const table = generateDiscordTable();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(table);
            showToast('Discord table copied to clipboard!', 'success');
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = table;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('Discord table copied to clipboard!', 'success');
            } catch (err) {
                showToast('Failed to copy to clipboard', 'error');
            }
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('Copy error:', error);
        showToast('Error copying to clipboard: ' + error.message, 'error');
    }
}