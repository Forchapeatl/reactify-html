const fs = require('fs');
const cheerio = require('cheerio');

// Function to read HTML file and extract sections
function extractSectionsFromHTML(filePath) {
  // Read the HTML file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err}`);
      return;
    }

    // Load the HTML into cheerio
    const $ = cheerio.load(data);

    // Array to store sections and their child components
    const sections = [];

    // Iterate over each section tag
    $('section').each((index, element) => {
      const section = $(element);
      const sectionData = {
        html: $.html(section), // Get the full HTML of the section including the outermost tag
        children: []
      };

      // Get child components of the section
      section.children().each((i, child) => {
        sectionData.children.push({
          tagName: $(child).prop('tagName'),
          html: $(child).html(),
          text: $(child).text()
        });
      });

      // Add section data to the array
      sections.push(sectionData);
    });

    // Log the sections array or save it to a file
    console.log(sections);

    // Optionally, save the sections to a JSON file
    fs.writeFile('sections.json', JSON.stringify(sections, null, 2), (err) => {
      if (err) {
        console.error(`Error writing JSON file: ${err}`);
      } else {
        console.log('Sections data has been saved to sections.json');
      }
    });
  });
}

// Specify the path to the HTML file
const htmlFilePath = 'test.html';

// Extract sections from the specified HTML file
extractSectionsFromHTML(htmlFilePath);
