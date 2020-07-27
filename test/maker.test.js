const { promises: fs } = require('fs');
const path = require('path');

const { expect } = require('chai');
const tempy = require('tempy');
const del = require('del');

const maker = require('../');

const svg = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="pink"/></svg>';

describe('app-icon-maker', () => {
  let destination;

  const validateIcons = async (dir, { icns = true, ico = true, png = true, svg = true } = {}) => {
    const expectedFiles = []
      .concat(icns ? ['icon.icns'] : [])
      .concat(ico ? ['icon.ico'] : [])
      .concat(png ? ['32x32.png', '256x256.png', '512x512.png'] : [])
      .concat(svg ? ['icon.svg'] : []);

    const actualFiles = await fs.readdir(dir);

    expect(actualFiles.sort()).to.deep.equal(expectedFiles.sort());
  };

  afterEach(async () => {
    if (destination) {
      await del(destination, { force: true });
    }

    destination = null;
  });

  it('generates all icons by default usign svg string', async () => {
    destination = tempy.directory();

    await maker(svg, { destination });

    await validateIcons(destination);
  });

  it('generates all icons by default usign svg buffer', async () => {
    destination = tempy.directory();

    await maker(Buffer.from(svg), { destination });

    await validateIcons(destination);
  });

  it('will create the output directory if it does not exisst', async () => {
    destination = tempy.directory();

    const exists = p => fs.access(p).then(() => true).catch(() => false);
    const outdir = path.resolve(destination, 'a/b/c/d');

    expect(await exists(outdir)).to.equal(false);

    await maker(svg, { destination: outdir });

    expect(await exists(outdir)).to.equal(true);
    await validateIcons(outdir);
  });

  for (let exclude of ['icns', 'ico', 'png', 'svg']) {
    it(`can optionally skip ${exclude} output`, async () => {
      destination = tempy.directory();

      await maker(svg, { destination, [exclude]: false });

      await validateIcons(destination, { [exclude]: false });
    });
  }

  it('can optionally generate arbitrary png sizes');
});
