const { promises: fs } = require('fs');
const path = require('path');
const crypto = require('crypto');

const { expect } = require('chai');
const tempy = require('tempy');
const del = require('del');

const maker = require('../');

const svg = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="pink"/></svg>';

const hashes = {
  'icon.icns': 'f9cfcd918fab4197d8be762f5c47339f421d774e0f96172660109a9688964cb7',
  'icon.ico': '97fedb69e446459a50af077f4bc18a53eb971bacc5555341b9b4173772a7c05f',
  '32x32.png': '8f21e688402635a9a2e4962cae7134e7d1e30562c592e5e80cc317308330ecdb',
  '256x256.png': '8118787efe05949878709928e23a7ae1b238ba31a45c43b4601f27e2ba04d304',
  '512x512.png': '86ac00e9d11b50402284b218197522289231464de690aa523a44573f73f30cb7',
  'icon.svg': '29a7b9b0e7bfeedd53fb1b88cede1ef618611b407c7ae61921bbadcee752d5a8'
};

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

    for (let file of expectedFiles) {
      const hash = crypto.createHash('sha256').update(await fs.readFile(path.resolve(dir, file))).digest('hex');

      expect(hash).to.equal(hashes[file], `${file} hash does not match`);
    }
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
