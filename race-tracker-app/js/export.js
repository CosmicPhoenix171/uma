function exportRaceResults() {
    const raceResults = JSON.parse(localStorage.getItem('raceResults')) || [];
    const dataStr = JSON.stringify(raceResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'race_results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importRaceResults(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const raceResults = JSON.parse(e.target.result);
            localStorage.setItem('raceResults', JSON.stringify(raceResults));
            alert('Race results imported successfully!');
        } catch (error) {
            alert('Error importing race results: ' + error.message);
        }
    };
    reader.readAsText(file);
}

document.getElementById('exportButton').addEventListener('click', exportRaceResults);
document.getElementById('importInput').addEventListener('change', importRaceResults);