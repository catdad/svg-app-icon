const { expect } = require('chai');

const { generateIcons } = require('../');
const { validateIcons, svg } = require('./helpers');

describe('app-icon-maker API generateIcons', () => {
  it('generates all icons by default usign svg string', async () => {
    const icons = {};

    for await (const icon of generateIcons(svg)) {
      expect(icon).to.have.all.keys(['buffer', 'name', 'ext']);
      expect(icon.buffer).to.be.instanceOf(Buffer);
      expect(icon.ext).to.be.a('string');
      expect(icon.name).to.be.a('string');

      expect(icon.name.split('.').pop()).to.equal(icon.ext);

      icons[icon.name] = icon.buffer;
    }

    expect(Object.keys(icons)).to.have.a.lengthOf(6);

    await validateIcons(icons);
  });
});
