const { expect } = require('chai');

const { generateIcons } = require('../');
const { validateIcons, svg, layers, layerHashes, png } = require('./helpers');

describe('app-icon-maker API generateIcons', () => {
  const validateIconEntity = icon => {
    const keys = ['buffer', 'name', 'ext'];

    if (icon.ext === 'png') {
      keys.push('size');
    }

    expect(icon).to.have.all.keys(keys);
    expect(icon.buffer).to.be.instanceOf(Buffer);
    expect(icon.ext).to.be.a('string');
    expect(icon.name).to.be.a('string');

    expect(icon.name.split('.').pop()).to.equal(icon.ext);

    if (icon.ext === 'png') {
      expect(icon.name).to.equal(`${icon.size}x${icon.size}.png`);
    }
  };

  const getGeneratedIcons = async generator => {
    const icons = {};

    for await (const icon of generator) {
      validateIconEntity(icon);
      icons[icon.name] = icon.buffer;
    }

    return icons;
  };

  it('generates all icons by default usign svg string', async () => {
    const icons = await getGeneratedIcons(generateIcons(svg));

    expect(Object.keys(icons)).to.have.a.lengthOf(6);

    await validateIcons(icons);
  });

  it('generates all icons by default usign svg buffer', async () => {
    const icons = await getGeneratedIcons(generateIcons(Buffer.from(svg)));

    expect(Object.keys(icons)).to.have.a.lengthOf(6);

    await validateIcons(icons);
  });

  for (let exclude of ['icns', 'ico', 'png', 'svg']) {
    it(`can optionally skip ${exclude} output`, async () => {
      const icons = await getGeneratedIcons(generateIcons(svg, { [exclude]: false }));

      expect(Object.keys(icons)).to.have.a.lengthOf(exclude === 'png' ? 3 : 5);

      await validateIcons(icons, { [exclude]: false });
    });
  }

  it('can composite multiple svg files as layers', async () => {
    const icons = await getGeneratedIcons(generateIcons(layers));

    expect(Object.keys(icons)).to.have.a.lengthOf(6);

    await validateIcons(icons, { hashes: layerHashes });
  });

  it('can optionally generate arbitrary png sizes', async () => {
    const pngSizes = [47, 345, 1000];

    const generator = generateIcons(layers, { icns: false, ico: false, svg: false, pngSizes });
    const icons = await getGeneratedIcons(generator);

    expect(Object.keys(icons)).to.deep.equal([
      '47x47.png',
      '345x345.png',
      '1000x1000.png'
    ]);

    for (let size of pngSizes) {
      const { width, height, depth } = await png(icons[`${size}x${size}.png`]);

      expect(width).to.equal(size);
      expect(height).to.equal(size);
      expect(depth).to.equal(8);
    }
  });
});
