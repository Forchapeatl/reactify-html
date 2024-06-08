const fs = require('fs');
const path = require('path');

// Function to read the JSON file and parse it
function readSections() {
    fs.readFile('sections.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return;
        }

        // Parse JSON data
        const sections = JSON.parse(data);
        
        // Generate React component files
        generateComponentFiles(sections);
    });
}

function generateComponentFiles(sections) {
    sections.forEach((section, index) => {
        const componentName = `Section${index + 1}`;
        const componentContent = createComponentTemplate(componentName, section.html);
        
        // Define the file path
        const filePath = path.join(__dirname, 'components', `${componentName}.js`);
        
        // Write the component file
        fs.writeFileSync(filePath, componentContent);
        console.log(`Component file ${componentName}.js created.`);
    });
}

function createComponentTemplate(name, htmlContent) {
    return `
import React from 'react';

const ${name} = () => {
    return(
            ${htmlContent}
        );
};

export default ${name};
    `;
}


// Create the components directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'components'))) {
    fs.mkdirSync(path.join(__dirname, 'components'));
}

readSections();
