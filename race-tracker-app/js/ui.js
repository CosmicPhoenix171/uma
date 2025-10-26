// ui.js
document.addEventListener('DOMContentLoaded', () => {
    const entryPanel = document.getElementById('entry-panel');
    const resultsPanel = document.getElementById('results-panel');
    const toggleButton = document.getElementById('toggle-entry-panel');
    const saveButton = document.getElementById('save-results');
    const exportButton = document.getElementById('export-results');

    toggleButton.addEventListener('click', () => {
        if (entryPanel.style.display === 'none' || entryPanel.style.display === '') {
            entryPanel.style.display = 'block';
            resultsPanel.style.display = 'none';
        } else {
            entryPanel.style.display = 'none';
            resultsPanel.style.display = 'block';
        }
    });

    saveButton.addEventListener('click', () => {
        const results = getRaceResultsFromInputs();
        if (validateResults(results)) {
            saveResultsToLocalStorage(results);
            updateResultsUI(results);
        } else {
            alert('Please enter valid results for all participants.');
        }
    });

    exportButton.addEventListener('click', () => {
        const results = getRaceResultsFromLocalStorage();
        exportResultsAsJSON(results);
    });

    function getRaceResultsFromInputs() {
        const results = [];
        for (let i = 1; i <= 15; i++) {
            const input = document.getElementById(`participant-${i}`);
            if (input) {
                results.push({ participant: `Girl ${i}`, time: input.value });
            }
        }
        return results;
    }

    function validateResults(results) {
        return results.every(result => result.time.trim() !== '');
    }

    function updateResultsUI(results) {
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = '';
        results.forEach(result => {
            const li = document.createElement('li');
            li.textContent = `${result.participant}: ${result.time}`;
            resultsList.appendChild(li);
        });
    }

    function getRaceResultsFromLocalStorage() {
        return JSON.parse(localStorage.getItem('raceResults')) || [];
    }

    function saveResultsToLocalStorage(results) {
        localStorage.setItem('raceResults', JSON.stringify(results));
    }

    function exportResultsAsJSON(results) {
        const dataStr = JSON.stringify(results, null, 2);
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
});