const { expect } = require('chai');

const { generateIcons } = require('../');
const { validateIcons, svg, layers, layerHashes } = require('./helpers');

describe('app-icon-maker API generateIcons', () => {
  const validateIconEntity = icon => {
    expect(icon).to.have.all.keys(['buffer', 'name', 'ext']);
    expect(icon.buffer).to.be.instanceOf(Buffer);
    expect(icon.ext).to.be.a('string');
    expect(icon.name).to.be.a('string');

    expect(icon.name.split('.').pop()).to.equal(icon.ext);
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
});
