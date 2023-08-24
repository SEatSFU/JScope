// Run this file after adding a new svg image, to generate it in the webfont.

const webfont = require('webfont');
const fs = require('fs');
const path = require('path');

async function generateFont() {

  const svgs = fs.readdirSync(path.join(__dirname))
                .filter((file) => file.endsWith('.svg'))
                .map((file) => file.split('/').pop())
                .map(file => path.join(__dirname, file))

  console.log(svgs)

  try {
    const result = await webfont.webfont({
      files: svgs,
      formats: ['woff'],
      startUnicode: 0xE000,
      verbose: true,
      fontHeight: 1000,
      normalize: true,
      sort: false
    });
    const dest = path.join(__dirname, 'async-coverage.woff')
    fs.writeFileSync(dest, result.woff, 'binary');
    console.log(`Font created at ${dest}`);
  } catch (e) {
    console.error('Font creation failed.', e);
  }
}

generateFont();

