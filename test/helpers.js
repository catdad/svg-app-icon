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

const defaultHashes = {
  '32x32.png': 'cafb6637775b10a1f69b32adce5fc7c2abc7486f7f20a9f4bf6aa42d1ee82c4d',
  '256x256.png': 'cc8517d70701b3f31213febe084dd22ad6f6551a1bb5a7163bd9dd4938a46560',
  '512x512.png': '8d374e1f9540eff522ca1d1ee408a906b923f8df2fb9051c9f321bb3936f2e48',
  'icon.svg': '8d374e1f9540eff522ca1d1ee408a906b923f8df2fb9051c9f321bb3936f2e48'
};

const layerHashes = {
  '32x32.png': '947d45a9bb8b57d6d334b2526c78584eddb5d6fe372dc2e6cc22e61c2f61ab72',
  '256x256.png': '3b0fe8dd0d5f1383e6869c02709902729d1cd515090d6997280ac1a06f97ab5b',
  '512x512.png': '5c2f43c9a83d2f3b05bf51cf48cf4861d20f42d5175aaf4d67d31d9c58b17a37',
  'icon.svg': '5c2f43c9a83d2f3b05bf51cf48cf4861d20f42d5175aaf4d67d31d9c58b17a37'
};

const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

const validators = {
  'icon.icns': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'icns', mime: 'image/icns' });
  },
  'icon.ico': async (buffer) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'ico', mime: 'image/x-icon' });
  },
  '32x32.png': async (buffer, filehash = defaultHashes['32x32.png']) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(32);
    expect(height).to.equal(32);
    expect(depth).to.equal(8);

    expect(hash(data), '32x32.png has different pixels').to.equal(filehash);
  },
  '256x256.png': async (buffer, filehash = defaultHashes['256x256.png']) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(256);
    expect(height).to.equal(256);
    expect(depth).to.equal(8);

    expect(hash(data), '256x256.png has different pixels').to.equal(filehash);
  },
  '512x512.png': async (buffer, filehash = defaultHashes['512x512.png']) => {
    expect(await type.fromBuffer(buffer)).to.deep.equal({ ext: 'png', mime: 'image/png' });
    const { width, height, depth, data } = png.read(buffer);

    expect(width).to.equal(512);
    expect(height).to.equal(512);
    expect(depth).to.equal(8);

    expect(hash(data), '512x512.png has different pixels').to.equal(filehash);
  },
  'icon.svg': async (buffer, filehash = defaultHashes['icon.svg']) => {
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

  // for (const name of expectedIcons) {
  //   if (/png$/.test(name)) {
  //     require('fs').writeFileSync(`./temp/${Date.now()}.png`, data[name]);
  //   }
  // }

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
