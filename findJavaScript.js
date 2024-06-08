const puppeteer = require('puppeteer');
const fs = require('fs');

async function describe(session, selector = '*') {
  const objectGroup = 'dc24d2b3-f5ec-4273-a5c8-1459b5c78ca0';

  const { result: { objectId } } = await session.send('Runtime.evaluate', {
    expression: `document.querySelectorAll("${selector}")`,
    objectGroup
  });

  const { result } = await session.send('Runtime.getProperties', { objectId });

  const descriptors = result
    .filter(x => x.value !== undefined)
    .filter(x => x.value.objectId !== undefined)
    .filter(x => x.value.className !== 'Function');

  const elements = [];

  for (const descriptor of descriptors) {
    const objectId = descriptor.value.objectId;

    Object.assign(descriptor, await session.send('DOMDebugger.getEventListeners', { objectId }));
    Object.assign(descriptor, await session.send('DOM.describeNode', { objectId }));

    elements.push(descriptor);
  }

  await session.send('Runtime.releaseObjectGroup', { objectGroup });

  return elements;
}

function parseAttributes(array) {
  const result = [];
  for (let i = 0; i < array.length; i += 2) {
    result.push(array.slice(i, i + 2));
  }
  return Object.fromEntries(result);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://forchapeatl.github.io/test-websites/javascript-only.html', { waitUntil: 'networkidle0', timeout: 10000000 });
  const session = await page.target().createCDPSession();

  const result = await describe(session);

  const output = {};

  for (const { node: { localName, attributes }, listeners } of result) {
    if (listeners.length === 0) { continue; }

    const { id, class: _class } = parseAttributes(attributes);
    let descriptor = localName;
    if (id !== undefined) { descriptor += `#${id}`; }
    if (_class !== undefined) { descriptor += `.${_class}`; }

    output[descriptor] = listeners.map(({ type, handler: { description } }) => ({
      type,
      description
    }));
  }

  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));

  await browser.close();
})();
