const { promises: fs } = require('fs');
const crypto = require('crypto');
const path = require('path');

const { expect } = require('chai');
const { sync: png } = require('pngjs').PNG;
const type = require('file-type');
const svgRender = require('svg-render');

const svg = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="pink"/></svg>';
const layers = [svg, `<svg viewBox="0 0 500 500">
  <ellipse cx="183" cy="155.5" rx="45" ry="33.5" style="fill:rgb(146,255,0);"/>
  <ellipse cx="333.5" cy="167" rx="41.5" ry="31" style="fill:rgb(0,255,203);"/>
  <ellipse cx="167.5" cy="274.5" rx="29.5" ry="36.5" style="fill:rgb(0,59,255);"/>
  <ellipse cx="358.5" cy="314.5" rx="50.5" ry="31.5" style="fill:rgb(255,0,236);"/>
  <ellipse cx="222.25" cy="412.5" rx="54.75" ry="39.5" style="fill:rgb(255,110,0);"/>
</svg>`];

const layerHashes = {
  '32x32.png': 'c450e4c48d310cac5e1432dc3d8855b9a08da0c1e456eeacdbe4b809c8eb5b27',
  '256x256.png': '7413a0717534701a7518a4e35633cae0edb63002c31ef58f092c555f2fa4bdfb',
  // it's weird that these two are different?
  '512x512.png': '926163d94eb5dd6309861db76e952d8562c83b815583440508f79b8213ed44b7',
  'icon.svg': 'bba03b4311a86f6e6f6b7e8b37d444604bca27d95984bd56894ab98857a43cdf'
};

const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

const validators = {
  'icon.icns': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'icns', mime: 'image/icns' });
  },
  'icon.ico': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'ico', mime: 'image/x-icon' });
  },
  '32x32.png': async (buffer, filehash = '84983735a5aa163aed058191c920e4b87831227182a9d800b0d0796c54d9635d') => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(32);
    expect(height).to.equal(32);
    expect(depth).to.equal(8);

    expect(hash(data), '32x32.png has different pixels').to.equal(filehash);
  },
  '256x256.png': async (buffer, filehash = '4db3b3bbfa792b966042487401d098e0ff6e477f32620020ff43c57e5ad1fa8b') => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(256);
    expect(height).to.equal(256);
    expect(depth).to.equal(8);

    expect(hash(data), '256x256.png has different pixels').to.equal(filehash);
  },
  '512x512.png': async (buffer, filehash = '4314abee99d494ab7a6675107fb5005c7a17367c3800a9b980ce207b1334cb36') => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(512);
    expect(height).to.equal(512);
    expect(depth).to.equal(8);

    expect(hash(data), '512x512.png has different pixels').to.equal(filehash);
  },
  'icon.svg': async (buffer, filehash) => {
    // soo... because of layers, the svg won't be just a passthrough, but rather
    // an svg that renders equivalently, so...
    const size = 512;
    const resultPng = await svgRender({ buffer: buffer, width: size, height: size });

    await validators['512x512.png'](resultPng, filehash);
  }
};

const validateIcons = async (data, { icns = true, ico = true, png = true, svg = true, hashes = {} } = {}) => {
  const expectedIcons = []
    .concat(icns ? ['icon.icns'] : [])
    .concat(ico ? ['icon.ico'] : [])
    .concat(png ? ['32x32.png', '256x256.png', '512x512.png'] : [])
    .concat(svg ? ['icon.svg'] : []);

  const actualIcons = Object.keys(data);

  expect(actualIcons.sort()).to.deep.equal(expectedIcons.sort());

  for (const name of expectedIcons) {
    expect(data).to.have.property(name);
    await validators[name](data[name], hashes[name]);
  }
};

const validateIconsDirectory = async (dir, options) => {
  const actualFiles = await fs.readdir(dir);
  const data = {};

  for (let file of actualFiles) {
    data[file] = await fs.readFile(path.resolve(dir, file));
  }

  await validateIcons(data, options);
};

module.exports = { hash, validateIcons, validateIconsDirectory, validators, svg, layers, layerHashes, png, type };
