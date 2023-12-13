const path = require('path');
const fs = require('fs').promises;

const renderSvg = require('svg-render');
const toIco = require('@catdad/to-ico');
const { Icns, IcnsImage } = require('@fiahfy/icns');
const { createCanvas, loadImage } = require('canvas');
const cheerio = require('cheerio');

const { toArray } = require('./helpers.js');

const dest = (...parts) => path.resolve('.', ...parts);

const write = async (dest, content) => {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content);
};

const createPng = async (buffers, size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  for (const buffer of buffers) {
    const png = await renderSvg({ buffer, width: size, height: size });
    const image = await loadImage(png);
    ctx.drawImage(image, 0, 0);
  }

  return canvas.toBuffer('image/png');
};

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

const createSvg = async svg => {
  const size = 100;

  const sizeNormalized = svg.map(s => {
    const $ = cheerio.load(s.toString(), { xmlMode: true });
    const $svg = $('svg');
    $svg.attr('width', size);
    $svg.attr('height', size);
    $svg.attr('version', '1.1');
    $svg.attr('xmlns', 'http://www.w3.org/2000/svg');

    return $.xml('svg');
  });

  return [
    `<svg viewBox="0 0 ${size} ${size}" version="1.1" xmlns="http://www.w3.org/2000/svg">`,
    ...sizeNormalized,
    '</svg>'
  ].join('\n');
};

const getInputArray = input => {
  return toArray(input).map(i => Buffer.isBuffer(i) ? i : Buffer.from(i));
};

async function* generateIcons(input, { icns = true, ico = true, png = true, svg = true, pngSizes = [32, 256, 512] } = {}) {
  const buffers = getInputArray(input);

  if (svg) {
    yield {
      name: 'icon.svg',
      ext: 'svg',
      buffer: Buffer.from(await createSvg(buffers))
    };
  }

  if (ico) {
    yield {
      name: 'icon.ico',
      ext: 'ico',
      buffer: Buffer.from(await createIco(buffers))
    };
  }

  if (icns) {
    yield {
      name: 'icon.icns',
      ext: 'icns',
      buffer: Buffer.from(await createIcns(buffers))
    };
  }

  if (png) {
    for (let size of pngSizes) {
      yield {
        name: `${size}x${size}.png`,
        ext: 'png',
        buffer: Buffer.from(await createPng(buffers, size))
      };
    }
  }
}

module.exports = async (input, { destination = 'icons', ...options } = {}) => {
  for await (const icon of generateIcons(input, options)) {
    await write(dest(destination, icon.name), icon.buffer);
  }
};
