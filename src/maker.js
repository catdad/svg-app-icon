const path = require('path');
const fs = require('fs').promises;

const renderSvg = require('svg-render');
const toIco = require('@catdad/to-ico');
const { Icns, IcnsImage } = require('@fiahfy/icns');

const dest = (...parts) => path.resolve('.', ...parts);

const write = async (dest, content) => {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content);
};

const createPng = async (buffer, width = 512) => await renderSvg({ buffer, width });

const createIco = async svg => await toIco(
  await Promise.all([16, 24, 32, 48, 64, 128, 256].map(size => createPng(svg, size)))
);

const createIcns = async svg => {
  const icns = new Icns();

  for (const { osType, size } of Icns.supportedIconTypes) {
    icns.append(IcnsImage.fromPNG(await createPng(svg, size), osType));
  }

  return icns.data;
};

module.exports = async (input, { destination = 'icons', icns = true, ico = true, png = true, svg = true, pngSizes = [32, 256, 512] } = {}) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  if (svg) {
    await write(dest(destination, 'icon.svg'), buffer);
  }

  if (ico) {
    await write(dest(destination, 'icon.ico'), await createIco(buffer));
  }

  if (icns) {
    await write(dest(destination, 'icon.icns'), await createIcns(buffer));
  }

  if (png) {
    for (let size of pngSizes) {
      await write(dest(destination, `${size}x${size}.png`), await createPng(buffer, size));
    }
  }
};
