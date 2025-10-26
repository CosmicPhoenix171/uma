// This file handles the integration with Tesseract.js for OCR functionality.
// It includes functions to process uploaded images and extract race placements from them.

function processImage(file) {
    return new Promise((resolve, reject) => {
        Tesseract.recognize(
            file,
            'eng',
            {
                logger: info => console.log(info) // Optional: log progress
            }
        ).then(({ data: { text } }) => {
            resolve(text);
        }).catch(err => {
            reject(err);
        });
    });
}

function extractRaceResults(text) {
    const results = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
        const match = line.match(/(\d+)\s+(\w+)\s+(\w+)/); // Example regex for extracting results
        if (match) {
            results.push({
                position: match[1],
                firstName: match[2],
                lastName: match[3]
            });
        }
    });

    return results;
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        try {
            const text = await processImage(file);
            const results = extractRaceResults(text);
            console.log(results); // Handle results (e.g., save to localStorage)
        } catch (error) {
            console.error('Error processing image:', error);
        }
    }
}

document.getElementById('imageUpload').addEventListener('change', handleImageUpload);