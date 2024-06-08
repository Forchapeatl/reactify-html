const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://forchapeatl.github.io/test-websites/javascript-only.html'); // Replace with the URL of the website

  // Extract external CSS links
  const cssLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel="stylesheet"]'), (link) => link.href)
  );

  // Extract inline styles
  const inlineStyles = await page.evaluate(() =>
    Array.from(document.querySelectorAll('style'), (style) => style.innerHTML)
  );

  // Extract styles from inline style attributes
  const inlineStyleAttributes = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('[style]'));
    return elements.map((element) => element.getAttribute('style'));
  });

  let cssContent = '';

  // Fetch external CSS files and append content
  for (const link of cssLinks) {
    const response = await page.goto(link);
    const css = await response.text();
    cssContent += css + '\n';
  }

  // Append inline <style> tag content
  for (const style of inlineStyles) {
    cssContent += style + '\n';
  }

  // Append inline style attributes
  for (const style of inlineStyleAttributes) {
    cssContent += `/* Inline style: ${style} */\n`;
  }

  // Save to App.css
  fs.writeFileSync('App.css', cssContent);

  await browser.close();
})();
