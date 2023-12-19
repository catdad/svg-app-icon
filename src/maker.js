const path = require('path');
const fs = require('fs').promises;

const generateIcons = require('./generator.js');

const dest = (...parts) => path.resolve('.', ...parts);

const write = async (dest, content) => {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content);
};

const generateAndWriteToDisk = async (input, { destination = 'icons', ...options } = {}) => {
  for await (const icon of generateIcons(input, options)) {
    await write(dest(destination, icon.name), icon.buffer);
  }
};

module.exports = generateAndWriteToDisk;
